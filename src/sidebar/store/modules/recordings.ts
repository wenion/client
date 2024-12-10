import type { Dispatch } from 'redux';
import { createSelector } from 'reselect';

import type { RecordItem, RecordStep } from '../../../types/api';
import { createStoreModule, makeAction } from '../create-store';

export type State = {
  tabView: 'list' | 'ongoing' | string;
  step: number; // scrollTop
  recordItems: RecordItem[];
  recordSteps: RecordStep[];
};

function initialState(): State {
  return {
    tabView: 'list',
    step: 0,
    recordItems: [],
    recordSteps: [],
  }
}

function sortByTaskName(a: RecordItem, b: RecordItem) {
  return a.taskName.localeCompare(b.taskName);
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
  SET_TAB_VIEW(state: State, action: { tabView: string }) {
    return { tabView: action.tabView };
  },

  SET_STEP(state: State, action: { step: number }) {
    return { step: action.step };
  },

  ADD_RECORDITEMS(state: State, action: {recordItems: RecordItem[] }): Partial<State> {
    const added = [];

    for (const record of action.recordItems) {
      let existing;
      existing = state.recordItems.find(r => r.id === record.id);

      if (!existing) {
        added.push(record);
      }
    }

    return {
      recordItems: state.recordItems.concat(added).sort(sortByTaskName),
    };
  },

  CLEAR_RECORDITEMS(): Partial<State> {
    return { recordItems: [] };
  },

  REMOVE_RECORDITEM(
    state: State,
    action: {
      remainingRecordItems: RecordItem[]
    },
  ): Partial<State> {
    return {
      recordItems: [...action.remainingRecordItems].sort(sortByTaskName),
    };
  },

  UPDATE_RECORDITEM(state: State, action: { recordItem: RecordItem },): Partial<State> {
    const remain = state.recordItems.filter(r => r.id !== action.recordItem.id);
    return {
      recordItems: remain.concat(action.recordItem).sort(sortByTaskName),
    }
  },

  ADD_RECORDSTEPS(state: State, action: {recordSteps: RecordStep[] }): Partial<State> {
    return {
      recordSteps: action.recordSteps,
    };
  },

  CLEAR_RECORDSTEPS(): Partial<State> {
    return { recordSteps: [] };
  },
};

// Action creators

function setRecordTabView(RecordTabView: string) {
  return makeAction(reducers, 'SET_TAB_VIEW', {tabView: RecordTabView});
}

function setStep(step: number) {
  return makeAction(reducers, 'SET_STEP', {step: step});
}

function addRecordItems(recordItems: RecordItem[]) {
  return makeAction(reducers, 'ADD_RECORDITEMS', {recordItems: recordItems});
}

function clearRecordItems() {
  return makeAction(reducers, 'CLEAR_RECORDITEMS', undefined);
}

function updateRecordItem(recordItem: RecordItem) {
  return makeAction(reducers, 'UPDATE_RECORDITEM', { recordItem });
}

function removeRecordItem(id: string) {
  return (dispatch: Dispatch, getState: () => { recordings: State }) => {
    const remaining = getState().recordings.recordItems.filter(r => r.id !== id);
    dispatch(makeAction(reducers, 'REMOVE_RECORDITEM', {remainingRecordItems: remaining}));
  }
}

function addRecordSteps(recordSteps: RecordStep[]) {
  return makeAction(reducers, 'ADD_RECORDSTEPS', {recordSteps: recordSteps});
}

function clearRecordSteps() {
  return makeAction(reducers, 'CLEAR_RECORDSTEPS', undefined);
}

// Selectors

function getRecordTabView(state: State) {
  return state.tabView;
}

function getStep(state: State) {
  return state.step;
}

function getRecordItemById(state: State, id: string) {
  const recordItem = state.recordItems.find(r => r.id === id);
  return recordItem?? null;
}

const getRecordItem = createSelector(
  (state: State) => state.recordItems,
  (state: State) => state.tabView,
  (recordItems, tabView) => {
    const recordItem = recordItems.find(r => r.id === tabView);
    return recordItem?? null;
  },
)

function recordItemsCount(state: State) {
  return state.recordItems.length;
}

function recordItems(state: State) {
  return state.recordItems;
}

function recordSteps(state: State) {
  return state.recordSteps;
}

// type RootState = {
//   recordings: State;
//   defaults: DefaultsState;
// }

// const currentRecordItem = createSelector(
//   (rootState: RootState) => rootState.recordings.recordItems,
//   (rootState: RootState) =>
//     defaultsModule.selectors.getDefault(rootState.defaults, 'recordTabView'),
//   (recordItems, sessionId) => {
//     const result = recordItems.find((r) => r.sessionId === sessionId);
//     console.log("currentRecordItem", recordItems, sessionId, result)
//     return result ?? null;
//   }
// );

export const recordingsModule = createStoreModule(initialState, {
  namespace: 'recordings',
  reducers,
  actionCreators: {
    setRecordTabView,
    setStep,
    addRecordItems,
    updateRecordItem,
    clearRecordItems,
    removeRecordItem,
    addRecordSteps,
    clearRecordSteps,
  },
  selectors: {
    getRecordTabView,
    getStep,
    getRecordItem,
    getRecordItemById,
    recordItems,
    recordItemsCount,
    recordSteps,
  },
  // rootSelectors: {
  //   currentRecordItem,
  // }
});
