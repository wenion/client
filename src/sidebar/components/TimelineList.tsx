import {
  Button,
  CaretUpIcon,
  ExpandIcon,
  LeaveIcon,
  Scroll,
  ScrollContainer,
  ScrollContent
} from '@hypothesis/frontend-shared';
import { useCallback, useRef, useMemo } from 'preact/hooks';
import classnames from 'classnames';

import { useSidebarStore } from '../store';
import type { RecordingStepData, RecordItem } from '../../types/api';
import TimelineCard from './TimelineCard';

export type TimelineListProps = {
  onSelectImage: (id: string) => void;
  onDataComicsEvent: (step: RecordingStepData) => void;
  onNewPage: (sessionId: string, userid?: string) => void;
  onUpdate: (record: RecordItem, scrollTop: number) => void;
  onClose: () => void;
};

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
export default function TimelineList({
  onSelectImage,
  onDataComicsEvent,
  onNewPage,
  onUpdate,
  onClose,
} : TimelineListProps) {
  const store = useSidebarStore();
  const recordItem = store.getRecordItem();
  const recordSteps = store.recordSteps();
  const scrollTop = store.getStep();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const goToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      store.setStep(0);
    }
  };

  const onScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      store.setStep(scrollTop);
    }
  };

  const onRendered = useCallback(
    () => {
      if (scrollRef.current) {
        // scrollRef.current.scrollTop = scrollTop;
        scrollRef.current.scrollTo({
          top: scrollTop,
          behavior: 'smooth',
        })
      }
    },
    [],
  );

  const rootAction = useMemo(() => {
    return recordSteps;
  }, [recordSteps]);

  // const omit = (url: string | undefined, numberOfCharacters: number = 15) => {
  //   return url ? (url.length < numberOfCharacters ? url : url.slice(0,numberOfCharacters -2) + '...'): url
  // }

  return (
    <div>
      <header>
        <div className='flex items-center mb-1'>
          <div className='flex-none size-3 bg-blue-700 rounded-full'/>
          {recordItem && (
            <p className='m-2 grow text-xl'>
              {recordItem.taskName}
            </p>
          )}
          <div className='flex-1'/>
          <div className='flex flex-none'>
            {/* <Button
              classes={classnames('flex-none', 'border-black')}
              onClick={() => toggleView()}
            >
              Switch
            </Button> */}
            <Button
              classes={classnames('flex-none', 'border-black')}
              onClick={goToTop}
            >
              <CaretUpIcon />
            </Button>
            <Button
              classes={classnames('flex-none', 'border-black')}
              // onClick={() => onNewPage(recording.sessionId, recording.userid)}
            >
              <ExpandIcon />
            </Button>
            <Button
              classes={classnames('flex-none')}
              onClick={onClose}
            >
              <LeaveIcon />
            </Button>
          </div>
        </div>
      </header>
      <div className="data-comics-height">
        <ScrollContainer borderless>
          <Scroll
            onMouseLeave={() => {
              if (recordItem)
                onUpdate(recordItem, scrollTop)
            }}
            onScroll={onScroll}
            elementRef={scrollRef}
            variant='flat'
          >
            <ScrollContent>
            {rootAction.map(child => (
              (<div
                className='message-grid'
                id={child.id}
                key={child.id}
              >
                <TimelineCard
                  trace={child}
                  onLoaded={onRendered}
                />
              </div>
              )
            ))}
            </ScrollContent>
          </Scroll>
        </ScrollContainer>
      </div>
    </div>
  )
}
