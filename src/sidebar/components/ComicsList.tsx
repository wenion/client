import { CaretUpIcon, ExpandIcon, LeaveIcon, Button } from '@hypothesis/frontend-shared';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useMemo,
  useRef
} from 'preact/hooks';
import debounce from 'lodash.debounce';
import classnames from 'classnames';

import { withServices } from '../service-context';
import type { FrameSyncService } from '../services/frame-sync';
import { ListenerCollection } from '../../shared/listener-collection';
import { useSidebarStore } from '../store';
import type { kmProcess, RecordStep } from '../../types/api';
import { getElementHeightWithMargins } from '../util/dom';
import ComicsCard from './ComicsCard';
import ArrowIcon from '../../images/icons/dataComicsArrow';


function SiteMap({id, process, onSelectImage}: {id: string; process: kmProcess[], onSelectImage: (id: number) => void;}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const scollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.style.width = '80px';
      imageRef.current.style.height = '80px';
    }
  }, [])

  const onImageClick = (id: number) => {
    onSelectImage(id);
  }

  const truncateStringAtWhitespace = (str:string, charLimit:number) => {
    if (str.length <= charLimit) {
      return str;
    }

    // Slice the string to get the first `charLimit` characters
    let truncatedStr = str.slice(0, charLimit);

    // Find the position of the last whitespace character within the truncated string
    let lastWhitespaceIndex = truncatedStr.lastIndexOf(' ');

    // If there is a whitespace character, trim the string at that position
    if (lastWhitespaceIndex !== -1) {
      truncatedStr = truncatedStr.slice(0, lastWhitespaceIndex);
    }

    if (!/[a-zA-Z0-9]$/.test(truncatedStr)) {
      truncatedStr = truncatedStr.slice(0, -1);
    }

    return truncatedStr + '...';
  }

  const onWheelEvent = (e: WheelEvent) => {
    e.preventDefault();
    if (scollRef.current) {
      if (e.deltaY > 1) {
        scollRef.current.scrollLeft += 50;
        return;
      }
      else if (e.deltaY < -1) {
        scollRef.current.scrollLeft -= 50;
        return;
      }

      scollRef.current.scrollLeft += e.deltaX;
    }
  }

  const onArrowClick = (index: number) => {
    let totallength = 0;
    for (let i = 0; i < index; i++) {
      const nodeElement = document.getElementById(`${id}` + '_' + `${i}`);
      if (nodeElement) {
        totallength += nodeElement.clientWidth + 30;
      }
      const arrowElement = document.getElementById(`${id}` + '_' + `${i}` + '_arrow');
      if (arrowElement) {
        totallength += arrowElement.clientWidth;
      }
    }

    if (scollRef.current) {
      scollRef.current.scrollTo({left: totallength, behavior: 'smooth'});
      onSelectImage(index);
    }
  }

  return (
    <>
      <div className="text-xl font-bold text-blue-chathams m-2" >Process Overview</div>
      <div
        className='flex h-fit m-2 overflow-y-auto'
        id={id}
        ref={scollRef}
        onWheel={(event) => onWheelEvent(event)}
      >
        <div className='flex min-w-max justify-center'>
        {process.map((p, index) => (
          <>
            {index !== 0 &&
              <div
                className='max-w-16 mx-1 cursor-pointer'
                id={id + '_' + index + '_arrow'}
                onClick={() => onArrowClick(index)}
              >
                <ArrowIcon />
              </div>
            }
            <div className='grid grid-cols-1'>
              <div
                className={classnames(
                  'place-self-center border border-gray-300 hover:border-2 hover:border-gray-500',
                  'flex justify-center items-center text-nowrap',
                  'text-blue-chathams relative cursor-pointer max-w-32',
                  {
                    'p-4': p.name.toLowerCase() !== 'match',
                    'px-0': p.name.toLowerCase() === 'match',
                    'py-4': p.name.toLowerCase() === 'match',
                  }
                )}
                id={id + '_' + index}
                onClick={() => onImageClick(index)}
              >
                {p.name.toLowerCase() === 'match' ? (<b>&nbsp;</b>) : (<b>{p.name}</b>)}
              </div>
              <div className='flex text-xs text-center max-w-32 pt-2'>{truncateStringAtWhitespace(p.title, 40)}</div>
            </div>
          </>
          )
        )}
        </div>
      </div>
    </>
  )
}


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

