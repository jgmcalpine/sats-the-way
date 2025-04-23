export type FSMChapterTag =
	| ["id", string]
	| ["title", string]
	| ["next", string] // linear next step
	| ["next", string, "choice", string] // choice fork
	| ["paywall", "true", "lnurl", string] // paywall via lnurl
	| ["end", "true"]
	| ["condition", "id", string] // conditional visibility
	| ["prompt", string]
	| ["content-type", string];

export type FSMChapterEvent = {
	kind: 40001;
	pubkey: string;
	created_at: number;
	tags: FSMChapterTag[];
	content: string; // encrypted base64 string
	id: string;
	sig: string;
};

export type FSMChoice = {
	nextId: string;
	label?: string;
	conditionId?: string;
};

export type FSMChapter = {
	id: string;
	title?: string;
	content: string;
	choices: FSMChoice[];
	paywall?: string; // lnurl
	isEnd?: boolean;
	prompt?: string;
	contentType?: string;
	previousId?: string; // for back navigation
};

export interface FSMMetadataEvent {
	kind: 30077;
	pubkey: string;
	created_at: number;
	tags: Array<[string, ...string[]]>;
	content: string;
	id: string;
	sig: string;
}

export interface ParsedFSMMetadata {
	id: string;
	pubkey: string;
	title: string;
	summary?: string;
	cover?: string;
	genre?: string;
	language?: string;
	start: string;
	chapterCount?: number;
	minCost?: number;
	paywalled: boolean;
	createdAt: number;
}

