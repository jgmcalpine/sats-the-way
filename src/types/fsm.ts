const FsmLifecycleStatus = {
	Draft: 'draft',
	Published: 'published',
	Archived: 'archived',
	Deleted: 'deleted',
	Flagged: 'flagged',
} as const;

type FsmLifecycleStatus = (typeof FsmLifecycleStatus)[keyof typeof FsmLifecycleStatus];

export interface Transition {
	id: string;
	choiceText: string;
	targetStateId: string;
	price?: number; // in satoshis
}

export interface FsmState {
	id: string;
	name: string;
	content: string;
	isStartState: boolean;
	isEndState: boolean;
	transitions: Transition[];
	previousStateId?: string;
	price?: number; // in satoshis
}

export interface FsmData {
	fsmType: string; // "book", "game", etc.
	states: Record<string, FsmState>;
	lifecycle: FsmLifecycleStatus,
	fsmId: string;
	title: string;
	description?: string;
	authorPubkey: string;
	startStateId: string | null;
	minCost?: number;
	lnurlp?: string;
}
