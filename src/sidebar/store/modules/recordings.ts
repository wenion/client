/**
 * State management for the set of annotations currently loaded into the
 * sidebar.
 */
import type { Dispatch } from 'redux';

import { createStoreModule, makeAction } from '../create-store';
import type { RecordingData, RecordingStepData } from '../../../types/api';

type BooleanMap = Record<string, boolean>;
type RecordingStage = 'Request' | 'Start' | 'End' | 'Idle'

export type Selector = { [key: string]: string; };

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
  selectedRecording: RecordingData | null;
  selectedRecordingStep: RecordingStepData | null;
  deleteConfirmation: boolean;
  recordings: RecordingData[];
};

function initialState(): State {
  return {
    recordingStage: 'Idle',
    selectedRecording: null,
    selectedRecordingStep: null,
    deleteConfirmation: false,
    recordings: [],
  }
}

function findByTaskName(state: State, taskName: string) {
  return state.recordings.find(r => r.taskName === taskName);
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

  SELECT_RECORDING(state: State, action: {taskName: string | null, status?: boolean}): Partial<State> {
    const selected = state.recordings.find(r => r.taskName === action.taskName)
    return {
      selectedRecording: selected? selected : null,
      deleteConfirmation: action.status ?? state.deleteConfirmation,
    }
  },

  SELECT_STEP(state: State, action: {stepId: string | null}): Partial<State> {
    if (state.selectedRecording && action.stepId) {
      const selectedStep = state.selectedRecording.steps.find(r => r.id === action.stepId)
      return {
        selectedRecordingStep: selectedStep ?? null,
      }
    }
    return {
      selectedRecordingStep: null,
    }
  },

  CHANG_RECORDING_STAGE(state: State, action: {newStage: RecordingStage}) {
    return { recordingStage: action.newStage }
  },

  RESET_STATUS(state: State, action: {status: boolean}) {
    return {
      selectedRecording: null,
      deleteConfirmation: action.status
    }
  }

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

function selectRecordingStep(stepId: string) {
  return makeAction(reducers, 'SELECT_STEP', {stepId: stepId})
}

function clearSelectedRecordingStep() {
  return makeAction(reducers, 'SELECT_STEP', {stepId: null})
}

function changeRecordingStage(newStage: RecordingStage) {
  return makeAction(reducers, 'CHANG_RECORDING_STAGE', {newStage: newStage})
}

function updateDeleteConfirmation(taskName: string, newStatus: boolean) {
  return makeAction(reducers, 'SELECT_RECORDING', {taskName: taskName, status: newStatus})
}

function resetDeleteConfirmation() {
  return makeAction(reducers, 'RESET_STATUS', {status: false})
}

function getSelectedRecording(state: State) {
  return state.selectedRecording;
}

function getSelectedRecordingStep(state: State) {
  return state.selectedRecordingStep;
}

function currentRecordingStage(state: State) {
  return state.recordingStage;
}

function deleteConfirmation(state: State) {
  return state.deleteConfirmation;
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
    selectRecordingStep,
    clearSelectedRecordingStep,
    removeRecordings,
    changeRecordingStage,
    updateDeleteConfirmation,
    resetDeleteConfirmation,
  },
  selectors: {
    Recordings,
    allRecordingsCount,
    currentRecordingStage,
    deleteConfirmation,
    getSelectedRecording,
    getSelectedRecordingStep,
    findByTaskName,
  },
});
