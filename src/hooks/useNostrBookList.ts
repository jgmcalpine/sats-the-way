import { useNdk } from '@/components/NdkProvider';
import type { NDKEvent, NDKFilter, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { NDKRelaySet as RelaySet } from '@nostr-dev-kit/ndk';
import { useCallback, useEffect, useState } from 'react';

import { BOOK_KIND } from '@/lib/nostr/constants';
import { FsmData, FsmState } from '@/types/fsm';

interface UseNostrBookListOptions {
  relays: string[];
  authorPubkey?: string;
  initialFetch?: boolean;
}

interface UseNostrBookListResult {
  books: FsmData[];
  isLoading: boolean;
  error: string | null;
  /**
   * @param fsmIds        If provided, only fetch books whose 'd' tag matches one of these IDs.
   * @param statusFilter  'all' | 'draft' | 'published' (default 'all')
   * @param limit         Max number of books to return (after filtering and ordering)
   */
  fetchBooks: (
    statusFilter?: 'all' | 'draft' | 'published',
    fsmIds?: string[],
    limit?: number
  ) => Promise<void>;
}

/**
 * Turn a raw NDKEvent(kind 30077) into your UI’s FsmData shape.
 * Returns null if the event is missing the required 'd' tag.
 */
function transformEventToFsmData(evt: NDKEvent): FsmData | null {
  const fsmId = evt.tagValue('d');
  if (!fsmId) return null;

  let title = 'Untitled Book';
  let description: string | undefined;
  let minCost = 0;
  let lifecycle: 'draft' | 'published' = 'draft';
  let authorName: string | undefined;
  let startStateId: string | undefined;
  let states: Record<string, FsmState> = {};

  try {
    const c = JSON.parse(evt.content || '{}');
    title = c.title || evt.tagValue('title') || title;
    description = c.description || c.summary;
    minCost = c.minCost ?? 0;
    lifecycle = c.lifecycle;
    authorName = c.authorName;
    startStateId = c.startStateId;
    states = c.states;
  } catch {
    // malformed JSON → keep defaults
  }

  return {
    fsmId,
    title,
    description,
    authorPubkey: evt.pubkey,
    lifecycle,
    authorName,
    minCost,
    fsmType: 'book',
    startStateId: startStateId || null,
    states,
  };
}

export const useNostrBookList = ({
  relays,
  authorPubkey,
  initialFetch = true,
}: UseNostrBookListOptions): UseNostrBookListResult => {
  const { ndk } = useNdk();

  const [books, setBooks] = useState<FsmData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build RelaySet only when explicit relays are provided
  const buildRelaySet = useCallback((): NDKRelaySet | undefined => {
    if (!relays.length) return undefined;
    return RelaySet.fromRelayUrls(relays, ndk);
  }, [ndk, relays]);

  const fetchBooks = useCallback(
    async (
      statusFilter: 'all' | 'draft' | 'published' = 'all',
      fsmIds?: string[],
      limit?: number
    ) => {
      if (!ndk) {
        setError('NDK not ready');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Base filter for kind and optional limit
        const filter: NDKFilter = {
          kinds: [BOOK_KIND],
        };
        if (limit !== undefined) filter.limit = limit;

        // Optional author filter
        if (authorPubkey) {
          filter.authors = [authorPubkey];
        }

        // Optional FSM‑ID filter
        if (fsmIds && fsmIds.length > 0) {
          filter['#d'] = fsmIds;
        }

        const relaySet = buildRelaySet();
        const events = await ndk.fetchEvents(filter, { relaySet });

        const processed: FsmData[] = [];
        (events as Set<NDKEvent>).forEach(evt => {
          const f = transformEventToFsmData(evt);
          if (!f) return;
          if (statusFilter !== 'all' && f.lifecycle !== statusFilter) return;
          processed.push(f);
        });

        // Enforce manual limit (after filtering & ordering)
        if (limit) {
          processed.splice(limit);
        }

        setBooks(processed);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setError(e?.message || 'Fetch failed');
        setBooks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [ndk, authorPubkey, buildRelaySet]
  );

  useEffect(() => {
    if (initialFetch && ndk) {
      // No fsmIds → fetch all
      fetchBooks();
    }
  }, [initialFetch, ndk, fetchBooks]);

  return { books, isLoading, error, fetchBooks };
};
