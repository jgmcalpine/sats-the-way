import { useState, useCallback, useMemo } from 'react';
import { nip19 } from 'nostr-tools';
import { v4 as uuidv4 } from 'uuid';
import type { NDKFilter, NDKEvent } from '@nostr-dev-kit/ndk';
import { NDKRelaySet } from '@nostr-dev-kit/ndk';

import { useNdk } from '@/components/NdkProvider';
import type { FsmState, Transition } from '@/types/fsm';
import { BOOK_KIND, NODE_KIND } from '@/lib/nostr/constants';

interface BookMetadataContent {
	bookId: string;
	title: string;
	status: 'draft' | 'published';
	startStateId: string;
	authorPubkey: string;
	description?: string;
	publishedAt?: number;
	lnurlp?: string;
}

interface NostrBookReaderUtils {
	isLoading: boolean;
	error: string | null;
	bookMetadata: BookMetadataContent | null;
	bookEvent: NDKEvent | null;
	chapters: Record<string, FsmState>;
	currentChapterId: string | null;
	currentChapter: FsmState | null;
	fetchBookData: (identifier: string | { bookId: string; authorPubkey: string }) => Promise<void>;
	setCurrentChapterById: (chapterId: string) => boolean;
	goToChapterByChoice: (choiceTextOrId: string) => boolean;
}

