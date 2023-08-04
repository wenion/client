import { createStoreModule, makeAction } from '../create-store';
import type { FileNode } from '../../../types/api';

const initialState = {
  pathChanged: false,
  currentPath: "",
  fileTree: null,
} as {
  pathChanged: boolean;
  currentPath: string;
  fileTree: FileNode | null;
};

export type State = typeof initialState;

function joinPaths(...segments: string[]): string{
  return segments.join('/').replace(/\/{2,}/g, '/');
}

function find(fileNode: FileNode| null, path: string): FileNode|null {
  if (fileNode == null)
    return null;

  if (path == fileNode.path) {
    return fileNode;
  }

  for (const child of fileNode.children) {
    let newPath = joinPaths(fileNode.path , child.name)
    if (path.startsWith(newPath)) {
      return find(child, path);
    }
  }
  return null;
};

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

  UPDATE_NODE(
    state: State,
    action: {
      newFileTree: FileNode;
      parentPath: string;
    }
  ): Partial<State> {
    const fileNode = find(state.fileTree, action.parentPath);
    if (fileNode && fileNode.type === "dir") {
      fileNode.children.push(action.newFileTree)
    }
    return {
      fileTree: state.fileTree,
    };
  },

  REMOVE_NODE(
    state: State,
    action: {
      filePath: string;
      parentPath: string;
    }
  ): Partial<State> {
    const parentFileNode = find(state.fileTree, action.parentPath);
    if (parentFileNode && parentFileNode.type === "dir") {
      const filterFiles = parentFileNode.children.filter(item => item.path !== action.filePath);
      parentFileNode.children = [];
      filterFiles.map(item => {
        parentFileNode.children.push(item);
      })
    }
    return {
      fileTree: state.fileTree,
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

  UPDATE_PATHSTATUS(
    state: State,
    action: {}
  ):  Partial<State> {
    return {
      pathChanged: !state.pathChanged,
    };
  },
};

function initFileTree(fileTree: FileNode) {
  return makeAction(reducers, 'UPDATE_FILETREE', {fileTree});
}

function changeCurrentPath(currentPath: string){
  return makeAction(reducers, 'UPDATE_FILEPATH', {currentPath});
}

function addFileNode(newFileTree: FileNode, parentPath: string){
  return makeAction(reducers, 'UPDATE_NODE', {newFileTree, parentPath});
}

function removeFileNode(filePath: string, parentPath: string){
  return makeAction(reducers, 'REMOVE_NODE', {filePath, parentPath});
}

function changePath(){
  return makeAction(reducers, 'UPDATE_PATHSTATUS', {});
}

function getCurrentPath(state: State){
  return state.currentPath;
}

function getPathChangedStatus(state: State) {
  return state.pathChanged;
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
    addFileNode,
    removeFileNode,
    changePath,
  },
  selectors: {
    getFileTree,
    getCurrentPath,
    getPathChangedStatus,
  },
});
