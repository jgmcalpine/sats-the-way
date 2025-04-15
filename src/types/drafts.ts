export type DraftType = "book" | "chapter"

export interface DraftBase {
	draft_type: DraftType
	published: boolean // true once converted to public kind 30077/30078
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
	slug?: string
	tags?: string[]
	chapters: {
		id: string
		title: string
		paid: boolean
		position: number
	}[]
}

export interface ChapterDraft extends DraftBase {
	draft_type: "chapter"
	entry_type: "chapter" | "episode" | "track"
	media_type: "text" | "audio" | "video"
	title?: string
	summary?: string
	body?: string | null
	encrypted_body?: string | null
	encryption_scheme?: string | null
	book: string | null // can be null until assigned to a published book
	paid: boolean
	position: number
	published_at?: number
}

export type NostrDraftEvent = BookDraft | ChapterDraft

export interface DraftFilter {
    draft_type?: DraftType;
    published?: boolean;
}

// Define an interface for our UI mapping (we're only handling book drafts here)
export interface BookDraftWithMetadata {
	title: string;
	draft: BookDraft;
	language?: string;
	slug?: string;
}
