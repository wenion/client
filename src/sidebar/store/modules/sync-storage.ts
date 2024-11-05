import { createStoreModule, makeAction } from '../create-store';

/**
 * A store module for managing client-side user-convenience defaults.
 *
 * Example: the default privacy level for newly-created annotations
 * (`private` or `shared`). This default is updated when a user selects a
 * different publishing destination (e.g. `Post to [group name]` versus
 * `Post to Only Me`) from the menu rendered by the `AnnotationPublishControl`
 * component.
 *
 * At present, these defaults are persisted between app sessions in `localStorage`,
 * and their retrieval and re-persistence on change is handled in the
 * `persistedDefaults` service.
 */

export type State = {
  muted: boolean | null;
  highlightsVisible: boolean | null;
};

export type Key = keyof State;

const initialState: State = {
  muted: null,
  highlightsVisible: null,
};

const reducers = {
  SET_DEFAULT(state: State, action: { defaultKey: Key; value: boolean | null }) {
    return { [action.defaultKey]: action.value };
  },
};

function setSync(defaultKey: Key, value: boolean | null) {
  return makeAction(reducers, 'SET_DEFAULT', { defaultKey, value });
}

/** Selectors */

/**
 * Retrieve the state's current value for `defaultKey`.
 */
function getSync(state: State, defaultKey: Key) {
  return state[defaultKey];
}

function getAllSync(state: State) {
  return state;
}

export const syncStorageModule = createStoreModule(initialState, {
  namespace: 'syncStorage',
  reducers,
  actionCreators: {
    setSync,
  },
  selectors: {
    getSync,
    getAllSync,
  },
});
