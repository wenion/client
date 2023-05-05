import { createStoreModule, makeAction } from '../create-store';
import type { FileStat } from '../../../types/api';

const initialState = {
  parent_path: '',
  current_path: '',
  current_dir: [],
} as {
  parent_path: string;
  current_path: string;
  current_dir: FileStat[];
};

export type State = typeof initialState;

const reducers = {
  ADD_FILESTATS(
    state: State,
    action: {
      current_path: string;
      current_dir: FileStat[];
    }
  ): Partial<State> {
    const added = []
    for (const ret of action.current_dir) {
      added.push(
        ret
      );
    }

    return {
      current_path: action.current_path,
      current_dir: added,
    };
  },

  CLEAR_FILESTATS(
    state: State,
  ): Partial<State> {
    return { current_path: '', current_dir: [] };
  },
};

/**
 * Add these `annotations` to the current collection of annotations in the
 * store.
 */
function addFileStats(current_path: string, current_dir: FileStat[]) {
  return makeAction(reducers, 'ADD_FILESTATS', {current_path, current_dir});
}

/** Set the currently displayed annotations to the empty set. */
function clearFileStats() {
  return makeAction(reducers, 'CLEAR_FILESTATS', undefined);
}

function allFiles(state: State) {
  return state.current_dir;
}

function currentDir(state: State) {
  return state.current_path;
}

export const fileTreeModule = createStoreModule(initialState, {
  namespace: 'fileTree',
  reducers,
  actionCreators: {
    addFileStats,
    clearFileStats,
  },
  selectors: {
    allFiles,
    currentDir,
  },
});
