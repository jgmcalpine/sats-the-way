'use client';

import { useCallback, useState, useRef } from 'react';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { nip04 } from 'nostr-tools';
import { NostrDraftEvent, DraftFilter } from '@/types/drafts';
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
        originalEvent?: boolean
    ): Promise<NDKEvent> => {
        try {
            const tags: string[][] = [['p', pubkey]];
            
            // Create a unique identifier for this draft
            const draftIdentifier = draftId || crypto.randomUUID();            
            // Add parameterized replaceable event tag for NIP-33
            tags.push(['d', draftIdentifier]);
            
            if (originalEvent) {
                // Reference the original event by its id
                tags.push(['e', draftId]);
            }
            
            const event = new NDKEvent(ndk, {
                kind: DRAFT_PARAMETERIZED_KIND, // Use parameterized kind consistently
                pubkey,
                tags,
                content: encryptedContent,
                created_at: Math.floor(Date.now() / 1000),
            });
            
            await event.sign();
            
            // First, check relay connectivity
            console.log("Connected relays:", ndk.pool?.relays.size);
            
            // Use the correct publish approach with timeout
            try {
                // Set a longer timeout for the publish operation
                const publishPromise = event.publish();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Publish timeout")), 10000)
                );
                
                await Promise.race([publishPromise, timeoutPromise]);
                return event;
            } catch (publishError) {
                console.error("Publish failed:", publishError);
                throw publishError;
            }
        } catch (error) {
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
        draft: NostrDraftEvent
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
            const newEvent = await publishDraftEvent(pubkey, encryptedContent, draft.id);
            
            // Add to cache
            draftCache.current.set(newEvent.id, { 
                event: newEvent, 
                draft: draftWithTimestamps 
            });
            
            updateDraftStatus(newEvent.id, 'sent');
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
    
            // Create a new event that references the same 'd' tag to ensure proper replacement
            const updatedEvent = new NDKEvent(ndk, {
                kind: DRAFT_PARAMETERIZED_KIND, // Use parameterized kind consistently
                pubkey,
                tags: [
                    ['p', pubkey],
                    ['d', dTag], // Use the same 'd' tag value for replacement
                ],
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
                return cachedDrafts.filter(({ draft }) => 
                    !filter
                    || ((!filter.draft_type || draft.draft_type === filter.draft_type))
                );
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
    
            // Get draft events - fetch both kinds for compatibility
            const events = await ndk.fetchEvents({
                kinds: [DRAFT_KIND, DRAFT_PARAMETERIZED_KIND],
                authors: [pubkey],
                ...(filter?.draft_type ? { '#d': [filter.draft_type] } : {}),
            });
    
            // Group events by their 'd' tag to handle replaceable events
            const eventsByDTag = new Map<string, NDKEvent>();
            for (const event of events) {
                // Skip deleted events
                if (deletedEventIds.has(event.id)) continue;
                
                // Find the 'd' tag to use as identifier for parameterized replaceable events
                const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
                if (!dTag) continue; // Skip events without 'd' tag
                
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
    
                    const matchesFilter = !filter
                        || ((!filter.draft_type || draft.draft_type === filter.draft_type));
    
                    if (draft) {
                        // Store in cache
                        draftCache.current.set(event.id, { event, draft });
                        // Set status as 'sent' for all loaded drafts
                        updateDraftStatus(event.id, 'sent');
                    }
    
                    return matchesFilter ? { event, draft } : null;
                });
    
            const results = await Promise.all(decryptionPromises);
            return results.filter((result): result is { event: NDKEvent; draft: NostrDraftEvent } => 
                result !== null
            );
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
            return draftCache.current.get(eventId) || null;
        }
        
        try {
            const pubkey = await getSignerPubkey();
            const event = await ndk.fetchEvent({ 
                ids: [eventId],
                authors: [pubkey]
            });
            
            if (!event) {
                throw new DraftError(`Draft not found: ${eventId}`, DraftErrorType.NOT_FOUND_ERROR);
            }
            
            const draft = await decryptDraft(event, pubkey);
            if (!draft) {
                return null;
            }
            
            const result = { event, draft };
            draftCache.current.set(eventId, result);
            return result;
        } catch (error) {
            console.error(`Failed to get draft by ID ${eventId}:`, error);
            throw error;
        }
    }, [ndk, getSignerPubkey, decryptDraft]);

    return {
        createDraft,
        updateDraft,
        listDrafts,
        deleteDraft,
        getDraftById,
        clearCache,
        draftsStatus,
    };
}