type DifferentThreads= {
  unreachableThreads: RecordStep[];
  topThread: RecordStep | null;
  reverseTopThread: RecordStep | null;
};

function calculateFirstVisibleThread(
  threads: RecordStep[],
  threadHeights: Map<string, number>,
  scrollPos: number,
  windowHeight: number,
): DifferentThreads {
  let topThread = null;
  let reverseTopThread = null;

  let unreachableThreads = [];
  // Total height used up by the top-level thread cards
  let totalHeight = 0;

  for (let i = 0; i < threads.length; i++) {
    const defaultHeight = THREAD_DIMENSION_DEFAULTS.defaultHeight;
    const threadHeight = threadHeights.get(threads[i].id) || defaultHeight;

    const threadBottomIsInViewport = totalHeight + threadHeight > scrollPos + 5;
    const threadTopIsInViewport = totalHeight >= scrollPos;

    if (threadBottomIsInViewport) {
      topThread = threads[i];
      break;
    }
    totalHeight += threadHeight;
  };

  let rearTotalHeight = 0;
  for (let j = threads.length - 1; j >= 0; j--) {
    const defaultHeight = THREAD_DIMENSION_DEFAULTS.defaultHeight;
    const threadHeight = threadHeights.get(threads[j].id) || defaultHeight;
    rearTotalHeight += threadHeight;

    if (rearTotalHeight >= windowHeight) {
      reverseTopThread = threads[j];
      break;
    }
    else {
      unreachableThreads.push(threads[j]);
    }
  }

  return {
    unreachableThreads,
    topThread,
    reverseTopThread,
  };
}

export type ComicListProps = {
  onClose: () => void;
  onRefreshStep: (record: string | null, recordStep: string | null) => void;

  frameSync: FrameSyncService;
};

/**
 * Create the iframe that will load the notebook application.
 */
