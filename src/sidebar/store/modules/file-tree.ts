import { createStoreModule, makeAction } from '../create-store';
import type { FileNode } from '../../../types/api';

const initialState = {
  currentPath: "",
  fileTree: null,
} as {
  currentPath: string;
  fileTree: FileNode | null;
};

export type State = typeof initialState;

const reducers = {
  UPDATE_FILETREE(
    state: State,
    action: {
      fileTree: FileNode;
    }
  ): Partial<State> {
    return {
      currentPath: action.fileTree.path,
      fileTree: action.fileTree,
    };
  },

  UPDATE_FILEPATH(
    state: State,
    action: {
      currentPath: string;
    }
  ): Partial<State> {
    return {
      currentPath: action.currentPath,
    };
  },
};

function initFileTree(fileTree: FileNode) {
  return makeAction(reducers, 'UPDATE_FILETREE', {fileTree});
}

function changeCurrentPath(currentPath: string){
  return makeAction(reducers, 'UPDATE_FILEPATH', {currentPath});
}

function getCurrentPath(state: State){
  return state.currentPath;
}

function getFileTree(state: State){
  return state.fileTree;
}

export const fileTreeModule = createStoreModule(initialState, {
  namespace: 'fileTree',
  reducers,
  actionCreators: {
    initFileTree,
    changeCurrentPath,
  },
  selectors: {
    getFileTree,
    getCurrentPath,
  },
});
