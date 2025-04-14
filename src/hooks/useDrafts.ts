'use client';

import { useCallback } from 'react';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { nip04 } from 'nostr-tools';
import { NostrDraftEvent, DraftFilter } from '@/types/drafts';
import { useNDK } from '@/components/NdkProvider';

const DRAFT_KIND = 4;
const DRAFT_ENCRYPTION_ERROR = 'Could not decrypt or parse draft';
const INVALID_DRAFT_ERROR = 'Invalid draft event to update';

export function useDrafts() {
    const { ndk } = useNDK();

    const getSignerPubkey = useCallback(async (): Promise<string> => {
        if (!ndk?.signer) return '';
        return await ndk.signer.user().then((u) => u.pubkey);
    }, [ndk]);

    const encryptDraft = useCallback(async (
        pubkey: string, 
        draft: NostrDraftEvent
    ): Promise<string> => {
        const content = JSON.stringify(draft);
        return await nip04.encrypt(pubkey, pubkey, content);
    }, []);

    const createNostrEvent = useCallback(async (
        pubkey: string, 
        encryptedContent: string
    ): Promise<NDKEvent> => {
        const event = new NDKEvent(ndk, {
            kind: DRAFT_KIND,
            pubkey,
            tags: [['p', pubkey]],
            content: encryptedContent,
            created_at: Math.floor(Date.now() / 1000),
        });

        await event.sign();
        await event.publish();

        return event;
    }, [ndk]);

    const createDraft = useCallback(async (
        draft: NostrDraftEvent
    ): Promise<NDKEvent> => {
        try {
            const pubkey = await getSignerPubkey();
            const encryptedContent = await encryptDraft(pubkey, draft);
            return await createNostrEvent(pubkey, encryptedContent);
        } catch (error) {
            console.error('Failed to create draft:', error);
            throw error;
        }
    }, [getSignerPubkey, encryptDraft, createNostrEvent]);

    const validateDraftEvent = useCallback((
        event: NDKEvent, 
        pubkey: string
    ): void => {
        if (event.kind !== DRAFT_KIND || event.pubkey !== pubkey) {
            throw new Error(INVALID_DRAFT_ERROR);
        }
    }, []);

    const updateDraft = useCallback(async (
        originalEvent: NDKEvent, 
        updatedDraft: NostrDraftEvent
    ): Promise<NDKEvent> => {
        try {
            const pubkey = await getSignerPubkey();
            validateDraftEvent(originalEvent, pubkey);

            const encryptedContent = await encryptDraft(pubkey, {
                ...updatedDraft,
                last_modified: Date.now(),
            });

            return await createNostrEvent(pubkey, encryptedContent);
        } catch (error) {
            console.error('Failed to update draft:', error);
            throw error;
        }
    }, [getSignerPubkey, validateDraftEvent, encryptDraft, createNostrEvent]);

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
        filter?: DraftFilter
    ): Promise<{ event: NDKEvent; draft: NostrDraftEvent }[]> => {
        try {
            const pubkey = await getSignerPubkey();
            const events = await ndk.fetchEvents({
                kinds: [DRAFT_KIND],
                authors: [pubkey],
            });

            const decryptionPromises = Array.from(events).map(async (event) => {
                const draft = await decryptDraft(event, pubkey);
                if (!draft) return null;

                const matchesFilter = !filter
                    || ((!filter.draft_type || draft.draft_type === filter.draft_type)
                        && (filter.published === undefined || draft.published === filter.published));

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
    }, [ndk, getSignerPubkey, decryptDraft]);

    const markDraftAsPublished = useCallback(async (
        originalEvent: NDKEvent, 
        draft: NostrDraftEvent
    ): Promise<NDKEvent> => {
        const updatedDraft = {
            ...draft,
            published: true,
            last_modified: Date.now(),
        };
        return await updateDraft(originalEvent, updatedDraft);
    }, [updateDraft]);

    return {
        createDraft,
        updateDraft,
        listDrafts,
        markDraftAsPublished,
    };
}