import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { nip19 } from 'nostr-tools'; // Only for address decoding – NDK has no helper yet.
import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { sha256 as jsSha256 } from '@noble/hashes/sha256';

import { generateChapterKey, aesEncrypt, EncryptedBlob } from '@/utils/crypto';

import { useNdk } from '@/components/NdkProvider';

import type { State, FsmData, Transition } from '@/hooks/useFsm';
import { BOOK_KIND, NODE_KIND } from '@/lib/nostr/constants';

const sha256Hex = (hex: string): string => Buffer.from(jsSha256(Buffer.from(hex, 'hex'))).toString('hex');

// ––––– Types –––––
interface NostrBookEditorUtils {
	isConnecting: boolean;
	isProcessing: boolean;
	error: string | null;
	createAndLoadNewBook: () => Promise<{ bookId: string; initialFsmData: FsmData } | null>;
	loadBook: (nip19Identifier: string) => Promise<{ bookId: string; fsmData: FsmData } | null>;
	saveChapter: (chapterData: State, bookId: string, authorPubkey: string) => Promise<boolean>;
	saveAllProgress: (
		fsmData: FsmData,
		bookId: string,
		bookTitle: string | undefined,
		authorPubkey: string,
	) => Promise<boolean>;
	publishBook: (
		fsmData: FsmData,
		bookId: string,
		bookTitle: string | undefined,
		authorPubkey: string,
	) => Promise<boolean>;
}

