import {
  Button,
  CaretUpIcon,
  ExpandIcon,
  LeaveIcon,
} from '@hypothesis/frontend-shared';
import debounce from 'lodash.debounce';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'preact/hooks';
import classnames from 'classnames';

import { withServices } from '../service-context';
import type { FrameSyncService } from '../services/frame-sync';
import { ListenerCollection } from '../../shared/listener-collection';
import { useSidebarStore } from '../store';
import { getElementHeightWithMargins } from '../util/dom';
import type { RecordStep } from '../../types/api';
import TimelineCard from './TimelineCard';

// The precision of the `scrollPosition` value in pixels; values will be rounded
// down to the nearest multiple of this scale value
const SCROLL_PRECISION = 50;

const THREAD_DIMENSION_DEFAULTS = {
  // When we don't have a real measurement of a thread card's height (yet)
  // from the browser, use this as an approximate value, in pixels.
  defaultHeight: 200,
  // Space above the viewport in pixels which should be considered 'on-screen'
  // when calculating the set of visible threads
  marginAbove: 800,
  // Same as MARGIN_ABOVE but for the space below the viewport
  marginBelow: 800,
};

function calculateFirstVisibleThread(
  threads: RecordStep[],
  threadHeights: Map<string, number>,
  scrollPos: number,
  // windowHeight: number,
): RecordStep | null {
  // Total height used up by the top-level thread cards
  let totalHeight = 0;

  for (let i = 0; i < threads.length; i++) {
    const defaultHeight = THREAD_DIMENSION_DEFAULTS.defaultHeight;
    const threadHeight = threadHeights.get(threads[i].id) || defaultHeight;

    const threadBottomIsInViewport = totalHeight + threadHeight > scrollPos + 5;
    const threadTopIsInViewport = totalHeight >= scrollPos;

    if (threadBottomIsInViewport) {
      return threads[i];
    }
    totalHeight += threadHeight;
  };

  return null;
}

function roundScrollPosition(pos: number) {
  return Math.max(pos - (pos % SCROLL_PRECISION), 0);
}

export type TimelineListProps = {
  onNewPage: (sessionId: string, userid?: string) => void;
  onRefreshStep: (record: string | null, recordStep: string | null) => void;
  onClose: () => void;

  frameSync: FrameSyncService;
};

/**
 * Render a list of traces.
 */