function ComicsList({
  onClose,
  onRefreshStep,
  frameSync,
}: ComicListProps) {
  const store = useSidebarStore();
  const recordItem = store.getRecordItem();
  const recordSteps = store.recordSteps();
  const focusedStepId = store.getFocusedStepId();
  const shouldScroll = store.getShouldScroll();
  const activePanelName = store.activePanelName();

  const headerElement = useRef<HTMLDivElement | null>(null);
  const contentElement = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousTopThreadRef = useRef<RecordStep | null>(null);

  const [firstRender, setFirstRender] = useState(true);

  const [imageThreads, setImageThreads] = useState(() => new Map());

  // Client height of the scroll container.
  const [scrollContainerHeight, setScrollContainerHeight] = useState(0);

  // Scroll offset of scroll container, rounded to a multiple of `SCROLL_PRECISION`
  // to avoid excessive re-renderings.
  const [scrollPosition, setScrollPosition] = useState(0);

  // Measure the initial size and offset of the scroll container once rendering
  // is complete and attach listeners to observe future size or scroll offset changes.
  useLayoutEffect(() => {
    const listeners = new ListenerCollection();
    const scrollContainer = scrollRef.current!;

    setScrollContainerHeight(scrollContainer.clientHeight);
    setScrollPosition(scrollContainer.scrollTop);

    const updateScrollPosition = debounce(
      () => {
        setScrollContainerHeight(scrollContainer.clientHeight);
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

  const {unreachableThreads, topThread, reverseTopThread} = useMemo(
    () =>
      calculateFirstVisibleThread(
        topLevelThreads,
        threadHeights,
        scrollPosition,
        scrollContainerHeight,
      ),
    [topLevelThreads, threadHeights, scrollPosition],
  );

  const allLoaded = useMemo(
    () => {
      let load = true;
      imageThreads.forEach((value) => {
        load = load && value; // Check if all values are truthy
      });
      return load;
    },
    [imageThreads]
  );

  const onMouseLeave = () => {
    if (previousTopThreadRef.current !== topThread) {
      onRefreshStep(recordItem?.id || null, topThread?.id || null);
    }
    previousTopThreadRef.current = topThread;
  }

  const onDblClick = (id: string) => {
    frameSync.notifyHost('openImageViewer', {id: id, timeLineList: recordSteps});
  }

  // Effect to scroll a particular thread into view. This is mainly used to
  // scroll a newly created annotation into view.
  useEffect(() => {
    if (!scrollToId) {
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

    scrollRef.current!.scrollTo({
      top: yOffset,
      behavior: 'smooth',
    });
  }, [scrollToId, threadHeights, topThread]);

  useEffect(() => {
    if (focusedStepId === null) {
      setScrollToId(null);
      return;
    }

    const topThreadId = topThread?.id || null;
    if (firstRender) {
      if (topThreadId !== focusedStepId && !allLoaded) {
        if (!allLoaded) {
          setScrollToId(focusedStepId);
        }
      } else {
        if (allLoaded) {
          setFirstRender(false);
        }
      }
      return;
    }

    if (topThreadId !== focusedStepId) {
      if (unreachableThreads.some(r => r.id === focusedStepId)) {
        if (reverseTopThread) {
          store.setFocusedStepId(reverseTopThread.id);
          setScrollToId(reverseTopThread.id);
        } else {
          store.setFocusedStepId(null);
        }
      }
      else {
        if (shouldScroll) {
          setScrollToId(focusedStepId);
        }
      }
    } else {
      store.setShouldScroll(false);
    }
  }, [focusedStepId, threadHeights, topThread, shouldScroll, firstRender, allLoaded])

  // When the set of TimelineCard height changes, recalculate the real rendered
  // heights of thread cards and update `threadHeights` state if there are changes.
  const onRendered = useCallback((id: string) => {
    const imageId = 'img' + id;
    const threadElement = document.getElementById(id)!;
    const imageElement = document.getElementById(imageId);

    setThreadHeights(prevHeights => {
      const changedHeights = new Map();

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
      // if (imageElement && imageElement.classList.contains('hidden')) {
      //   imageHeight = getElementHeightWithMargins(imageElement);
      // }

      const height = getElementHeightWithMargins(threadElement) - imageHeight;
      if (height !== prevHeights.get(id)) {
        changedHeights.set(id, height);
      }

    // Skip update if no heights changed from previous measured values
    // (or defaults).
    if (changedHeights.size === 0) {
      return prevHeights;
    }

    return new Map([...prevHeights, ...changedHeights]);
  });

  setImageThreads(prevThreads => {
    const changedThreads = new Map();
    if (imageElement) {
      if (prevThreads.has(imageId)) {
        changedThreads.set(imageId, true);
      } else {
        changedThreads.set(imageId, false);
      }
    }
    return new Map([...prevThreads, ...changedThreads]);
  });
  }, []);

  const contentStyle: Record<string, number> = {};
  contentStyle['height'] = contentHeight;

  useLayoutEffect(() => {
    const offset = 110;
    const headerHeight = getElementHeightWithMargins(headerElement.current!);

    let sidebarPanelHeight = 0;
    const sidebarPanel = document.querySelector('[data-component="Dialog"][tabindex="-1"]');
    if (sidebarPanel) {
      sidebarPanelHeight = getElementHeightWithMargins(sidebarPanel);
    }
    setContentHeight(window.innerHeight - sidebarPanelHeight - headerHeight - offset);
  }, [activePanelName]);

  return (
    <>
      <header
        ref={headerElement}
      >
        <div className='flex items-center mb-1'>
          <div className='flex-none size-3 bg-blue-700 rounded-full'/>
          {recordItem && (
            <p
              className="m-2 grow text-xl truncate"
              title={recordItem.taskName}
            >
              {recordItem.taskName}
            </p>
          )}
          <div className='flex-1'/>
          <div className='flex flex-none'>
            <Button
              classes={classnames('flex-none', 'border-black')}
              // onClick={goToTop}
            >
              <CaretUpIcon />
            </Button>
            <Button
              classes={classnames('flex-none', 'border-black')}
              // onClick={() => onFullPage(recordItem!.id, recordItem!.userid)}
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
      <div
        ref={contentElement}
        style={contentStyle}
      >
        <div
          className={'h-full overflow-auto bg-white'}
          ref={scrollRef}
          onMouseLeave={onMouseLeave}
        >
          <div
            className={"mx-2"}
          >
            {/* <div style={{ height: offscreenUpperHeight }} /> */}
            {recordSteps.map(child => (
              <ComicsCard
                onImageClick={(id) => onDblClick(id)}
                onElementSizeChanged={onRendered}
                step={child}
              />
            ))}
            {/* <div style={{ height: offscreenLowerHeight }} /> */}
          </div>
        </div>
      </div>
    </>
  );
}

export default withServices(ComicsList, ['frameSync']);
