import type { QueryResult } from '../../types/api';

export type Thread = {
  /**
   * The thread's id, which equivalent to the id of its annotation. For unsaved
   * annotations, the id is derived from the annotation's local `$tag` property.
   */
  id: string;

  /**
   * This thread's annotation. Undefined in cases when an annotation _should_
   * exist—it's implied by a reference from another annotation—but is not
   * present in our collection of annotations.
   * This can happen when a reply has been deleted, but still has children that
   * exist.
   */
  annotation?: QueryResult;

  /** The id of this thread's parent. Top-level threads do not have parents */
  parent?: string;

  /**
   * Whether this thread should be visible when rendered. true when the thread's
   * annotation matches current annotation filters.
   */
  visible: boolean;

  /**
   * Whether the replies in this thread should be rendered as collapsed
   * (when true) or expanded (when false).
   */
  collapsed: boolean;

  children: Thread[];

  /** Computed count of all replies to a thread */
  replyCount: number;

  /** The thread's depth in the hierarchy */
  depth: number;
};
