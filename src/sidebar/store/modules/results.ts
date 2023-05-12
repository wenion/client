import { createStoreModule, makeAction } from '../create-store';
import type { QueryResult, QueryResponseObject } from '../../../types/api';

const initialState = {
  query: '',
  clientURL: null,
  results: [],
  response: null,
} as {
  query: string | null;
  clientURL: string | null,
  results: QueryResult[];
  response: QueryResponseObject | null,
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

  ADD_RESPONSE(
    state: State,
    action: {
      query: string;
      response: QueryResponseObject;
    }
  ): Partial<State> {
    return {
      query: action.query,
      response: action.response,
    };
  },

  CLEAR_RESPONSE(
    state: State,
  ): Partial<State> {
    return { query: null, response: null };
  },

  CLEAR_RESPONSE_ONLY(
    state: State,
  ): Partial<State> {
    return { response: null };
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

function addResponse(query: string, response: QueryResponseObject) {
  return makeAction(reducers, 'ADD_RESPONSE', {query, response});
}

function clearResponse() {
  return makeAction(reducers, 'CLEAR_RESPONSE', undefined);
}

function clearResponseOnly() {
  return makeAction(reducers, 'CLEAR_RESPONSE_ONLY', undefined);
}

function getResponse(state: State) {
  return state.response;
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
    addResponse,
    clearResponse,
    clearResponseOnly,
  },
  selectors: {
    allResults,
    queryingWord,
    getClientURL,
    getResponse,
  },
});
