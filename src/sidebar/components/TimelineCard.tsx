import { useState, useRef, useLayoutEffect } from 'preact/hooks';
import classnames from 'classnames';
import debounce from 'lodash.debounce';

import type { RecordStep } from '../../types/api';

const capitalize = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

type TimelineCardProps = {
  trace: RecordStep;
  // onSelectImage: (id: string) => void;
  onLoaded: () => void,
};

export default function TimelineCard({
  trace,
  // hoverContent,
  // onSelectImage,
  onLoaded,
}: TimelineCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const updateCirclePosition = debounce(
      () => {
        if (imageRef.current && circleRef.current) {
          const width = trace.width;
          const height = trace.height;
          const offsetX = trace.clientX;
          const offsetY = trace.clientY;

          if (width && height && offsetY && offsetX) {
            const widthToHeight = width / height;
            const ratioHeight = imageRef.current.clientHeight/height;
            const ratioWidth = widthToHeight * imageRef.current.clientHeight / width;
    
            circleRef.current.style.top = Math.round(offsetY * ratioHeight - 8).toString() + "px";
            circleRef.current.style.left = Math.round(offsetX * ratioWidth - 8).toString() + "px";
          }
        }
        onLoaded();
      },
      10,
      { maxWait: 1000 }
    );

    if (!collapsed) {
      updateCirclePosition();
    }

    if (imageRef.current) {
      imageRef.current.onload = updateCirclePosition;
    }

    return () => {
      updateCirclePosition.cancel();
    }
  }, [collapsed, ])

  // const toggleStep = (id: string) => {
  //   store.selectRecordingStep(id);
  // }

  const onImageClick = (id: string) => {
    // store.selectRecordingStep(id);
    // onSelectImage(id)
  }

  return (
    <>
      <div
        className='timeline-node cursor-pointer py-1'
        id={trace.id}
      >
        <div className='timeline-circle text-blue-700 text-center bg-blue-200/50'>
          <span>{trace.index}</span>
        </div>
      </div>
      <div
        className={classnames(
          'timeline-content py-1',
          'hover:bg-blue-200/50'
        )}
        id={trace.id}
        // onClick={() => toggleStep(id)}
      >
        <div
          className='flex gap-x-1 cursor-pointer'
          onClick={() => {setCollapsed(!collapsed)}}
        >
          <b>{capitalize(trace.title)}</b>
          <div
            className={classnames(
              'inline px-1 ml-1 break-all',
            )}
          >
            {trace.description}
          </div>
        </div>
        <div className='flex justify-center'>
          {trace.image && (
            <div className='relative w-80 p-1 cursor-pointer'>
              <img
                ref={imageRef}
                className={classnames(
                  'border border-gray-300 hover:border-2 hover:border-gray-500',
                  {
                    'hidden': collapsed,
                  }
                )}
                id={'img' + trace.id}
                alt={trace.title}
                src={trace.image}
              />
              {!collapsed && trace.clientX && trace.clientY && (
                <div
                  ref={circleRef}
                  className={classnames(
                    'w-6 h-6 rounded-full',
                    'absolute border-2 border-red-500 bg-red-100/35 transition-all',
                  )}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
