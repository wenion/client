import { Link } from '@hypothesis/frontend-shared';

import { useState, useRef, useLayoutEffect, useMemo } from 'preact/hooks';
import classnames from 'classnames';
import type { RecordStep } from '../../types/api';

const capitalize = (word: string | null) => {
  if (word)
    return word.charAt(0).toUpperCase() + word.slice(1);
  return '';
}

type TimelineCardProps = {
  trace: RecordStep;
  onElementSizeChanged: (id: string) => void;
};

export default function TimelineCard({
  trace,
  onElementSizeChanged,
}: TimelineCardProps) {
  const [collapsed, setCollapsed] = useState(false);
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

  const onToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const onLoad = () => {
    setLoaded(true);
  };

  useLayoutEffect(()=> {
    updateCirclePosition();
    onElementSizeChanged(trace.id);
  }, [collapsed, loaded])

  const title = useMemo(
    () => capitalize(trace.title),
    [trace]
  );

  return (
    <>
      <div className='timeline-node cursor-pointer py-1'>
        <div className='timeline-circle text-blue-700 text-center bg-blue-200/50'>
          <span>{trace.index}</span>
        </div>
      </div>
      <div
        className={classnames(
          'timeline-content py-1',
          'hover:bg-blue-200/50',
        )}
      >
        <div
          className='flex gap-x-1 cursor-pointer'
          onClick={onToggleCollapse}
        >
          <p>
            <strong>{title}</strong>{' '}
            {title === 'Go to' || title === 'Switch to' ? (
              <Link href={trace.url} target="_blank" underline="none">
                {trace.description}
                </Link>
              ) : (
                trace.description
              )
            }
          </p>
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
                  },
                  'duration-300 ease-in-out',
                )}
                id={'img' + trace.id}
                alt={trace.title}
                src={trace.image}
                onLoad={onLoad}
              />
              {!collapsed && (
                <div
                  ref={circleRef}
                  className={classnames(
                    'w-6 h-6 rounded-full',
                    'absolute border-2 border-red-500 bg-red-100/35 transition-all',
                    'duration-300 ease-in-out',
                  )}
                  style={{ top: `${circleTop}px`, left: `${circleLeft}px` }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
