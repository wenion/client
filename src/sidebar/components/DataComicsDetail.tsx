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

type ThumbnailProps = {
  trace: RecordStep;
  onClickEvent: (id: string) => void,
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
  }, [loaded])

  // const hover = (hoved: boolean) => {
  //   if (hoved && circleRef.current) {
  //     circleRef.current.classList.add("animate-blink");
  //   }
  //   if (!hoved && circleRef.current) {
  //     circleRef.current.classList.remove("animate-blink");
  //   }
  // }

  return (
    // <div className='relative p-1 cursor-pointer border hover:shadow-lg my-0.5'>
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
  index: number;
  title: string;
  url: string;
};

function ComicHeader({
  index,
  title,
  url,
}: ComicHeaderProps) {
  const onClick = (url: string) => {
    window.open(url, '_blank');
  }

  return (
    <div
      className={classnames(
        "text-lg text-neutral-900 text-center",
        "border border-black",
        'hover:shadow-lg',
        'cursor-pointer',
        'p-2',
        {"bg-green-200" : index % 4 === 0 },
        {"bg-pink-200" : index % 4 === 1},
        {"bg-sky-200" : index % 4 === 2},
        {"bg-purple-200" : index % 4 === 3},
      )}
      title={url}
      onClick={() => onClick(url)}
    >
      <b>Navigate to:</b>{" "}{title}
    </div>
  )
}

type ComicItemProps = {
  type: string;
  content: string;
  title: string;
  isAlign: boolean;
};

function ComicItem({
  type,
  content,
  title,
  isAlign = false
}: ComicItemProps) {
  const displayContent = content.length > 60 ? content.slice(0, 60) : content.length > 35 ? content.slice(0, 35) : content;

  return (
    <div
      className={classnames(
        'grid grid-rows-3 grid-flow-col gap-y-1',
        'justify-self-center content-center',
        {
          'gap-x-4': !isAlign,
        },
        {'data-comics-image gap-x-2': isAlign},
        'text-lg text-blue-chathams text-center',
        'border border-black my-0.5',
        'hover:shadow-lg',
        'cursor-pointer',
      )}
      title={title}
      // onClick={e => onClick(step.url)}
    >
      <div
        className={classnames(
          "justify-self-center content-center row-span-3",
          {"data-comics-icon": isAlign},
          {
            "min-w-20 max-w-24 p-4": !isAlign,
          },
        )}
      >
        {type.toLowerCase() === "click" ? (
          <ClickIcon />
        ) : type.toLowerCase() === "type" || type.toLowerCase() === "keydown"  ? (
          <TypeIcon />
        ) : type.toLowerCase() === "scroll" && content.toLowerCase() === "down" ? (
          <ScrollDownIcon />
        ) : type.toLowerCase() === "scroll" && content.toLowerCase() === "up" ? (
          <ScrollUpIcon />
        ) : type.toLowerCase() === "submit" ? (
          <SubmitIcon />
        ) : type.toLowerCase() === "search" ? (
          <SearchIcon />
        ) : type.toLowerCase() === "select" ? (
          <SelectionIcon />
        ) : type.toLowerCase() === "selectarea" ? (
          <SelectAreaIcon />
        ) : (
          <QuestionIcon />
        )}
      </div>
      <span className={classnames(
        "col-span-2 border-b border-l border-black",
        "text-lg text-black font-bold content-center",
        "px-4"
      )}>
        {capitalizeFirstLetter(type)}
      </span>
      <div
        className={classnames(
          "row-span-2 col-span-2",
          "justify-self-center content-center",
          {"italic": isAlign},
          "overflow-hidden text-ellipsis",
          {"text-sm": content.length >= 35 && content.length <60},
          {"text-xs": content.length >= 60}
        )}
        title={content}
      >
        {displayContent}
      </div>
    </div>
  )
}

type DetailProps = {
  onImageClick: (id: string) => void;
  onElementSizeChanged: (id: string) => void;
  step: RecordStep;
};

export default function Detail({
  onImageClick,
  onElementSizeChanged,
  step,
}: DetailProps) {
  const onClick = (url: string) => {
    window.open(url, '_blank');
  }

  const getFirstQuotationContent = (text: string) => {
    const match = text.match(/"([^"]*)"/);
    if (match) {
      return(match[1]); // Output: 'the text'
    }
    return text
  }

  return (
    <>
      <div
        className={classnames({'data-comics-content': step.index})}
        id={'ps_' + step.id}
      >
        {step.tagName === 'Navigate' || step.tagName === 'Switch' ? (
          <ComicHeader
            index={step.index!}
            title={step.description??step.url}
            url={step.url}
          />
          ) : (
            <div class="flex">
              <ComicItem
                type={step.title??''}
                content={getFirstQuotationContent(step.description??'')}
                title={step.title??''}
                isAlign={step.image ? true: false}
              />
              {step.image && (
                <Thumbnail
                  trace={step}
                  onClickEvent={onImageClick}
                  onElementSizeChanged={onElementSizeChanged}
                />
              )}
            </div>
          )
        }
      </div>
    </>
  )
}
