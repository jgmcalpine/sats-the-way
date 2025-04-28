// src/hooks/useNostrBookEditor.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    SimplePool,
    Event as NostrEvent, // Renaming to avoid conflict with DOM Event
    EventTemplate,
    nip19,
    Filter,
} from 'nostr-tools';
import type { State, FsmData } from '@/components/ui/FsmBuilder';
import { BOOK_KIND, NODE_KIND } from '@/lib/nostr';

// --- Constants ---
const LOAD_TIMEOUT_MS = 5000; // Timeout for fetching chapters

// --- Hook Interface ---
interface NostrBookEditorUtils {
    /** Checks if the hook is establishing initial relay connections. */
    isConnecting: boolean;
    /** Indicates if a Nostr operation (load, save, publish) is currently in progress. */
    isProcessing: boolean;
    /** Error message if a Nostr operation failed. */
    error: string | null;
    /**
     * Creates initial Nostr events for a new book and returns the FsmData structure.
     * Requires the user to be logged in (currentUserPubkey must be set).
     * @returns A promise resolving to { bookId: string; initialFsmData: FsmData } or null on failure.
     */
    createAndLoadNewBook: () => Promise<{ bookId: string; initialFsmData: FsmData } | null>;
    /**
     * Loads existing book metadata and its chapters from Nostr relays.
     * @param nip19Identifier - An identifier for the book (e.g., naddr1... pointing to the metadata event).
     * @returns A promise resolving to { bookId: string; fsmData: FsmData } or null if not found/error.
     */
    loadBook: (nip19Identifier: string) => Promise<{ bookId: string; fsmData: FsmData } | null>;
    /**
     * Saves (publishes/replaces) a single chapter event to Nostr.
     * Requires the user to be logged in and match the authorPubkey.
     * @param chapterData - The State object for the chapter to save.
     * @param bookId - The ID of the book this chapter belongs to.
     * @param authorPubkey - The pubkey of the author (must match logged-in user).
     * @returns Promise<boolean> indicating success.
     */
    saveChapter: (chapterData: State, bookId: string, authorPubkey: string) => Promise<boolean>;
    /**
     * Saves (publishes/replaces) the book metadata (as draft) and all chapter events.
     * Requires the user to be logged in and match the authorPubkey.
     * @param fsmData - The complete FsmData object.
     * @param bookId - The ID of the book being saved.
     * @param bookTitle - The current title of the book (for metadata).
     * @param authorPubkey - The pubkey of the author (must match logged-in user).
     * @returns Promise<boolean> indicating if all operations were attempted successfully.
     */
    saveAllProgress: (fsmData: FsmData, bookId: string, bookTitle: string | undefined, authorPubkey: string) => Promise<boolean>;
    /**
     * Updates the book metadata event to mark it as "published".
     * Requires the user to be logged in and match the authorPubkey.
     * @param fsmData - The complete FsmData object (needed for startStateId).
     * @param bookId - The ID of the book being published.
     * @param bookTitle - The current title of the book.
     * @param authorPubkey - The pubkey of the author (must match logged-in user).
     * @returns Promise<boolean> indicating success.
     */
    publishBook: (fsmData: FsmData, bookId: string, bookTitle: string | undefined, authorPubkey: string) => Promise<boolean>;
}

/**
 * Custom hook to manage CRUD operations for Nostr-based interactive books.
 *
 * @param relays - Array of relay URLs to connect to.
 * @param currentUserPubkey - The hex public key of the currently logged-in user, or null.
 * @returns Utility functions and state for interacting with the book data.
 */