export const useNostrBookReader = (): NostrBookReaderUtils => {
	const { ndk, isConnected } = useNdk();

	const [isLoading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [bookEvent, setBookEvent] = useState<NDKEvent | null>(null);
	const [bookMetadata, setBookMetadata] = useState<BookMetadataContent | null>(null);
	const [chapters, setChapters] = useState<Record<string, FsmState>>({});
	const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
    const [currentBookId, setCurrentBookId] = useState<string | null>(null);
    const [currentAuthorPubkey, setCurrentAuthorPubkey] = useState<string | null>(null);


	const clearState = () => {
		setError(null);
		setBookEvent(null);
		setBookMetadata(null);
		setChapters({});
		setCurrentChapterId(null);
        setCurrentBookId(null);
        setCurrentAuthorPubkey(null);
	};

	const fetchBookData = useCallback(async (identifier: string | { bookId: string; authorPubkey: string }) => {
		if (!isConnected || !ndk) {
			setError('NDK not connected');
			setLoading(false);
			return;
		}
		setLoading(true);
		clearState();

		try {
			let bookId: string;
			let authorPubkey: string;

			// 1. Decode Identifier
			if (typeof identifier === 'string') {
				// Assume naddr
				try {
					const decoded = nip19.decode(identifier);
					if (decoded.type !== 'naddr' || decoded.data.kind !== BOOK_KIND) {
						throw new Error('Invalid book address (naddr)');
					}
					bookId = decoded.data.identifier;
					authorPubkey = decoded.data.pubkey;
				} catch (e) {
					throw new Error(`Failed to decode identifier: ${e instanceof Error ? e.message : String(e)}`);
				}
			} else {
				// Assume object
				bookId = identifier.bookId;
				authorPubkey = identifier.authorPubkey;
			}

            setCurrentBookId(bookId);
            setCurrentAuthorPubkey(authorPubkey);

			// 2. Fetch Book Metadata Event
			console.log(`Fetching metadata: kind=${BOOK_KIND}, author=${authorPubkey}, #d=${bookId}`);
			const metaFilter: NDKFilter = {
				kinds: [BOOK_KIND],
				authors: [authorPubkey],
				'#d': [bookId],
				limit: 1,
			};
			const fetchedMetaEvent = await ndk.fetchEvent(metaFilter);

			if (!fetchedMetaEvent) {
				throw new Error(`Book metadata not found for ${bookId} by ${authorPubkey}`);
			}
			setBookEvent(fetchedMetaEvent);

			// 3. Parse Book Metadata Content
			let parsedMeta: BookMetadataContent;
			try {
				parsedMeta = JSON.parse(fetchedMetaEvent.content);
				if (!parsedMeta.startStateId) {
					throw new Error('Metadata content is missing startStateId');
				}
			} catch (e) {
				throw new Error(`Failed to parse book metadata content: ${e instanceof Error ? e.message : String(e)}`);
			}
			setBookMetadata(parsedMeta);

			// 4. Fetch Chapter Events linked via #a tag
			const bookAddress = `${BOOK_KIND}:${authorPubkey}:${bookId}`;
			console.log(`Fetching chapters linked to book: ${bookAddress}`);
			const chapterFilter: NDKFilter = {
				kinds: [NODE_KIND],
				'#a': [bookAddress],
				limit: 500,
			};
			console.log("JUST BEFORE FETCH CHAPTERS")
			console.log("Waiting 3 seconds before fetching chapters...");

			const allRelays = Array.from(ndk.pool.relays.values());
			const connectedOnly = allRelays.filter(r => r.status === 5);
			console.log("connectedOnly: ", connectedOnly)
			const chapterRelaySet = new NDKRelaySet(new Set(connectedOnly), ndk);
			console.log("bout to fetch fetch ")
			const chapterEventSet = await ndk.fetchEvents(
			chapterFilter,
			{ relaySet: chapterRelaySet, closeOnEose: true }
			);
			console.log(`Found ${chapterEventSet.size} chapter events`);


			// 5. Parse and Store Chapter States
			const fetchedStates: Record<string, FsmState> = {};
			for (const ev of chapterEventSet) {
				try {
					const chapterContent = JSON.parse(ev.content);
					const chapterDTag = ev.tagValue('d'); // Use NDK helper
					const stateId = chapterContent.stateId || chapterDTag; // Prefer stateId from content, fallback to d tag

					if (!stateId) {
						console.warn(`Chapter event ${ev.id} missing stateId in content and d tag. Skipping.`);
						continue;
					}

                    // Ensure transitions have necessary fields, providing defaults
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const transitions = (chapterContent.transitions ?? []).map((t: any): Transition => ({
                        id: t.id || uuidv4(), // Generate ID if missing
                        choiceText: t.choiceText ?? 'Continue',
                        targetStateId: t.targetStateId,
                        price: t.price ?? 0,
                    })).filter((t: Transition) => t.targetStateId); // Filter out transitions without a target

					fetchedStates[stateId] = {
						id: stateId, // This is the chapter's unique ID (d tag / stateId)
						name: chapterContent.name ?? 'Untitled Chapter',
						content: chapterContent.content ?? '',
						previousStateId: chapterContent.previousStateId ?? undefined,
						isEndState: chapterContent.isEndState ?? false,
						isStartState: stateId === parsedMeta.startStateId,
                        transitions: transitions,
						// Add any other relevant fields from your State type definition
						price: chapterContent.price ?? 0,
					};
				} catch (e) {
					console.error(`Failed to parse chapter event ${ev.id} content:`, e);
					// Continue processing other chapters
				}
			}
			setChapters(fetchedStates);

			// 6. Set Initial Current Chapter
			if (fetchedStates[parsedMeta.startStateId]) {
				setCurrentChapterId(parsedMeta.startStateId);
			} else if (Object.keys(fetchedStates).length > 0) {
                // Fallback if startStateId points to a non-existent chapter
                const firstChapterId = Object.keys(fetchedStates)[0];
                setCurrentChapterId(firstChapterId);
                console.warn(`startStateId "${parsedMeta.startStateId}" not found in fetched chapters. Falling back to first chapter "${firstChapterId}".`);
                // Optionally update the metadata state or warn the user more prominently
			} else {
                console.warn(`No chapters found for book ${bookId}.`);
            }

		} catch (e: unknown) {
			console.error("Error loading book data:", e);
			setError(e instanceof Error ? e.message : String(e));
            clearState(); // Ensure partial data isn't left in inconsistent state on error
		} finally {
			setLoading(false);
		}
	}, [ndk, isConnected]);

	// --- Navigation ---

	/**
	 * Sets the current chapter being viewed.
	 * @param chapterId The ID ('d' tag / stateId) of the chapter to set as current.
	 * @returns True if the chapter exists and was set, false otherwise.
	 */
	const setCurrentChapterById = useCallback((chapterId: string): boolean => {
		if (chapters[chapterId]) {
			setCurrentChapterId(chapterId);
            setError(null); // Clear previous navigation errors
			return true;
		} else {
            console.warn(`Attempted to set current chapter to non-existent ID: ${chapterId}`);
            setError(`Chapter with ID ${chapterId} not found.`);
			return false;
		}
	}, [chapters]);

	/**
	 * Navigates to the next chapter based on the selected choice's text or ID from the current chapter.
	 * @param choiceTextOrId The 'choiceText' or 'id' of the transition to follow.
	 * @returns True if navigation was successful, false otherwise.
	 */
	const goToChapterByChoice = useCallback((choiceTextOrId: string): boolean => {
		if (!currentChapterId || !chapters[currentChapterId]) {
            setError("Cannot navigate: Current chapter is not set or not found.");
			return false;
		}

		const current = chapters[currentChapterId];
		const transition = current.transitions.find(t => t.choiceText === choiceTextOrId || t.id === choiceTextOrId);
		if (transition && transition.targetStateId) {
			return setCurrentChapterById(transition.targetStateId);
		} else {
            console.warn(`Transition not found for choice "${choiceTextOrId}" in chapter ${currentChapterId}`);
            setError(`Choice "${choiceTextOrId}" does not lead anywhere from the current chapter.`);
			return false;
		}
	}, [currentChapterId, chapters, setCurrentChapterById]);


    // --- Derived State ---

    const currentChapter = useMemo((): FsmState | null => {
        if (!currentChapterId || !chapters[currentChapterId]) {
            return null;
        }
        return chapters[currentChapterId];
    }, [currentChapterId, chapters]);

    // --- Specific Chapter Fetching (Optional - useful if initial load might miss chapters or for lazy loading) ---

    /**
     * Fetches a single chapter event by its ID (d tag) and adds/updates it in the state.
     * Assumes book context (authorPubkey, bookId) is already set by fetchBookData.
     * @param chapterId The 'd' tag of the chapter to fetch.
     * @returns The fetched State object or null if not found or error occurs.
     */
    const fetchChapterById = useCallback(async (chapterId: string): Promise<FsmState | null> => {
        if (!ndk || !currentAuthorPubkey || !currentBookId) {
            setError("Cannot fetch chapter: Book context not loaded.");
            return null;
        }
        // Avoid refetching if already present
        if (chapters[chapterId]) {
            return chapters[chapterId];
        }

        setLoading(true); // Indicate activity
        try {
            console.log(`Fetching specific chapter: kind=${NODE_KIND}, author=${currentAuthorPubkey}, #d=${chapterId}`);
            const chapterFilter: NDKFilter = {
                kinds: [NODE_KIND],
                authors: [currentAuthorPubkey], // Be specific
                '#d': [chapterId],
                limit: 1,
            };
            const chapterEvent = await ndk.fetchEvent(chapterFilter);

            if (!chapterEvent) {
                console.warn(`Specific chapter with d=${chapterId} not found.`);
                setError(`Chapter with ID ${chapterId} could not be fetched.`);
                return null;
            }

            // Parse and add to state
            const chapterContent = JSON.parse(chapterEvent.content);
            const stateId = chapterContent.stateId || chapterId; // Use chapterId as fallback

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
             const transitions = (chapterContent.transitions ?? []).map((t: any): Transition => ({
                id: t.id || uuidv4(),
                choiceText: t.choiceText ?? 'Continue',
                targetStateId: t.targetStateId,
                price: t.price ?? 0,
            })).filter((t: Transition) => t.targetStateId);

            const newState: FsmState = {
                id: stateId,
                name: chapterContent.name ?? 'Untitled Chapter',
                content: chapterContent.content ?? '',
                isEndState: chapterContent.isEndState ?? false,
                isStartState: stateId === bookMetadata?.startStateId, // Check against loaded metadata
                transitions: transitions,
            };

            setChapters(prev => ({ ...prev, [stateId]: newState }));
            setError(null); // Clear previous errors
            return newState;

        } catch (e) {
            console.error(`Failed to fetch or parse specific chapter ${chapterId}:`, e);
            setError(`Failed to load chapter ${chapterId}.`);
            return null;
        } finally {
            setLoading(false);
        }

    }, [ndk, currentAuthorPubkey, currentBookId, chapters, bookMetadata?.startStateId]);


	// --- Public API ---
	return useMemo(() => ({
		isLoading,
		error,
		bookMetadata,
        bookEvent,
		chapters,
		currentChapterId,
        currentChapter, // Derived from currentChapterId and chapters
		fetchBookData,
		setCurrentChapterById,
		goToChapterByChoice,
        fetchChapterById, // Expose the specific fetch function
	}), [
		isLoading, error, bookMetadata, bookEvent, chapters, currentChapterId, currentChapter,
		fetchBookData, setCurrentChapterById, goToChapterByChoice, fetchChapterById
	]);
};