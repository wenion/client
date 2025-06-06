import {
  Button,
  CaretUpIcon,
  ExpandIcon,
  LeaveIcon,
  PinFilledIcon,
  PinIcon
} from '@hypothesis/frontend-shared';
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
import type { RecordItem, RecordStep } from '../../types/api';
import {
  getElementHeightWithMargins,
  getElementWidthWithMargins,
} from '../util/dom';
import { ComicHeader, ComicItem, ImageComicCard, TextComicCard} from './ComicCard';
import NavComics from './NavComics';

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
    const threadHeight = threadHeights.get(threads[i].id) || 0;

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
    const threadHeight = threadHeights.get(threads[j].id) || 0;
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
  onOpen: (recordItem: RecordItem, recordSteps: RecordStep[], top: RecordStep) => void;
  onClose: (id: string) => void;
  onPin: (recordItem: RecordItem, value: boolean) => void;
  onRefreshStep: (record: string | null, recordStep: string | null) => void;

  frameSync: FrameSyncService;
};

/**
 * Create the iframe that will load the notebook application.
 */
function ComicList({
  onOpen,
  onClose,
  onPin,
  onRefreshStep,
  frameSync,
}: ComicListProps) {
  const store = useSidebarStore();
  const recordItem = store.getRecordItem();
  const recordSteps = store.recordSteps();
  const focusedStepId = store.getFocusedStepId();
  const shouldScroll = store.getShouldScroll();
  const activePanelName = store.activePanelName();

  const focusedShareflow = store.getDefault('focusedShareflow');
  const isPin = !(focusedShareflow === 'null' || !focusedShareflow);

  const headerElement = useRef<HTMLDivElement | null>(null);
  const contentElement = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const previousTopThreadRef = useRef<RecordStep | null>(null);

  const [sectionId, setSectionId] = useState(0);
  const [firstRender, setFirstRender] = useState(true);

  const [imageThreads, setImageThreads] = useState(() => new Map());

  // Client height of the scroll container.
  const [scrollContainerHeight, setScrollContainerHeight] = useState(0);

  // Scroll offset of scroll container, rounded to a multiple of `SCROLL_PRECISION`
  // to avoid excessive re-renderings.
  const [scrollPosition, setScrollPosition] = useState(0);

  const updateContentSize = () => {
    let offset = 110;
    const headerHeight = getElementHeightWithMargins(headerElement.current!);

    let sidebarPanelHeight = 0;
    const sidebarPanel = document.querySelector('[data-component="Dialog"][tabindex="-1"]');
    if (sidebarPanel) {
      sidebarPanelHeight = getElementHeightWithMargins(sidebarPanel);
    }

    const navComics = document.querySelector('.comics-nav');
    if (navComics) {
      offset = offset + getElementHeightWithMargins(navComics);
    }

    setContentHeight(window.innerHeight - sidebarPanelHeight - headerHeight - offset);
  };

  useLayoutEffect(() => {
    updateContentSize();
  }, [activePanelName, navRef.current, scrollContainerHeight]);

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
    [topLevelThreads, threadHeights, scrollPosition, scrollContainerHeight],
  );

  const allLoaded = useMemo(
    () => {
      let load = true;
      const threads = topLevelThreads.filter(item => item.image);
      if (threads.length > 0 && imageThreads.size === 0) {
        setImageThreads(new Map(threads.map(item => [item.id, false])));
        return false;
      }

      imageThreads.forEach((value) => {
        load = load && value; // Check if all values are truthy
      });
      return load;
    },
    [imageThreads, topLevelThreads]
  );

  const onMouseLeave = () => {
    if (previousTopThreadRef.current !== topThread) {
      onRefreshStep(recordItem?.id || null, topThread?.id || null);
    }
    previousTopThreadRef.current = topThread;
  }

  const onComicClick = (id: string) => {
    store.setNavFocusedStepId(id);
  }

  const onDblClick = (id: string) => {
    frameSync.notifyHost('openImageViewer', {id: id, timeLineList: recordSteps});
  }

  const getComicsNavElementHeightById = (id: number): number => {
    const ele =
      document.querySelector(`[class="data-comics-nav"][data-id="${id}"]`) as HTMLDivElement | null;
    return ele ? getElementHeightWithMargins(ele) : 0;
  }

  const onNavClick = (step: RecordStep, sectionId?: number) => {
    setScrollToId(step.id);
    if (sectionId) {
      setSectionId(sectionId);
    }
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

    const getThreadHeight = (thread: RecordStep) => threadHeights.get(thread.id) ?? 0;

    let yOffset = topLevelThreads
      .slice(0, threadIndex)
      .reduce((total, thread) => total + getThreadHeight(thread), 0);

    for (let i = 0; i < sectionId; i++) {
      yOffset += getComicsNavElementHeightById(i);
    }

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

    if (firstRender) {
      // if (topThreadId !== focusedStepId) {
      //   if (!allLoaded) {
      //     setScrollToId(focusedStepId);
      //   }
      // } else {
        if (allLoaded) {
          setFirstRender(false);
        }
      // }
      return;
    }
    const topThreadId = topThread?.id || null;

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

  const onLoaded = (id: string, value:boolean) => {
    setImageThreads(prevThreads => {
      const changedThreads = new Map();
      if (prevThreads.has(id)) {
        changedThreads.set(id, value);
      }
      return new Map([...prevThreads, ...changedThreads]);
    });
  };

  // When the set of TimelineCard height changes, recalculate the real rendered
  // heights of thread cards and update `threadHeights` state if there are changes.
  const onRendered = useCallback((id: string) => {
    const threadElements = Array.from(document.querySelectorAll(`[id="${id}"]`));

    setThreadHeights(prevHeights => {
      const changedHeights = new Map();

      if (threadElements.length === 0) {
        return prevHeights;
      }

      let height = 0;
      threadElements.forEach(threadElement => {
        height += getElementHeightWithMargins(threadElement);
      });

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

    updateContentSize();
  }, []);

  const contentStyle: Record<string, number> = {};
  contentStyle['height'] = contentHeight;

  // The index of steps should be addressed
  let n = 0;
  let navId = 0;
  let dataId = 0;

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
              onClick={() => {
                isPin? onPin(recordItem!, false): onPin(recordItem!, true)
              }}
            >
              {isPin? (<PinFilledIcon className={classnames("text-brand")} />): (<PinIcon />)}
            </Button>
            <Button
              classes={classnames('flex-none', 'border-black')}
              onClick={() => onOpen(recordItem!, recordSteps, topThread!)}
            >
              <ExpandIcon />
            </Button>
            <Button
              classes={classnames('flex-none')}
              onClick={() => onClose(recordItem!.id)}
            >
              <LeaveIcon />
            </Button>
          </div>
        </div>
        <div
          className={'text-sm pl-2'}
        >
          {recordItem?.description}
        </div>
      </header>
      {recordItem && (
        <NavComics
          recordItem={recordItem}
          steps={recordSteps}
          onClick={onNavClick}
        />
      )}
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
            {recordItem && recordItem.extra?.sections && (
              recordItem.extra?.sections.map((item, index) => {
                let n = 0;
                let navId = 0;
                let dataId = 0;
                return (
                  <>
                    <div
                      className={classnames("data-comics-nav")}
                      data-id={index}
                      id={item.steps_id[0]}
                      onClick={() => onComicClick(item.steps_id[0])}
                      title={item.title}
                    >
                      <div
                        className={classnames(
                          "flex flex-row",
                          "bg-gray-100 rounded-xl text-lg text-blue-chathams text-center",
                          "border-2 border-gray-400",
                          'hover:shadow-lg',
                          'cursor-pointer',
                          "justify-center items-center",
                          'p-2',
                        )}
                        title={item.description}
                      >
                        <b>{item.title}</b>
                      </div>
                    </div>
                    {item.steps_id.map((stepId, index) => {
                      const step = store.getRecordStepById(stepId);
                      if (!step) {
                        return (<></>)
                      }
                      if (index !== n) {
                        return;
                      } else {
                        if (step.tagName === "Navigate" || step.tagName === "Switch") {
                          n++;
                          navId++;
                          dataId++;
                          return (
                            <ComicHeader
                              dataId={dataId}
                              trace={step}
                              onElementSizeChanged={onRendered}
                              onClick={onComicClick}
                              classes={classnames({ "data-comics-nav": navId !== 1 })}
                            />
                          )
                        } else if (step.image) {
                          let start = n;
                          let accumulated = 1;
                          const subSteps = item.steps_id.map(stepId=>
                            store.getRecordStepById(stepId)
                          );
                          // get the next step of this section
                          let nextIndex = n + 1;
                          let nextStep = subSteps[nextIndex];
                          while (
                            nextStep &&
                            nextStep.image === null &&
                            nextStep.tagName !== 'Navigate' &&
                            nextStep.tagName !== 'Switch' &&
                            accumulated < 3
                          ) {
                            accumulated++;
                            nextIndex++;
                            nextStep = subSteps[nextIndex];
                          }
                          n = n + accumulated;
                          dataId++;
                          return (
                            <ImageComicCard
                              onImageClick={(id) => onDblClick(id)}
                              onElementSizeChanged={onRendered}
                              onLoaded={onLoaded}
                              onClick={onComicClick}
                              step={step}
                              dataId={dataId}
                            >
                              {subSteps.slice(start, start + accumulated).map(s =>
                                s ? (
                                  <ComicItem
                                    trace={s}
                                    isAlign={s.image ? true: false}
                                    onElementSizeChanged={onRendered}
                                  />
                                ) : (<></>)
                              )}
                            </ImageComicCard>
                          )
                        } else {
                          let start = n;
                          let accumulated = 1;
                          const subSteps = item.steps_id.map(stepId=>
                            store.getRecordStepById(stepId)
                          );
                          let nextIndex = n + 1;
                          let nextStep = subSteps[nextIndex];
                          while (
                            nextStep &&
                            nextStep.image === null &&
                            nextStep.tagName !== "Navigate" &&
                            nextStep.tagName !== "Switch" &&
                            accumulated < 3
                          ) {
                            accumulated++;
                            nextIndex++;
                            nextStep = subSteps[nextIndex];
                          }
                          n = n + accumulated;
                          dataId++;
                          return (
                            <TextComicCard
                              step={step}
                              dataId={dataId}
                              onClick={onComicClick}
                            >
                              {subSteps.slice(start, start + accumulated).map(s =>
                                s ? (
                                  <ComicItem
                                    trace={s}
                                    isAlign={s.image ? true: false}
                                    onElementSizeChanged={onRendered}
                                    classes='mr-0.5'
                                  />
                                ) : (<></>)
                              )}
                            </TextComicCard>
                          )
                        }
                      }
                    })}
                  </>
                )
              })
            )}
            {recordItem && recordItem.extra && Object.keys(recordItem.extra).length === 0 && (
              recordSteps.map((step, index) => {
                if (index !== n) {
                  return;
                } else {
                  if (step.tagName === "Navigate" || step.tagName === "Switch") {
                    n++;
                    navId++;
                    dataId++;
                    return (
                      <>
                        {/* {navId !== 1 && (
                          <div
                            className="w-full h-2 bg-transparent"
                          >
                          </div>
                        )} */}
                        <ComicHeader
                          id ={navId}
                          dataId={dataId}
                          trace={step}
                          onElementSizeChanged={onRendered}
                          onClick={onComicClick}
                          classes={classnames({ "data-comics-nav": navId !== 1 })}
                        />
                      </>
                    )
                  } else if (step.image) {
                    let accumulated = 0;
                    let i = index + 1;
                    let current = recordSteps[i];
                    while (
                      current &&
                      current.image === null &&
                      current.tagName !== "Navigate" &&
                      current.tagName !== "Switch" &&
                      accumulated < 2 // TODO decide by media screen size
                    ) {
                      // calculate the number of the following step which is without the image
                      accumulated++;
                      i = i + 1;
                      current = recordSteps[i];
                    }
                    n = n + accumulated + 1;
                    dataId++;
                    return (
                      <ImageComicCard
                        onImageClick={(id) => onDblClick(id)}
                        onLoaded={onLoaded}
                        onElementSizeChanged={onRendered}
                        onClick={onComicClick}
                        step={step}
                        dataId={dataId}
                      >
                        {recordSteps.slice(index, index + accumulated + 1).map(s =>
                          <ComicItem
                            trace={s}
                            isAlign={s.image ? true: false}
                            onElementSizeChanged={onRendered}
                          />
                        )}
                      </ImageComicCard>
                    )
                  } else {
                    let accumulated = 0;
                    let i = index + 1;
                    let current = recordSteps[i];
                    while (
                      current &&
                      current.image === null &&
                      current.tagName !== "Navigate" &&
                      current.tagName !== "Switch" &&
                      accumulated < 1
                    ) {
                      accumulated++;
                      i = i + 1;
                      current = recordSteps[i];
                    }
                    n = n + accumulated + 1;
                    dataId++;
                    return (
                      <TextComicCard
                        step={step}
                        dataId={dataId}
                        onClick={onComicClick}
                      >
                        {recordSteps.slice(index, index + accumulated + 1).map(s =>
                          <ComicItem
                            trace={s}
                            isAlign={s.image ? true: false}
                            onElementSizeChanged={onRendered}
                            classes='mr-0.5'
                          />
                        )}
                      </TextComicCard>
                    )
                  }
                }
              })
            )}
            {/* <div style={{ height: offscreenLowerHeight }} /> */}
          </div>
        </div>
      </div>
    </>
  );
}

export default withServices(ComicList, ['frameSync']);
