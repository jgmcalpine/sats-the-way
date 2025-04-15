import { NDKEvent } from '@nostr-dev-kit/ndk';

export type DraftType = "book" | "chapter"

export interface DraftBase {
    id: string
	draft_type: DraftType
	last_modified: number // timestamp for syncing and autosave
}

export interface BookDraft extends DraftBase {
    id: string
	draft_type: "book"
	series_type: "book" | "video" | "music"
	media_type: "text" | "audio" | "video"
	title: string
	author: string
	language: string
	description?: string
    dedication?: string
	slug?: string
	tags?: string[]
	chapters: {
		id: string
		title?: string
		paid: boolean
		position: number
	}[]
}

export interface ChapterDraft extends DraftBase {
	draft_type: "chapter"
	entry_type: "chapter" | "episode" | "track"
	media_type: "text" | "audio" | "video"
	body: string
	book: string
	paid: boolean
	position: number
	title?: string
	summary?: string
	encrypted_body?: string | null
	encryption_scheme?: string | null
	published_at?: number
}

export type NostrDraftEvent = BookDraft | ChapterDraft

export interface DraftFilter {
    draft_type?: DraftType;
    book?: string;
}

// Define an interface for our UI mapping (we're only handling book drafts here)
export interface BookDraftWithMetadata {
	event: NDKEvent; 
    draft: BookDraft;
}
