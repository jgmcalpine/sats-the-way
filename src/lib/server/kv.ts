// In-memory stub; swap for Redis, Upstash, etc.
const CHAPTER_KEYS = new Map<string, string>();

/**
 * Store the preimage key for a given bookId:chapId.
 */
export const putChapterKey = async (bookId: string, chapId: string, key: string): Promise<void> => {
	CHAPTER_KEYS.set(`${bookId}:${chapId}`, key);
};