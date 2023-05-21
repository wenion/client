import { createStoreModule, makeAction } from '../create-store';
import type { QueryResponseObject } from '../../../types/api';

const initialState = {
  query: '',
  clientURL: null,
  response: null,
} as {
  query: string | null;
  clientURL: string | null,
  response: QueryResponseObject | null,
};

export type State = typeof initialState;

const reducers = {
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
};

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
    setClientURL,
    addResponse,
    clearResponse,
    clearResponseOnly,
  },
  selectors: {
    queryingWord,
    getClientURL,
    getResponse,
  },
});
