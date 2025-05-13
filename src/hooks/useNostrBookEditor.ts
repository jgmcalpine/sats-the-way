import { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk';
import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useNdk } from '@/components/NdkProvider';

import { BOOK_KIND, NODE_KIND } from '@/lib/nostr/constants';
import type { FsmData, FsmState, Transition } from '@/types/fsm';
import { calculateCheapestPath } from '@/utils/graph';

// ––––– Types –––––
interface NostrBookEditorUtils {
  isConnecting: boolean;
  isProcessing: boolean;
  error: string | null;
  createAndLoadNewBook: () => Promise<{ bookId: string; initialFsmData: FsmData } | null>;
  loadBook: (
    bookId: string,
    authorPubkey: string | undefined
  ) => Promise<{ bookId: string; fsmData: FsmData } | null>;
  saveChapter: (chapterData: FsmState, bookId: string, authorPubkey: string) => Promise<boolean>;
  saveAllProgress: (fsmData: FsmData) => Promise<boolean>;
  publishBook: (fsmData: FsmData) => Promise<boolean>;
}

// ––––– Hook –––––
export const useNostrBookEditor = (currentUserPubkey: string | null): NostrBookEditorUtils => {
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

  const signAndPublish = useCallback(
    async (ev: NDKEvent): Promise<NDKEvent | null> => {
      try {
        await ensureSigner();
        await ev.sign();
        const publishedEvent = await ev.publish();
        console.log('publishedEvent: ', publishedEvent);

        return ev;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.error('sign/publish failed', e);
        setError(e.message ?? 'Publish failed');
        return null;
      }
    },
    [ensureSigner]
  );

  // Metadata & chapter builders
  const buildMetadataEvent = useCallback(
    (
      fsm: FsmData,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      merge?: Record<string, any>
    ): NDKEvent => {
      const {
        title,
        description,
        lnurlp,
        startStateId,
        fsmId: bookId,
        lifecycle,
        authorPubkey,
        authorName,
      } = fsm;
      const ev = new NDKEvent(ndk);
      ev.kind = BOOK_KIND;
      ev.tags = [['d', bookId]];
      if (title) ev.tags.push(['title', title]);

      const { cost: minCost } = calculateCheapestPath(fsm.states, fsm.startStateId) || { cost: 0 };

      ev.content = JSON.stringify({
        ...(merge ?? {}),
        bookId,
        title: title ?? merge?.title ?? 'Untitled Book',
        lifecycle,
        description,
        lnurlp,
        startStateId,
        authorPubkey,
        authorName,
        minCost,
        ...(lifecycle === 'published' && {
          publishedAt: merge?.publishedAt ?? Math.floor(Date.now() / 1000),
        }),
      });
      return ev;
    },
    [ndk]
  );

  const buildChapterEvent = useCallback(
    async (chapter: FsmState, bookId: string, authorPubkey: string): Promise<NDKEvent> => {
      if (!ndk) throw new Error('NDK not ready');

      const ev = new NDKEvent(ndk);
      ev.kind = NODE_KIND;
      ev.tags = [
        ['d', chapter.id],
        ['a', `${NODE_KIND}:${authorPubkey}:${chapter.id}`],
        ['a', `${BOOK_KIND}:${authorPubkey}:${bookId}`, '', 'root'],
      ];

      // Base payload with all fields
      const chapterContent = {
        stateId: chapter.id,
        bookId,
        name: chapter.name,
        price: chapter.price,
        content: chapter.content,
        isEndState: chapter.isEndState,
        previousStateId: chapter.previousStateId,
        transitions: chapter.transitions.map((t: Transition) => ({
          id: t.id,
          choiceText: t.choiceText,
          targetStateId: t.targetStateId,
          price: t.price ?? 0,
        })),
      };

      ev.content = JSON.stringify(chapterContent);
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

      const initialChapter: FsmState = {
        id: startChapterId,
        name: 'Chapter 1',
        content: '',
        isStartState: true,
        isEndState: false,
        transitions: [],
      };

      const fsmData: FsmData = {
        states: { [startChapterId]: initialChapter },
        authorPubkey: currentUserPubkey,
        startStateId: startChapterId,
        title: '',
        lifecycle: 'draft',
        description: '',
        lnurlp: '',
        fsmType: 'book',
        fsmId: bookId,
        minCost: 0,
      };

      const metadataEv = buildMetadataEvent(fsmData);
      const chapterEv = await buildChapterEvent(initialChapter, bookId, currentUserPubkey);

      const [metaOk, chapOk] = await Promise.all([
        signAndPublish(metadataEv),
        signAndPublish(chapterEv),
      ]);
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

  const saveChapter = useCallback(
    async (chapter: FsmState, bookId: string, authorPubkey: string) => {
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
    },
    [currentUserPubkey, buildChapterEvent, signAndPublish]
  );

  const saveAllProgress = useCallback(
    async (fsmData: FsmData) => {
      const { authorPubkey, fsmId, startStateId, states } = fsmData;

      if (!currentUserPubkey || currentUserPubkey !== authorPubkey) {
        setError('Permission denied');
        return false;
      }
      if (!startStateId) {
        setError('Missing start state');
        return false;
      }
      setProcessing(true);
      setError(null);

      try {
        const meta = buildMetadataEvent(fsmData);
        const chapterPromises = Object.values(states).map(s =>
          buildChapterEvent(s, fsmId, authorPubkey)
        );
        const chapterEvents = await Promise.all(chapterPromises);
        const results = await Promise.allSettled([
          signAndPublish(meta),
          ...chapterEvents.map(ev => signAndPublish(ev)),
        ]);
        return results.every(r => r.status === 'fulfilled' && r.value);
      } finally {
        setProcessing(false);
      }
    },
    [currentUserPubkey, buildMetadataEvent, buildChapterEvent, signAndPublish]
  );

  const publishBook = useCallback(
    async (fsmData: FsmData) => {
      const { authorPubkey, fsmId: bookId } = fsmData;
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
        const chapterPromises = Object.values(fsmData.states).map(s =>
          buildChapterEvent(s, bookId, authorPubkey)
        );
        const chapterEvents = await Promise.all(chapterPromises);
        fsmData.lifecycle = 'published';
        const meta = buildMetadataEvent(fsmData, merge);
        const results = await Promise.allSettled([
          signAndPublish(meta),
          ...chapterEvents.map(ev => signAndPublish(ev)),
        ]);
        return results.every(r => r.status === 'fulfilled' && r.value);
      } finally {
        setProcessing(false);
      }
    },
    [currentUserPubkey, ndk, buildMetadataEvent, signAndPublish]
  );

  const loadBook = useCallback(
    async (bookId: string, authorPubkey: string | undefined) => {
      if (isConnecting) {
        setError('Still connecting');
        return null;
      }
      if (!authorPubkey) {
        setError('Could not load book, no author pubkey found');
        return null;
      }
      setProcessing(true);
      setError(null);
      try {
        const meta = await ndk.fetchEvent({
          kinds: [BOOK_KIND],
          authors: [authorPubkey],
          '#d': [bookId],
          limit: 1,
        } as NDKFilter);
        if (!meta) throw new Error('Metadata not found');

        const bookAddrTag = `${BOOK_KIND}:${authorPubkey}:${bookId}`;
        const chapterSet = await ndk.fetchEvents({
          kinds: [NODE_KIND],
          '#a': [bookAddrTag],
          authors: [authorPubkey],
        } as NDKFilter);
        const chapters = Array.from(chapterSet);
        const states: Record<string, FsmState> = {};
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

        const { startStateId, title, minCost, lifecycle, authorName, lnurlp, description } =
          metaContent;

        return {
          bookId,
          fsmData: {
            states,
            startStateId,
            title,
            lifecycle,
            authorName,
            authorPubkey,
            minCost,
            lnurlp,
            description,
            fsmId: bookId,
            fsmType: 'book',
          },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setError(e.message ?? 'Load failed');
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [isConnecting, ndk]
  );

  // ––––– Public API –––––
  return useMemo(
    () => ({
      isConnecting,
      isProcessing,
      error,
      createAndLoadNewBook,
      loadBook,
      saveChapter,
      saveAllProgress,
      publishBook,
    }),
    [
      isConnecting,
      isProcessing,
      error,
      createAndLoadNewBook,
      loadBook,
      saveChapter,
      saveAllProgress,
      publishBook,
    ]
  );
};
