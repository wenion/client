import { createStoreModule, makeAction } from '../create-store';
import type { QuerySuggestions } from '../../../types/api';

export type State = {
  query: string | null;
  querySuggestions: QuerySuggestions[];
};

function initialState(): State {
  return {
    query: null,
    querySuggestions: [],
  }
}

const reducers = {
  ADD_QUERY_SUGGESTIONS(
    state: State,
    action: {
      querySuggestions: QuerySuggestions[];
    }
  ): Partial<State> {
    return {
      querySuggestions: action.querySuggestions,
    };
  },

  CLEAR_QUERY_SUGGESTIONS(): Partial<State> {
    return { querySuggestions: [] };
  },

  SET_QUERY(state: State, action: { query: string | null }) {
    return { query: action.query };
  },
};

// Action creators

function setQuery(query: string | null) {
  return makeAction(reducers, 'SET_QUERY', { query });
}

function addQuerySuggestions(querySuggestions: QuerySuggestions[],  ) {
  return makeAction(reducers, 'ADD_QUERY_SUGGESTIONS', {querySuggestions: querySuggestions});
}

function clearQuerySuggestions() {
  return makeAction(reducers, 'CLEAR_QUERY_SUGGESTIONS', undefined);
}

// Selectors

function query(state: State) {
  return state.query;
}

function querySuggestions(state: State) {
  return state.querySuggestions.sort((a, b) => {return b.value - a.value});
}

export const queryModule = createStoreModule(initialState, {
  namespace: 'query',
  reducers,

  actionCreators: {
    addQuerySuggestions,
    clearQuerySuggestions,
    setQuery,
  },

  selectors: {
    querySuggestions,
    query,
  },
});
