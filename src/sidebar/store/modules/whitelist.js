import { createStoreModule, makeAction } from '../create-store';

const initialState = /** @type {string[]|null} */ (null);

/** @typedef {typeof initialState} State */

const reducers = {
  /**
   * @param {State} state
   * @param {{ whitelist: string[] }} action
   */
  UPDATE_WHITELIST(state, action) {
    return [
      ...action.whitelist,
    ];
  },
};

/**
 * Update the link map
 *
 * @param {string[]} whitelist - Link map fetched from the `/api/whitelist` endpoint
 */
function updateWhitelist(whitelist) {
  return makeAction(reducers, 'UPDATE_WHITELIST', {whitelist});
}

/**
 * Render a service link (URL) using the given `params`
 *
 * Returns an empty string if whitelist have not been fetched yet.
 *
 * @param {State} state
 */
function getWhitelist(state) {
  if (!state) {
    return [];
  }
  return state;
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
