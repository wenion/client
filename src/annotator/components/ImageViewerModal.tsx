import { IconButton, CancelIcon } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useEffect, useRef, useState } from 'preact/hooks';

import type { EventBus, Emitter } from '../util/emitter';


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
  const [iframeKey, setIframeKey] = useState(0);
  const [isHidden, setIsHidden] = useState(true);
  const [src, setSrc] = useState<string | null>(null);
  const originalDocumentOverflowStyle = useRef('');
  const emitterRef = useRef<Emitter | null>(null);

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
    emitter.subscribe('openImageViewer', (src: string) => {
      setIsHidden(false);
      setIframeKey(iframeKey => iframeKey + 1);
      setSrc(src);
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
      <div className="relative w-full h-full" data-testid="notebook-inner">
        <div className="absolute right-0 m-3">
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
        <div className="h-full w-full border-0 flex justify-center items-center" onClick={onClose}>
          <div onClick={(event)=>{event.stopPropagation()}}>
            <img src={src} className='w-full p-1 border border-gray-300 cursor-pointer'/>
          </div>
        </div>
      </div>
    </div>
  );
}
