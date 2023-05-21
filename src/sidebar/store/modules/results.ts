import { createStoreModule, makeAction } from '../create-store';
import type { QueryResponseObject, Item } from '../../../types/api';

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

  SET_BOOKMARK(
    state: State,
    action: {
      title: string;
      isBookmark: boolean;
    }
  ): Partial<State> {
    let newResponse: QueryResponseObject = {query: state.response!.query, status: state.response!.status, context:[]};

    state.response!.context.forEach((innerArray) => {
      let newTopic: Item[] = [];
      innerArray.forEach((item) => {
        if (item.metadata.title === action.title) {
          newTopic.push({
            ...item,
            is_bookmark: action.isBookmark,
          })
        }
        else {
          newTopic.push(item);
        }
      })
      newResponse.context.push(newTopic);
    });

    return {
      response: newResponse,
    }
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

function setBookmark(title: string, isBookmark: boolean) {
  return makeAction(reducers, 'SET_BOOKMARK', {title, isBookmark});
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
    setBookmark,
    clearResponse,
    clearResponseOnly,
  },
  selectors: {
    queryingWord,
    getClientURL,
    getResponse,
  },
});
