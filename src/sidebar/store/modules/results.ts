import { createStoreModule, makeAction } from '../create-store';
import type { QueryResult } from '../../../types/api';

const initialState = {
  query: '',
  clientURL: null,
  results: [],
} as {
  query: string | null;
  clientURL: string | null,
  results: QueryResult[];
};

export type State = typeof initialState;

const reducers = {
  ADD_RESULTS(
    state: State,
    action: {
      query: string;
      results: QueryResult[];
    }
  ): Partial<State> {
    const added = []
    for (const ret of action.results) {
      added.push(
        ret
      );
    }

    return {
      query: action.query,
      results: added,
    };
  },

  SET_CLIENT_URL(
    state: State,
    action: {
      clientURL: string;
    }
  ): Partial<State> {
    return {
      clientURL: action.clientURL,
    };
  },

  CLEAR_PRE_RESULTS( state: State, action: { query: string }): Partial<State> {
    state.query = action.query;
    return { query: state.query, results: [] };
  },

  CLEAR_RESULTS(
    state: State,
  ): Partial<State> {
    return { query: null, results: [] };
  },
};

/**
 * Add these `annotations` to the current collection of annotations in the
 * store.
 */
function addResults(query: string, results: QueryResult[]) {
  return makeAction(reducers, 'ADD_RESULTS', {query, results});
}

/** Set the currently displayed annotations to the empty set. */
function clearResults() {
  return makeAction(reducers, 'CLEAR_RESULTS', undefined);
}

/** Set the currently displayed annotations to the empty set. */
function clearPreResults(query: string) {
  return makeAction(reducers, 'CLEAR_PRE_RESULTS', {query});
}

function allResults(state: State) {
  return state.results;
}

function queryingWord(state: State) {
  return state.query;
}

function setClientURL(clientURL: string) {
  return makeAction(reducers, 'SET_CLIENT_URL', {clientURL});
}

function getClientURL(state: State) {
  return state.clientURL;
}

export const resultModule = createStoreModule(initialState, {
  namespace: 'results',
  reducers,
  actionCreators: {
    addResults,
    clearResults,
    clearPreResults,
    setClientURL,
  },
  selectors: {
    allResults,
    queryingWord,
    getClientURL,
  },
});
