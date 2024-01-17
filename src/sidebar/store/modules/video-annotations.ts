/**
 * State management for the set of annotations currently loaded into the
 * sidebar.
 */
import type { Dispatch } from 'redux';
import { createSelector } from 'reselect';

import { hasOwn } from '../../../shared/has-own';
import type { VideoAnnotation, SavedVideoAnnotation } from '../../../types/api';
import type { HighlightCluster } from '../../../types/shared';
import * as metadata from '../../helpers/annotation-metadata';
import { isHighlight, isSaved } from '../../helpers/annotation-metadata';
import { countIf, toTrueMap, trueKeys } from '../../util/collections';
import { createStoreModule, makeAction } from '../create-store';
import { routeModule } from './route';
import type { State as RouteState } from './route';
import { sessionModule } from './session';
import type { State as SessionState } from './session';

type AnchorStatus = 'anchored' | 'orphan' | 'timeout';

type AnchorStatusUpdates = {
  [$tag: string]: AnchorStatus;
};

type VideoAnnotationStub = {
  /**
   * Service-provided identifier if annotation has been
   * persisted to the service
   */
  id?: string;

  /** Local-generated identifier */
  $tag?: string;
};

const initialState = {
  videoAnnotations: [],
  highlighted: {},
  hovered: {},
  nextTag: 1,
} as {
  /** Set of currently-loaded annotations */
  videoAnnotations: VideoAnnotation[];

  /**
   * The $tags of annotations that should appear as "highlighted", e.g. the
   * target of a single-annotation view. NB: This feature is currently not
   * supported in the application UI.
   */
  highlighted: { [$tag: string]: boolean };

  /**
   * The $tags of annotations whose cards or highlights are currently hovered.
   * The styling of the highlights/cards of these annotations are adjusted to
   * show the correspondence between the two.
   */
  hovered: { [$tag: string]: boolean };

  /**
   * The local tag to assign to the next annotation that is loaded into the app
   */
  nextTag: number;
};

export type VideoState = typeof initialState;

/**
 * Return a copy of `current` with all matching annotations in `annotations`
 * removed (matched on identifier—`id` or `$tag`)
 *
 * Annotations in `annotations` may be complete annotations or "stubs" with only
 * the `id` field set.
 */
function excludeVideoAnnotations(
  current: VideoAnnotation[],
  annotations: VideoAnnotationStub[]
) {
  const ids = new Set();
  const tags = new Set();
  for (const annot of annotations) {
    if (annot.id) {
      ids.add(annot.id);
    }
    if (annot.$tag) {
      tags.add(annot.$tag);
    }
  }
  return current.filter(annot => {
    const shouldRemove =
      (annot.id && ids.has(annot.id)) || (annot.$tag && tags.has(annot.$tag));
    return !shouldRemove;
  });
}

function findByID(annotations: VideoAnnotation[], id: string) {
  return annotations.find(a => a.id === id);
}

