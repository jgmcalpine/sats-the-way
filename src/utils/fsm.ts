import { FSMMetadataEvent, ParsedFSMMetadata } from '@/types/fsm';

export function parseFSMMetadata(event: FSMMetadataEvent): ParsedFSMMetadata {
	const tag = (key: string) =>
		event.tags.find(t => t[0] === key)?.[1];

	return {
		id: event.id,
		pubkey: event.pubkey,
		title: tag("title") ?? "Untitled",
		summary: tag("summary"),
		cover: tag("cover"),
		genre: tag("genre"),
		language: tag("language"),
		start: tag("start") ?? "start",
		chapterCount: parseInt(tag("chapters") ?? "0", 10),
		minCost: tag("min-cost") ? parseInt(tag("min-cost")!, 10) : undefined,
		paywalled: tag("paywalled") === "true",
		createdAt: event.created_at
	};
}
