import {
  ArrowUpIcon,
  CancelIcon,
  CautionFilledIcon,
  TrashIcon,
  EditIcon,
  NoteIcon,
  PlusIcon,
  Card,
  CardActions,
  CardHeader,
  CardContent,
  Button,
  Input,
  Textarea,
  Overlay,
} from '@hypothesis/frontend-shared';
import { IconButton, Checkbox } from '@hypothesis/frontend-shared';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useRef} from 'preact/hooks';
import debounce from 'lodash.debounce';
import classnames from 'classnames';

import { ListenerCollection } from '../../shared/listener-collection';
import type { RecordItem, RecordStep } from '../../types/api';
import {
  getElementHeightWithMargins,
} from '../../sidebar/util/dom';
import { withServices } from '../../sidebar/service-context';
import ImageEditor from './ImageEditor';
import type { RecordingService } from '../../sidebar/services/recording';
import type { SessionService } from '../../sidebar/services/session';
import type { ToastMessengerService } from '../../sidebar/services/toast-messenger';
import { useSidebarStore } from '../../sidebar/store';

import { EditPrompt} from './EditPrompt';
import TopBar from './TopBar';

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
import { generateHexString } from '../../shared/random';

function capitalizeFirstLetter(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}


type ComicHeaderProps = {
  index: number;
  trace: RecordStep;
  classes?: string;
};

export function ComicHeader({
  index,
  trace,
  classes,
}: ComicHeaderProps) {
  return (
    <div
      className={classnames(
        classes,
      )}
      id={trace.id}
    >
      <div
        className={classnames(
          "flex",
          "rounded-xl text-lg text-blue-chathams text-center",
          'hover:shadow-lg',
          'cursor-pointer',
          "justify-center items-center",
          'p-2',
        )}
        title={trace.url}
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
          {index}
        </div>
        <div className="flex-1">
          <b>{capitalizeFirstLetter(trace.title)}:</b>{" "} {trace.description??trace.url}
        </div>
      </div>
    </div>
  )
}

type ComicItemProps = {
  index: number;
  sectionId: number;
  trace: RecordStep;
  isAlign: boolean;
  selected: boolean;
  onElementSizeChanged: (id: string) => void;
  onSelect: (id: string, selected: boolean) => void;
  classes?: string;
};

