import { IconButton, CancelIcon, CaretLeftIcon, CaretRightIcon } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useCallback, useEffect, useRef, useState, useLayoutEffect, useMemo } from 'preact/hooks';

import type { EventBus, Emitter } from '../util/emitter';
import type { RecordStep } from '../../types/api';

export type ImageViewerModalProps = {
  eventBus: EventBus;
};

/**
 * Create a modal component that hosts (1) the notebook iframe and (2) a button to close the modal.
 */
export default function ImageViewerModal({
  eventBus,
}: ImageViewerModalProps) {
  // Temporary solution: while there is no mechanism to sync new annotations in
  // the notebook, we force re-rendering of the iframe on every 'openNotebook'
  // event, so that the new annotations are displayed.
  // https://github.com/hypothesis/client/issues/3182
  // const [iframeKey, setIframeKey] = useState(0);
  const [isHidden, setIsHidden] = useState(true);
  const originalDocumentOverflowStyle = useRef('');
  const emitterRef = useRef<Emitter | null>(null);

  const [timeLineList, setTimeLineList] = useState<RecordStep[] | null>(null);
  const [id, setId] = useState<string | null>(null);

  const [circleTop, setCircleTop] = useState(0);
  const [circleLeft, setCircleLeft] = useState(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

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
    emitter.subscribe('openImageViewer', (data: {id: string, timeLineList: RecordStep[]}) => {
      setIsHidden(false);
      // setIframeKey(iframeKey => iframeKey + 1);
      setId(data.id);
      setTimeLineList(data.timeLineList);
    });
    emitterRef.current = emitter;

    return () => {
      emitter.destroy();
    };
  }, [eventBus]);

  const onClose = () => {
    setIsHidden(true);
    emitterRef.current!.publish('closeImageViewer', {id: id});
  };

  const trace = useMemo(() => {
    if (id && timeLineList) {
      return timeLineList.find(t => t.id === id);
    }
    return null;
  }, [id, timeLineList])

  const capitalize = (word: string | null) => {
    if (word)
      return word.charAt(0).toUpperCase() + word.slice(1);
    return '';
  }

  const updateCirclePosition = () => {
    if (!imageRef.current || !trace) return;
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

  const onLoad = useCallback(() => {
    updateCirclePosition();
  }, [updateCirclePosition]);

  useLayoutEffect(()=> {
    updateCirclePosition();
  }, [trace])

  const find = useCallback((direction: string) => {
    if (trace && timeLineList) {
      const index = trace.index!;
      if (direction === 'prev' && index > 0) {
        setId(timeLineList[index - 1].id);
      } else if (direction === 'next' && index < timeLineList.length - 1 ) {
        setId(timeLineList[index + 1].id);
      }
    }
  }, [trace, id, timeLineList])

  if (id === null || timeLineList === null) {
    return null;
  }

  return (
    <div
      className={classnames(
        'fixed z-max top-0 left-0 right-0 bottom-0 p-3 bg-black/95',
        { hidden: isHidden },
        'flex',
      )}
      data-testid="notebook-outer"
    >
      <div className="w-full grid grid-cols-11 gap-2" data-testid="notebook-inner">
        <div className="flex justify-center items-center col-start-10 col-span-2 max-h-12">
          <IconButton
            title="Close the Viewer"
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
        <div className="col-start-1 col-end-2 flex justify-center items-center">
          <div
            className={classnames(
              'text-gray-400 hover:text-white',
              'cursor-pointer',
            )}
            onClick={() => find('prev')}
          >
            <div
              className={classnames(
                'flex justify-center items-center',
                'border-gray-400 hover:border-white border-2 rounded-full',
                'w-12 h-12',
              )}
            >
              <CaretLeftIcon />
            </div>
            <div className="flex justify-center items-center">Previous</div>
          </div>
        </div>
        <div className="col-start-2 col-span-9 flex justify-self-center items-center" onClick={onClose}>
          {trace && trace.image && (
            <div
              className='relative cursor-pointer'
              onClick={(event)=>{event.stopPropagation()}}
            >
              <img
                ref={imageRef}
                className={classnames(
                  'max-h-[80vh]',
                  'border border-gray-300 hover:border-2 hover:border-gray-500',
                )}
                id={'img' + trace.id}
                alt={trace.title}
                src={trace.image}
                onLoad={onLoad}
              />
              <div
                ref={circleRef}
                className={classnames(
                  'w-6 h-6 rounded-full',
                  'absolute border-2 border-red-500 bg-red-100/35 transition-all',
                )}
                style={{ top: `${circleTop}px`, left: `${circleLeft}px` }}
              />
            </div>
          )}
          {trace && !trace.image && (
            <div
              className={classnames(
                'flex justify-center col-start-2 col-span-4',
                'text-white min-h-4/5',
              )}
            >
              <p>Step{' '}{trace.index}: { } {capitalize(trace.title)} {trace.description}</p>
            </div>
          )}
        </div>
        <div className="col-span-1 col-end-12 flex justify-center items-center">
          <div
            className={classnames(
              'text-gray-400 hover:text-white',
              'cursor-pointer',
            )}
            onClick={() => find('next')}
          >
            <div
              className={classnames(
                'flex justify-center items-center',
                'border-gray-400 hover:border-white border-2 rounded-full',
                'w-12 h-12',
              )}
            >
              <CaretRightIcon />
            </div>
            <div className="flex justify-center items-center">Next</div>
          </div>
        </div>
        <div
          className={classnames(
            'flex justify-center col-start-2 col-span-9',
            'text-white',
          )}
        >
          {trace && trace.image && (
            <p>Step{' '}{trace.index}: { } {capitalize(trace.title)} {trace.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
