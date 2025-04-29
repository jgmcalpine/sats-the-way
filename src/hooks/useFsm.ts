import { useReducer, useMemo, useState } from "react";
import { cheapestPath } from "@/utils/graph";
import { v4 as uuid } from "uuid";

export interface Transition {
  id: string;
  choiceText: string;
  targetStateId: string;
  /** price in satoshis */
  price?: number;
}

export interface State {
  id: string;
  name: string;
  content: string;
  isStartState: boolean;
  isEndState: boolean;
  transitions: Transition[];
  entryFee?: string;
}

export interface FsmData {
  title: string;
  states: Record<string, State>;
  startStateId: string | null;
  description?: string;
}

// ─────────────── Reducer ───────────────

type Action =
  | { type: "init"; payload: FsmData }
  | { type: "update-meta"; patch: Partial<Pick<FsmData,"title"|"description">> }
  | { type: "add-state" }
  | { type: "delete-state"; id: string }
  | { type: "update-state"; id: string; patch: Partial<State> }
  | { type: "add-transition"; stateId: string }
  | { type: "delete-transition"; stateId: string; trId: string }
  | { type: "update-transition"; stateId: string; trId: string; patch: Partial<Transition> };

function reducer(state: FsmData, action: Action): FsmData {
  switch (action.type) {
    case "update-meta":
      return { ...state, ...action.patch };

    case "add-state": {
      const id = uuid();
      const first = Object.keys(state.states).length === 0;
      return {
        ...state,
        states: {
          ...state.states,
          [id]: {
            id,
            name: "New step",
            content: "",
            isStartState: first,
            isEndState: false,
            transitions: [],
          },
        },
        startStateId: first ? id : state.startStateId,
      };
    }

    case "delete-state": {
      const { [action.id]: _removed, ...rest } = state.states;
      for (const st of Object.values(rest)) {
        st.transitions = st.transitions.filter(t => t.targetStateId !== action.id);
      }
      return {
        ...state,
        states: rest,
        startStateId: state.startStateId === action.id ? null : state.startStateId,
      };
    }

    case "update-state":
      return {
        ...state,
        states: {
          ...state.states,
          [action.id]: { ...state.states[action.id], ...action.patch },
        },
      };

    case "add-transition": {
      const trId = uuid();
      const st   = state.states[action.stateId];
      if (!st) return state;
      return reducer(state, {
        type : "update-state",
        id   : action.stateId,
        patch: {
          transitions: [...st.transitions, { id: trId, choiceText: "", targetStateId: "", price: 0 }],
        },
      });
    }

    case "delete-transition": {
      const st = state.states[action.stateId];
      if (!st) return state;
      return reducer(state, {
        type : "update-state",
        id   : action.stateId,
        patch: { transitions: st.transitions.filter(t => t.id !== action.trId) },
      });
    }

    case "update-transition":
      const stBase = state.states[action.stateId];
      if (!stBase) return state;
      return reducer(state,{
        type : "update-state",
        id   : action.stateId,
        patch: {
          transitions: stBase.transitions.map(t =>
            t.id === action.trId ? { ...t, ...action.patch } : t
          ),
        },
      });

    default:
      return state;
  }
}

// ─────────────── Hook API ───────────────

export function useFsm(initial: FsmData) {
    const [data, dispatch] = useReducer(reducer, initial);
    const [selectedId, select] = useState<string | null>(initial.startStateId ?? null);
  
    /* derived helpers */
    const totalStates      = Object.keys(data.states).length;
    const totalTransitions = Object.values(data.states).reduce((s, st) => s + st.transitions.length, 0);
    const cheapest         = useMemo(() => cheapestPath(data.states, data.startStateId), [data]);
  
    /* single-entry wrapper so the builder can call fsm.actions.* */
    const actions = {
      selectState     : select,
      updateMeta      : (patch: Partial<Pick<FsmData,"title"|"description">>) =>
                         dispatch({ type: "update-meta", patch }),
  
      addState        : ()                    => dispatch({ type: "add-state" }),
      deleteState     : (id: string)          => dispatch({ type: "delete-state", id }),
      updateState     : (id: string, p: Partial<State>) =>
                         dispatch({ type: "update-state", id, patch: p }),
  
      addTransition   : (stateId: string)                          =>
                         dispatch({ type: "add-transition", stateId }),
      deleteTransition: (stateId: string, trId: string)            =>
                         dispatch({ type: "delete-transition", stateId, trId }),
      updateTransition: (stateId: string, trId: string, p: Partial<Transition>) =>
                         dispatch({ type: "update-transition", stateId, trId, patch: p }),
    };
  
    return {
      /* data */
      data,
      selectedId,
      selected: selectedId ? data.states[selectedId] ?? null : null,
  
      /* stats */
      totalStates,
      totalTransitions,
      cheapest,
  
      /* facade expected by builder */
      actions,
    } as const;
  }