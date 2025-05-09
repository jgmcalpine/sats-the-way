import { useState, useCallback, useEffect } from 'react';
import type { NDKFilter, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { NDKRelaySet as RelaySet } from '@nostr-dev-kit/ndk';
import { useNdk } from '@/components/NdkProvider';

import { BOOK_KIND } from '@/lib/nostr/constants';
import { FsmData } from '@/types/fsm'

interface UseNostrBookListOptions {
	relays: string[];
	authorPubkey?: string;
	initialFetch?: boolean;
}

interface UseNostrBookListResult {
	books: FsmData[];
	isLoading: boolean;
	error: string | null;
	fetchBooks: (statusFilter?: 'all' | 'draft' | 'published', limit?: number) => Promise<void>;
}

// ────────────────────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────────────────────
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
	const buildRelaySet = (): NDKRelaySet | undefined => {
		if (!relays.length) return undefined;
		return RelaySet.fromRelayUrls(relays, ndk);
	};

	const fetchBooks = useCallback(
		async (statusFilter: 'all' | 'draft' | 'published' = 'all', limit?: number) => {
			if (!ndk) {
				setError('NDK not ready');
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const filter: NDKFilter = { kinds: [BOOK_KIND], limit };
				if (authorPubkey) filter.authors = [authorPubkey];

				const relaySet = buildRelaySet();
				const events = await ndk.fetchEvents(filter, { relaySet });

				const processed: FsmData[] = [];
				events.forEach((evt) => {
					const bookId = evt.tagValue('d');
					if (!bookId) return;

					let title = 'Untitled Book';
					let description;
                    let minCost;
					let lifecycle;
                    let authorName;
                    let startStateId;
                    let states;

					try {
						const c = JSON.parse(evt.content || '{}');
						title = c.title || evt.tagValue('title') || title;
						description = c.description || c.summary;
                        minCost = c.minCost || 0;
						lifecycle = c.lifecycle;
                        authorName = c.authorName;
                        startStateId = c.startStateId;
                        states = c.states;
					} catch {}

					if (statusFilter !== 'all' && lifecycle !== statusFilter) return;

					processed.push({
						fsmId: bookId,
						title,
						description,
						authorPubkey: evt.pubkey,
						lifecycle,
                        authorName,
                        minCost: minCost || 0,
                        fsmType: 'book',
                        startStateId,
                        states
					});
				});

                // Limit manually here
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
		[ndk, authorPubkey, relays]
	);

	useEffect(() => {
		if (initialFetch && ndk) fetchBooks();
	}, [initialFetch, ndk, fetchBooks]);

	return { books, isLoading, error, fetchBooks };
};
