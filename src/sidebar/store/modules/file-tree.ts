import { createStoreModule, makeAction } from '../create-store';
import type { FileMeta } from '../../../types/api';
import { createSelector } from 'reselect';

const initialState = {
  dir: "",
  files: [],
} as {
  dir: string;
  files: FileMeta[],
};

export type State = typeof initialState;

function sortByFilename(a: FileMeta, b: FileMeta) {
  return a.filename.localeCompare(b.filename);
}

const reducers = {
  SET_DIR(state: State, action: { dir: string }) {
    return { dir: action.dir };
  },

  ADD_FILES(state: State, action: {files: FileMeta[]}): Partial<State> {
    const added = [];
    for (const record of action.files) {
      let existing;
      console.log("state.files",state.files)
      existing = state.files.find(r => r.id === record.id);

      if (!existing) {
        added.push(record);
      }
    }

    return {
      files: state.files.concat(added).sort(sortByFilename),
    };
  },

  CLEAR_FILES(): Partial<State> {
    return { files: [] };
  },

  REMOVE_FILES(state: State, action: {files: FileMeta[]}): Partial<State> {
    const remain = state.files.filter(item => action.files.some(item2 => item.id !== item2.id));
    return {
      files: remain,
    }
  },
};

// Action creators

function addFiles(files: FileMeta[]) {
  return makeAction(reducers, 'ADD_FILES', {files: files});
}

function removeFiles(files: FileMeta[]) {
  return makeAction(reducers, 'REMOVE_FILES', {files: files});
}

function clearFiles() {
  return makeAction(reducers, 'CLEAR_FILES', undefined);
}

function changeDir(dir: string) {
  return makeAction(reducers, 'SET_DIR', {dir: dir});
}

// Selectors

function getAllFiles(state: State) {
  return state.files;
}

const getFiles = createSelector(
  (state: State) => state.files,
  (files: FileMeta[]) =>
    files.filter(item => item.fileType !== 'directory'),
);

const getDirs = createSelector(
  (state: State) => state.files,
  (files: FileMeta[]) =>
    files.filter(item => item.fileType === 'directory'),
);

function getDir(state: State) {
  return state.dir;
}

export const fileTreeModule = createStoreModule(initialState, {
  namespace: 'fileTree',
  reducers,
  actionCreators: {
    addFiles,
    removeFiles,
    clearFiles,
    changeDir,
  },
  selectors: {
    getAllFiles,
    getFiles,
    getDirs,
    getDir,
  },
});
