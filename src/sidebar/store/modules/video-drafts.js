import { createSelector } from 'reselect';

import { createStoreModule, makeAction } from '../create-store';
import { removeVideoAnnotations } from './video-annotations';

/**
 * @typedef {import('redux-thunk/extend-redux')} Dummy
 * @typedef {import('../../../types/api').VideoAnnotation} VideoAnnotation
 */

/**
 * The drafts store provides temporary storage for unsaved edits to new or
 * existing annotations.
 */

const initialState = {
  /** @type {VideoDraft[]} */
  videoDrafts: [],
};

/** @typedef {typeof initialState} State */

/**
 * @typedef {Pick<VideoAnnotation, 'id'|'$tag'>} AnnotationID
 */

/**
 * Edits made to a new or existing annotation by a user.
 *
 * @typedef DraftChanges
 * @prop {boolean} isPrivate
 * @prop {string[]} tags
 * @prop {string} text
 */

/**
 * An unsaved set of changes to an annotation.
 *
 * This consists of an annotation ID ({@link AnnotationID}) and the edits
 * ({@link DraftChanges}) made by the user.
 */
export class VideoDraft {
  /**
   * @param {AnnotationID} annotation
   * @param {DraftChanges} changes
   */
  constructor(annotation, changes) {
    this.annotation = { id: annotation.id, $tag: annotation.$tag };
    this.isPrivate = changes.isPrivate;
    this.tags = changes.tags;
    this.text = changes.text;
  }
  /**
   * Returns true if this draft matches a given annotation.
   *
   * Annotations are matched by ID or local tag.
   *
   * @param {AnnotationID} annotation
   */
  match(annotation) {
    return (
      (this.annotation.$tag && annotation.$tag === this.annotation.$tag) ||
      (this.annotation.id && annotation.id === this.annotation.id)
    );
  }
  /**
   * Return true if this draft is empty and can be discarded without losing
   * any user input.
   */
  isEmpty() {
    return !this.text && this.tags.length === 0;
  }
}

const reducers = {
  DISCARD_ALL_VIDEO_DRAFTS() {
    return { videoDrafts: [] };
  },

  /**
   * @param {State} state
   * @param {{ annotation: AnnotationID }} action
   */
  REMOVE_VIDEO_DRAFT(state, action) {
    const videoDrafts = state.videoDrafts.filter(draft => {
      return !draft.match(action.annotation);
    });
    return { videoDrafts };
  },

  /**
   * @param {State} state
   * @param {{ draft: VideoDraft }} action
   */
  UPDATE_VIDEO_DRAFT(state, action) {
    // removes a matching existing draft, then adds
    const videoDrafts = state.videoDrafts.filter(draft => {
      return !draft.match(action.draft.annotation);
    });
    videoDrafts.push(action.draft); // push ok since its a copy
    return { videoDrafts };
  },
};

/**
 * Create or update the draft version for a given annotation by
 * replacing any existing draft or simply creating a new one.
 *
 * @param {AnnotationID} annotation
 * @param {DraftChanges} changes
 */
function createVideoDraft(annotation, changes) {
  return makeAction(reducers, 'UPDATE_VIDEO_DRAFT', {
    draft: new VideoDraft(annotation, changes),
  });
}

/**
 * Remove any drafts that are empty.
 *
 * An empty draft has no text and no reference tags.
 */
function deleteNewAndEmptyVideoDrafts() {
  /**
   * @param {import('redux').Dispatch} dispatch
   * @param {() => { videoDrafts: State }} getState
   */
  return (dispatch, getState) => {
    const newDrafts = getState().videoDrafts.videoDrafts.filter(draft => {
      return (
        !draft.annotation.id &&
        !getVideoDraftIfNotEmpty(getState().videoDrafts, draft.annotation)
      );
    });
    const removedAnnotations = newDrafts.map(draft => {
      dispatch(removeVideoDraft(draft.annotation));
      return draft.annotation;
    });
    dispatch(removeVideoAnnotations(removedAnnotations));
  };
}

/**
 * Remove all drafts.
 */
function discardAllVideoDrafts() {
  return makeAction(reducers, 'DISCARD_ALL_VIDEO_DRAFTS', undefined);
}

/**
 * Remove the draft version of an annotation.
 *
 * @param {AnnotationID} annotation
 */
function removeVideoDraft(annotation) {
  return makeAction(reducers, 'REMOVE_VIDEO_DRAFT', { annotation });
}

/**
 * Returns the number of drafts - both unsaved new annotations, and unsaved
 * edits to saved annotations - currently stored.
 *
 * @param {State} state
 */
function countVideoDrafts(state) {
  return state.videoDrafts.length;
}

/**
 * Retrieve the draft changes for an annotation.
 *
 * @param {State} state
 * @param {AnnotationID} annotation
 */
function getVideoDraft(state, annotation) {
  const drafts = state.videoDrafts;
  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i];
    if (draft.match(annotation)) {
      return draft;
    }
  }

  return null;
}

/**
 * Returns the draft changes for an annotation, or null if no draft exists
 * or the draft is empty.
 *
 * @param {State} state
 * @param {AnnotationID} annotation
 */
function getVideoDraftIfNotEmpty(state, annotation) {
  const draft = getVideoDraft(state, annotation);
  if (!draft) {
    return null;
  }
  return draft.isEmpty() ? null : draft;
}

/**
 * Returns a list of draft annotations which have no id.
 */
const unsavedVideoAnnotations = createSelector(
  /** @param {State} state */
  state => state.videoDrafts,
  drafts => drafts.filter(d => !d.annotation.id).map(d => d.annotation)
);

export const videoDraftsModule = createStoreModule(initialState, {
  namespace: 'videoDrafts',
  reducers,
  actionCreators: {
    createVideoDraft,
    deleteNewAndEmptyVideoDrafts,
    discardAllVideoDrafts,
    removeVideoDraft,
  },

  selectors: {
    countVideoDrafts,
    getVideoDraft,
    getVideoDraftIfNotEmpty,
    unsavedVideoAnnotations,
  },
});
