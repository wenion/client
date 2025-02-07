import { IconButton, CancelIcon, CaretLeftIcon, CaretRightIcon } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import type { ComponentChildren, JSX } from 'preact';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef, useState, useLayoutEffect, useMemo } from 'preact/hooks';

import { ListenerCollection } from '../../shared/listener-collection';
import type { EventBus, Emitter } from '../util/emitter';
import type { RecordItem, RecordStep} from '../../types/api';
import {
  getElementHeightWithMargins,
  getElementWidthWithMargins,
} from '../../sidebar/util/dom';
import ArrowIcon from '../../images/icons/dataComicsArrow';
import ClickIcon from '../../images/icons/action-click';
import TypeIcon from '../../images/icons/action-type';
import ScrollUpIcon from '../../images/icons/action-scroll-up';
import SelectionIcon from '../../images/icons/action-selection';
import SelectAreaIcon from '../../images/icons/action-select-area';
import SubmitIcon from '../../images/icons/action-submit';
import ScrollDownIcon from '../../images/icons/action-scroll-down';
import SearchIcon from '../../images/icons/action-search';
import QuestionIcon from '../../images/icons/action-question';
import CopyIcon from '../../images/icons/action-copy';
import PasteIcon from '../../images/icons/action-paste';
import AnnotationIcon from '../../images/icons/action-annotation';


function capitalizeFirstLetter(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

type NavComicsProps = {
  steps: RecordStep[] | null;
  onClick: (step: RecordStep) => void;
};

function NavComics({
  steps,
  onClick,
}: NavComicsProps) {
  if (!steps || steps.length === 0) {
    return (<></>);
  }

  const scollRef = useRef<HTMLDivElement | null>(null);

  const navs = steps.filter(step => step.tagName === "Navigate" || step.tagName === "Switch");

  const onNavClick = (step: RecordStep) => {
    onClick(step);
    const threadIndex = navs.findIndex(t => t.id === step.id);
    if (threadIndex === -1) {
      return;
    }

    const xOffset = navs
      .slice(0, threadIndex)
      .reduce((total, thread) => total + getElementWidthWithMargins(document.getElementById("nav"+ thread.id)!), 0)

    scollRef.current!.scrollTo({
      left: xOffset,
      behavior: 'smooth',
    })
  };

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
  };

  const onArrowClick = (index: number) => {
    // let totallength = 0;
    // for (let i = 0; i < index; i++) {
    //   const nodeElement = document.getElementById(`${id}` + '_' + `${i}`);
    //   if (nodeElement) {
    //     totallength += nodeElement.clientWidth + 30;
    //   }
    //   const arrowElement = document.getElementById(`${id}` + '_' + `${i}` + '_arrow');
    //   if (arrowElement) {
    //     totallength += arrowElement.clientWidth;
    //   }
    // }

    // if (scollRef.current) {
    //   scollRef.current.scrollTo({left: totallength, behavior: 'smooth'});
    //   // onSelectImage(index);
    // }
  }

  if (navs.length === 1) {
    return (<></>);
  }

  return (
    <div className="w-full h-24 comics-nav">
      <div
        className="flex w-full h-full overflow-x-auto bg-white"
        ref={scollRef}
        onWheel={(event) => onWheelEvent(event)}
      >
        {
          navs.map((step, index) => (
            <>
              <div
                id={"nav" + step.id}
                className={classnames(
                  "border-2 border-gray-400",
                  "hover:shadow-lg",
                  "cursor-pointer",
                  "text-blue-chathams",
                  "text-ellipsis",
                  "justify-center content-center",
                  "min-w-32",
                  "overflow-hidden",
                  "px-4 m-2",     // Add padding for better spacing
                )}
                title={step.description ?? step.url}
                onClick={() => onNavClick(step)}
              >
                <b>{capitalizeFirstLetter(step.title)}:</b>{" "}{step.description ?? step.url}
              </div>
              {index !== navs.length - 1 && (
                <div
                  className={classnames(
                    "flex justify-center items-center px-2",
                    "cursor-pointer",
                  )}
                >
                  <ArrowIcon />
                </div>
              )}
            </>
          ))
        }
      </div>
    </div>
  )
}

type ComicItemProps = {
  trace: RecordStep;
  isAlign: boolean;
  onElementSizeChanged: (id: string) => void;
  classes?: string;
};