function TimelineList({
  onRefreshStep,
  onClose,
  frameSync,
} : TimelineListProps) {
  const store = useSidebarStore();
  const recordItem = store.getRecordItem();
  const recordSteps = store.recordSteps();
  const focusedStepId = store.getFocusedStepId();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousTopThreadRef = useRef<RecordStep | null>(null);

  // Client height of the scroll container.
  // const [scrollContainerHeight, setScrollContainerHeight] = useState(0);

  // Scroll offset of scroll container, rounded to a multiple of `SCROLL_PRECISION`
  // to avoid excessive re-renderings.
  const [scrollPosition, setScrollPosition] = useState(0);

  // Measure the initial size and offset of the scroll container once rendering
  // is complete and attach listeners to observe future size or scroll offset changes.
  useLayoutEffect(() => {
    const listeners = new ListenerCollection();
    const scrollContainer = scrollRef.current!;

    // setScrollContainerHeight(scrollContainer.clientHeight);
    setScrollPosition(scrollContainer.scrollTop);

    const updateScrollPosition = debounce(
      () => {
        // setScrollContainerHeight(scrollContainer.clientHeight);
        setScrollPosition(scrollContainer.scrollTop);
      },
      10,
      { maxWait: 100 },
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

  // Map of thread ID to measured height of thread. The height of each thread
  // includes any headings displayed immediately above it.
  const [threadHeights, setThreadHeights] = useState(() => new Map());

  // ID of thread to scroll to after the next render. If the thread is not
  // present, the value persists until it can be "consumed".
  const [scrollToId, setScrollToId] = useState<string | null>(null);

  const topLevelThreads = recordSteps;

  const topThread = useMemo(
    () =>
      calculateFirstVisibleThread(
        topLevelThreads,
        threadHeights,
        scrollPosition,
      ),
    [topLevelThreads, threadHeights, scrollPosition],
  );

  const onMouseLeave = () => {
    if (previousTopThreadRef.current !== topThread) {
      onRefreshStep(recordItem?.id || null, topThread?.id || null);
    }
    previousTopThreadRef.current = topThread;
  };

  const onDblClick = (id: string) => {
    frameSync.notifyHost('openImageViewer', {id: id, timeLineList: recordSteps});
  }

  // Effect to scroll a particular thread into view. This is mainly used to
  // scroll a newly created annotation into view.
  useEffect(() => {
    if (!scrollToId || !scrollRef.current) {
      return;
    }

    const threadIndex = topLevelThreads.findIndex(t => t.id === scrollToId);
    if (threadIndex === -1) {
      // Thread is not currently present. The `scrollToId` will be consumed
      // when this thread appears.
      return;
    }

    // Clear `scrollToId` so we don't scroll again after the next render.
    setScrollToId(null);

    const getThreadHeight = (thread: RecordStep) =>
      threadHeights.get(thread.id) || THREAD_DIMENSION_DEFAULTS.defaultHeight;

    const yOffset = topLevelThreads
      .slice(0, threadIndex)
      .reduce((total, thread) => total + getThreadHeight(thread), 0);

    // const scrollContainer = getScrollContainer();
    // scrollContainer.scrollTop = yOffset;
    scrollRef.current.scrollTo({
      top: yOffset,
      behavior: 'smooth',
    });
    store.setFocusedStepId(null);
  }, [scrollToId, topLevelThreads, threadHeights]);

  useEffect(() => {
    if (focusedStepId === null) return;

    const topThreadId = topThread?.id || null;
    if (topThreadId !== focusedStepId) {
      setScrollToId(focusedStepId);
    } else {
      store.setFocusedStepId(null);
    }
  }, [focusedStepId, threadHeights, topThread,])

  const goToTop = () => {
    setScrollToId(recordSteps[0] ? recordSteps[0].id: null);
  };

  // When the set of TimelineCard height changes, recalculate the real rendered
  // heights of thread cards and update `threadHeights` state if there are changes.
  const onRendered = useCallback(
    () => {
      setThreadHeights(prevHeights => {
        const changedHeights = new Map();
        for (const { id } of recordSteps) {
          const threadElement = document.getElementById(id)!;
          const imageElement = document.getElementById('img' + id);

          if (!threadElement) {
            // This could happen if the `ThreadList` DOM is not connected to the document.
            //
            // Errors earlier in the render can also potentially cause this (see
            // https://github.com/hypothesis/client/pull/3665#issuecomment-895857072),
            // although we don't in general try to make all effects robust to that
            // as it is a problem that needs to be handled elsewhere.
            console.warn(
              'ThreadList could not measure thread. Element not found.',
            );
            return prevHeights;
          }

          let imageHeight = 0;
          if (imageElement && imageElement.classList.contains('hidden')) {
            imageHeight = getElementHeightWithMargins(imageElement);
          }

          const height = getElementHeightWithMargins(threadElement) - imageHeight;
          if (height !== prevHeights.get(id)) {
            changedHeights.set(id, height);
          }
        }

        // Skip update if no heights changed from previous measured values
        // (or defaults).
        if (changedHeights.size === 0) {
          return prevHeights;
        }

        return new Map([...prevHeights, ...changedHeights]);
      });
    }, []);

  return (
    <div>
      <header>
        <div className='flex items-center mb-1'>
          <div className='flex-none size-3 bg-blue-700 rounded-full'/>
          {recordItem && (
            <p className='m-2 grow text-xl'>
              {recordItem.taskName}
            </p>
          )}
          <div className='flex-1'/>
          <div className='flex flex-none'>
            {/* <Button
              classes={classnames('flex-none', 'border-black')}
              onClick={() => toggleView()}
            >
              Switch
            </Button> */}
            <Button
              classes={classnames('flex-none', 'border-black')}
              onClick={goToTop}
            >
              <CaretUpIcon />
            </Button>
            <Button
              classes={classnames('flex-none', 'border-black')}
              // onClick={() => onNewPage(recording.sessionId, recording.userid)}
            >
              <ExpandIcon />
            </Button>
            <Button
              classes={classnames('flex-none')}
              onClick={onClose}
            >
              <LeaveIcon />
            </Button>
          </div>
        </div>
      </header>
      <div className="data-comics-height">
        <div
          className={'h-full min-h-full overflow-auto'}
          ref={scrollRef}
          onMouseLeave={onMouseLeave}
        >
          <div>
            {/* <div style={{ height: offscreenUpperHeight }} /> */}
            {recordSteps.map(child => (
              (<div
                className='message-grid'
                id={child.id}
                key={child.id}
                onDblClick={() => onDblClick(child.id)}
              >
                <TimelineCard
                  trace={child}
                  onElementSizeChanged={onRendered}
                />
              </div>
              )
            ))}
            {/* <div style={{ height: offscreenLowerHeight }} /> */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default withServices(TimelineList, ['frameSync',]);