export function ComicItem({
  index,
  sectionId,
  trace,
  isAlign = false,
  selected,
  onElementSizeChanged,
  onSelect,
  classes,
}: ComicItemProps) {
  useLayoutEffect(()=> {
    onElementSizeChanged(trace.id);
  }, []);
  return (
    <div
      className={classnames(
        "relative",
        {'grid grid-rows-3 grid-flow-col': trace.tagName !== "Navigate" && trace.tagName !== "Switch"},
        'content-center rounded-lg',
        {'bg-gray-100': trace.tagName === "Navigate" || trace.tagName === "Switch"},
        'text-base text-blue-chathams text-center',
        'hover:shadow-lg',
        'cursor-pointer',
        classes,
      )}
    >
      <div
        className={classnames(
          "absolute flex",
          "text-black",
          "p-2",
        )}
      >
        <Checkbox
          checked={selected}
          onClick={(e: PointerEvent) => e.stopPropagation()}
          onChange={(e: Event) => {
            onSelect(trace.id, !selected);
          }}
        />
      </div>
      {
        (trace.tagName === "Navigate" || trace.tagName === "Switch") ? (
          <>
            <ComicHeader
              index ={sectionId}
              trace={trace}
              classes='rounded-lg bg-gray-100'
            />
          </>
        ) : (
          <>
            <div
              className={classnames(
                "justify-self-center content-center row-span-3",
                "text-black",
                "w-12 p-1",
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
              "text-base text-black font-bold content-center",
              "p-2",
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
          </>
        )
      }
    </div>
  )
}

type EditingCardSpacingProps = {
  index: number,
  onClick: (id: number) => void;
  hovered: boolean;
  classes?: string;
};

export function EditingCardSpacing({
  index,
  onClick,
  hovered,
  classes,
}: EditingCardSpacingProps) {

  return (
    <div
      id="data-comics-space"
      data-id={index}
      className={classnames(
        "group flex w-full justify-center items-center rounded-lg",
        "hover:border-gray-300 hover:border-2",
        "h-4",
        "cursor-pointer",
        {"ring-2 ring-blue-500 bg-blue-100 ": hovered},
        classes
      )}
      onClick={() => onClick(index)}
    >
      <IconButton
        icon={PlusIcon}
        size="lg"
        title="New"
        classes="text-blue-500 cursor-pointer hidden group-hover:block"
      />
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
  const [circleTop, setCircleTop] = useState<number | null>(null);
  const [circleLeft, setCircleLeft] = useState<number | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  const updateCirclePosition = () => {
    if (!imageRef.current) return;
    const imageHeight = imageRef.current.clientHeight;
    const { width, height, clientX: offsetX, clientY: offsetY } = trace;

    if (width > 0 && height > 0 && offsetX !== null && offsetY !== null) {
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
        onElementSizeChanged(trace.id);
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
        onDblClick={() => {
          onClickEvent(trace.id);
        }}
      />
      {circleTop && circleLeft && (
        <div
          ref={circleRef}
          className={classnames(
            "w-6 h-6 rounded-full",
            "absolute border-2 border-red-500 bg-red-100/35 transition-all",
            "duration-300 ease-in-out",
          )}
          style={{ top: `${circleTop}px`, left: `${circleLeft}px` }}
        />
      )}
    </div>
  )
}


type EditingCardProps = {
  dataId: number,
  sectionId: number,
  trace: RecordStep;
  selected: boolean;
  onElementSizeChanged: (id: string) => void;
  onSelect: (id: string, selected: boolean) => void;
  onDblClick: (id: string) => void;
  onImageDblClick: (id: string) => void;
  classes?: string;
};

export function EditingCard({
  dataId,
  sectionId,
  trace,
  selected,
  onElementSizeChanged,
  onSelect,
  onDblClick,
  onImageDblClick,
  classes,
}: EditingCardProps) {
  useLayoutEffect(()=> {
    onElementSizeChanged(trace.id);
  }, []);

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      draggable
      className={classnames(
        // 'w-full block',
        'data-comics-item',
        'flex',
        // 'border border-black mb-0.5 rounded-lg',
        // 'hover:ring-gray-500 hover:bg-gray-100',
        classes
      )}
      id={trace.id}
      data-id={dataId}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div
        className={classnames(
          'w-full block',
          'h-fit',
          // 'data-comics-item',
          'border border-black mb-0.5 rounded-lg',
          'hover:ring-gray-500 hover:bg-gray-100',
        )}
        onDblClick={() => onDblClick(trace.id)}
      >
        <ComicItem
          index={dataId}
          sectionId={sectionId}
          trace={trace}
          isAlign={trace.image ? true: false}
          selected={selected}
          onElementSizeChanged={()=> {}}
          onSelect={onSelect}
        />
      </div>
      {trace.image && (
        <Thumbnail
          trace={trace}
          onClickEvent={onImageDblClick}
          onElementSizeChanged={() => {}}
        />
      )}
    </div>

  )
};

type EditViewProps = {
  // sessionId: string;
  /** Callback invoked when user clicks "Login" button */
  onLogin: () => void;

  /** Callback invoked when user clicks "Logout" action in account menu */
  onLogout: () => void;

  /** Callback invoked when user clicks "Sign up" button */
  onSignUp: () => void;
  session: SessionService;
  recordingService: RecordingService;
  toastMessenger: ToastMessengerService;
};

/**
 * The root component for the Hypothesis client.
 *
 * This handles login/logout actions and renders the top navigation bar
 * and content appropriate for the current route.
 */
function EditView({
  // sessionId,
  onLogin,
  onLogout,
  onSignUp,
  session,
  recordingService,
  toastMessenger,
}: EditViewProps) {
  const store = useSidebarStore();
  const recordSteps = store.recordSteps();
  const recordItems = store.recordItems();
  const links = store.getLink("index");

  const [id, setId] = useState< null | string>(null);

  useEffect(() => {
    const url = (window.location.href);
    const queryString = url.split('?')[1] || '';
    const params = new URLSearchParams(queryString);
    const paramId = params.get('id') ?? null;
    setId(prev => (prev !== paramId ? paramId : prev));

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";

      if (id) {
        recordingService.saveTraces(id, steps);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [])

  const [recordItem, setRecordItem] = useState<RecordItem | null>(null);

  // const parentRef = useRef<HTMLDivElement | null>(null);

  // const [dragState, setDragState] = useState<string>("End"); // Start Trigger End

  const [steps, setSteps] = useState<RecordStep[]>([]);

  // const prevSourceRef = useRef<number | null>(null);
  // const prevTargetRef = useRef<number | null>(null);
  const [sourceIndex, setSourceIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  const prevSourceRef = useRef(sourceIndex);
  const prevTargetRef = useRef(targetIndex);

  const [step, setStep] = useState<RecordStep | null>(null);
  const [popup, setPopup] = useState(false);
  const [imagePopup, setImagePopup] = useState(false);
  const nameEl = useRef<HTMLInputElement>();
  const descriptionEl = useRef<HTMLTextAreaElement>();
  const descriptionTitleEl = useRef<HTMLInputElement>();

  useEffect(() => {
    if (id) {
      recordingService.getVersionTracesById(id);
    }
  }, [id, links]);

  useEffect(()=> {
    if (recordSteps.length) {
      setSteps(recordSteps);
    }
    if (id) {
      recordingService.getHistoryList(id);
    }
  }, [recordSteps]);

  useEffect(() => {
    if (recordItems.length && recordItem === null) {
      const url = (window.location.href);
      const queryString = url.split('?')[1] || '';
      const params = new URLSearchParams(queryString);
      const paramId = params.get('id') ?? null;
      const id = paramId;

      const item = recordItems.find(r => r.sessionId === id);
      setRecordItem(item??null);
    }
  })

  useEffect(() => {
    if (sourceIndex !== null && targetIndex !== null) {
      if (sourceIndex === targetIndex) {
      } else {
      }
    }
    else if (sourceIndex !== null && targetIndex === null) {
    }
    else if (sourceIndex === null && targetIndex !== null) {
    }
    else {
      const source = prevSourceRef.current!;
      const target = prevTargetRef.current!;
      const selected = steps.splice(source, 1);

      const newSteps = [
        ...steps.slice(0, target),
        ...selected,
        ...steps.slice(target),
      ];
      newSteps.map((ns, index) => ns.index = index);

      setSteps(newSteps);
      if (id) {
        recordingService.autoSaveTraces(id, newSteps);
      }
    }

    prevSourceRef.current = sourceIndex;
    prevTargetRef.current = targetIndex;

  }, [sourceIndex, targetIndex])

  const [selectedList, setSelectedList] = useState<string[]>([]);

  const [imageThreads, setImageThreads] = useState(() => new Map());
  const [threadHeights, setThreadHeights] = useState(() => new Map());

  const exist = useMemo(()=> {
    if (selectedList.length) {
      return true;
    }
    return false;
  }, [selectedList])

  const addSelectedItem = (item: string) => {
    const exist = steps.filter(step => step.id === item);
    if (exist)
      setSelectedList(prev => [...prev, item]);
  };

  // Remove item
  const removeSelectedItem = (item: string) => {
    const exist = steps.filter(step => step.id === item);
    if (exist)
      setSelectedList(prevList => prevList.filter(existingItem => existingItem !== item));
  };

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

      if (threadElement && !threadElement.hasAttribute('data-id')) {
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

  const onSelect = (id: string, selected: boolean) => {
    if (selected) {
      addSelectedItem(id);
    } else {
      removeSelectedItem(id);
    }
  }

  const onDeselect = () => {
    setSelectedList([]);
  }

  const onDelete = () => {
    if (selectedList.length) {
      for (let x = 0; x < selectedList.length; x++) {
        const index = steps.findIndex(step => step.id === selectedList[x]);
        steps.splice(index, 1);
      }
      setSteps(steps);
      if (id) {
        recordingService.autoSaveTraces(id, steps);
      }
      setSelectedList([]);
    }
  }

  const onNote = () => {
    if (id === null) {
      const url = (window.location.href);
      const queryString = url.split('?')[1] || '';
      const params = new URLSearchParams(queryString);
      const paramId = params.get('id') ?? null;
      setId(prev => (prev !== paramId ? paramId : prev));
    }
    setPopup(true);
  };

  const onEdit = async() => {
    if (selectedList.length === 1) {
      const selectedStep = selectedList[0];
      const step = steps.find(item => item.id === selectedStep);
      if (!step) {
        return;
      }
      const form = await EditPrompt({
        title: "Editing - " + step.title,
        trace: step,
        confirmAction: "Done",
      });

      if (form.result) {
        step.title = form.title;
        step.description = form.description;
        step.url = form.url;
        if (form.type) {
          step.type = form.type;
        }
        if (form.tagName) {
          step.tagName = form.tagName;
        }

        const index = step.index;

        const udpate = [
          ...steps.slice(0, index),
          step,
          ...steps.slice(index! + 1),
        ];

        if (id) {
          recordingService.autoSaveTraces(id, udpate);
        }

        // deselect all
        setSelectedList([]);
      }
    }
  }

  const onDblClick = async(id: string) => {
    setSelectedList([id,]);
    setTimeout(()=> {
      onEdit();
    }, 200);
  };

  const onNew = async(index: number) => {
    const step = {
      index: index,
      pk: "",
      id: generateHexString(8),
      type: "",
      title: "",
      description: "",
      timestamp: Date.now(),
      tagName: "",
      width: 0,
      height: 0,
      clientX: 0,
      clientY: 0,
      url: "",
      image: null,
    };
    const regex = /^([a-zA-Z][a-zA-Z\d+\-.]*):\/\/([a-zA-Z\d\-\.]+)\.([a-zA-Z]{2,})(\/[a-zA-Z0-9\-._~:\/?#[\]@!$&'()*+,;%=]*)?$/;
    let form = await EditPrompt({
      title: "Editing - " + step.title,
      trace: step,
      confirmAction: "Done",
    });

    while(
      form.result && ( form.title === "" || !regex.test(form.url))
    ) {
      step.title = form.title;
      step.url = form.url;
      step.description = form.description;
      form = await EditPrompt({
        title: "Editing - " + step.title,
        trace: step,
        confirmAction: "Done",
      });
    }

    if (form.result) {
      step.title = form.title;
      step.description = form.description;
      step.url = form.url;
      step.type = form.type;
      step.index = index;
      if (form.tagName) {
        step.tagName = form.tagName;
      }

      const newIndex = step.index + 1;
      const newSteps = [
        ...steps.slice(0, newIndex),
        {...step, index: newIndex},
        ...steps.slice(newIndex),
      ];
      newSteps.map((ns, index) => ns.index = index);
      setSteps(newSteps);

      if (id) {
        recordingService.autoSaveTraces(id, newSteps);
      }
    }
  }

  const onConfirm = async() => {
    if (recordItem) {
      const description= descriptionEl.current?.value?? '';
      const taskName = nameEl.current?.value?? '';
      const update = await recordingService.syncUpdateRecord(recordItem.id, {
        name: taskName,
        description: description,
      });

      if (descriptionEl.current) {
        descriptionEl.current.value = update.description;
      }

      if (nameEl.current) {
        nameEl.current.value = update.taskName;
      }

      if (descriptionTitleEl.current) {
        descriptionTitleEl.current.value = update.description;
      }
    }
    setPopup(false);
  };

  const onAuto = async() => {
    if (recordItem) {
      const update = await recordingService.syncUpdateRecord(recordItem.id, {
        request_summary: true,
        url: window.location.href
      });
      if (descriptionEl.current) {
        descriptionEl.current.value = update.description;
      }
    }
  };

  const onToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const onDragStart = (e: DragEvent) => {
    const target = e.target;
    if (target instanceof HTMLDivElement && target.classList.contains('data-comics-item')) {
      const selectIndex = target.getAttribute("data-id")
      setSourceIndex(Number(selectIndex!));
    }
  };

  // const onDragOver = (e: DragEvent) => {
  //   e.preventDefault();
  // };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
  };

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const draggableItem = target.closest('[data-id]') as HTMLElement;
    if (draggableItem instanceof HTMLDivElement && draggableItem.classList.contains('data-comics-item')) {
      const currentIndex = Number(draggableItem.getAttribute("data-id")!);
      if (sourceIndex !== null && sourceIndex < currentIndex) {
        setTargetIndex(currentIndex);
        setHighlightIndex(currentIndex);
      }
      else if (sourceIndex !== null && sourceIndex > currentIndex) {
        setTargetIndex(currentIndex);
        setHighlightIndex(currentIndex - 1);
      }
    }
  };

  const onDragEnd = (e: DragEvent) => {
    e.preventDefault();
    setTargetIndex(null);
    setSourceIndex(null);
    setHighlightIndex(null);
  };

  const onSave = (id: string) => {
    recordingService.saveTraces(id, steps);
    toastMessenger.success("Changes have been saved!");
    setTimeout(() => {
      const messages = store.getToastMessages();
      messages.map(message => store.removeToastMessage(message.id));
    }, 1000);
  }

  let navId = 0;

  return (
    <div className="w-full">
      <TopBar
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
        onSave={onSave}
        isSidebar={true}
      />
      {popup && (
        <Overlay classes={"z-40"}>
          <div className="w-xs mb-3">
            <Card>
              <CardHeader title={recordItem?.taskName} onClose={() => setPopup(false)} />
              <CardContent>
                <div className='flex items-center gap-4 px-1 mb-4'>
                  <label htmlFor='input-name' className='font-semibold w-24 shrink-0'>
                    Name
                  </label>
                  <div className='flex-1 sm:w-56 lg:w-96'>
                    <Input
                      elementRef={nameEl}
                      id='input-name'
                      aria-label='Type the title'
                      defaultValue={recordItem?.taskName}
                    />
                  </div>
                </div>
                <div className='flex items-center items-start gap-4 px-1'>
                  <label htmlFor='textarea-name' className='font-semibold w-24 shrink-0 pt-1'>
                    Description
                  </label>
                  <div className='flex-1 sm:w-56 lg:w-96'>
                    <Textarea
                      elementRef={descriptionEl}
                      id='textarea-name'
                      aria-label='Type the title'
                      defaultValue={recordItem?.description}
                      rows={5}
                    />
                  </div>
                  <div className="pt-1">
                    <Button title='Confirm' variant='primary' onClick={onAuto}>
                      AI Suggest
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardActions classes="m-4">
                <Button title="Cancel" onClick={() => setPopup(false)}>
                Cancel
                </Button>
                <Button title="Confirm" variant="primary" onClick={onConfirm}>
                Confirm
                </Button>
              </CardActions>
            </Card>
          </div>
        </Overlay>
      )}
      {imagePopup && step && (
        <Overlay>
          <ImageEditor
            trace={step}
            onSave={(id: string) => {console.log("id", id); setImagePopup(false)}}
            onCancel={(id: string) => {setImagePopup(false)}}
          />
        </Overlay>
      )}
      <div>
        <div
          className={"fixed flex ml-32 mt-4 bg-white border border-black rounded-md"}
        >
          {/* <IconButton
            icon={NoteIcon}
            onClick={onNote}
            size="lg"
            title="Edit Title And Description"
            classes="text-blue-500 cursor-pointer"
          /> */}
          <IconButton
            icon={ArrowUpIcon}
            onClick={onToTop}
            size="lg"
            title="To Top"
            classes="text-blue-500 cursor-pointer"
          />
          {exist && (
            <IconButton
              icon={TrashIcon}
              onClick={onDelete}
              size="lg"
              title="Delete Shareflows"
              classes="text-red-500 cursor-pointer"
            />
          )}
          {exist && (
            <IconButton
              icon={selectedList.length === 1 ? EditIcon : CautionFilledIcon}
              onClick={onEdit}
              size="lg"
              title="Edit Shareflow"
              disabled={selectedList.length !== 1}
              classes="text-blue-500 cursor-pointer"
            />
          )}
          {exist && (
            <IconButton
              icon={CancelIcon}
              onClick={onDeselect}
              size="lg"
              title="Deselect All"
              classes="text-blue-500 cursor-pointer"
            />
          )}
        </div>
        <div
          class="flex w-1/2 justify-self-center items-center m-4"
        >
          <Input
            elementRef={descriptionTitleEl}
            id="description"
            className="bg-transparent"
            disabled
            defaultValue={recordItem?.description}
          />
          <IconButton
            onClick={onNote}
            size="lg"
            title="Change"
            classes="border border-black cursor-pointer ml-4"
          >
            Change
          </IconButton>
        </div>
        <div
          id="data-comics-list"
          className={"mt-4 mx-auto w-1/2 z-10"}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragEnd={onDragEnd}
        >
          {/* <div style={{ height: offscreenUpperHeight }} /> */}
          {
            <>
              {steps.length !== 0 && (
                <EditingCardSpacing
                  index={-1}
                  onClick={onNew}
                  hovered={highlightIndex === -1}
                />
              )}
              {steps.map((step, index) => {
                if (step.tagName === "Navigate" || step.tagName === "Switch") {
                  navId++;
                }
                return (
                  <>
                    <EditingCard
                      dataId={index}
                      sectionId={navId}
                      trace={step}
                      selected={selectedList.some(item => item === step.id)}
                      onSelect={onSelect}
                      onDblClick={onDblClick}
                      onImageDblClick={(id)=> {
                        setImagePopup(true);
                        const s = steps.find(step => step.id === id)??null;
                        setStep(s);
                      }}
                      onElementSizeChanged={() => {}}
                    />
                    <EditingCardSpacing
                      index={index}
                      onClick={onNew}
                      hovered={highlightIndex === index}
                    />
                  </>
                )
              })}
            </>
          }
          {/* <div style={{ height: offscreenLowerHeight }} /> */}
        </div>
      </div>
    </div>
  );
}

export default withServices(EditView, [
  'recordingService',
  'session',
  'toastMessenger',
]);
