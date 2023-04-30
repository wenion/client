import classnames from 'classnames';
import debounce from 'lodash.debounce';
import { useLayoutEffect, useState } from 'preact/hooks';

import { ListenerCollection } from '../../shared/listener-collection';
import type { Thread } from '../helpers/build-thread';
import { useSidebarStore } from '../../sidebar/store';
import ThreadCard from './ThreadCard';

// The precision of the `scrollPosition` value in pixels; values will be rounded
// down to the nearest multiple of this scale value
const SCROLL_PRECISION = 50;

function getScrollContainer() {
  const container = document.querySelector('.js-thread-list-scroll-root');
  if (!container) {
    throw new Error('Scroll container is missing');
  }
  return container;
}

function roundScrollPosition(pos: number) {
  return Math.max(pos - (pos % SCROLL_PRECISION), 0);
}

export type ThreadListProps = {
  threads: Thread[];
};

/**
 * Render a list of threads.
 *
 * The thread list is "virtualized", meaning that only threads in or near the
 * viewport are rendered. This is critical for performance and memory usage as
 * annotations (and replies) are complex interactive components whose
 * user-defined content may include rich media such as images, audio clips,
 * embedded YouTube videos, rendered math and more.
 */
export default function ThreadList({ threads }: ThreadListProps) {
  // Client height of the scroll container.
  const [scrollContainerHeight, setScrollContainerHeight] = useState(0);

  // Scroll offset of scroll container, rounded to a multiple of `SCROLL_PRECISION`
  // to avoid excessive re-renderings.
  const [scrollPosition, setScrollPosition] = useState(0);

  // Measure the initial size and offset of the scroll container once rendering
  // is complete and attach listeners to observe future size or scroll offset changes.
  useLayoutEffect(() => {
    const listeners = new ListenerCollection();
    const scrollContainer = getScrollContainer();

    setScrollContainerHeight(scrollContainer.clientHeight);
    setScrollPosition(roundScrollPosition(scrollContainer.scrollTop));

    const updateScrollPosition = debounce(
      () => {
        setScrollContainerHeight(scrollContainer.clientHeight);
        setScrollPosition(roundScrollPosition(scrollContainer.scrollTop));
      },
      10,
      { maxWait: 100 }
    );

    listeners.add(scrollContainer, 'scroll', updateScrollPosition);

    // We currently assume that the scroll container's size only changes with
    // the window as a whole. A more general approach would involve using
    // ResizeObserver via the `observeElementSize` utility.
    listeners.add(window, 'resize', updateScrollPosition);

    return () => {
      listeners.removeAll();
      updateScrollPosition.cancel();
    };
  }, []);

  const store = useSidebarStore();

  return (
    <div class="flex flex-col" >
      {/* <div style={{ height: offscreenUpperHeight }} /> */}
      {threads.map(child => (
        <a href={child.annotation?.url}>
          <div
            className={classnames(
              // The goal is to space out each annotation card vertically. Typically
              // this is better handled by applying vertical spacing to the parent
              // element (e.g. `space-y-3`) but in this case, the constraints of
              // sibling divs before and after the list of annotation cards prevents
              // this, so a bottom margin is added to each card's wrapping element.
              'mb-8'
            )}
            data-testid="thread-card-container"
            id={child.id}
            key={child.id}
          >
            {/* {headings.get(child) && (
              <h3 className="text-md text-grey-7 font-bold pt-3 pb-2">
                {headings.get(child)}
              </h3>
            )} */}
            <ThreadCard thread={child} />
          </div>
        </a>
      ))}
      {/* <div style={{ height: offscreenLowerHeight }} /> */}
    </div>
  );
}