export const useNostrBookEditor = (
    relays: string[],
    currentUserPubkey: string | null
): NostrBookEditorUtils => {
    // --- State ---
    const pool = useRef<SimplePool | null>(null);
    const [isConnecting, setIsConnecting] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Initialization and Cleanup ---
    useEffect(() => {
        // Create a new pool instance
        const currentPool = new SimplePool();
        pool.current = currentPool;
        console.log('NostrBookEditor: Initializing pool...');

        // Attempt initial connections
        let connectionCheckDone = false;
        const checkConnections = async () => {
            if (connectionCheckDone) return;
            try {
                // Ensure connections are at least attempted
                await Promise.any(relays.map(r => currentPool.ensureRelay(r).then(relay => relay.connect())));
                console.log('NostrBookEditor: Initial connection attempt completed.');
            } catch (e) {
                console.warn("NostrBookEditor: Could not connect to any initial relays.", e);
            } finally {
                // Only set connecting to false once, even if retries happen internally
                if (!connectionCheckDone) {
                     setIsConnecting(false);
                     connectionCheckDone = true;
                }
            }
        };
        checkConnections();

        // Cleanup function
        return () => {
            console.log('NostrBookEditor: Closing connections...');
            currentPool.close(relays);
            pool.current = null;
        };
    }, [relays]); // Re-run effect if relay list changes

    // --- Internal Helper Functions ---

    /**
     * Signs an event template using NIP-07 window.nostr.signEvent
     * and publishes it to the configured relays.
     * @param eventTemplate - The event template to sign and publish.
     * @returns The signed NostrEvent if successful, otherwise null.
     */
    const signAndPublishEvent = useCallback(async (
        eventTemplate: EventTemplate
    ): Promise<NostrEvent | null> => {
        const currentPool = pool.current; // Capture ref value
        if (!currentPool) {
            setError("Relay pool not initialized.");
            return null;
        }
        if (!window.nostr || !currentUserPubkey) {
            setError("Nostr extension (NIP-07) not found or user not logged in.");
            return null;
        }

        // Prepare the unsigned event, ensuring pubkey is set
        const unsignedEvent: EventTemplate & { pubkey: string } = {
            ...eventTemplate,
            pubkey: currentUserPubkey, // Set pubkey from logged-in user
            created_at: eventTemplate.created_at ?? Math.floor(Date.now() / 1000),
            tags: eventTemplate.tags ?? [], // Ensure tags is an array
            content: eventTemplate.content ?? "", // Ensure content is a string
        };

        try {
            const signedEventDraft = await window.nostr.signEvent(unsignedEvent);
            if (!signedEventDraft?.sig) {
                throw new Error("Invalid signed event.");
            }

            const signedEvent: NostrEvent = signedEventDraft as NostrEvent;
            const pubs = currentPool.publish(relays, signedEvent);
            await Promise.any(pubs.map(p => p.catch(e => { /* Handle individual publish errors if needed */ }))); // Wait for at least one potential success/ack
            return signedEvent;
        } catch (err: any) { console.error("Sign/Publish Error:", err); setError(err.message || "Failed."); return null; }
    }, [currentUserPubkey, relays]); // Dependencies: pubkey and relays list

    /**
     * Prepares the EventTemplate for the Book Metadata (Kind 30077).
     * @param bookId - Unique identifier for the book ('d' tag).
     * @param startStateId - ID of the starting chapter/state.
     * @param authorPubkey - The author's public key.
     * @param status - 'draft' or 'published'.
     * @param title - Optional book title.
     * @param currentEventData - Optional existing metadata content to merge/preserve fields.
     * @returns The constructed EventTemplate.
     */
    const prepareMetadataEvent = useCallback((
        bookId: string,
        startStateId: string | null,
        authorPubkey: string,
        status: 'draft' | 'published',
        title?: string,
        currentEventData?: Record<string, any> // Pass parsed content of existing event
    ): EventTemplate => {

        const content = {
            ...(currentEventData ?? {}), // Preserve existing fields by spreading first
            bookId: bookId,
            title: title || currentEventData?.title || 'Untitled Book',
            status: status,
            startStateId: startStateId,
            authorPubkey: authorPubkey, // Include for convenience?
            // Add/update publishedAt only when status becomes 'published'
            ...(status === 'published' && {
                publishedAt: currentEventData?.publishedAt ?? Math.floor(Date.now() / 1000) // Set only on first publish
            }),
        };

        // Ensure required 'd' tag exists
        const tags = [['d', bookId]];
        if (content.title) {
            tags.push(['title', content.title]);
        }
        // Add other optional tags ('summary', 'image', 't', 'L') if available in content

        return {
            kind: BOOK_KIND,
            tags: tags,
            content: JSON.stringify(content),
            created_at: new Date().getTime()
        };
    }, []); // No dependencies needed for this pure function

    /**
     * Prepares the EventTemplate for a Chapter/State (Kind 31112).
     * @param chapterData - The State object from the FSM builder.
     * @param bookId - The ID of the book this chapter belongs to.
     * @param authorPubkey - The author's public key (for the 'a' tag).
     * @returns The constructed EventTemplate.
     */
    const prepareChapterEvent = useCallback((
        chapterData: State,
        bookId: string,
        authorPubkey: string
    ): EventTemplate => {
        // Construct the 'a' tag linking to the metadata event: kind:pubkey:d_tag_identifier
        const addrTag: string = `${BOOK_KIND}:${authorPubkey}:${bookId}`;

        // Content directly maps from State, ensuring only data fields are included
        const content = {
            stateId: chapterData.id,
            bookId: bookId, // Redundant but useful for context?
            name: chapterData.name,
            content: chapterData.content,
            entryFee: chapterData.entryFee ?? 0,
            isEndState: chapterData.isEndState,
            transitions: chapterData.transitions.map(t => ({ // Sanitize transition object
                id: t.id,
                choiceText: t.choiceText,
                targetStateId: t.targetStateId,
                price: t.price ?? 0
            })),
        };

        // Required tags: 'd' for replaceability, 'a' for linking
        const tags = [
            ['d', chapterData.id],
            ['a', addrTag], // Relay hint can be added by client finding the metadata later
        ];
        // Add optional tags ('L' for language) if needed

        return {
            kind: NODE_KIND,
            tags: tags,
            content: JSON.stringify(content),
            created_at: new Date().getTime()
        };
    }, []); // No dependencies needed

    // --- Exposed Action Methods ---

    const createAndLoadNewBook = useCallback(async (): Promise<{ bookId: string; initialFsmData: FsmData } | null> => {
        if (!currentUserPubkey) {
            setError("Cannot create book: User not logged in.");
            return null;
        }
        setIsProcessing(true);
        setError(null);
        console.log('NostrBookEditor: Creating new book...');

        const newBookId = uuidv4();
        const startChapterId = uuidv4();
        const initialChapter: State = { id: startChapterId, name: 'Chapter 1', content: '', isStartState: true, isEndState: false, entryFee: 0, transitions: [] };
        const initialFsmData: FsmData = { states: { [startChapterId]: initialChapter }, startStateId: startChapterId };

        try {
            // Prepare events
            const metadataTemplate = prepareMetadataEvent(newBookId, startChapterId, currentUserPubkey, 'draft', 'Untitled Book');
            const chapterTemplate = prepareChapterEvent(initialChapter, newBookId, currentUserPubkey);

            // Publish both - wait for both results
            const [metaEvent, chapEvent] = await Promise.all([
                signAndPublishEvent(metadataTemplate),
                signAndPublishEvent(chapterTemplate)
            ]);

            if (metaEvent && chapEvent) {
                console.log('NostrBookEditor: New book created successfully.');
                return { bookId: newBookId, initialFsmData: initialFsmData };
            } else {
                throw new Error("Failed to publish initial book events.");
            }
        } catch (err: any) {
            console.error("NostrBookEditor: Error creating new book:", err);
            setError(err.message || "Failed to create book.");
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, [currentUserPubkey, prepareMetadataEvent, prepareChapterEvent, signAndPublishEvent]);

    const saveChapter = useCallback(async (chapterData: State, bookId: string, authorPubkey: string): Promise<boolean> => {
        if (!currentUserPubkey || currentUserPubkey !== authorPubkey) {
            setError("Cannot save chapter: Not logged in or not the author.");
            return false;
        }
        setIsProcessing(true);
        setError(null);
        console.log(`NostrBookEditor: Saving chapter ${chapterData.id}...`);

        try {
            const chapterTemplate = prepareChapterEvent(chapterData, bookId, authorPubkey);
            const publishedEvent = await signAndPublishEvent(chapterTemplate);

            if (publishedEvent) {
                console.log(`NostrBookEditor: Chapter ${chapterData.id} saved successfully.`);
                return true;
            } else {
                throw new Error("Failed to publish chapter event.");
            }
        } catch (err: any) {
             console.error("NostrBookEditor: Error saving chapter:", err);
             setError(err.message || "Failed to save chapter.");
             return false;
        } finally {
             setIsProcessing(false);
        }
    }, [currentUserPubkey, prepareChapterEvent, signAndPublishEvent]);

    const saveAllProgress = useCallback(async (fsmData: FsmData, bookId: string, bookTitle: string | undefined, authorPubkey: string): Promise<boolean> => {
        if (!currentUserPubkey || currentUserPubkey !== authorPubkey) {
            setError("Cannot save progress: Not logged in or not the author.");
            return false;
        }
        if (!fsmData || !fsmData.startStateId) {
            setError("Cannot save: Invalid data or no start state defined.");
            return false;
        }
        setIsProcessing(true);
        setError(null);
        console.log(`NostrBookEditor: Saving all progress for book ${bookId}...`);

        try {
            // Prepare metadata event (always save as draft)
            const metadataTemplate = prepareMetadataEvent(bookId, fsmData.startStateId, authorPubkey, 'draft', bookTitle);

            // Prepare all chapter events
            const chapterTemplates = Object.values(fsmData.states).map(chapter =>
                prepareChapterEvent(chapter, bookId, authorPubkey)
            );

            // Create publish promises for all events
            const publishPromises = [
                signAndPublishEvent(metadataTemplate),
                ...chapterTemplates.map(template => signAndPublishEvent(template))
            ];

            // Wait for all publish attempts
            const results = await Promise.allSettled(publishPromises);

            // Check if any failed
            const failedCount = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value)).length;

            if (failedCount > 0) {
                console.warn(`NostrBookEditor: ${failedCount} event(s) failed to save.`);
                setError(`${failedCount} event(s) failed to save. Check console.`);
                return false; // Indicate partial or full failure
            } else {
                console.log(`NostrBookEditor: All progress saved successfully for book ${bookId}.`);
                return true; // Indicate success
            }

        } catch (err: any) {
            // Catch unexpected errors during preparation phase
            console.error("NostrBookEditor: Unexpected error saving all progress:", err);
            setError(err.message || "Unexpected error saving progress.");
            return false;
        } finally {
             setIsProcessing(false);
        }
    }, [currentUserPubkey, prepareMetadataEvent, prepareChapterEvent, signAndPublishEvent]);

    const publishBook = useCallback(async (fsmData: FsmData, bookId: string, bookTitle: string | undefined, authorPubkey: string): Promise<boolean> => {
        if (!currentUserPubkey || currentUserPubkey !== authorPubkey) {
            setError("Cannot publish: Not logged in or not the author.");
            return false;
        }
        if (!fsmData || !fsmData.startStateId) {
            setError("Cannot publish: Invalid data or no start state defined.");
            return false;
        }
        setIsProcessing(true);
        setError(null);
        console.log(`NostrBookEditor: Publishing book ${bookId}...`);

        const currentPool = pool.current; // Capture ref
        if (!currentPool) { setError("Relay pool not available."); setIsProcessing(false); return false; }

        try {
             // 1. Fetch the latest metadata event to preserve existing fields (optional but good practice)
            let currentMetadataEvent: NostrEvent | null = null;
            try {
                 currentMetadataEvent = await currentPool.get(relays, {
                     kinds: [BOOK_KIND],
                     authors: [authorPubkey],
                     '#d': [bookId],
                     limit: 1,
                 });
                 console.log("NostrBookEditor: Fetched existing metadata for merging:", currentMetadataEvent?.id);
            } catch (e) { console.warn("NostrBookEditor: Could not fetch current metadata before publishing:", e) }

            // 2. Prepare updated metadata event with 'published' status
            const currentContent = currentMetadataEvent ? JSON.parse(currentMetadataEvent.content || '{}') : {};
            const metadataTemplate = prepareMetadataEvent(
                bookId,
                fsmData.startStateId,
                authorPubkey,
                'published', // <-- Set status to published
                bookTitle,
                currentContent // Pass existing content
            );

            // 3. Sign and publish ONLY the metadata event
            const publishedEvent = await signAndPublishEvent(metadataTemplate);

            if (publishedEvent) {
                console.log(`NostrBookEditor: Book ${bookId} published successfully.`);
                return true;
            } else {
                throw new Error("Failed to publish book metadata event.");
            }
        } catch (err: any) {
            console.error("NostrBookEditor: Error publishing book:", err);
            setError(err.message || "Failed to publish book.");
            return false;
        } finally {
             setIsProcessing(false);
        }
    }, [currentUserPubkey, prepareMetadataEvent, signAndPublishEvent, relays]);

    const loadBook = useCallback(async (nip19Identifier: string): Promise<{ bookId: string; fsmData: FsmData } | null> => {
        const currentPool = pool.current;
        if (!currentPool) { 
            setError("Relay pool not available."); 
            return null;
        }

        if (isConnecting) { 
            setError("Still connecting to relays..."); 
            return null; 
        }

        setIsProcessing(true); setError(null);
        console.log(`NostrBookEditor: Loading book from ${nip19Identifier}...`);

        try {
            // Decode naddr (same)
            const decoded = nip19.decode(nip19Identifier);
            if (decoded.type !== 'naddr' || decoded.data.kind !== BOOK_KIND) {
                throw new Error("Invalid ID: Expected book naddr.");
            }

            const { identifier: bookId, pubkey: authorPubkey, kind, relays: naddrRelays } = decoded.data;
            const effectiveRelays = naddrRelays?.length ? naddrRelays : relays;

            // Fetch Metadata (same)
            console.log(`NostrBookEditor: Fetching metadata K:${kind} A:${authorPubkey.substring(0, 6)} D:${bookId}`);
            const metadataEvent = await currentPool.get(effectiveRelays, { kinds: [kind], authors: [authorPubkey], '#d': [bookId], limit: 1 });
            if (!metadataEvent) {
                throw new Error(`Book metadata not found.`);
            }

            console.log(`NostrBookEditor: Found metadata event ${metadataEvent.id.substring(0, 8)}`);

            // Fetch Chapters using pool.subscribeMany
            const addrTagFilter = `${BOOK_KIND}:${authorPubkey}:${bookId}`;
            const chapterFilter: Filter = { kinds: [NODE_KIND], '#a': [addrTagFilter] };
            console.log(`NostrBookEditor: Fetching chapters with filter:`, chapterFilter);

            if (!currentPool?.subscribeMany) { // Defensive check
                console.error("NostrBookEditor: CRITICAL - pool.current.subscribeMany does not exist!");
                throw new Error("SimplePool instance is missing the 'subscribeMany' method.");
            }
            const actualPool = currentPool; // Use verified non-null pool

            const chapterEvents: NostrEvent[] = await new Promise((resolve) => {
                const eventsMap = new Map<string, NostrEvent>();
                let subCloser: { close: () => void } | null = null;
                let timeoutId: NodeJS.Timeout | null = null;

                // Corrected cleanup function
                const finish = () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    
                    if (subCloser) {
                        console.log("NostrBookEditor: Unsubscribing from chapter feed.");
                        subCloser.close(); // Call the .unsub() method
                    }
                    console.log(`NostrBookEditor: Resolving chapter fetch with ${eventsMap.size} events.`);
                    resolve(Array.from(eventsMap.values()));
                };

                timeoutId = setTimeout(() => {
                    console.warn(`NostrBookEditor: Timeout fetching chapters for ${bookId}`);
                    finish();
                }, LOAD_TIMEOUT_MS);

                try {
                    console.log("NostrBookEditor: Calling subscribeMany...");
                    // Assign the returned SubCloser object
                    subCloser = actualPool.subscribeMany(
                        effectiveRelays,
                        [chapterFilter],
                        { // The options object, type is inferred by TS
                            onevent(event: NostrEvent) {
                                // Deduplication logic (same as before)
                                const dTag = event.tags.find(t => t[0] === 'd')?.[1];
                                if (dTag) {
                                    const existing = eventsMap.get(dTag);
                                    if (!existing || event.created_at > existing.created_at) {
                                        eventsMap.set(dTag, event);
                                    }
                                }
                            },
                            oneose() {
                                console.log(`NostrBookEditor: EOSE received.`);
                                // Rely on timeout to ensure all relays potentially respond
                            },
                        } // Removed 'satisfies SubscriptionOptions'
                    );

                } catch (subError) {
                    console.error("NostrBookEditor: Error calling subscribeMany:", subError);
                    // Attempt to resolve with potentially empty data if subscribe call fails
                    finish();
                }
            });
            // --- End of subscribeMany Promise ---

            console.log(`NostrBookEditor: Processed ${chapterEvents.length} chapter events after subscription.`);

            // Assemble FsmData (logic remains the same)
            const states: Record<string, State> = {};
            chapterEvents.forEach(event => {
                try { 
                    const content = JSON.parse(event.content); 
                    if (!content.stateId) {
                        throw new Error("Missing stateId");
                    }
                    states[content.stateId] = { id: content.stateId, name: content.name || '?', content: content.content || '', entryFee: content.entryFee ?? 0, isEndState: content.isEndState ?? false, isStartState: false, transitions: content.transitions || [] }; 
                } catch (e: any) { 
                    console.warn(`Parse chapter ${event.id.substring(0,8)} error: ${e.message}`)
                }
            });

            const metadataContent = JSON.parse(metadataEvent.content || '{}');
            const startStateId = metadataContent.startStateId;

            if (startStateId && states[startStateId]) { 
                states[startStateId].isStartState = true; 
            } else if (Object.keys(states).length > 0 && !startStateId) { 
                console.warn("Start state invalid."); 
            }
            const fsmData: FsmData = { states: states, startStateId: startStateId || null };

            console.log(`NostrBookEditor: Book ${bookId} loaded successfully.`);
            return { bookId, fsmData };

        } catch (err: any) {
             console.error("NostrBookEditor: Load book failed:", err);
             setError(`Load failed: ${err.message || err}`);
             return null;
        } finally {
             setIsProcessing(false);
        }
    }, [relays, isConnecting]);

    // --- Return Hook Interface ---
    return {
        isConnecting,
        isProcessing,
        error,
        createAndLoadNewBook,
        loadBook,
        saveChapter,
        saveAllProgress,
        publishBook,
    };
};