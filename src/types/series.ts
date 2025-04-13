export interface SeriesMetadataEvent {
	series_type: "book" | "video" | "music";
	media_type: "text" | "audio" | "video";
	title: string;
	slug: string;
	author: string;
	language: string;
	chapters: {
		id: string;
		title: string;
		paid: boolean;
		position: number;
	}[];
	description?: string;
}

export interface SeriesEntryEvent {
	entry_type: "chapter" | "episode" | "track";
	media_type: "text" | "audio" | "video";
	book: string;
	paid: boolean;
	position: number;
	title?: string;
	summary?: string;
	body?: string | null;
	encrypted_body?: string | null;
	encryption_scheme?: string | null;
	published_at?: number;
}
