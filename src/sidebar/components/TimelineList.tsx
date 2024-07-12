import { Button, CaretDownIcon, CaretRightIcon, LeaveIcon } from '@hypothesis/frontend-shared';
import { useEffect, useState, useRef } from 'preact/hooks';
import classnames from 'classnames';

import { useSidebarStore } from '../store';
import MarkdownView from './MarkdownView';
import DataComicsNote from './DataComics';
import type { RecordingStepData, Recording } from '../../types/api';
import { applyTheme } from '../helpers/theme';

type StickyNoteProps = {
  index: number;
  id: string;
  defaultCollapsed: boolean;
  title: string;
  content: string;
  image?: string | null;
  imagePosition? : {width: number|undefined, height: number|undefined, offsetX: number|undefined, offsetY: number|undefined};
  url?: string;
  urlText?: string;
  hoverContent: (id: string, visible: boolean) => void;
  onSelectImage: (id: string) => void;
};

function StickyNote({
  index,
  id,
  defaultCollapsed,
  title,
  content,
  image,
  imagePosition,
  url,
  urlText,
  hoverContent,
  onSelectImage,
}: StickyNoteProps) {
  const store = useSidebarStore();
  const textStyle = applyTheme(['annotationFontFamily'], {});

  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (imageRef.current && circleRef.current && imagePosition) {
      const width = imagePosition?.width;
      const height = imagePosition?.height;
      const offsetX = imagePosition?.offsetX;
      const offsetY = imagePosition?.offsetY;

      if (width && height && offsetY && offsetX) {
        const widthToHeight = width / height;
        const ratioHeight = imageRef.current.clientHeight/height;
        const ratioWidth = widthToHeight * imageRef.current.clientHeight / width;

        circleRef.current.style.top = Math.round(offsetY * ratioHeight - 8).toString() + "px";
        circleRef.current.style.left = Math.round(offsetX * ratioWidth - 8).toString() + "px";

      }
    }
  }, [collapsed])

  const toggleStep = (id: string) => {
    store.selectRecordingStep(id);
  }

  const onImageClick = (id: string) => {
    store.selectRecordingStep(id);
    onSelectImage(id)
  }

  return (
    <>
      <div
        className='timeline-node cursor-pointer'
        id={id}
      >
        <div className='timeline-circle text-blue-700 text-center bg-blue-200/50'>{index}</div>
      </div>
      <div
        className='timeline-content'
        id={id}
        onMouseEnter={() => hoverContent(id, true)}
        onMouseLeave={() => hoverContent(id, false)}
        onClick={() => toggleStep(id)}
      >
        <div className='flex items-center gap-x-1 cursor-pointer'>
          {collapsed ? <CaretDownIcon className='grow-0'/> : <CaretRightIcon className='grow-0'/>}
          <h3 className='grow text-md' onClick={() => {setCollapsed(!collapsed)}}>
            {!urlText &&
              <>
                {title}
              </>
            }
            {urlText && url &&
              <>
                {title}
                <div className='text-blue-700 bg-blue-50 border-blue-200 border rounded'>
                  {urlText}
                </div>
              </>
            }
          </h3>
        </div>
        <div className='flex justify-center'>
          {!collapsed && image && (
            <div className='relative w-80 p-1 cursor-pointer'>
              <img
                ref={imageRef}
                className='border border-gray-300 hover:border-2 hover:border-gray-500'
                id={'img' + id}
                onClick={() => onImageClick(id)}
                src={image}
              />
              <div
                ref={circleRef}
                className='w-6 h-6 rounded-full absolute border-2 border-blue-500 bg-blue-100/35 transition-all'
              />
            </div>
          )}
        </div>
        {/* {!collapsed && (
          <div
            className='grow my-4 rounded-sm bg-blue-200'
          >
            <MarkdownView
              classes='text-sm m-3'
              markdown={content}
              style={textStyle}
            />
          </div>
        )} */}
      </div>
    </>
  )
}

export type JsonObjectData = { [key: string]: string | number | boolean | JsonObjectData; };

function stringifyObject(obj: JsonObjectData, indentation: number = 0): string {
  if (obj == null) {
    return '';
  }
  const spaces = ' '.repeat(indentation * 2);

  return Object.entries(obj)
    .map(([key, value]) => {
      key = key.trim();
      const formattedValue = typeof value === 'object' ? stringifyObject(value, indentation + 1) : value.toString().trim();
      return `${spaces}<span style="color:grey">${key}</span>: ${formattedValue}`;
    })
    .join('\n\n');
}

function formatObject(object: RecordingStepData) {
  return {
    url: object.url,
    position: object.position,
  }
}

export type TimelineListProps = {
  recording: Recording,
  onSelectImage: (id: string) => void;
  onDataComicsEvent: (step: RecordingStepData) => void;
};

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
export default function TimelineList({
  recording,
  onSelectImage,
  onDataComicsEvent,
} : TimelineListProps) {
  const store = useSidebarStore();
  const [collapsed, setCollapsed] = useState(false);
  // const textStyle = applyTheme(['annotationFontFamily'], {});

  const [dcView, setDcView] = useState(true);
  const toggleView = () => {
    setDcView(!dcView);
  }

  const hoverContent = (id: string, visible: boolean) => {
    const hoverItems = document.querySelectorAll('#' + id);
    for (const item of hoverItems) {
      item.classList.toggle('timeline-hover-on', visible)
    }
  }

  useEffect(()=> {}, [collapsed])

  const omit = (url: string | undefined, numberOfCharacters: number = 15) => {
    return url ? (url.length < numberOfCharacters ? url : url.slice(0,numberOfCharacters -2) + '...'): url
  }

  return (
    <>
      <div className='flex items-center mb-1'>
        {dcView ? (
          <div className="flex-1"></div>
        ) : (
          <>
            <div className='flex-none size-3 bg-blue-700 rounded-full'></div>
            <h1 className='m-2 grow text-xl'>{recording.taskName}</h1>
         </>
        )}
        <Button classes={classnames('flex-none', 'border-black')} onClick={() => toggleView()}>Switch</Button>
        <Button classes={classnames('flex-none')} onClick={() => store.clearSelectedRecord()}><LeaveIcon /></Button>
      </div>
      {!dcView && recording.steps && recording.steps.map((child, index) => (
        <div
          className='message-grid'
        >
          <StickyNote
            index={index + 1}
            id={child.id}
            defaultCollapsed={collapsed}
            title={child.description? child.description : child.type}
            // title={child.description?.includes('Navigate')? child.description : child.description ?? child.type}
            content={stringifyObject(formatObject(child) as JsonObjectData)}
            image={child.image}
            imagePosition={child.image? {width: child.width, height: child.height, offsetX: child.offsetX, offsetY: child.offsetY}: undefined}
            url={child.description?.toLowerCase().includes('go to') ? child.url: undefined}
            urlText={child.description?.toLowerCase().includes('go to') ? (child.title?? child.url): undefined}
            hoverContent={hoverContent}
            onSelectImage={onSelectImage}
          />
        </div>
      ))}
      {dcView && recording.dc && (
        <DataComicsNote
          data={recording.dc}
          onDataComicsEvent={onDataComicsEvent}
        />
      )}
    </>
  );
}

