import { useMemo, useReducer, useState } from 'react';
import { v4 as uuid } from 'uuid';

import { FsmData, FsmState, Transition } from '@/types/fsm';
import { calculateCheapestPath } from '@/utils/graph';

// ─────────────── Reducer ───────────────

type Action =
  | { type: 'init'; payload: FsmData }
  | { type: 'update-meta'; patch: Partial<Pick<FsmData, 'title' | 'description' | 'lnurlp'>> }
  | { type: 'add-state' }
  | { type: 'delete-state'; id: string }
  | { type: 'update-state'; id: string; patch: Partial<FsmState> }
  | { type: 'add-transition'; stateId: string }
  | { type: 'delete-transition'; stateId: string; trId: string }
  | { type: 'update-transition'; stateId: string; trId: string; patch: Partial<Transition> };

function reducer(state: FsmData, action: Action): FsmData {
  switch (action.type) {
    case 'update-meta':
      return { ...state, ...action.patch };

    case 'add-state': {
      const id = uuid();
      const first = Object.keys(state.states).length === 0;
      return {
        ...state,
        states: {
          ...state.states,
          [id]: {
            id,
            name: `Chapter ${Object.keys(state.states).length + 1}`,
            content: '',
            isStartState: first,
            isEndState: false,
            transitions: [],
            previousStateId: first ? undefined : state.startStateId || undefined,
          },
        },
        startStateId: first ? id : state.startStateId,
      };
    }

    case 'delete-state': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action.id]: _, ...rest } = state.states;
      for (const st of Object.values(rest)) {
        st.transitions = st.transitions.filter(t => t.targetStateId !== action.id);
        if (st.previousStateId === action.id) {
          st.previousStateId = undefined;
        }
      }
      return {
        ...state,
        states: rest,
        startStateId: state.startStateId === action.id ? null : state.startStateId,
      };
    }

    case 'update-state':
      return {
        ...state,
        states: {
          ...state.states,
          [action.id]: { ...state.states[action.id], ...action.patch },
        },
      };

    case 'add-transition': {
      const trId = uuid();
      const st = state.states[action.stateId];
      if (!st) return state;
      return reducer(state, {
        type: 'update-state',
        id: action.stateId,
        patch: {
          transitions: [
            ...st.transitions,
            { id: trId, choiceText: '', targetStateId: '', price: 0 },
          ],
        },
      });
    }

    case 'delete-transition': {
      const st = state.states[action.stateId];
      if (!st) return state;
      const updatedTransitions = st.transitions.filter(t => t.id !== action.trId);
      const targetStateId = st.transitions.find(t => t.id === action.trId)?.targetStateId;

      if (targetStateId) {
        const targetState = state.states[targetStateId];
        if (targetState && !targetState.isStartState) {
          const otherTransitionsToTarget = Object.values(state.states).some(
            s =>
              s.id !== action.stateId && s.transitions.some(t => t.targetStateId === targetStateId)
          );
          if (!otherTransitionsToTarget) {
            return reducer(
              reducer(state, {
                type: 'update-state',
                id: action.stateId,
                patch: { transitions: updatedTransitions },
              }),
              {
                type: 'update-state',
                id: targetStateId,
                patch: { previousStateId: undefined },
              }
            );
          }
        }
      }

      return reducer(state, {
        type: 'update-state',
        id: action.stateId,
        patch: { transitions: updatedTransitions },
      });
    }

    case 'update-transition': {
      const stBase = state.states[action.stateId];
      if (!stBase) return state;

      // First, update the transition in the current state
      const updatedState = reducer(state, {
        type: 'update-state',
        id: action.stateId,
        patch: {
          transitions: stBase.transitions.map(t =>
            t.id === action.trId ? { ...t, ...action.patch } : t
          ),
        },
      });

      // If the target state ID is being updated, we need to handle previousStateId
      if (action.patch.targetStateId) {
        const targetState = updatedState.states[action.patch.targetStateId];
        if (targetState && !targetState.isStartState) {
          // Update the target state with the previousStateId
          return reducer(updatedState, {
            type: 'update-state',
            id: action.patch.targetStateId,
            patch: {
              previousStateId: action.stateId,
            },
          });
        }
      }

      return updatedState;
    }

    default:
      return state;
  }
}

// ─────────────── Hook API ───────────────

export function useFsm(initial: FsmData) {
  const [data, dispatch] = useReducer(reducer, initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial.startStateId);

  /* derived helpers */
  const totalStates = Object.keys(data.states).length;
  const totalTransitions = Object.values(data.states).reduce(
    (s, st) => s + st.transitions.length,
    0
  );
  const cheapest = useMemo(() => calculateCheapestPath(data.states, data.startStateId), [data]);

  /* single-entry wrapper so the builder can call fsm.actions.* */
  const actions = {
    /* meta */
    updateMeta: (p: Partial<Pick<FsmData, 'title' | 'description' | 'lnurlp' | 'authorName'>>) =>
      dispatch({ type: 'update-meta', patch: p }),

    /* selection */
    selectState: setSelectedId,

    /* state CRUD */
    addState: () => dispatch({ type: 'add-state' }),
    deleteState: (id: string) => dispatch({ type: 'delete-state', id }),
    updateState: (id: string, p: Partial<FsmState>) =>
      dispatch({ type: 'update-state', id, patch: p }),

    /* transition CRUD */
    addTransition: (sid: string) => dispatch({ type: 'add-transition', stateId: sid }),
    deleteTransition: (sid: string, tid: string) =>
      dispatch({ type: 'delete-transition', stateId: sid, trId: tid }),
    updateTransition: (sid: string, tid: string, p: Partial<Transition>) =>
      dispatch({ type: 'update-transition', stateId: sid, trId: tid, patch: p }),
  };

  return {
    data,
    selectedId,
    selected: selectedId ? (data.states[selectedId] ?? null) : null,
    totalStates,
    totalTransitions,
    cheapest,
    actions,
  } as const;
}
