import { createStoreModule, makeAction } from '../create-store';
import type { FileNode } from '../../../types/api';

const initialState = {
  currentNode: null,
  fileTree: null,
} as {
  currentNode: FileNode | null;
  fileTree: FileNode | null;
};

function joinPaths(...segments: string[]): string{
  return segments.join('/').replace(/\/{2,}/g, '/');
}

export type State = typeof initialState;

const reducers = {
  UPDATE_FILETREE(
    state: State,
    action: {
      fileTree: FileNode;
    }
  ): Partial<State> {
    return {
      currentNode: action.fileTree,
      fileTree: action.fileTree,
    };
  },
};

function find(state: State, fileNode: FileNode, path: string) {
  // if (path == null || state.fileTree == null || fileNode == null) {
  //   return state.currentNode;
  // }

  if (path == fileNode.path) {
    // console.log('found', fileNode)
    state.currentNode = fileNode;
    return;
    // return fileNode;
  }

  // let isFound = false;
  for (const child of fileNode.children) {
    let newPath = joinPaths(fileNode.path , child.name)
    // isFound = path.startsWith(newPath)
    // if (isFound) {
    if (path.startsWith(newPath)) {
      // console.log('newpath', newPath, 'found?')//, isFound)
      find(state, child, path);
    }
  }
  // return;
  // return state.currentNode;
}

function isTopDirectory(state: State) {
  return state.currentNode == state.fileTree;
}

function addFileTree(fileTree: FileNode) {
  return makeAction(reducers, 'UPDATE_FILETREE', {fileTree});
}

function getCurrentFileNode(state: State){
  return state.currentNode;
}

function getFileTree(state: State){
  return state.fileTree;
}

export const fileTreeModule = createStoreModule(initialState, {
  namespace: 'fileTree',
  reducers,
  actionCreators: {
    addFileTree,
  },
  selectors: {
    getCurrentFileNode,
    getFileTree,
    find,
    isTopDirectory,
  },
});
