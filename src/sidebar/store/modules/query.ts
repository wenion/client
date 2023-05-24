import { createStoreModule, makeAction } from '../create-store';
import type { suggestResult } from '../../../types/api';

const initialState = {
    /**
     * @type {suggestResult[]}
     */
    suggestList: [],

    /**
     * The selectedSuggestIndex that should be given keyboard focus.
     *
     * @type {number|null}
     */
    selectedSuggestIndex: null,
  } as {
    suggestList: suggestResult[];
    selectedSuggestIndex: number | null;
};

export type State = typeof initialState;

const reducers = {
  ADD_SUGGEST_RESULTS(
    state: State,
    action: {
      suggestList: suggestResult[];
      // selectedSuggestIndex: number | null;
    }
  ): Partial<State> {
    // const added = []
    // for (const ret of action.suggestList) {
    //   added.push(
    //     ret
    //   );
    // }

    return {
      suggestList: action.suggestList,
    };
  },

  CLEAR_INDEX() {
    return { selectedSuggestIndex: null };
  },

  CLEAR_SUGGEST_RESULTS() {
    return { suggestList: [], selectedSuggestIndex: null };
  },

  SET_INDEX(state: State, action: {index: number}): Partial<State> {
    return { selectedSuggestIndex: action.index };
  },
};

/**
 * Retrieve the current sort option key.
 *
 * @param {State} state
 */
function addSuggestResults(suggestList: suggestResult[],  ) {
  return makeAction(reducers, 'ADD_SUGGEST_RESULTS', {suggestList});
}

function clearIndex() {
  return makeAction(reducers, 'CLEAR_INDEX', undefined);
}

function clearSuggestResults() {
  return makeAction(reducers, 'CLEAR_SUGGEST_RESULTS', undefined);
}

function getSuggestIndex(state: State) {
  return state.selectedSuggestIndex;
}

function getSuggestResults(state: State) {
  return state.suggestList;
}

export const queryModule = createStoreModule(initialState, {
  namespace: 'query',
  reducers,

  actionCreators: {
    addSuggestResults,
    clearIndex,
    clearSuggestResults,
  },

  selectors: {
    getSuggestIndex,
    getSuggestResults,
  },
});