// ––––– Hook –––––
export const useNostrBookEditor = (
	currentUserPubkey: string | null,
): NostrBookEditorUtils => {
	const { ndk, isConnected, addSigner } = useNdk();

	const [isProcessing, setProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// NDK handles relay connection internally; mirror the flag for compatibility
	const isConnecting = !isConnected;

	// ––––– Helpers –––––
	const ensureSigner = useCallback(async () => {
		if (!ndk.signer) await addSigner();
		if (!ndk.signer) throw new Error('NIP‑07 signer not attached.');
	}, [ndk, addSigner]);

	const signAndPublish = useCallback(async (ev: NDKEvent): Promise<NDKEvent | null> => {
		try {
			await ensureSigner();
			await ev.sign();
			const publishedEvent = await ev.publish();
            console.log("publishedEvent: ", publishedEvent)

			return ev;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			console.error('sign/publish failed', e);
			setError(e.message ?? 'Publish failed');
			return null;
		}
	}, [ensureSigner]);

	// Metadata & chapter builders
	const buildMetadataEvent = useCallback(
		(
            fsm: FsmData,
			bookId: string,
			authorPubkey: string,
			status: 'draft' | 'published',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
			merge?: Record<string, any>,
		): NDKEvent => {
            const { title, description, lnurl, startStateId } = fsm;
			const ev = new NDKEvent(ndk);
			ev.kind = BOOK_KIND;
			ev.tags = [['d', bookId]];
			if (title) ev.tags.push(['title', title]);
			ev.content = JSON.stringify({
				...(merge ?? {}),
				bookId,
				title: title ?? merge?.title ?? 'Untitled Book',
				status,
                description,
                lnurl,
				startStateId,
				authorPubkey,
				...(status === 'published' && { publishedAt: merge?.publishedAt ?? Math.floor(Date.now() / 1000) }),
			});
			return ev;
		},
		[ndk],
	);

	const buildChapterEvent = useCallback(
		async (
			chapter: State,
			bookId: string,
			authorPubkey: string,
			isPublish: boolean = false
		): Promise<NDKEvent> => {
			if (!ndk) throw new Error('NDK not ready');

			const ev = new NDKEvent(ndk);
			ev.kind = NODE_KIND;
			ev.tags = [
				['d', chapter.id],
    		['a', `${NODE_KIND}:${authorPubkey}:${chapter.id}`],
    		['a', `${BOOK_KIND}:${authorPubkey}:${bookId}`, '', 'root'],
			];

			// Base payload with all fields
			const payload: any = {
				stateId: chapter.id,
				bookId,
				name: chapter.name,
				price: chapter.price,
				content: chapter.content,
				isEndState: chapter.isEndState,
				previousChapterId: chapter.previousChapterId,
				transitions: chapter.transitions.map((t: Transition) => ({
					id: t.id,
					choiceText: t.choiceText,
					targetStateId: t.targetStateId,
					price: t.price ?? 0,
				})),
			};

			// Encrypt only content if publishing and price > 0
			if (isPublish && chapter.price && chapter.price > 0) {
				const key = generateChapterKey();
				const enc: EncryptedBlob = aesEncrypt(chapter.content, key);
				// Replace plaintext with encrypted blob
				payload.content = enc;

				// Payment tags
				ev.tags.push(['amount', chapter.price.toString()]);
				ev.tags.push(['s', sha256Hex(key)]);

				// Persist preimage for LNURL handler
				await fetch('/api/chapter-key', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ bookId, chapId: chapter.id, key }),
				});
			}

			// Attach final payload
			ev.content = JSON.stringify(payload);
			return ev;
		},
		[ndk]
		);

	// ––––– CRUD actions –––––
	const createAndLoadNewBook = useCallback(async () => {
		if (!currentUserPubkey) {
			setError('User not logged in');
			return null;
		}

		setProcessing(true);
		setError(null);

		try {
			const bookId = uuidv4();
			const startChapterId = uuidv4();

			const initialChapter: State = {
				id: startChapterId,
				name: 'Chapter 1',
				content: '',
				isStartState: true,
				isEndState: false,
				transitions: [],
			};

			const fsmData: FsmData = {
				states: { [startChapterId]: initialChapter },
				startStateId: startChapterId,
                title: '',
                description: '',
                lnurl: ''
			};

			const metadataEv = buildMetadataEvent(fsmData, bookId, currentUserPubkey, 'draft');
			const chapterEv = await buildChapterEvent(initialChapter, bookId, currentUserPubkey);

			const [metaOk, chapOk] = await Promise.all([signAndPublish(metadataEv), signAndPublish(chapterEv)]);
			if (!metaOk || !chapOk) throw new Error('Failed to publish initial events');

			return { bookId, initialFsmData: fsmData };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setError(e.message ?? 'Creation failed');
			return null;
		} finally {
			setProcessing(false);
		}
	}, [currentUserPubkey, buildMetadataEvent, buildChapterEvent, signAndPublish]);

	const saveChapter = useCallback(async (
		chapter: State,
		bookId: string,
		authorPubkey: string,
	) => {
		if (!currentUserPubkey || currentUserPubkey !== authorPubkey) {
			setError('Permission denied');
			return false;
		}
		setProcessing(true);
		setError(null);
		try {
			const ev = await buildChapterEvent(chapter, bookId, authorPubkey);
			return !!(await signAndPublish(ev));
		} finally {
			setProcessing(false);
		}
	}, [currentUserPubkey, buildChapterEvent, signAndPublish]);

	const saveAllProgress = useCallback(async (
		fsmData: FsmData,
		bookId: string,
		bookTitle: string | undefined,
		authorPubkey: string,
	) => {
		if (!currentUserPubkey || currentUserPubkey !== authorPubkey) {
			setError('Permission denied');
			return false;
		}
		if (!fsmData.startStateId) {
			setError('Missing start state');
			return false;
		}
		setProcessing(true);
		setError(null);

		try {
			const meta = buildMetadataEvent(fsmData, bookId, authorPubkey, 'draft');
			const chapterPromises = Object.values(fsmData.states).map(s => buildChapterEvent(s, bookId, authorPubkey));
			const chapterEvents = await Promise.all(chapterPromises);
			const results = await Promise.allSettled([
				signAndPublish(meta),
				...chapterEvents.map(ev => signAndPublish(ev)),
			]);
			return results.every(r => r.status === 'fulfilled' && r.value);
		} finally {
			setProcessing(false);
		}
	}, [currentUserPubkey, buildMetadataEvent, buildChapterEvent, signAndPublish]);

	const publishBook = useCallback(async (
		fsmData: FsmData,
		bookId: string,
		bookTitle: string | undefined,
		authorPubkey: string,
	) => {
		if (!currentUserPubkey || currentUserPubkey !== authorPubkey) {
			setError('Permission denied');
			return false;
		}
		if (!fsmData.startStateId) {
			setError('Missing start state');
			return false;
		}
		setProcessing(true);
		setError(null);
		try {
			// Fetch existing metadata to retain immutable fields
			const existing = await ndk.fetchEvent({
				kinds: [BOOK_KIND],
				authors: [authorPubkey],
				'#d': [bookId],
				limit: 1,
			} as NDKFilter);

			const merge = existing ? JSON.parse(existing.content) : undefined;
            console.log("what state:/ssm ", fsmData.states)
            const chapterPromises = Object.values(fsmData.states).map(s => buildChapterEvent(s, bookId, authorPubkey, true));
			const chapterEvents = await Promise.all(chapterPromises);
			const meta = buildMetadataEvent(fsmData, bookId, authorPubkey, 'published', merge);
			const results = await Promise.allSettled([
				signAndPublish(meta),
				...chapterEvents.map(ev => signAndPublish(ev)),
			]);
			return results.every(r => r.status === 'fulfilled' && r.value);
		} finally {
			setProcessing(false);
		}
	}, [currentUserPubkey, ndk, buildMetadataEvent, signAndPublish]);

	const loadBook = useCallback(async (addr: string) => {
		if (isConnecting) {
			setError('Still connecting');
			return null;
		}
		setProcessing(true);
		setError(null);
		try {
			const decoded = nip19.decode(addr);
			if (decoded.type !== 'naddr' || decoded.data.kind !== BOOK_KIND) throw new Error('Not a book address');

			const { identifier: bookId, pubkey: authorPubkey } = decoded.data;
			const meta = await ndk.fetchEvent({ kinds: [BOOK_KIND], authors: [authorPubkey], '#d': [bookId], limit: 1 } as NDKFilter);
			if (!meta) throw new Error('Metadata not found');

			const addrTag = `${BOOK_KIND}:${authorPubkey}:${bookId}`;
			const chapterSet = await ndk.fetchEvents({ kinds: [NODE_KIND], '#a': [addrTag] } as NDKFilter);
			const chapters = Array.from(chapterSet);

			const states: Record<string, State> = {};
			chapters.forEach(ev => {
				try {
					const c = JSON.parse(ev.content);
					states[c.stateId] = {
						id: c.stateId,
						name: c.name ?? '?',
						content: c.content ?? '',
						price: c.price ?? 0,
						isEndState: c.isEndState ?? false,
						isStartState: false,
						transitions: c.transitions ?? [],
					};
				} catch {}
			});

			const metaContent = JSON.parse(meta.content);
			if (metaContent.startStateId && states[metaContent.startStateId]) {
				states[metaContent.startStateId].isStartState = true;
			}
			return { bookId, fsmData: { states, startStateId: metaContent.startStateId, title: metaContent.title } };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setError(e.message ?? 'Load failed');
			return null;
		} finally {
			setProcessing(false);
		}
	}, [isConnecting, ndk]);

	// ––––– Public API –––––
	return useMemo(() => ({
		isConnecting,
		isProcessing,
		error,
		createAndLoadNewBook,
		loadBook,
		saveChapter,
		saveAllProgress,
		publishBook,
	}), [isConnecting, isProcessing, error, createAndLoadNewBook, loadBook, saveChapter, saveAllProgress, publishBook]);
};
