import type { Annotation } from '../../types/api';
import type { Thread } from './build-thread';

/**
 * Count the number of annotations/replies in the `thread` whose `visible`
 * property matches `visibility`.
 *
 * @param visibility — `true`: count visible annotations
 *                     `false`: count hidden annotations
 */
function countByVisibility(thread: Thread, visibility: boolean): number {
  const matchesVisibility = thread.visible === visibility;
  return thread.children.reduce(
    (count, reply) => count + countByVisibility(reply, visibility),
    matchesVisibility ? 1 : 0
  );
}

/**
 * Count the hidden annotations/replies in the `thread`
 */
export function countHidden(thread: Thread): number {
  return countByVisibility(thread, false);
}

/**
 * Count the visible annotations/replies in the `thread`
 */
export function countVisible(thread: Thread): number {
  return countByVisibility(thread, true);
}

/**
 * Find the topmost annotations in a thread.
 *
 * For the (vast) majority of threads, this is the single annotation at the
 * top level of the thread hierarchy.
 *
 * However, when the top-level thread lacks
 * an annotation, as is the case if that annotation has been deleted but still
 * has replies, find the first level of descendants that has at least one
 * annotation (reply) and return the set of annotations (replies) at that level.
 *
 * For example, given the (overly-complex) thread-annotation structure of:
 *
 * [missing]
 *   - [missing]
 *       - reply 1
 *            - reply 2
 *            - reply 3
 *       - reply 4
 *   - [missing]
 *       - reply 5
 *   - [missing]
 *      - [missing]
 *          - reply 6
 *
 * Return [reply 1, reply 4, reply 5]
 */
export function rootAnnotations(threads: Thread[]): Annotation[] {
  // If there are any threads at this level with extant annotations, return
  // those annotations
  const threadAnnotations = threads
    .filter(thread => !!thread.annotation)
    .map(thread => thread.annotation!);

  if (threadAnnotations.length) {
    return threadAnnotations;
  }

  // Else, search across all children at once (an entire hierarchical level)
  const allChildren: Thread[] = [];
  threads.forEach(thread => {
    if (thread.children) {
      allChildren.push(...thread.children);
    }
  });
  if (allChildren.length) {
    return rootAnnotations(allChildren);
  }

  throw new Error('Thread contains no annotations');
}
