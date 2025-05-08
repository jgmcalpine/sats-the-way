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
	fsmId: string;
	title: string;
	description?: string;
	authorPubkey: string;
	startStateId: string | null;
	lnurlp?: string;
	states: Record<string, FsmState>;
}
