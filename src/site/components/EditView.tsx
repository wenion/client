import { ArrowUpIcon, IconButton, TrashIcon, EditIcon, CancelIcon, PlusIcon, Checkbox } from '@hypothesis/frontend-shared';
import type { ComponentChildren, JSX } from 'preact';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useRef, Ref} from 'preact/hooks';
import classnames from 'classnames';

import type { RecordStep } from '../../types/api';
import {
  getElementHeightWithMargins,
} from '../../sidebar/util/dom';
import { withServices } from '../../sidebar/service-context';
import type { RecordingService } from '../../sidebar/services/recording';
import type { SessionService } from '../../sidebar/services/session';
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


type ComicItemProps = {
  trace: RecordStep;
  isAlign: boolean;
  selected: boolean;
  onElementSizeChanged: (id: string) => void;
  onSelect: (id: string, selected: boolean) => void;
  classes?: string;
};

export function ComicItem({
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
        'grid grid-rows-3 grid-flow-col',
        'content-center',
        'text-base text-blue-chathams text-center',
        'hover:shadow-lg',
        'cursor-pointer',
        classes,
      )}
    >
      <div
        className={classnames(
          "absolute",
          "text-black",
          "p-2",
        )}
      >
        <Checkbox
          checked={selected}
          onChange={(e: Event) => {
            onSelect(trace.id, (e.target! as HTMLInputElement).checked);
          }}
        />
      </div>
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
    </div>
  )
}

type EditingCardProps = {
  dataId: number,
  trace: RecordStep;
  selected: boolean;
  onElementSizeChanged: (id: string) => void;
  onSelect: (id: string, selected: boolean) => void;
  classes?: string;
};

export function EditingCard({
  dataId,
  trace,
  selected,
  onElementSizeChanged,
  onSelect,
  classes,
}: EditingCardProps) {
  useLayoutEffect(()=> {
    onElementSizeChanged(trace.id);
  }, []);

  return (
    <div
      draggable
      className={classnames(
        'w-full block',
        'data-comics-item',
        'border border-black mb-0.5 rounded-lg',
        'hover:ring-gray-500 hover:bg-gray-100',
      )}
      id={trace.id}
      data-id={dataId}
    >
      <ComicItem
        trace={trace}
        isAlign={trace.image ? true: false}
        selected={selected}
        onElementSizeChanged={()=> {}}
        onSelect={onSelect}
      />
      {/* {trace.image && (
        <div
          className={"p-4"}
        >
          <img
            src={trace.image}
            className={"border shadow-2xl"}
          />
        </div>
      )} */}
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
  id?: string;
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
  id,
}: EditViewProps) {
  const store = useSidebarStore();
  const recordSteps = store.recordSteps();
  const links = store.getLink("index");

  // const parentRef = useRef<HTMLDivElement | null>(null);

  // const [dragState, setDragState] = useState<string>("End"); // Start Trigger End

  const [steps, setSteps] = useState<RecordStep[]>(recordSteps);

  // const prevSourceRef = useRef<number | null>(null);
  // const prevTargetRef = useRef<number | null>(null);
  const [sourceIndex, setSourceIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  const prevSourceRef = useRef(sourceIndex);
  const prevTargetRef = useRef(targetIndex);

  useEffect(() => {
    recordingService.getTracesById(id!);
  }, [id, links]);

  useEffect(()=> {
    if (recordSteps.length) {
      setSteps(recordSteps);
    }
  }, [recordSteps])

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
      setSelectedList([]);
    }
  }

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

        const index = step.index;

        setSteps([
          ...steps.slice(0, index),
          step,
          ...steps.slice(index! + 1),
        ]);
      }
    }
  }

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

      const newIndex = step.index + 1;
      const newSteps = [
        ...steps.slice(0, newIndex),
        {...step, index: newIndex},
        ...steps.slice(newIndex),
      ];
      newSteps.map((ns, index) => ns.index = index);
      setSteps(newSteps);
    }
  }

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
    store.clearRecordSteps();
    store.addRecordSteps(steps);
    recordingService.saveTraces(id);
    window.alert("Changes have been saved!");
  }

  return (
    <div className="w-full">
      <TopBar
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
        onSave={onSave}
        isSidebar={true}
      />
      <div
        className={"fixed flex ml-32 mt-4 border border-black rounded-md"}
      >
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
            icon={EditIcon}
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
        id="data-comics-list"
        className={"mt-4 mx-auto w-1/3"}
        onDragStart={onDragStart}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragEnd={onDragEnd}
      >
        {/* <div style={{ height: offscreenUpperHeight }} /> */}
        {
          <>
            {steps.length !== 0 && (
              <div
                id="data-comics-space"
                data-id={-1}
                className={classnames(
                  "group flex w-full justify-center items-center rounded-lg",
                  {"hover:border-gray-300 hover:border-2": highlightIndex === null},
                  "h-4",
                  "cursor-pointer",
                  {"ring-2 ring-blue-500 bg-blue-100 ": highlightIndex === -1}
                )}
                onClick={() => {
                  onNew(-1)
                }}
              >
                <IconButton
                  icon={PlusIcon}
                  size="lg"
                  title="New"
                  classes="text-blue-500 cursor-pointer hidden group-hover:block"
                />
              </div>
            )}
            {steps.map((step, index) => {
              return (
                <>
                  <EditingCard
                    dataId={index}
                    trace={step}
                    selected={selectedList.some(item => item === step.id)}
                    onSelect={onSelect}
                    onElementSizeChanged={() => {}}
                  />
                  <div
                    id="data-comics-space"
                    data-id={index}
                    className={classnames(
                      "group flex w-full justify-center items-center rounded-lg",
                      {"hover:border-gray-300 hover:border-2": highlightIndex === null},
                      "h-4",
                      "cursor-pointer",
                      {"ring-2 ring-blue-500 bg-blue-100": highlightIndex === index}
                    )}
                    onClick={() => {
                      onNew(index)
                    }}
                  >
                    <IconButton
                      icon={PlusIcon}
                      size="lg"
                      title="New"
                      classes="text-blue-500 cursor-pointer hidden group-hover:block"
                    />
                  </div>
                </>
              )
            })}
          </>
        }
        {/* <div style={{ height: offscreenLowerHeight }} /> */}
      </div>
    </div>
  );
}

export default withServices(EditView, [
  'recordingService',
  'session',
]);
