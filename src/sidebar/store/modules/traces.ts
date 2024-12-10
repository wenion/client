/**
 * State management for the set of annotations currently loaded into the
 * sidebar.
 */
import type { Dispatch } from 'redux';
import { createStoreModule, makeAction } from '../create-store';

type RawTraceData = {
  title: string;
  type: string;
  description: string;
  imgSrc: string | null;
  width: number;
  height: number;
  clientX: number | null;
  clientY: number | null;
};

type TraceData = RawTraceData & {id: number};

const initialState = {
  traces: [],
  nextId: 1,
} as {
  /** Set of currently-loaded annotations */
  traces: TraceData[];
  nextId: number;
};

export type State = typeof initialState;

const reducers = {
  ADD_TRACE(state: State, action: { trace: RawTraceData }): Partial<State> {
    return {
      traces: state.traces.concat({...action.trace, id: state.nextId}),
      nextId: state.nextId + 1,
    };
  },

  CLEAR_TRACES(state: State) {
    return {
      traces: [],
      nextId: 1,
    }
  },

  UPDATE_TRACE(state: State, action: { trace: RawTraceData; index: number }): Partial<State> {
    const selected = state.traces[action.index];
    state.traces[action.index] = {...selected, ...action.trace};
    return {
      traces: state.traces,
    }
  },
};

// Action creators

/**
 * Add these `annotations` to the current collection of annotations in the
 * store.
 */
function addTrace(trace: RawTraceData) {
  return makeAction(reducers, 'ADD_TRACE', { trace });
}

/** Set the currently displayed annotations to the empty set. */
function clearTraces() {
  return makeAction(reducers, 'CLEAR_TRACES', undefined);
}

function updateLastTrace(trace: RawTraceData) {
  return (dispatch: Dispatch, getState: () => { traces: State }) => {
    const length = getState().traces.traces.length;
    if (length > 0) {
      dispatch(
        makeAction(reducers, 'UPDATE_TRACE', { trace: trace, index: length - 1,
        })
      );
    }
  };
}

/* Selectors */

function allTraces(state: State) {
  return state.traces;
}

export const tracesModule = createStoreModule(initialState, {
  namespace: 'traces',
  reducers,
  actionCreators: {
    addTrace,
    updateLastTrace,
    clearTraces,
  },
  selectors: {
    allTraces,
  },
});
