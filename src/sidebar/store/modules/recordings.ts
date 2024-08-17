/**
 * State management for the set of annotations currently loaded into the
 * sidebar.
 */
import type { Dispatch } from 'redux';

import { createStoreModule, makeAction } from '../create-store';
import type { RecordingStepData } from '../../../types/api';
import type { Recording } from '../../../types/api';

type BooleanMap = Record<string, boolean>;
type RecordingStage = 'Request' | 'Start' | 'End' | 'Idle'

export type Selector = { [key: string]: string; };

function excludeRecords(
  current: Recording[],
  records_id: string[],
) {
  return current.filter(recording => !records_id.includes(recording.session_id))
}

export type State = {
  recordingStage: RecordingStage;
  selectedRecordingStep: RecordingStepData | null;
  records: Recording[];
  selectedRecord: Recording & {action: "delete" | "view" | "share"} | null;
  step: number; // scrollTop
};

function initialState(): State {
  return {
    recordingStage: 'Idle',
    selectedRecordingStep: null,
    records: [],
    selectedRecord: null,
    step: 0,
  }
}

function findBySessionId(recordings: Recording[], id: string) {
  return recordings.find(r => r.session_id === id);
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
  ADD_RECORDS(
    state: State,
    action: { records: Recording[] },
  ): Partial<State> {
    const updatedIDs = new Map();

    const added = [];
    const merged = [];

    for (const record of action.records) {
      let existing = findBySessionId(state.records, record.session_id)
      if (existing) {
        updatedIDs.set(record.session_id, Object.assign({}, existing, record));
      } else {
        added.push(record)
      }
    }

    for (const record of state.records) {
      if (updatedIDs.has(record.session_id)) {
        merged.push(updatedIDs.get(record.session_id));
      }
      else {
        merged.push(record);
      }
    }

    return {
      records: merged.concat(added),
    };
  },

  CLEAR_RECORDS(): Partial<State> {
    return { records: [] };
  },

  REMOVE_RECORDS(
    state: State,
    action: {
      recordsToRemove: string[];
      remainingRecords: Recording[];
    },
  ): Partial<State> {
    return { records: [...action.remainingRecords] };
  },

  SELECT_RECORD(state: State, action: {record: Recording, action: "delete" | "view" | "share"}): Partial<State> {
    return {
      selectedRecord: {...action.record, action: action.action}
    }
  },

  CLEAR_RECORD(state: State): Partial<State> {
    return {
      selectedRecord: null
    }
  },

  SELECT_STEP(state: State, action: {stepId: string | null}): Partial<State> {
    if (state.selectedRecord && state.selectedRecord.steps && action.stepId) {
      const selectedStep = state.selectedRecord.steps.find(r => r.id === action.stepId)
      return {
        selectedRecordingStep: selectedStep ?? null,
      }
    }
    return {
      selectedRecordingStep: null,
    }
  },

  SET_STEP(state: State, {step}: {step:number},) {
    return {
      step
    };
  },

  CHANG_RECORDING_STAGE(state: State, action: {newStage: RecordingStage}) {
    return { recordingStage: action.newStage }
  },
};

/* Action creators */
function addRecords(records: Recording[]) {
  return makeAction(reducers, 'ADD_RECORDS', {records:records})
}

function removeRecords(recordings_name: string[]) {
  return (dispatch: Dispatch, getState: () => {recordings: State}) => {
    const remainingRecords = excludeRecords(
      getState().recordings.records,
      recordings_name,
    );
    dispatch(
      makeAction(reducers, 'REMOVE_RECORDS', {
        recordsToRemove: recordings_name,
        remainingRecords: remainingRecords,
      }),
    );
  };
}

function clearRecords() {
  return makeAction(reducers, 'CLEAR_RECORDS', undefined)
}

function selectRecordBySessionId(sessionId: string, action: "delete" | "view" | "share") {
  return (dispatch: Dispatch, getState: () => {recordings: State}) => {
      const selected = getState().recordings.records.find(r => r.session_id === sessionId)
      if (selected) {
        dispatch(makeAction(reducers, 'SELECT_RECORD', {record: selected, action: action}))
      }
    }
}

function clearSelectedRecord() {
  return makeAction(reducers, 'CLEAR_RECORD', undefined)
}

function setStep(step: number) {
  return makeAction(reducers, 'SET_STEP', {step: step})
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

function getSelectedRecord(state: State) {
  return state.selectedRecord;
}

function getSelectedRecordingStep(state: State) {
  return state.selectedRecordingStep;
}

function currentRecordingStage(state: State) {
  return state.recordingStage;
}

function allRecordingsCount(state: State) {
  return state.records.length;
}

function Records(state:State) {
  return state.records;
}

function getStep(state:State) {
  return state.step;
}

export const recordingsModule = createStoreModule(initialState, {
  namespace: 'recordings',
  reducers,

  actionCreators: {
    addRecords,
    removeRecords,
    clearRecords,
    selectRecordBySessionId,
    clearSelectedRecord,
    selectRecordingStep,
    clearSelectedRecordingStep,
    changeRecordingStage,
    setStep,
  },
  selectors: {
    allRecordingsCount,
    Records,
    currentRecordingStage,
    getSelectedRecordingStep,
    getSelectedRecord,
    getStep,
  },
});