export function ComicItem({
  trace,
  isAlign = false,
  onElementSizeChanged,
  classes,
}: ComicItemProps) {
  useLayoutEffect(()=> {
    onElementSizeChanged(trace.id);
  }, []);

  return (
    <div
      className={classnames(
        "w-full",
        'grid grid-rows-3 grid-flow-col',
        'justify-self-center content-center',
        'text-lg text-blue-chathams text-center',
        'border border-black mb-0.5',
        'hover:shadow-lg',
        'cursor-pointer',
        classes,
      )}
      title={trace.title}
      // onClick={e => onClick(step.url)}
    >
      <div
        className={classnames(
          "justify-self-center content-center row-span-3",
          "text-black",
          "min-w-10 p-2",
        )}
      >
        {trace.title === "click" ? (
          <ClickIcon />
        ) : trace.title === "type" && trace.tagName !== "SELECT" ? (
          <TypeIcon />
        ) : trace.title === "select" ? (
          <SelectAreaIcon />
        ) : trace.title === "scroll" && trace.description === "down" ? (
          <ScrollDownIcon />
        ) : trace.title === "scroll" && trace.description === "up" ? (
          <ScrollUpIcon />
        ) : trace.title === "submit" ? (
          <SubmitIcon />
        ) : trace.title === "search" ? (
          <SearchIcon />
        ) : trace.title === "type" && trace.tagName === "SELECT" ? (
          <SelectionIcon />
        ) : trace.title === "copy" ? (
          <CopyIcon />
        ) : trace.title === "paste" ? (
          <PasteIcon />
        ) : trace.type === "annotation" ? (
          <AnnotationIcon />
        ) : (
          <QuestionIcon />
        )}
      </div>
      <div className={classnames(
        "col-span-2 border-b border-l border-black",
        "text-lg text-black font-bold content-center",
        "px-4",
      )}>
        {capitalizeFirstLetter(trace.title)}
      </div>
      <div
        className={classnames(
          "flex row-span-2 col-span-2",
          "h-full",
          "pl-1",
          "bg-transparent",
          {"italic": isAlign},
          "cursor-pointer",
        )}
      >
        <div
          className={classnames(
            "text-sm",
            "overflow-hidden",
            "text-ellipsis",
            "content-center",
            "data-comics-content",
            "word-break-word",
            "hyphens-auto",
          )}
          title={trace.description}
        >
          {trace.description}
        </div>
      </div>
    </div>
  )
}


type TextComicsCardProps = {
  step: RecordStep;
  children: ComponentChildren;
  classes?: string;
};

export function TextComicsCard({
  step,
  children,
  classes,
}: TextComicsCardProps) {
  const onClick = (url: string) => {
    window.open(url, '_blank');
  }

  return (
    <div
      className={classnames({'data-comics-item': step.index}, classes)}
      id={step.id}
    >
      <div className={"flex"}>
        {children}
      </div>
    </div>
  )
}

type ThumbnailProps = {
  trace: RecordStep;
  onClickEvent: (id: string) => void;
  onElementSizeChanged: (id: string) => void;
};

