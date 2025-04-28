import { createStoreModule, makeAction } from '../create-store';
import type { QueryResults, QuerySuggestions } from '../../../types/api';

export type State = {
  query: string | null;
  querySuggestions: QuerySuggestions[];
  queryResults: QueryResults[];
  queryStatus: string | null;
};

function initialState(): State {
  return {
    query: null,
    querySuggestions: [],
    queryResults: [],
    queryStatus: null,
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

  ADD_QUERY_RESULTS(
    state: State,
    action: { queryResults: QueryResults[] }
  ): Partial<State> {
    return {
      queryResults: action.queryResults,
    };
  },

  CLEAR_QUERY_RESULTS(): Partial<State> {
    return { queryResults: [] };
  },

  SET_QUERY(state: State, action: { query: string | null }) {
    return { query: action.query };
  },

  SET_QUERY_STATUS(state: State, action: { queryStatus: string | null }) {
    return { queryStatus: action.queryStatus };
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

function addQueryResults(queryResults: QueryResults[],  ) {
  return makeAction(reducers, 'ADD_QUERY_RESULTS', {queryResults: queryResults});
}

function clearQueryResults() {
  return makeAction(reducers, 'CLEAR_QUERY_RESULTS', undefined);
}

function setQueryStatus(queryStatus: string | null,  ) {
  return makeAction(reducers, 'SET_QUERY_STATUS', {queryStatus: queryStatus});
}

// Selectors

function query(state: State) {
  return state.query;
}

function querySuggestions(state: State) {
  return state.querySuggestions.sort((a, b) => {return b.value - a.value});
}

function queryResults(state: State) {
  return state.queryResults;
}

function queryStatus(state: State) {
  return state.queryStatus;
}

export const queryModule = createStoreModule(initialState, {
  namespace: 'query',
  reducers,

  actionCreators: {
    addQuerySuggestions,
    clearQuerySuggestions,
    setQuery,
    addQueryResults,
    clearQueryResults,
    setQueryStatus,
  },

  selectors: {
    querySuggestions,
    queryResults,
    query,
    queryStatus,
  },
});
