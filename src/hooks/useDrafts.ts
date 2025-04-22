'use client';

import { useCallback, useState, useRef } from 'react';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { nip04 } from 'nostr-tools';
import { NostrDraftEvent, DraftFilter, BookDraft, ChapterDraft } from '@/types/drafts';
import { useNDK } from '@/components/NdkProvider';

// Constants
const DRAFT_KIND = 4; // For backward compatibility
const DRAFT_PARAMETERIZED_KIND = 30023; // NIP-33 parameterized replaceable events
const DRAFT_DELETION_KIND = 5;
const DRAFT_ENCRYPTION_ERROR = 'Could not decrypt or parse draft';
const INVALID_DRAFT_ERROR = 'Invalid draft event to update';

// Error handling
enum DraftErrorType {
    ENCRYPTION_ERROR = 'encryption_error',
    DECRYPTION_ERROR = 'decryption_error',
    VALIDATION_ERROR = 'validation_error',
    PUBLICATION_ERROR = 'publication_error',
    SIGNER_ERROR = 'signer_error',
    NOT_FOUND_ERROR = 'not_found_error',
}

class DraftError extends Error {
    type: DraftErrorType;
    
    constructor(message: string, type: DraftErrorType) {
        super(message);
        this.type = type;
        this.name = 'DraftError';
    }
}

// Draft status tracking
type DraftStatus = 'idle' | 'sending' | 'sent' | 'failed' | 'deleted';

