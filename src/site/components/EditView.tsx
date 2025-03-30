import { ArrowUpIcon, IconButton, TrashIcon, EditIcon, CancelIcon, Checkbox } from '@hypothesis/frontend-shared';
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

function capitalizeFirstLetter(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

type ComicHeaderProps = {
  id: number;
  dataId: number,
  trace: RecordStep;
  selected: boolean;
  onElementSizeChanged: (id: string) => void;
  onSelect: (id: string, selected: boolean) => void;
  classes?: string;
};

export function ComicHeader({
  id,
  dataId,
  trace,
  selected,
  onElementSizeChanged,
  onSelect,
  classes,
}: ComicHeaderProps) {
  useLayoutEffect(()=> {
    onElementSizeChanged(trace.id);
  }, []);

  return (
    <div
      draggable
      className={classnames(
        "data-comics-item",
        "p-4",
        "border-2 border-transparent",
        classes,
      )}
      id={trace.id}
      data-id={dataId}
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
      >
        <div>
          <Checkbox
            checked={selected}
            onChange={e => {
              onSelect(trace.id, (e.target! as HTMLInputElement).checked);
            }}
          />
        </div>
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
        <div className="flex-1 p-2">
          <b>{trace.title}:</b>{" "} {trace.description??trace.url}
        </div>
      </div>
    </div>
  )
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
        'text-lg text-blue-chathams text-center',
        'border border-black mb-0.5',
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
          onChange={e => {
            onSelect(trace.id, (e.target! as HTMLInputElement).checked);
          }}
        />
      </div>
      <div
        className={classnames(
          "justify-self-center content-center row-span-3",
          "text-black",
          "w-16 p-2",
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
        "p-4",
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
            "p-2",
          )}
          title={trace.description}
        >
          {trace.description}
        </div>
      </div>
    </div>
  )
}

type ImageComicsCardProps = {
  children: ComponentChildren;
  onImageClick: (id: string) => void;
  onElementSizeChanged: (id: string) => void;
  step: RecordStep;
  dataId: number;
};

