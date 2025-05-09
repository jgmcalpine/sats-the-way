import type { FsmData } from '@/types/fsm';

export function validateFsmForPublish(fsm: FsmData): string[] {
	const errors: string[] = [];
	if (!fsm.title?.trim()) {
		errors.push('Book title is required.');
	}

	const hasPaidStep = Object.values(fsm.states).some(state => state.price && state.price > 0);
	if (hasPaidStep) {
		if (!fsm.lnurlp || !fsm.lnurlp.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
			errors.push('A valid Lightning address is required for paid chapters.');
		}
	}

	if (!fsm.startStateId || !fsm.states[fsm.startStateId]) {
		errors.push('A start chapter must be defined.');
	}

	const hasEndState = Object.values(fsm.states).some(state => state.isEndState);
	if (!hasEndState) {
		errors.push('At least one chapter must be marked as a finish.');
	}
    
	return errors;
}