function findByTag(annotations: VideoAnnotation[], tag: string) {
  return annotations.find(a => a.$tag === tag);
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
function initializeAnnotation(
  annotation: Omit<VideoAnnotation, '$anchorTimeout'>,
  tag: string,
  currentUserId: string | null
): VideoAnnotation {
  let orphan = annotation.$orphan;

  if (!annotation.id) {
    // Unsaved (new) annotations must be anchored
    orphan = false;
  }

  let $cluster: HighlightCluster = 'other-content';
  // if (annotation.user === currentUserId) {
  //   $cluster = isHighlight(annotation) ? 'user-highlights' : 'user-annotations';
  // }

  return Object.assign({}, annotation, {
    $anchorTimeout: false,
    $cluster,
    $tag: annotation.$tag || tag,
    $orphan: orphan,
  });
}

const reducers = {
  ADD_VIDEO_ANNOTATIONS(
    state: VideoState,
    action: {
      annotations: VideoAnnotation[];
      currentAnnotationCount: number;
      currentUserId: string | null;
    }
  ): Partial<VideoState> {
    const updatedIDs = new Set();
    const updatedTags = new Set();

    const added = [];
    const unchanged = [];
    const updated = [];
    let nextTag = state.nextTag;

    for (const annot of action.annotations) {
      let existing;
      if (annot.id) {
        existing = findByID(state.videoAnnotations, annot.id);
      }
      if (!existing && annot.$tag) {
        existing = findByTag(state.videoAnnotations, annot.$tag);
      }

      if (existing) {
        // Merge the updated annotation with the private fields from the local
        // annotation
        updated.push(Object.assign({}, existing, annot));
        if (annot.id) {
          updatedIDs.add(annot.id);
        }
        if (existing.$tag) {
          updatedTags.add(existing.$tag);
        }
      } else {
        added.push(
          initializeAnnotation(annot, 't' + nextTag, action.currentUserId)
        );
        ++nextTag;
      }
    }

    for (const annot of state.videoAnnotations) {
      if (!updatedIDs.has(annot.id) && !updatedTags.has(annot.$tag)) {
        unchanged.push(annot);
      }
    }

    return {
      videoAnnotations: added.concat(updated).concat(unchanged),
      nextTag,
    };
  },

  CLEAR_VIDEO_ANNOTATIONS(): Partial<VideoState> {
    return { videoAnnotations: [], highlighted: {}, hovered: {} };
  },

  HOVER_VIDEO_ANNOTATIONS(state: VideoState, action: { tags: string[] }): Partial<VideoState> {
    return { hovered: toTrueMap(action.tags) };
  },

  HIDE_VIDEO_ANNOTATION(state: VideoState, action: { id: string }): Partial<VideoState> {
    const anns = state.videoAnnotations.map(ann => {
      if (ann.id !== action.id) {
        return ann;
      }
      return { ...ann, hidden: true };
    });
    return { videoAnnotations: anns };
  },

  HIGHLIGHT_VIDEO_ANNOTATIONS(
    state: VideoState,
    action: Pick<VideoState, 'highlighted'>
  ): Partial<VideoState> {
    return { highlighted: action.highlighted };
  },

  REMOVE_VIDEO_ANNOTATIONS(
    state: VideoState,
    action: {
      annotationsToRemove: VideoAnnotationStub[];
      remainingAnnotations: VideoAnnotation[];
    }
  ): Partial<VideoState> {
    return {
      videoAnnotations: [...action.remainingAnnotations],
    };
  },

  UNHIDE_VIDEO_ANNOTATION(state: VideoState, action: { id: string }): Partial<VideoState> {
    const anns = state.videoAnnotations.map(ann => {
      if (ann.id !== action.id) {
        return ann;
      }
      return Object.assign({}, ann, { hidden: false });
    });
    return { videoAnnotations: anns };
  },

  UPDATE_ANCHOR_STATUS(
    state: VideoState,
    action: { statusUpdates: AnchorStatusUpdates }
  ): Partial<VideoState> {
    const videoAnnotations = state.videoAnnotations.map(annot => {
      if (!hasOwn(action.statusUpdates, annot.$tag)) {
        return annot;
      }

      const state = action.statusUpdates[annot.$tag];
      if (state === 'timeout') {
        return Object.assign({}, annot, { $anchorTimeout: true });
      } else {
        return Object.assign({}, annot, { $orphan: state === 'orphan' });
      }
    });
    return { videoAnnotations };
  },

  UPDATE_FLAG_STATUS(
    state: VideoState,
    action: { id: string; isFlagged: boolean }
  ): Partial<VideoState> {
    const videoAnnotations = state.videoAnnotations.map(annot => {
      const match = annot.id && annot.id === action.id;
      if (match) {
        if (annot.flagged === action.isFlagged) {
          return annot;
        }

        const newAnn = Object.assign({}, annot, {
          flagged: action.isFlagged,
        });
        if (newAnn.moderation) {
          const countDelta = action.isFlagged ? 1 : -1;
          newAnn.moderation = {
            ...newAnn.moderation,
            flagCount: newAnn.moderation.flagCount + countDelta,
          };
        }
        return newAnn;
      } else {
        return annot;
      }
    });
    return { videoAnnotations };
  },
};

/* Action creators */

/**
 * Add these `annotations` to the current collection of annotations in the
 * store.
 */
function addVideoAnnotations(annotations: VideoAnnotation[]) {
  return function (
    dispatch: Dispatch,
    getState: () => {
      videoAnnotations: VideoState;
      route: RouteState;
      session: SessionState;
    }
  ) {
    annotations = annotations.filter(annot => {
      return (
        metadata.isVideoAnnotation(annot)
      );
    });
     const added = annotations.filter(annot => {
      return (
        !annot.id || !findByID(getState().videoAnnotations.videoAnnotations, annot.id)
      );
    });

    const profile = sessionModule.selectors.profile(getState().session);
    annotations = added;
    dispatch(
      makeAction(reducers, 'ADD_VIDEO_ANNOTATIONS', {
        annotations,
        currentAnnotationCount: getState().videoAnnotations.videoAnnotations.length,
        currentUserId: profile.userid,
      })
    );

    // If we're not in the sidebar, we're done here.
    // FIXME Split the annotation-adding from the anchoring code; possibly
    // move into service
    if (routeModule.selectors.route(getState().route) !== 'sidebar') {
      return;
    }

    // If anchoring fails to complete in a reasonable amount of time, then
    // we assume that the annotation failed to anchor. If it does later
    // successfully anchor then the status will be updated.
    const ANCHORING_TIMEOUT = 500;

    const anchoringIds = added
      .filter(metadata.isWaitingToAnchor)
      .map(ann => ann.id);

    if (anchoringIds.length > 0) {
      setTimeout(() => {
        // Find annotations which haven't yet been anchored in the document.
        const anns = getState().videoAnnotations.videoAnnotations;
        const annsStillAnchoring = anchoringIds
          .map(id => (id ? findByID(anns, id) : null))
          .filter(ann => ann && metadata.isWaitingToAnchor(ann));

        // Mark anchoring as timed-out for these annotations.
        const anchorStatusUpdates = annsStillAnchoring.reduce(
          (updates, ann) => {
            updates[ann!.$tag] = 'timeout';
            return updates;
          },
          {} as AnchorStatusUpdates
        );
        dispatch(updateVideoAnchorStatus(anchorStatusUpdates));
      }, ANCHORING_TIMEOUT);
    }
  };
}

/** Set the currently displayed annotations to the empty set. */
function clearVideoAnnotations() {
  return makeAction(reducers, 'CLEAR_VIDEO_ANNOTATIONS', undefined);
}

/**
 * Replace the current set of hovered annotations with the annotations
 * identified by `tags`.
 */
function hoverVideoAnnotations(tags: string[]) {
  return makeAction(reducers, 'HOVER_VIDEO_ANNOTATIONS', { tags });
}

/**
 * Update the local hidden state of an annotation.
 *
 * This updates an annotation to reflect the fact that it has been hidden from
 * non-moderators.
 */
function hideVideoAnnotation(id: string) {
  return makeAction(reducers, 'HIDE_VIDEO_ANNOTATION', { id });
}

/**
 * Highlight annotations with the given `ids`.
 *
 * This is used to indicate the specific annotation in a thread that was
 * linked to for example. Replaces the current map of highlighted annotations.
 * All provided annotations (`ids`) will be set to `true` in the `highlighted`
 * map.
 */
function highlightVideoAnnotations(ids: string[]) {
  return makeAction(reducers, 'HIGHLIGHT_VIDEO_ANNOTATIONS', {
    highlighted: toTrueMap(ids),
  });
}

/**
 * Remove annotations from the currently displayed set.
 *
 * @param annotations - Annotations to remove. These may be complete annotations
 *   or stubs which only contain an `id` property.
 */
export function removeVideoAnnotations(annotations: VideoAnnotationStub[]) {
  return (dispatch: Dispatch, getState: () => { videoAnnotations: VideoState }) => {
    const remainingAnnotations = excludeVideoAnnotations(
      getState().videoAnnotations.videoAnnotations,
      annotations
    );
    dispatch(
      makeAction(reducers, 'REMOVE_VIDEO_ANNOTATIONS', {
        annotationsToRemove: annotations,
        remainingAnnotations,
      })
    );
  };
}

/**
 * Update the local hidden state of an annotation.
 *
 * This updates an annotation to reflect the fact that it has been made visible
 * to non-moderators.
 */
function unhideVideoAnnotation(id: string) {
  return makeAction(reducers, 'UNHIDE_VIDEO_ANNOTATION', { id });
}

/**
 * Update the anchoring status of an annotation
 */
function updateVideoAnchorStatus(statusUpdates: AnchorStatusUpdates) {
  return makeAction(reducers, 'UPDATE_ANCHOR_STATUS', { statusUpdates });
}

/**
 * Updating the flagged status of an annotation.
 */
function updateVideoFlagStatus(id: string, isFlagged: boolean) {
  return makeAction(reducers, 'UPDATE_FLAG_STATUS', { id, isFlagged });
}

/* Selectors */

/**
 * Count the number of annotations (as opposed to notes or orphans)
 */
// const annotationCount = createSelector(
//   (state: VideoState) => state.videoAnnotations,
//   annotations => countIf(annotations, metadata.isAnnotation)
// );

function allVideoAnnotations(state: VideoState) {
  return state.videoAnnotations;
}

/**
 * Does the annotation indicated by `id` exist in the collection?
 */
function videoAnnotationExists(state: VideoState, id: string) {
  return state.videoAnnotations.some(annot => annot.id === id);
}

function findVideoAnnotationByID(state: VideoState, id: string) {
  return findByID(state.videoAnnotations, id);
}

/**
 * Return the IDs of annotations that correspond to `tags`.
 *
 * If an annotation does not have an ID because it has not been created on
 * the server, there will be no entry for it in the returned array.
 */
function findVideoIDsForTags(state: VideoState, tags: string[]) {
  const ids = [];
  for (const tag of tags) {
    const annot = findByTag(state.videoAnnotations, tag);
    if (annot && annot.id) {
      ids.push(annot.id);
    }
  }
  return ids;
}

/**
 * Retrieve currently-hovered annotation identifiers
 */
const hoveredVideoAnnotations = createSelector(
  (state: VideoState) => state.hovered,
  hovered => trueKeys(hovered)
);

/**
 * Retrieve currently-highlighted annotation identifiers
 */
const highlightedVideoAnnotations = createSelector(
  (state: VideoState) => state.highlighted,
  highlighted => trueKeys(highlighted)
);

/**
 * Is the annotation identified by `$tag` currently hovered?
 */
function isVideoAnnotationHovered(state: VideoState, $tag: string) {
  return state.hovered[$tag] === true;
}

/**
 * Are there any annotations still waiting to anchor?
 */
// const isWaitingToAnchorAnnotations = createSelector(
//   (state: VideoState) => state.videoAnnotations,
//   annotations => annotations.some(metadata.isWaitingToAnchor)
// );

/**
 * Return all loaded annotations that are not highlights and have not been saved
 * to the server
 */
const newVideoAnnotations = createSelector(
  (state: VideoState) => state.videoAnnotations,
  annotations =>
    annotations.filter(ann => metadata.isNew(ann) && !metadata.isHighlight(ann))
);

/**
 * Return all loaded annotations that are highlights and have not been saved
 * to the server
 */
// const newHighlights = createSelector(
//   (state: VideoState) => state.videoAnnotations,
//   annotations =>
//     annotations.filter(ann => metadata.isNew(ann) && metadata.isHighlight(ann))
// );

// /**
//  * Count the number of page notes currently in the collection
//  */
// const noteCount = createSelector(
//   (state: VideoState) => state.videoAnnotations,
//   annotations => countIf(annotations, metadata.isPageNote)
// );

/**
 * Count the number of annotations (as opposed to notes or orphans)
 */
const videoAnnotationCount = createSelector(
  (state: VideoState) => state.videoAnnotations,
  annotations => countIf(annotations, metadata.isVideoAnnotation)
);

/**
 * Count the number of orphans currently in the collection
 */
// const orphanCount = createSelector(
//   (state: VideoState) => state.videoAnnotations,
//   annotations => countIf(annotations, metadata.isOrphan)
// );

/**
 * Return all loaded annotations which have been saved to the server
 */
function savedVideoAnnotations(state: VideoState): SavedVideoAnnotation[] {
  return state.videoAnnotations.filter(ann => isSaved(ann)) as SavedVideoAnnotation[];
}

export const videoAnnotationsModule = createStoreModule(initialState, {
  namespace: 'videoAnnotations',
  reducers,
  actionCreators: {
    addVideoAnnotations,
    clearVideoAnnotations,
    hoverVideoAnnotations,
    hideVideoAnnotation,
    highlightVideoAnnotations,
    removeVideoAnnotations,
    unhideVideoAnnotation,
    updateVideoAnchorStatus,
    updateVideoFlagStatus,
  },
  selectors: {
    allVideoAnnotations,
    // annotationCount,
    videoAnnotationCount,
    videoAnnotationExists,
    findVideoAnnotationByID,
    findVideoIDsForTags,
    hoveredVideoAnnotations,
    highlightedVideoAnnotations,
    isVideoAnnotationHovered,
    // isWaitingToAnchorAnnotations,
    newVideoAnnotations,
    // newHighlights,
    // noteCount,
    // orphanCount,
    savedVideoAnnotations,
  },
});