export function ImageComicsCard({
  children,
  onImageClick,
  onElementSizeChanged,
  step,
  dataId,
}: ImageComicsCardProps) {
  return (
    <div
      draggable
      className={classnames(
        'data-comics-item',
        "p-4",
        "border-2 border-transparent",
      )}
      id={step.id}
      data-id={dataId}
    >
      <div className={"flex"}>
        <div
          className={classnames(
            { "w-full" : !step.image},
            { "max-w-52" : step.image}
          )}
        >
          {children}
        </div>
        {step.image && (
          <div
            className={"flex-1"}
          >
            <img
              src={step.image}
              className={"w-full border"}
            />
          </div>
        )}
      </div>
    </div>
  )
}

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

  const parentRef = useRef<HTMLDivElement | null>(null);

  const [sourceNode, setSourceNode] = useState<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<string>("End"); // Start Trigger End
  const [startTop, setStartTop] = useState(0);

  useEffect(() => {
    recordingService.getTracesById(id!);
  }, [id, links]);

  const [selectedList, setSelectedList] = useState<string[]>([]);

  const [imageThreads, setImageThreads] = useState(() => new Map());
  const [threadHeights, setThreadHeights] = useState(() => new Map());

  const exist = useMemo(()=> {
    if (selectedList.length) {
      return true;
    }
    return false;
  }, [selectedList])

  const addItem = (item: string) => {
    const exist = recordSteps.filter(step => step.id === item);
    if (exist)
      setSelectedList(prev => [...prev, item]);
  };

  // Remove item
  const removeItem = (item: string) => {
    const exist = recordSteps.filter(step => step.id === item);
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
      addItem(id);
    } else {
      removeItem(id);
    }
  }

  const onDeselect = () => {
    setSelectedList([]);
  }

  const onDelete = () => {
    if (selectedList.length) {
      store.removeRecordSteps(selectedList);
      setSelectedList([]);
    }
  }

  const onEdit = async() => {
    if (selectedList.length === 1) {
      const selectedStep = selectedList[0];
      const step = recordSteps.find(item => item.id === selectedStep);
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
        store.updateRecordStep(step);
      }
    }
  }

  const onToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const onDragStart = (e: DragEvent) => {
    const target = e.target;
    if (target instanceof HTMLDivElement) {
      setTimeout(() => {
        target.classList.add("moving");
        Array.from(target.children).forEach((child) => {
          (child as HTMLElement).style.visibility = 'hidden';
        });
      }, 0);
      e.dataTransfer!.effectAllowed = "move";
      setSourceNode(target);
      setDragState("Start");
      setStartTop(target.getBoundingClientRect().top);
    }
  };

  const onDragOver = (e: Event) => {
    e.preventDefault();
  };

  const onDragEnter = (e: Event) => {
    e.preventDefault();
    const target = e.target;
    if (target === parentRef.current) {
      setDragState("Start");
      return;
    }
    if (target === sourceNode) {
      setDragState("Start");
      return;
    }
    if (target instanceof HTMLDivElement && target.classList.contains('data-comics-item') && sourceNode && dragState === "Start") {
      const children = [...parentRef.current!.children];
      const sourceIndex = children.indexOf(sourceNode);
      const targetIndex = children.indexOf(target);
      if (sourceIndex <= targetIndex) {
        parentRef.current!.insertBefore(sourceNode, target.nextElementSibling);
      } else {
        parentRef.current!.insertBefore(sourceNode, target);
      }
      setDragState("Trigger");
    }
  };

  const onDragEnd = (e: DragEvent) => {
    const target = e.target;
    if (target instanceof HTMLDivElement) {
      target.classList.remove("moving");
      Array.from(target.children).forEach((child) => {
        (child as HTMLElement).style.visibility = "visible";
      });
    }
    setDragState("End");
  };

  const onSave = (id: string) => {
    const children = [...parentRef.current!.children];
    children.map((child, newIndex) => {
      const selectIndex = child.getAttribute("data-id");
      const step = recordSteps.find(item => item.index === Number(selectIndex));
      if (step) {
        step.index = newIndex;
        store.updateRecordStep(step);
      }
    })
    recordingService.saveTraces(id);
    window.alert("Changes have been saved!");
  }

  let navId = 0;
  let dataId = 0;

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
        ref={parentRef}
        className={"mx-auto max-w-2xl"}
        onDragStart={onDragStart}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        {/* <div style={{ height: offscreenUpperHeight }} /> */}
        <div
          className={"fixed flex -ml-40 border border-black rounded-md"}
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
          {exist && (<IconButton
            icon={CancelIcon}
            onClick={onDeselect}
            size="lg"
            title="Deselect All"
            classes="text-blue-500 cursor-pointer"
          />)}
        </div>
        {
          recordSteps.map((step, index) => {
            if (step.tagName === "Navigate" || step.tagName === "Switch") {
              navId++;
              dataId++;
              return (
                <ComicHeader
                  id ={navId}
                  dataId={index}
                  trace={step}
                  selected={selectedList.some(item => item === step.id)}
                  onElementSizeChanged={onRendered}
                  onSelect={onSelect}
                  classes={classnames({ "data-comics-nav": navId !== 1 })}
                />
              )
            } else {
              dataId++;
              return (
                <ImageComicsCard
                  onImageClick={(id) => {}}
                  onElementSizeChanged={onRendered}
                  step={step}
                  dataId={index}
                >
                  <ComicItem
                    trace={step}
                    isAlign={step.image ? true: false}
                    selected={selectedList.some(item => item === step.id)}
                    onElementSizeChanged={onRendered}
                    onSelect={onSelect}
                  />
                </ImageComicsCard>
              )
            }
          })
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
