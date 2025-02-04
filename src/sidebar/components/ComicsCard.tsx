import { useState, useRef, useLayoutEffect } from 'preact/hooks';
import classnames from 'classnames';

import type { RecordStep } from '../../types/api';

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

  useLayoutEffect(()=> {
    updateCirclePosition();
    onElementSizeChanged(trace.id);
  }, [loaded]);

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
      className='relative p-1 cursor-pointer border hover:shadow-lg overflow-clip'
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

function capitalizeFirstLetter(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

type ComicHeaderProps = {
  id: string;
  title: string;
  description: string;
  url: string;
  onElementSizeChanged: (id: string) => void;
};

function ComicHeader({
  id,
  title,
  description,
  url,
  onElementSizeChanged,
}: ComicHeaderProps) {
  useLayoutEffect(()=> {
    onElementSizeChanged(id);
  }, []);

  const onClick = (url: string) => {
    window.open(url, '_blank');
  }

  return (
    <div
      className={classnames(
        "text-lg text-neutral-900 text-center",
        "border-4",
        'hover:shadow-lg',
        'cursor-pointer',
        'p-2',
        "border-pink-200",
      )}
      title={url}
      onClick={() => onClick(url)}
    >
      <b>{title}:</b>{" "} {description}
    </div>
  )
}

type ComicItemProps = {
  trace: RecordStep;
  isAlign: boolean;
  onElementSizeChanged: (id: string) => void;
};

function ComicItem({
  trace,
  isAlign = false,
  onElementSizeChanged,
}: ComicItemProps) {
  useLayoutEffect(()=> {
    onElementSizeChanged(trace.id);
  }, []);

  return (
    <div
      className={classnames(
        'grid grid-rows-3 grid-flow-col',
        'justify-self-center content-center',
        'text-lg text-blue-chathams text-center',
        'border border-black my-0.5',
        'hover:shadow-lg',
        'cursor-pointer',
        "h-20",
      )}
      title={trace.title}
      // onClick={e => onClick(step.url)}
    >
      <div
        className={classnames(
          "justify-self-center content-center row-span-3",
          "text-black p-1",
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
      <span className={classnames(
        "col-span-2 border-b border-l border-black",
        "text-lg text-black font-bold content-center",
        "px-4",
      )}>
        {capitalizeFirstLetter(trace.title)}
      </span>
      <div
        className={classnames(
          "flex row-span-2 col-span-2",
          "h-full",
          // "p-1",
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
            "break-words",
            "data-comics-content"
          )}
          title={trace.description}
        >
          {trace.description}
        </div>
      </div>
    </div>
  )
}

type ComicsCardProps = {
  onImageClick: (id: string) => void;
  onElementSizeChanged: (id: string) => void;
  step: RecordStep;
};

export default function ComicsCard({
  onImageClick,
  onElementSizeChanged,
  step,
}: ComicsCardProps) {
  const onClick = (url: string) => {
    window.open(url, '_blank');
  }

  return (
    <>
      <div
        className={classnames({'data-comics-item': step.index})}
        id={step.id}
      >
        {step.tagName === 'Navigate' || step.tagName === 'Switch' ? (
          <ComicHeader
            id={step.id}
            title={step.title}
            description={step.description??step.url}
            url={step.url}
            onElementSizeChanged={onElementSizeChanged}
          />
        ) : (
          <div class="flex">
            <ComicItem
              trace={step}
              isAlign={step.image ? true: false}
              onElementSizeChanged={onElementSizeChanged}
            />
            {step.image && (
              <Thumbnail
                trace={step}
                onClickEvent={onImageClick}
                onElementSizeChanged={onElementSizeChanged}
              />
            )}
          </div>
        )}
      </div>
    </>
  )
}
