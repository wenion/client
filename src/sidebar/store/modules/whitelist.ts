import { createStoreModule, makeAction } from '../create-store';

const initialState = {
  whitelist: [],
} as {
  whitelist: string[];
}

export type State = typeof initialState;

const reducers = {
  UPDATE_WHITELIST(state: State, action: {whitelist: string[]}) {
    return {whitelist: action.whitelist};
  },
};


function updateWhitelist(whitelist: string[]) {
  return makeAction(reducers, 'UPDATE_WHITELIST', {whitelist});
}

/**
 * Render a service link (URL) using the given `params`
 *
 * Returns an empty string if whitelist have not been fetched yet.
 *
 * @param {State} state
 */
function getWhitelist(state: State) {
  return state.whitelist;
}

export const whitelistModule = createStoreModule(initialState, {
  namespace: 'whitelist',
  reducers,
  actionCreators: {
    updateWhitelist,
  },
  selectors: {
    getWhitelist,
  },
});