function Thumbnail({
  trace,
  onClickEvent,
  onElementSizeChanged
}: ThumbnailProps) {
  const [loaded, setLoaded] = useState(false);
  const [circleTop, setCircleTop] = useState(0);
  const [circleLeft, setCircleLeft] = useState(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  const updateCirclePosition = () => {
    if (!imageRef.current) return;
    const imageHeight = imageRef.current.clientHeight;
    const { width, height, clientX: offsetX, clientY: offsetY } = trace;

    if (width > 0 && height > 0 && offsetX >= 0 && offsetY >= 0) {
      const widthToHeight = width / height;
      const ratioHeight = imageHeight/height;
      const ratioWidth = widthToHeight * imageHeight / width;

      setCircleTop(Math.round(offsetY * ratioHeight - 8));
      setCircleLeft(Math.round(offsetX * ratioWidth - 8));
    }
  };

  const onLoad = () => {
    setLoaded(true);
  };

  useLayoutEffect(() => {
    updateCirclePosition();
    onElementSizeChanged(trace.id);
  }, [loaded]);

  useLayoutEffect(() => {
    const listeners = new ListenerCollection();

    const updatePosition = debounce(
      () => {
        updateCirclePosition();
      },
      10,
      { maxWait: 100 },
    );

    listeners.add(window, 'resize', updatePosition);

    return () => {
      listeners.removeAll();
      updatePosition.cancel();
    };
  }, []);

  // const hover = (hoved: boolean) => {
  //   if (hoved && circleRef.current) {
  //     circleRef.current.classList.add("animate-blink");
  //   }
  //   if (!hoved && circleRef.current) {
  //     circleRef.current.classList.remove("animate-blink");
  //   }
  // }

  return (
    <div
      className={classnames(
        "relative",
        "ml-0.5",
        "cursor-pointer border",
        "hover:shadow-lg",
        "overflow-clip",
      )}
      onClick={() => onClickEvent(trace.id)}
    >
      <img
        ref={imageRef}
        className={classnames(
          'cursor-pointer',
        )}
        id={'img' + trace.id}
        // onMouseEnter={() => hover(true)}
        // onMouseLeave={() => hover(false)}
        alt={trace.title}
        src={trace.image!}
        onLoad={onLoad}
      />
      <div
        ref={circleRef}
        className={classnames(
          "w-6 h-6 rounded-full",
          "absolute border-2 border-red-500 bg-red-100/35 transition-all",
          "duration-300 ease-in-out",
        )}
        style={{ top: `${circleTop}px`, left: `${circleLeft}px` }}
      />
    </div>
  )
}

type ImageComicsCardProps = {
  children: ComponentChildren;
  onImageClick: (id: string) => void;
  onElementSizeChanged: (id: string) => void;
  step: RecordStep;
};

export function ImageComicsCard({
  children,
  onImageClick,
  onElementSizeChanged,
  step,
}: ImageComicsCardProps) {
  const onClick = (url: string) => {
    window.open(url, '_blank');
  }

  return (
    <div
      className={classnames({'data-comics-item': step.index})}
      id={step.id}
    >
      <div className={"flex"}>
        <div
          className={"flex-1"}
        >
          {children}
        </div>
        <Thumbnail
          trace={step}
          onClickEvent={onImageClick}
          onElementSizeChanged={onElementSizeChanged}
        />
      </div>
    </div>
  )
}

type ComicHeaderProps = {
  id: number;
  trace: RecordStep;
  onElementSizeChanged: (id: string) => void;
  classes?: string;
};

export function ComicHeader({
  id,
  trace,
  onElementSizeChanged,
  classes,
}: ComicHeaderProps) {
  useLayoutEffect(()=> {
    onElementSizeChanged(trace.id);
  }, []);

  const onClick = (url: string) => {
    window.open(url, '_blank');
  }

  return (
    <div
      className={classnames(
        "data-comics-item",
        classes,
      )}
      id={trace.id}
    >
      <div
        className={classnames(
          "flex",
          "text-lg text-blue-chathams text-center",
          "border-2 border-gray-400",
          'hover:shadow-lg',
          'cursor-pointer',
          "justify-center items-center",
          'p-2',
        )}
        title={trace.url}
        onClick={() => onClick(trace.url)}
      >
        <div
          className={classnames(
            "flex m-1",
            "rounded-full",
            "bg-zinc-300 text-gray-600",
            "border border-gray-600",
            "w-8 h-8",
            "justify-center items-center",
          )}
        >
          {id}
        </div>
        <div className="flex-1">
          <b>{capitalizeFirstLetter(trace.title)}:</b>{" "} {trace.description??trace.url}
        </div>
      </div>
    </div>
  )
}

export type ComicsViewerModalProps = {
  eventBus: EventBus;
};

/**
 * Create a modal component that hosts (1) the notebook iframe and (2) a button to close the modal.
 */
export default function ComicsViewerModal({
  eventBus,
}: ComicsViewerModalProps) {
  // Temporary solution: while there is no mechanism to sync new annotations in
  // the notebook, we force re-rendering of the iframe on every 'openNotebook'
  // event, so that the new annotations are displayed.
  // https://github.com/hypothesis/client/issues/3182

  const [isHidden, setIsHidden] = useState(true);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [recordSteps, setRecordSteps] = useState<RecordStep[] | null>(null);
  const [topThread, setTopThread] = useState<RecordStep | null>(null);
  const originalDocumentOverflowStyle = useRef('');
  const emitterRef = useRef<Emitter | null>(null);

  const contentElement = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Stores the original overflow CSS property of document.body and reset it
  // when the component is destroyed
  useEffect(() => {
    originalDocumentOverflowStyle.current = document.body.style.overflow;

    return () => {
      document.body.style.overflow = originalDocumentOverflowStyle.current;
    };
  }, []);

  // The overflow CSS property is set to hidden to prevent scrolling of the host page,
  // while the notebook modal is open. It is restored when the modal is closed.
  useEffect(() => {
    if (isHidden) {
      document.body.style.overflow = originalDocumentOverflowStyle.current;
    } else {
      document.body.style.overflow = 'hidden';
    }
  }, [isHidden]);

  useEffect(() => {
    const emitter = eventBus.createEmitter();
    emitter.subscribe(
      'openNewPage',
      (data: {recordItem: RecordItem, recordSteps: RecordStep[], topThread: RecordStep}
    ) => {
      setIsHidden(false);
      // setIframeKey(iframeKey => iframeKey + 1);
      setRecordId(data.recordItem.id);
      setRecordSteps(data.recordSteps);
      setTopThread(data.topThread);
    });
    emitterRef.current = emitter;

    return () => {
      emitter.destroy();
    };
  }, [eventBus]);

  const onClose = () => {
    setIsHidden(true);
    emitterRef.current!.publish('closeNewPage');
  };

  const onRendered = useCallback((id: string) => {

  }, [recordId]);

  // useEffect(() => {
  //   if (!topThread || !recordSteps) {
  //     return;
  //   }
  //   const threadIndex = recordSteps.findIndex(t => t.id === topThread.id);
  //   if (threadIndex === -1) {
  //     // Thread is not currently present. The `scrollToId` will be consumed
  //     // when this thread appears.
  //     return;
  //   }
  //   const yOffset = recordSteps
  //     .slice(0, threadIndex)
  //     .reduce((total, thread) => total + getElementWidthWithMargins(document.getElementById(thread.id)!), 0)

  //   scrollRef.current!.scrollTo({
  //     top: yOffset,
  //     behavior: 'smooth',
  //   })

  // }, [topThread]);


  const contentStyle: Record<string, number> = {};
  contentStyle['height'] = contentHeight;

  let n = 0;
  let navId = 0;

  return (
    <div
      className={classnames(
        'fixed z-max top-0 left-0 right-0 bottom-0 p-3 bg-black/50',
        { hidden: isHidden },
      )}
      data-testid="notebook-outer"
    >
      <div className="relative w-full h-full" data-testid="notebook-inner">
        <div className="absolute right-0 m-3">
          <IconButton
            title="Close the Comics"
            onClick={onClose}
            variant="dark"
            classes={classnames(
              // Remove the dark variant's background color to avoid
              // interfering with modal overlays. Re-activate the dark variant's
              // background color on hover.
              // See https://github.com/hypothesis/client/issues/3676
              '!bg-transparent enabled:hover:!bg-grey-3',
            )}
          >
            <CancelIcon className="w-4 h-4" />
          </IconButton>
        </div>
        {/* <NavComics
          steps={recordSteps}
          onClick={(step) => {console.log("NavComics", step.id)}}
        /> */}
        <div
          ref={contentElement}
          className={'h-full mx-4'}
          // style={contentStyle}
        >
          <div
            className={'h-full overflow-auto bg-white'}
            ref={scrollRef}
            // onMouseLeave={onMouseLeave}
          >
            <div
              className={"mx-2"}
            >
              {/* <div style={{ height: offscreenUpperHeight }} /> */}
              {
                recordSteps && recordSteps.map((step, index) => {
                  if (index !== n) {
                    return;
                  } else {
                    if (step.tagName === "Navigate" || step.tagName === "Switch") {
                      n++;
                      navId++;
                      return (
                        <>
                          {navId !== 1 && (
                            <div
                              className="w-full h-2 bg-transparent"
                            >
                            </div>
                          )}
                          <ComicHeader
                            id ={navId}
                            trace={step}
                            onElementSizeChanged={onRendered}
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
                      return (
                        <ImageComicsCard
                          onImageClick={(id) => {}}
                          onElementSizeChanged={onRendered}
                          step={step}
                        >
                          {recordSteps.slice(index, index + accumulated + 1).map(s =>
                            <ComicItem
                              trace={s}
                              isAlign={s.image ? true: false}
                              onElementSizeChanged={onRendered}
                            />
                          )}
                        </ImageComicsCard>
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
                      return (
                        <TextComicsCard
                          step={step}
                        >
                          {recordSteps.slice(index, index + accumulated + 1).map(s =>
                            <ComicItem
                              trace={s}
                              isAlign={s.image ? true: false}
                              onElementSizeChanged={onRendered}
                              classes='mr-0.5'
                            />
                          )}
                        </TextComicsCard>
                      )
                    }
                  }
                })
              }
              {/* <div style={{ height: offscreenLowerHeight }} /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