export function useDrafts() {
    const { ndk } = useNDK();
    const [draftsStatus, setDraftsStatus] = useState<Record<string, DraftStatus>>({});
    const draftCache = useRef(new Map<string, { event: NDKEvent; draft: NostrDraftEvent }>());

    const updateDraftStatus = useCallback((eventId: string, status: DraftStatus) => {
        setDraftsStatus(prev => ({
            ...prev,
            [eventId]: status
        }));
    }, []);

    const clearCache = useCallback(() => {
        draftCache.current.clear();
    }, []);

    const getSignerPubkey = useCallback(async (): Promise<string> => {
        if (!ndk?.signer) {
            throw new DraftError("No signer connected", DraftErrorType.SIGNER_ERROR);
        }
        return await ndk.signer.user().then((u) => u.pubkey);
    }, [ndk]);

    const encryptDraft = useCallback(async (
        pubkey: string, 
        draft: NostrDraftEvent
    ): Promise<string> => {
        try {
            const content = JSON.stringify(draft);
            return await nip04.encrypt(pubkey, pubkey, content);
        } catch (error) {
            throw new DraftError(
                `Failed to encrypt draft: ${error instanceof Error ? error.message : String(error)}`, 
                DraftErrorType.ENCRYPTION_ERROR
            );
        }
    }, []);

    const publishDraftEvent = useCallback(async (
        pubkey: string,
        encryptedContent: string,
        draftId: string,
        draftType: string,
        bookId?: string,
        options?: {
            originalEvent?: boolean;
            extraTags?: string[][];
        }
    ): Promise<NDKEvent> => {
        try {
            const now = Math.floor(Date.now() / 1000);
            const draftIdentifier = draftId || crypto.randomUUID();
    
            // Base tags
            const tags: string[][] = [
                ["p", pubkey],                            // Author
                ["d", draftIdentifier],                   // NIP-33 replaceable ID
                ["t", draftType],                         // For filtering by draft_type
            ];
    
            // Tag for book reference (only for chapters)
            if (draftType === "chapter" && bookId) {
                tags.push(["b", bookId]);                 // Internal book reference (for your cache-based lookup)
                tags.push(["book", bookId]);              // NIP-01 compatible tag (for NDK queries) ✅
            }
    
            // Optional: tag the event being replaced or referenced
            if (options?.originalEvent) {
                tags.push(["e", draftId]);                // For threading/replace references
            }
    
            // Optional: extra tags from the caller (e.g. ["position", "1"])
            if (options?.extraTags?.length) {
                tags.push(...options.extraTags);
            }
    
            const event = new NDKEvent(ndk, {
                kind: DRAFT_PARAMETERIZED_KIND,
                pubkey,
                tags,
                content: encryptedContent,
                created_at: now,
            });
    
            await event.sign();
    
            console.log("📝 Publishing draft event:");
            console.log("  Kind:", event.kind);
            console.log("  Created At:", now);
            console.log("  Tags:", tags);
    
            // Time-limited publish
            const publishPromise = event.publish();
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Publish timeout")), 10000)
            );
    
            await Promise.race([publishPromise, timeoutPromise]);
    
            return event;
        } catch (error) {
            console.error("❌ Failed to publish draft:", error);
            throw new DraftError(
                `Failed to publish draft event: ${error instanceof Error ? error.message : String(error)}`,
                DraftErrorType.PUBLICATION_ERROR
            );
        }
    }, [ndk]);
    

    const validateDraftEvent = useCallback((
        event: NDKEvent, 
        pubkey: string
    ): void => {
        // Accept both traditional DMs and parameterized replaceable events
        if ((event.kind !== DRAFT_KIND && event.kind !== DRAFT_PARAMETERIZED_KIND) || event.pubkey !== pubkey) {
            throw new DraftError(INVALID_DRAFT_ERROR, DraftErrorType.VALIDATION_ERROR);
        }
    }, []);

    const createDraft = useCallback(async (
        draft: NostrDraftEvent,
        options?: { tags?: string[][] }
    ): Promise<NDKEvent> => {
        try {
            updateDraftStatus('new', 'sending');
            const pubkey = await getSignerPubkey();
            
            // Ensure we have created_at and last_modified fields
            const draftWithTimestamps = {
                ...draft,
                created_at: Date.now(),
                last_modified: Date.now(),
            };
            
            const encryptedContent = await encryptDraft(pubkey, draftWithTimestamps);
            
            // Pass draft type for tagging
            const bookId = draft.draft_type === 'chapter' ? (draft as ChapterDraft).book : undefined;
            const newEvent = await publishDraftEvent(
                pubkey, 
                encryptedContent, 
                draft.id, 
                draft.draft_type,
                bookId,
                { extraTags: options?.tags || [] }
            );
            
            // Add to cache
            draftCache.current.set(newEvent.id, { 
                event: newEvent, 
                draft: draftWithTimestamps 
            });
            
            updateDraftStatus(newEvent.id, 'sent');
            console.log("Created chapterEvent.id:", newEvent.id);
            console.log("chapterEvent.raw:", newEvent.rawEvent);
            return newEvent;
        } catch (error) {
            updateDraftStatus('new', 'failed');
            console.error('Failed to create draft:', error);
            throw error;
        }
    }, [getSignerPubkey, encryptDraft, publishDraftEvent, updateDraftStatus]);

    const updateDraft = useCallback(async (
        originalEvent: NDKEvent, 
        updatedDraft: NostrDraftEvent
    ): Promise<NDKEvent> => {
        try {
            const eventId = originalEvent.id;
            updateDraftStatus(eventId, 'sending');
            
            const pubkey = await getSignerPubkey();
            validateDraftEvent(originalEvent, pubkey);
            
            // Get the 'd' tag value from the original event for proper replacement
            const dTag = originalEvent.tags.find(tag => tag[0] === 'd')?.[1];
            if (!dTag) {
                throw new DraftError("Missing 'd' tag in original event", DraftErrorType.VALIDATION_ERROR);
            }
    
            // Create an updated draft with the current timestamp
            const draftWithTimestamp = {
                ...updatedDraft,
                last_modified: Date.now(),
            };
    
            const encryptedContent = await encryptDraft(pubkey, draftWithTimestamp);
    
            // Create a new event that preserves all the original tags
            const tags = [...originalEvent.tags];
            
            // Update or add 't' tag for draft type
            const tTagIndex = tags.findIndex(tag => tag[0] === 't');
            if (tTagIndex >= 0) {
                tags[tTagIndex] = ['t', updatedDraft.draft_type];
            } else {
                tags.push(['t', updatedDraft.draft_type]);
            }
            
            // If this is a chapter, ensure book tag is present
            if (updatedDraft.draft_type === 'chapter') {
                const chapterDraft = updatedDraft as ChapterDraft;
                const bTagIndex = tags.findIndex(tag => tag[0] === 'b');
                if (bTagIndex >= 0) {
                    tags[bTagIndex] = ['b', chapterDraft.book];
                } else {
                    tags.push(['b', chapterDraft.book]);
                }
            }
    
            const updatedEvent = new NDKEvent(ndk, {
                kind: DRAFT_PARAMETERIZED_KIND, // Use parameterized kind consistently
                pubkey,
                tags,
                content: encryptedContent,
                created_at: Math.floor(Date.now() / 1000),
            });
            
            await updatedEvent.sign();
            
            // Log before publishing
            console.log("Publishing updated draft with d tag:", dTag);
            
            await updatedEvent.publish();
            
            // Update cache with the newest version
            draftCache.current.set(updatedEvent.id, { 
                event: updatedEvent, 
                draft: draftWithTimestamp 
            });
            
            // Remove old version from cache if ID changed
            if (eventId !== updatedEvent.id) {
                draftCache.current.delete(eventId);
            }
            
            updateDraftStatus(updatedEvent.id, 'sent');
            return updatedEvent;
        } catch (error) {
            console.error('Failed to update draft:', error);
            updateDraftStatus(originalEvent.id, 'failed');
            throw error;
        }
    }, [ndk, getSignerPubkey, validateDraftEvent, encryptDraft, updateDraftStatus]);

    const decryptDraft = useCallback(async (
        event: NDKEvent, 
        pubkey: string
    ): Promise<NostrDraftEvent | null> => {
        try {
            const decrypted = await nip04.decrypt(pubkey, pubkey, event.content);
            return JSON.parse(decrypted) as NostrDraftEvent;
        } catch (error) {
            console.warn(DRAFT_ENCRYPTION_ERROR, error);
            return null;
        }
    }, []);

    const listDrafts = useCallback(async (
        filter?: DraftFilter,
        forceRefresh = false
    ): Promise<{ event: NDKEvent; draft: NostrDraftEvent }[]> => {
        try {
            // Use cache unless forced to refresh
            if (!forceRefresh && draftCache.current.size > 0) {
                const cachedDrafts = Array.from(draftCache.current.values());
                return cachedDrafts.filter(({ draft }) => {
                    // Filter by draft type if specified
                    if (filter?.draft_type && draft.draft_type !== filter.draft_type) {
                        return false;
                    }
                    
                    // Filter by book ID if specified and this is a chapter
                    if (filter?.book && draft.draft_type === 'chapter') {
                        const chapterDraft = draft as ChapterDraft;
                        return chapterDraft.book === filter.book;
                    }
                    
                    return true;
                });
            }
    
            const pubkey = await getSignerPubkey();
            
            // Get all deletion events first to filter them out
            const deletionEvents = await ndk.fetchEvents({
                kinds: [DRAFT_DELETION_KIND],
                authors: [pubkey],
            });
    
            // Create a Set of deleted event IDs for quick lookup
            const deletedEventIds = new Set<string>();
            for (const deletionEvent of deletionEvents) {
                const eTags = deletionEvent.tags.filter(tag => tag[0] === 'e');
                for (const eTag of eTags) {
                    if (eTag[1]) deletedEventIds.add(eTag[1]);
                }
            }
    
            // Build the filter for fetching events
            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
            const eventFilter: any = {
                kinds: [DRAFT_KIND, DRAFT_PARAMETERIZED_KIND],
                authors: [pubkey],
            };
            
            // Add tag filters
            if (filter?.draft_type) {
                eventFilter['#t'] = [filter.draft_type];
            }
            
            if (filter?.book) {
                eventFilter['#b'] = [filter.book];
                console.log(`Filtering chapters for book ID: ${filter.book}`);
            }
    
            // Get draft events
            const events = await ndk.fetchEvents(eventFilter);
            console.log(`Found ${events.size} events matching filter:`, eventFilter);
    
            // Group events by their 'd' tag to handle replaceable events
            const eventsByDTag = new Map<string, NDKEvent>();
            for (const event of events) {
                // Skip deleted events
                if (deletedEventIds.has(event.id)) continue;
                
                // Find the 'd' tag to use as identifier for parameterized replaceable events
                const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
                if (!dTag) continue; // Skip events without 'd' tag
                
                // Log book ID tag if present
                const bTag = event.tags.find(tag => tag[0] === 'b')?.[1];
                if (bTag && filter?.book) {
                    console.log(`Event ${event.id} has book tag: ${bTag}, filter wants: ${filter.book}`);
                }
                
                // Only keep the newest event for each 'd' tag
                const existingEvent = eventsByDTag.get(dTag);
                if (!existingEvent || existingEvent.created_at < event.created_at) {
                    eventsByDTag.set(dTag, event);
                }
            }
    
            // Clear cache if doing a full refresh
            if (forceRefresh) {
                draftCache.current.clear();
            }
    
            // Process all the unique latest events
            const decryptionPromises = Array.from(eventsByDTag.values())
                .map(async (event) => {
                    const draft = await decryptDraft(event, pubkey);
                    if (!draft) return null;
    
                    // Apply filtering
                    let matchesFilter = true;
                    
                    if (filter?.draft_type && draft.draft_type !== filter.draft_type) {
                        matchesFilter = false;
                    }
                    
                    if (filter?.book && draft.draft_type === 'chapter') {
                        const chapterDraft = draft as ChapterDraft;
                        matchesFilter = matchesFilter && chapterDraft.book === filter.book;
                        console.log(`Chapter ${draft.id} has book: ${chapterDraft.book}, filter wants: ${filter.book}, matches: ${matchesFilter}`);
                    }
    
                    if (draft) {
                        // Store in cache
                        draftCache.current.set(event.id, { event, draft });
                        // Set status as 'sent' for all loaded drafts
                        updateDraftStatus(event.id, 'sent');
                    }
    
                    return matchesFilter ? { event, draft } : null;
                });
    
            const results = await Promise.all(decryptionPromises);
            const filteredResults = results.filter((result): result is { event: NDKEvent; draft: NostrDraftEvent } => 
                result !== null
            );
            
            console.log(`Found ${filteredResults.length} drafts after filtering`);
            console.log("All chapters in cache:");
            console.log(Array.from(draftCache.current.entries()));
            return filteredResults;
        } catch (error) {
            console.error('Failed to list drafts:', error);
            throw error;
        }
    }, [ndk, getSignerPubkey, decryptDraft, updateDraftStatus]);

    const deleteDraft = useCallback(async (
        eventToDelete: NDKEvent
    ): Promise<NDKEvent> => {
        try {
            updateDraftStatus(eventToDelete.id, 'sending');
            
            const pubkey = await getSignerPubkey();
            validateDraftEvent(eventToDelete, pubkey);
            
            // Create a deletion event (kind 5)
            const deletionEvent = new NDKEvent(ndk, {
                kind: DRAFT_DELETION_KIND, // Deletion event kind
                pubkey,
                tags: [
                    ['e', eventToDelete.id], // Reference the event to delete
                ],
                content: '', // Usually empty or contains reason for deletion
                created_at: Math.floor(Date.now() / 1000),
            });
            
            await deletionEvent.sign();
            await deletionEvent.publish();
            
            // Remove from cache
            draftCache.current.delete(eventToDelete.id);
            updateDraftStatus(eventToDelete.id, 'deleted');
            
            return deletionEvent;
        } catch (error) {
            console.error('Failed to delete draft:', error);
            updateDraftStatus(eventToDelete.id, 'failed');
            throw error;
        }
    }, [ndk, getSignerPubkey, validateDraftEvent, updateDraftStatus]);

    const getDraftById = useCallback(async (
        eventId: string
    ): Promise<{ event: NDKEvent; draft: NostrDraftEvent } | null> => {
        // Check cache first
        if (draftCache.current.has(eventId)) {
            console.log(`Found draft ${eventId} in cache`);
            return draftCache.current.get(eventId) || null;
        }
        
        try {
            console.log(`Fetching draft with ID: ${eventId}`);
            const pubkey = await getSignerPubkey();
            const event = await ndk.fetchEvent({ 
                ids: [eventId],
                authors: [pubkey]
            });
            console.log("Fetched event: ", event);
            if (!event) {
                throw new DraftError(`Draft not found: ${eventId}`, DraftErrorType.NOT_FOUND_ERROR);
            }
            
            const draft = await decryptDraft(event, pubkey);
            console.log("DRAFT in the fetch: ", draft)
            if (!draft) {
                return null;
            }
            const result = { event, draft };
            draftCache.current.set(eventId, result);
            console.log(`Added draft ${eventId} to cache with type: ${draft.draft_type}`);
            return result;
        } catch (error) {
            console.error(`Failed to get draft by ID ${eventId}:`, error);
            throw error;
        }
    }, [ndk, getSignerPubkey, decryptDraft]);

    // NEW FUNCTION: Create a book with initial chapter
    const createBookWithChapter = useCallback(async (
        bookData: Omit<BookDraft, 'last_modified' | 'created_at'>,
        initialChapterData: Omit<ChapterDraft, 'last_modified' | 'created_at' | 'book'>
    ): Promise<{ bookEvent: NDKEvent; chapterEvent: NDKEvent }> => {
        try {
            const bookId = crypto.randomUUID();
            const chapterId = crypto.randomUUID();
            const bookDraft: BookDraft = {
                ...bookData,
                id: bookId,
                last_modified: Date.now(),
                created_at: Date.now(),
                chapters: [{
                    id: chapterId,
                    title: initialChapterData.title || '',
                    paid: initialChapterData.paid,
                    position: initialChapterData.position,
                    fee: null
                }]
            };
            console.log("Creating book draft:", bookDraft);
            const bookEvent = await createDraft(bookDraft);
            
            // 2. Create the initial chapter - ensure it has the book ID
            const chapterDraft: ChapterDraft = {
                ...initialChapterData,
                id: chapterId,
                book: bookId,
                draft_type: 'chapter',
                last_modified: Date.now(),
                created_at: Date.now()
            };
            console.log("Creating chapter draft with book ID:", chapterDraft);
            const chapterEvent = await createDraft(chapterDraft);
            
            // 3. Add to cache immediately
            if (chapterEvent && bookEvent) {
                draftCache.current.set(chapterEvent.id, { 
                    event: chapterEvent, 
                    draft: chapterDraft 
                });
            }
            
            return { bookEvent, chapterEvent };
        } catch (error) {
            console.error('Failed to create book with chapter:', error);
            throw error;
        }
    }, [createDraft]);

    const createNewChapter = useCallback(async (
        bookEventId: string,
        chapterData: Omit<ChapterDraft, 'last_modified' | 'created_at'>
    ): Promise<{ bookEvent: NDKEvent; chapterEvent: NDKEvent }> => {
        try {
            console.log(`Creating new chapter for book EVENT ID: ${bookEventId}`);
            
            // Fetch full book info (this gives us both event + draft ID)
            const bookResult = await getDraftById(bookEventId);
            console.log("BOOK RESULT", bookResult)
            if (!bookResult || bookResult.draft.draft_type !== 'book') {
                throw new DraftError(`Book not found: ${bookEventId}`, DraftErrorType.NOT_FOUND_ERROR);
            }
    
            const bookDraft = bookResult.draft as BookDraft;
    
            // Correct: use bookDraft.id (not event ID) for internal linkage
            const chapterDraft: ChapterDraft = {
                ...chapterData,
                id: chapterData.id || crypto.randomUUID(),
                book: bookDraft.id,
                draft_type: 'chapter',
                created_at: Date.now(),
                last_modified: Date.now(),
                tags: [
                    ["book", chapterData.book], // ✅ Tag with the actual EVENT ID so NDK can query by it
                    ["position", chapterData.position.toString()],
                    ["draft_type", "chapter"]
                ]
            };
    
            console.log("Creating chapter draft with internal book ID:", bookDraft.id);
    
            const chapterEvent = await createDraft(chapterDraft, {
                tags: [
                    ["book", bookEventId],
                    ["position", chapterDraft.position.toString()],
                    ["draft_type", "chapter"]
                ]
            });
            console.log("what CHAPTER EVENT: ", chapterEvent);
            draftCache.current.set(chapterEvent.id, {
                event: chapterEvent,
                draft: chapterDraft
            });
    
            // Add this chapter to the book's chapter list
            const updatedChapters = [
                ...(bookDraft.chapters || []),
                {
                    id: chapterDraft.id,
                    title: chapterDraft.title || '',
                    paid: chapterDraft.paid || false,
                    position: chapterData.position,
                    fee: null
                }
            ].sort((a, b) => a.position - b.position);
    
            const updatedBook: BookDraft = {
                ...bookDraft,
                last_modified: Date.now(),
                chapters: updatedChapters
            };
    
            const bookEvent = await updateDraft(bookResult.event, updatedBook);
    
            clearCache();
            await getDraftById(bookEvent.id);
            console.log("Using bookEventId:", bookEventId);
            console.log("Resolved bookDraft.id:", bookDraft.id);
            console.log("Assigning chapter.book:", bookDraft.id);
            console.log("Tagging event with ['book', bookEventId]:", bookEventId);
            return { bookEvent, chapterEvent };
        } catch (error) {
            console.error('Failed to create new chapter:', error);
            throw error;
        }
    }, [getDraftById, createDraft, updateDraft, clearCache]);
    
    

    const getChaptersByBookId = useCallback(async (
        bookDraftId: string, // must be the draft ID
        forceRefresh = true
    ): Promise<{ event: NDKEvent; draft: ChapterDraft }[]> => {
        try {
            console.log(`Fetching chapters for book draft ID: ${bookDraftId}`);
    
            if (forceRefresh) {
                clearCache();
            }
    
            const chapters = await listDrafts({
                draft_type: 'chapter',
                book: bookDraftId
            }, forceRefresh);
    
            console.log(`Found ${chapters.length} chapters for book ${bookDraftId}`);
    
            return chapters
                .map(item => ({
                    event: item.event,
                    draft: item.draft as ChapterDraft
                }))
                .sort((a, b) => a.draft.position - b.draft.position);
        } catch (error) {
            console.error(`Failed to get chapters for book ${bookDraftId}:`, error);
            throw error;
        }
    }, [listDrafts, clearCache]);
    

    return {
        createDraft,
        updateDraft,
        listDrafts,
        deleteDraft,
        getDraftById,
        clearCache,
        draftsStatus,
        // New functions
        createBookWithChapter,
        createNewChapter,
        getChaptersByBookId
    };
}