import type { Dispatch } from 'redux';
import { createSelector } from 'reselect';

import type { RecordItem, RecordStep } from '../../../types/api';
import { createStoreModule, makeAction } from '../create-store';
import type { State as LinksState } from './links';

export type State = {
  tabView: 'list' | 'ongoing' | string;
  focusedRecordItemId: string | null;
  focusedStepId: string | null;
  recordItems: RecordItem[];
  recordSteps: RecordStep[];
  shouldScroll: boolean;
};

function initialState(): State {
  return {
    tabView: 'list',
    focusedRecordItemId: null,
    focusedStepId: null,
    recordItems: [],
    recordSteps: [],
    shouldScroll: true,
  }
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

  SET_FOCUSED_STEP_ID(state: State, action: { scrollToId: string | null }) {
    return { focusedStepId: action.scrollToId };
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
      recordItems: state.recordItems.concat(added),
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
      recordItems: [...action.remainingRecordItems],
    };
  },

  UPDATE_RECORDITEM(state: State, action: { recordItem: RecordItem },): Partial<State> {
    const index = state.recordItems.findIndex(r => r.id === action.recordItem.id);

    if (index === -1) {
      return {
        recordItems: state.recordItems,
      };
    }

    return {
      recordItems: [
        ...state.recordItems.slice(0, index),
        action.recordItem,
        ...state.recordItems.slice(index + 1),
      ]
    };
  },

  ADD_RECORDSTEPS(state: State, action: {recordSteps: RecordStep[]}): Partial<State> {
    const newRecordSteps = [...state.recordSteps];
    action.recordSteps.map(step => {
      const index = step.index!;
      newRecordSteps.splice(index, 0, step);
    });
    newRecordSteps.map((step, index) => {
      step.index = index;
    });
    return {
      recordSteps: newRecordSteps,
    };
  },

  REMOVE_RECORDSTEPS(
    state: State,
    action: {
      toRemove: RecordStep[]
    },
  ): Partial<State> {
    const newRecordSteps = [...state.recordSteps];
    action.toRemove.map(step => {
      const index = step.index!;
      newRecordSteps.splice(index, 1);
    })

    // reorder
    newRecordSteps.map((step, index) => {
      step.index = index;
    });

    return {
      recordSteps: newRecordSteps,
    };
  },

  UPDATE_RECORDSTEP(state: State, action: { recordStep: RecordStep },): Partial<State> {
    const index = state.recordSteps.findIndex(r => r.id === action.recordStep.id);
    if (index === -1) {
      return {
        recordSteps: state.recordSteps,
      };
    }

    return {
      recordSteps: [
        ...state.recordSteps.slice(0, index),
        action.recordStep,
        ...state.recordSteps.slice(index + 1),
      ]
    };
  },

  CLEAR_RECORDSTEPS(): Partial<State> {
    return { recordSteps: [] };
  },

  SET_SHOULD_SCROLL(state: State, action: { shouldScroll: boolean }) {
    return { shouldScroll: action.shouldScroll };
  },

  SET_FOCUSED_RECORD_ITEM_ID(state: State, action: { id: string | null }) {
    return { focusedRecordItemId: action.id };
  },
};

// Action creators

function setRecordTabView(RecordTabView: string) {
  return makeAction(reducers, 'SET_TAB_VIEW', {tabView: RecordTabView});
}

function setFocusedStepId(scrollToId: string | null) {
  return makeAction(reducers, 'SET_FOCUSED_STEP_ID', {scrollToId: scrollToId});
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
  return (
    dispatch: Dispatch,
     getState: () => {
      recordings: State;
      links: LinksState;
    }) => {
      const linksState = getState().links;
      const link = linksState? linksState['index'] : null;

      if (!link) {
        recordSteps = [];
      }

      recordSteps = recordSteps.filter((step, index) => {
        const existsInState =
          getState().recordings.recordSteps.find(rs => rs.id === step.id);
        if (existsInState) {
          return false;
        }

        if (step.image) {
          step.image = link + 'api/image/' + step.image + '.jpg';
        }
        /* backwards compatibility */
        if (!step.title) {
          step.title = step.type;
        }
        if (!step.index) {
          step.index = index;
        }
        return true;
      });
      dispatch(
        makeAction(reducers, 'ADD_RECORDSTEPS', {
          recordSteps: recordSteps
        })
      );
    }
}

function removeRecordSteps(ids: string[]) {
  return (dispatch: Dispatch, getState: () => { recordings: State }) => {
    const toRemove =
      getState().recordings.recordSteps.filter(
        r => ids.includes(r.id)
      );
    dispatch(makeAction(reducers, 'REMOVE_RECORDSTEPS', {toRemove: toRemove}));
  }
}

function updateRecordStep(recordStep: RecordStep) {
  return makeAction(reducers, 'UPDATE_RECORDSTEP', { recordStep });
}

function clearRecordSteps() {
  return makeAction(reducers, 'CLEAR_RECORDSTEPS', undefined);
}

function setShouldScroll(shouldScroll: boolean) {
  return makeAction(reducers, 'SET_SHOULD_SCROLL', {shouldScroll: shouldScroll});
}


function setFocusedRecordItemId(id: string | null) {
  return makeAction(reducers, 'SET_FOCUSED_RECORD_ITEM_ID', {id: id});
}

// Selectors

function getRecordTabView(state: State) {
  return state.tabView;
}

function getFocusedStepId(state: State) {
  return state.focusedStepId;
}

function getRecordItemById(state: State, id: string) {
  const recordItem = state.recordItems.find(r => r.id === id);
  return recordItem?? null;
}

function getRecordItemByPk(state: State, pk: string) {
  const recordItem = state.recordItems.find(r => r.pk === pk);
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
  return state.recordSteps.sort((a, b) => {
    if (a.index !== undefined && b.index !== undefined) {
      // Sort by index if both have index values
      return a.index - b.index;
    }
    // If index is undefined, sort by timestamp
    return a.timestamp - b.timestamp;
  });
}

function getRecordStepByPk(state: State, pk: string) {
  const step = state.recordSteps.find(r => r.pk === pk);
  return step?? null;
}

function getRecordStepById(state: State, id: string) {
  const step = state.recordSteps.find(r => r.id === id);
  return step?? null;
}

function getShouldScroll(state: State) {
  return state.shouldScroll;
}

function focusedRecordItemId(state: State) {
  return state.focusedRecordItemId;
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
    setFocusedStepId,
    addRecordItems,
    updateRecordItem,
    clearRecordItems,
    removeRecordItem,
    addRecordSteps,
    removeRecordSteps,
    updateRecordStep,
    clearRecordSteps,
    setShouldScroll,
    setFocusedRecordItemId,
  },
  selectors: {
    getFocusedStepId,
    getRecordTabView,
    getRecordItem,
    getRecordItemById,
    getRecordItemByPk,
    focusedRecordItemId,
    recordItems,
    recordItemsCount,
    recordSteps,
    getRecordStepById,
    getRecordStepByPk,
    getShouldScroll,
  },
  // rootSelectors: {
  //   currentRecordItem,
  // }
});
