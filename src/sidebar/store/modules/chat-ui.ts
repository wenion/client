/**
 * State management for the chatui parameters currently loaded into the
 * sidebar.
 */
import { createStoreModule, makeAction } from '../create-store';

export type State = {
  // base url
  url: string | null;
  token: string | null;
  model: string | null;
  // settings page
  option: string | null;
  //full url
  src: string | null;
};

export type Key = keyof State;

const initialState: State = {
  url: null,
  token: null,
  model: null,
  option: null,
  src: null,
};

const reducers = {
  SET_VALUE(state: State, action: { key: Key; value: string | null }) {
    return { [action.key]: action.value };
  },
};

// Action creators

/**
 * Add these `annotations` to the current collection of annotations in the
 * store.
 */

function setValue(key: Key, value: string | null) {
  return makeAction(reducers, 'SET_VALUE', { key, value });
}

function setChatUiUrl(value: string | null) {
  return setValue('url', value);
}

function setChatUiToken(value: string | null) {
  return setValue('token', value);
}

function setChatUiModel(value: string | null) {
  return setValue('model', value);
}

function setChatUiOption(value: string | null) {
  return setValue('option', value);
}

function setChatUiSrc(value: string | null) {
  return setValue('src', value);
}

/* Selectors */

function chatUiUrl(state: State) {
  return state.url;
}

function chatUiToken(state: State) {
  return state.token;
}

function chatUiModel(state: State) {
  return state.model;
}

function chatUiOption(state: State) {
  return state.option;
}

function chatUiSrc(state: State) {
  return state.src;
}

export const chatUiModule = createStoreModule(initialState, {
  namespace: 'chatUi',
  reducers,
  actionCreators: {
    setChatUiUrl,
    setChatUiToken,
    setChatUiModel,
    setChatUiOption,
    setChatUiSrc,
  },
  selectors: {
    chatUiUrl,
    chatUiToken,
    chatUiModel,
    chatUiOption,
    chatUiSrc,
  },
});
