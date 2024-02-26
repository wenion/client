import { Button, CaretDownIcon, CaretRightIcon } from '@hypothesis/frontend-shared';
import { useEffect, useState } from 'preact/hooks';
import classnames from 'classnames';

import { useSidebarStore } from '../store';
import MarkdownView from './MarkdownView';
import type { RecordingData, RecordingStepData } from '../store/modules/recordings';
import { applyTheme } from '../helpers/theme';

type StickyNoteProps = {
  id: string;
  title: string;
  content: string;
  image?: string | null;
  hoverContent: (id: string, visible: boolean) => void;
  onSelectImage: (id: string) => void;
};

function StickyNote({
  id,
  title,
  content,
  image,
  hoverContent,
  onSelectImage,
}: StickyNoteProps) {
  const textStyle = applyTheme(['annotationFontFamily'], {});
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
  }, [collapsed])

  return (
    <>
      <div
        className='timeline-node cursor-pointer'
        id={id}
      >
        <div className='timeline-circle'></div>
      </div>
      <div
        className='timeline-content'
        id={id}
        onMouseEnter={() => hoverContent(id, true)}
        onMouseLeave={() => hoverContent(id, false)}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className='flex items-center gap-x-1 cursor-pointer'>
          {collapsed ? <CaretDownIcon className='grow-0'/> : <CaretRightIcon className='grow-0'/>}
          <h3 className='grow text-lg'>
            {title}
          </h3>
        </div>
        {image && (
          <div className='flex justify-center mt-2.5 p-1 cursor-pointer'>
            <img
              className='border border-gray-300 hover:border-2 hover:border-gray-500'
              id={'img' + id}
              onClick={() => onSelectImage(id)}
              src={image}
            />
          </div>
        )}
        {!collapsed && (
          <div
            className='my-4 rounded-sm bg-blue-200'
          >
            <MarkdownView
              classes={'text-md m-3'}
              markdown={content}
              style={textStyle}
            />
          </div>
        )}
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
      return `${spaces}<span style="color:red">${key}</span>: ${formattedValue}`;
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
  recording: RecordingData,
  onSelectImage: (id: string) => void;
};

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
export default function TimelineList({
  recording,
  onSelectImage,
} : TimelineListProps) {
  const store = useSidebarStore();
  // const textStyle = applyTheme(['annotationFontFamily'], {});

  const hoverContent = (id: string, visible: boolean) => {
    const hoverItems = document.querySelectorAll('#' + id);
    for (const item of hoverItems) {
      item.classList.toggle('timeline-hover-on', visible)
    }
  }

  return (
    <>
      <Button onClick={() => store.clearSelectedRecording()}>return</Button>
      <div className='flex items-center'>
        <div className='flex-none size-3 bg-blue-700 rounded-full '></div>
        <h1 className='m-4 grow text-xl'>{recording.taskName}</h1>
        <Button classes={classnames('flex-none')}>
          Expand
        </Button>
      </div>
      <div
        className='message-grid'
      >
      {recording.steps.map(child => (
        <StickyNote
          id={child.id}
          title={child.description? child.description : child.type}
          content={stringifyObject(formatObject(child) as JsonObjectData)}
          image={child.image}
          hoverContent={hoverContent}
          onSelectImage={onSelectImage}
        />
      ))}
      </div>
    </>
  );
}

