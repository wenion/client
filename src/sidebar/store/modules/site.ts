import { createStoreModule, makeAction } from '../create-store';

import type { RecordItem } from '../../../types/api';

type Popup = 'Segmentation' | 'Description';

export type State = {
  popup: Popup | null;
  currentRecordItem: RecordItem | null;
};

const initialState: State = {
  popup: null,
  currentRecordItem: null,
};

const reducers = {
  OPEN_POPUP(state: State, action: { popup: Popup }) {
    return { popup: action.popup };
  },

  CLOSE_POPUP(state: State, action: { popup: Popup }) {
    let popup = state.popup;
    if (action.popup === popup) {
      // `action.panelName` is indeed the currently-active panel; deactivate
      popup = null;
    }
    // `action.panelName` is not the active panel; nothing to do here
    return {
      popup,
    };
  },

  TOGGLE_POPUP(
    state: State,
    action: { popup: Popup; panelState?: boolean },
  ) {
    let popup = action.popup;
    return {
      popup,
    };
  },

  SET_CURRENT_RECORD_ITEM(state: State, action: { recordItem: RecordItem | null }) {
    return { currentRecordItem: action.recordItem };
  },
};

function openPopup(popup: Popup) {
  return makeAction(reducers, 'OPEN_POPUP', { popup });
}

function closePopup(popup: Popup) {
  return makeAction(reducers, 'CLOSE_POPUP', { popup });
}

function togglePopup(popup: Popup) {
  return makeAction(reducers, 'TOGGLE_POPUP', {
    popup,
  });
}

function updateCurrentRecordItem(currentRecordItem: RecordItem | null) {
  return makeAction(reducers, 'SET_CURRENT_RECORD_ITEM', {
    recordItem: currentRecordItem,
  });
}

/**
 * Render a service link (URL) using the given `params`
 *
 * Returns an empty string if whitelist have not been fetched yet.
 *
 * @param {State} state
 */
function getPopup(state: State) {
  return state.popup;
}

function currentRecordItem(state: State) {
  return state.currentRecordItem;
}

export const siteModule = createStoreModule(initialState, {
  namespace: 'site',
  reducers,
  actionCreators: {
    openPopup,
    closePopup,
    togglePopup,
    updateCurrentRecordItem,
  },
  selectors: {
    getPopup,
    currentRecordItem,
  },
});
