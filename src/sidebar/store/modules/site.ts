import { createStoreModule, makeAction } from '../create-store';

type Popup = 'Segmentation' | 'Description';

export type State = {
  popup: Popup | null;
};

const initialState: State = {
  popup: null,
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

export const siteModule = createStoreModule(initialState, {
  namespace: 'site',
  reducers,
  actionCreators: {
    openPopup,
    closePopup,
    togglePopup,
  },
  selectors: {
    getPopup,
  },
});
