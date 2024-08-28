import { IconButton, CancelIcon, CaretLeftIcon, CaretRightIcon } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useEffect, useRef, useState, useLayoutEffect } from 'preact/hooks';
import debounce from 'lodash.debounce';

import { ListenerCollection } from '../../shared/listener-collection';
import type { EventBus, Emitter } from '../util/emitter';
import type { RecordingStepData } from '../../types/api';

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
  const [src, setSrc] = useState<string | null>(null);
  const originalDocumentOverflowStyle = useRef('');
  const emitterRef = useRef<Emitter | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const circleRef = useRef<HTMLDivElement | null>(null);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

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
    emitter.subscribe('openImageViewer', (selectedStep: RecordingStepData) => {
      setIsHidden(false);
      // setIframeKey(iframeKey => iframeKey + 1);
      setSrc(selectedStep.image ?? '');
      setWidth(selectedStep.width ?? 0);
      setHeight(selectedStep.height ?? 0);
      setOffsetX(selectedStep.offsetX ?? -1);
      setOffsetY(selectedStep.offsetY ?? -1);
    });
    emitterRef.current = emitter;

    return () => {
      emitter.destroy();
    };
  }, [eventBus]);

  const onClose = () => {
    setIsHidden(true);
    emitterRef.current?.publish('closeImageViewer');
  };

  useLayoutEffect(() => {
    const listeners = new ListenerCollection();

    const updateCirclePosition = debounce(
      () => {
        if (imageRef.current && circleRef.current) {
          const widthToHeight = width / height;
          const ratioHeight = imageRef.current.clientHeight/height;
          const ratioWidth = widthToHeight * imageRef.current.clientHeight / width;

          circleRef.current.style.top = (offsetY * ratioHeight - 22).toString() + "px";
          circleRef.current.style.left = (offsetX * ratioWidth - 22).toString() + "px";

          circleRef.current.classList.add('animate-blink');
        }
      },
      10,
      { maxWait: 1000 }
    );

    const onError = () => {
      if (src) {
        window.open(src, '_blank');
      }
      onClose();
    }

    listeners.add(window, 'resize', updateCirclePosition);
    if (imageRef.current) {
      imageRef.current.onload = updateCirclePosition;
      imageRef.current.onerror = onError;
    }

    return () => {
      listeners.removeAll();
      updateCirclePosition.cancel();
    };

  }, [src])

  const hoverContent = (visible: boolean) => {
    if (visible && imageRef.current && circleRef.current) {
      const widthToHeight = width / height;
      const ratioHeight = imageRef.current.clientHeight/height;
      const ratioWidth = widthToHeight * imageRef.current.clientHeight / width;

      circleRef.current.style.width = "56px";
      circleRef.current.style.height = "56px";

      circleRef.current.style.top = (offsetY * ratioHeight - 28).toString() + "px";
      circleRef.current.style.left = (offsetX * ratioWidth - 28).toString() + "px";
    }
    else if (!visible && imageRef.current && circleRef.current) {
      const widthToHeight = width / height;
      const ratioHeight = imageRef.current.clientHeight/height;
      const ratioWidth = widthToHeight * imageRef.current.clientHeight / width;

      circleRef.current.style.width = "44px";
      circleRef.current.style.height = "44px";

      circleRef.current.style.top = (offsetY * ratioHeight - 22).toString() + "px";
      circleRef.current.style.left = (offsetX * ratioWidth - 22).toString() + "px";
    }
  }

  if (src === null) {
    return null;
  }

  return (
    <div
      className={classnames(
        'fixed z-max top-0 left-0 right-0 bottom-0 p-3 bg-black/95',
        { hidden: isHidden },
      )}
      data-testid="notebook-outer"
    >
      <div className="w-full" data-testid="notebook-inner">
        <div className="flex m-3">
          <div className='grow'></div>
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
        <div className="flex justify-center items-center" onClick={onClose}>
          {/* <div className="flex justify-center items-center w-40 h-40 bg-white/50 rounded-2xl m-4 cursor-pointer">
            <CaretLeftIcon />
          </div> */}
          <div
            className={classnames(
              "relative",
              "cursor-pointer",
              "md:h-[400px] lg:h-[700px] p-1"
            )}
            onClick={(event)=>{event.stopPropagation()}}
          >
            <img
              className={'max-h-full'}
              ref={imageRef}
              src={src}
              onMouseEnter={() => hoverContent(true)}
              onMouseLeave={() => hoverContent(false)}
            />
            {offsetX !== -1 && offsetY !== -1 && (
              <div
                ref={circleRef}
                className='w-11 h-11 rounded-full absolute border-2 border-blue-500 bg-blue-100/35 transition-all'
              />
            )}
          </div>
          {/* <div className="flex justify-center items-center w-40 h-40 bg-white/50 rounded-2xl m-4 cursor-pointer">
            <CaretRightIcon />
          </div> */}
        </div>
      </div>
    </div>
  );
}
