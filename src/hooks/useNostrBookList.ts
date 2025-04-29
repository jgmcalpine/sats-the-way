import { useState, useCallback, useEffect } from 'react';
import { nip19 } from 'nostr-tools';
import type { NDKEvent, NDKFilter, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { NDKRelaySet as RelaySet } from '@nostr-dev-kit/ndk';
import { useNdk } from '@/components/NdkProvider';

import { BOOK_KIND } from '@/lib/nostr/constants';

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────
export interface BookListItem {
	bookId: string;
	title: string;
	description?: string;
	coverImage?: string; 
	authorPubkey: string;
	status: 'draft' | 'published' | 'unknown';
	createdAt: number;
	naddr: string;
	event: NDKEvent; 
}

interface UseNostrBookListOptions {
	relays: string[];
	authorPubkey?: string;
	initialFetch?: boolean;
}

interface UseNostrBookListResult {
	books: BookListItem[];
	isLoading: boolean;
	error: string | null;
	fetchBooks: (statusFilter?: 'all' | 'draft' | 'published') => Promise<void>;
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

	const [books, setBooks] = useState<BookListItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Build RelaySet only when explicit relays are provided
	const buildRelaySet = (): NDKRelaySet | undefined => {
		if (!relays.length) return undefined;
		return RelaySet.fromRelayUrls(relays, ndk);
	};

	const fetchBooks = useCallback(
		async (statusFilter: 'all' | 'draft' | 'published' = 'all') => {
			if (!ndk) {
				setError('NDK not ready');
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const filter: NDKFilter = { kinds: [BOOK_KIND] };
				if (authorPubkey) filter.authors = [authorPubkey];

				const relaySet = buildRelaySet();
				const events = await ndk.fetchEvents(filter, { relaySet });

				const processed: BookListItem[] = [];
				events.forEach((evt) => {
					const bookId = evt.tagValue('d');
					if (!bookId) return;

					let title = 'Untitled Book';
					let description: string | undefined;
					let image: string | undefined;
					let status: BookListItem['status'] = 'unknown';

					try {
						const c = JSON.parse(evt.content || '{}');
						title = c.title || evt.tagValue('title') || title;
						description = c.description || c.summary;
						image = c.image;
						status = c.status === 'published' ? 'published' : c.status === 'draft' ? 'draft' : 'unknown';
					} catch {}

					if (statusFilter !== 'all' && status !== statusFilter) return;

					const naddr = nip19.naddrEncode({
						identifier: bookId,
						pubkey: evt.pubkey,
						kind: BOOK_KIND,
						relays: relays.length ? [relays[0]] : undefined,
					});

					processed.push({
						bookId,
						title,
						description,
						coverImage: image,
						authorPubkey: evt.pubkey,
						status,
						createdAt: evt.created_at!,
						naddr,
						event: evt,
					});
				});

				processed.sort((a, b) => b.createdAt - a.createdAt);
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
