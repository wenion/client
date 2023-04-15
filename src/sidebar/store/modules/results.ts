import { createStoreModule, makeAction } from '../create-store';
import type { QueryResult } from '../../../types/api';

const initialState = {
 query: 'test2222',
 results: [
  {
    data_type: 'pdf',
    title: 'test pdf 1',
    context: 'for test pdf',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'html',
    title: 'test html 2',
    context: 'for test html',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'html',
    title: 'test html 3',
    context: 'for test html',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'image',
    title: 'test image 4',
    context: 'for test image',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'html',
    title: 'test html 5',
    context: 'for test html',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'html',
    title: 'test html 6',
    context: 'for test html',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'image',
    title: 'test image 7',
    context: 'for test image',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'html',
    title: 'test html 8',
    context: 'for test html',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'video',
    title: 'test video 9',
    context: 'for test video',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'image',
    title: 'test image 10',
    context: 'for test image',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'video',
    title: 'test video 11',
    context: 'for test video',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'html',
    title: 'test html 12',
    context: 'for test html',
    author: 'author',
    url: 'http://localhost:3000'
  }, {
    data_type: 'image',
    title: 'test image 13',
    context: 'for test image',
    author: 'author',
    url: 'http://localhost:3000'
  }],
} as {
  query: string | null;
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
    state.query = action.query;
    for (const ret of action.results) {
      state.results.push(
        ret
      );
    }

    return {
      query: state.query,
      results: state.results,
    };
  },

  CLEAR_RESULTS(): Partial<State> {
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

function allResults(state: State) {
  return state.results;
}

function queryingWord(state: State) {
  return state.query;
}

export const resultModule = createStoreModule(initialState, {
  namespace: 'results',
  reducers,
  actionCreators: {
    addResults,
    clearResults,
  },
  selectors: {
    allResults,
    queryingWord,
  },
});
