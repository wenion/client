/**
 * State management for the set of annotations currently loaded into the
 * sidebar.
 */
import type { Dispatch } from 'redux';

import { createStoreModule, makeAction } from '../create-store';

type BooleanMap = Record<string, boolean>;
type RecordingStage = 'Request' | 'Start' | 'End' | 'Idle'

export type Selector = { [key: string]: string; };

export type RecordingStepData = {
  type: string;
  id: string;
  url?: string;
  description?: string;
  title?: string;
  position?: string;
  image?: string | null;
}

export type RecordingData = {
  taskName: string;
  sessionId: string;
  title?: string;
  selectorAttribute?: string;
  steps: RecordingStepData[];
}

/**
 * Get the remaining recordings
 * 
 * @param current 
 * @param recordings - to remove
 * @returns 
 */
function excludeRecordings(
  current: RecordingData[],
  recordings: string[],
) {
  return current.filter(recording => !recordings.includes(recording.taskName))
}

export type State = {
  recordingStage: RecordingStage;
  newRecording: RecordingData | null;
  selectedRecording: RecordingData | null;
  // selected: BooleanMap;
  recordings: RecordingData[];
};

function initialState(): State {
  return {
    recordingStage: 'Idle',
    newRecording: null,
    selectedRecording: null,
    recordings: [],
  }
}

function findByTaskName(recording: RecordingData[], taskName: string) {
  return recording.find(r => r.taskName === taskName);
}

function findBySessionId(recording: RecordingData[], sessionId: string) {
  return recording.find(r => r.sessionId === sessionId);
}

/**
 * Merge client annotation data into the annotation object about to be added to
 * the store's collection of `annotations`.
 *
 * `annotation` may either be new (unsaved) or a persisted annotation retrieved
 * from the service.
 *
 * @param tag - The `$tag` value that should be used for this if it doesn't have
 * a `$tag` already
 * @return - API annotation data with client annotation data merged
 */

const reducers = {
  ADD_RECORDINGS(
    state: State,
    action: { recordings: RecordingData[] },
  ): Partial<State> {
    const added = [];
    for (const recording of action.recordings) {
      // let existing = findBySessionId(state.recordings, recording.sessionId)
      // if (!existing) {
        added.push(recording)
      // }
    }
    return {
      recordings: added,//state.recordings.concat(added),
    };
  },

  REMOVE_RECORDINGS(
    state: State,
    action: {
      recordingsToRemove: string[];
      remainingRecordings: RecordingData[]
    },
  ): Partial<State> {
    return {
      recordings: [...action.remainingRecordings],
    };
  },

  CLEAR_RECORDINGS(state: State): Partial<State> {
    return { recordings: []}
  },

  CREATE_NEW_RECORDING(state: State, action: {taskName: string, sessionId: string, selectorAttribute: string | undefined}) {
    return {newRecording: {
      taskName: action.taskName,
      sessionId: action.sessionId,
      title: action.taskName,
      selectorAttribute: action.selectorAttribute,
      steps: []
    }}
  },

  REMOVE_NEW_RECORDING(state: State): Partial<State> {
    return { newRecording: null}
  },

  SELECT_RECORDING(state: State, action: {taskName: string | null}) {
    const selected = state.recordings.find(r => r.taskName === action.taskName)
    return {
      selectedRecording: selected? selected : null
    }
  },

  CHANG_RECORDING_STAGE(state: State, action: {newStage: RecordingStage}) {
    return { recordingStage: action.newStage }
  },

  // UPDATE_NEW_RECORDING(state: State, action: {taskName: string, steps: RecordingStepData[]}) {
  //   return {newRecording: {taskName: action.taskName, steps: []}}
  // }
};

/* Action creators */

/**
 * Add these `annotations` to the current collection of annotations in the
 * store.
 */
function addRecordings(recordings: RecordingData[]) {
  return function(
    dispatch: Dispatch,
    getState: () => {
      selected: BooleanMap;
      recordings: RecordingData[];
    }
  ) {
    // const added = recordings.filter(recording => !findByTaskName(getState().recordings, recording.taskName))
    dispatch(
      makeAction(reducers, 'ADD_RECORDINGS', {
        recordings: recordings,
      }),
    )
  }
}

function removeRecordings(recordings: string[]) {
  return (dispatch: Dispatch, getState: () => {recordings: State}) => {
    const remainingRecordings = excludeRecordings(
      getState().recordings.recordings,
      recordings,
    );
    dispatch(
      makeAction(reducers, 'REMOVE_RECORDINGS', {
        recordingsToRemove: recordings,
        remainingRecordings,
      }),
    );
  };
}

function clearRecordings() {
  return makeAction(reducers, 'CLEAR_RECORDINGS', undefined)
}

function selectRecording(taskName: string) {
  return makeAction(reducers, 'SELECT_RECORDING', {taskName: taskName})
}

function clearSelectedRecording() {
  return makeAction(reducers, 'SELECT_RECORDING', {taskName: null})
}

function createNewRecording(taskName: string, sessionId: string, selectorAttribute: string | undefined) {
  return makeAction(reducers, 'CREATE_NEW_RECORDING', {taskName: taskName, sessionId: sessionId, selectorAttribute: selectorAttribute})
}

function removeNewRecording() {
  return makeAction(reducers, 'REMOVE_NEW_RECORDING', undefined)
}

function changeRecordingStage(newStage: RecordingStage) {
  return makeAction(reducers, 'CHANG_RECORDING_STAGE', {newStage: newStage})
}

function getNewRecording(state: State) {
  return state.newRecording;
}

function getSelectedRecording(state: State) {
  return state.selectedRecording;
}

function hasNewRecording(state: State) {
  return state.newRecording != null;
}

function currentRecordingStage(state: State) {
  return state.recordingStage;
}

function Recordings(state: State) {
  return state.recordings;
}

function allRecordingsCount(state: State) {
  return state.recordings.length;
}

export const recordingsModule = createStoreModule(initialState, {
  namespace: 'recordings',
  reducers,

  actionCreators: {
    addRecordings,
    clearRecordings,
    selectRecording,
    clearSelectedRecording,
    removeRecordings,
    createNewRecording,
    removeNewRecording,
    changeRecordingStage,
  },
  selectors: {
    Recordings,
    allRecordingsCount,
    currentRecordingStage,
    getNewRecording,
    getSelectedRecording,
    hasNewRecording,
  },
});
