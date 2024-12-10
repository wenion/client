import { useCallback, useMemo, useRef } from 'preact/hooks';

import { withServices } from '../service-context';
import type { FrameSyncService } from '../services/frame-sync';
import type { RecordingService } from '../services/recording';
import { useSidebarStore } from '../store';
import ActionList from './ActionList';
import RecordingList from './RecordingList';
import TimelineList from './TimelineList';
import type { RecordingStepData, RecordItem } from '../../types/api';

type RecordingTabProps = {
  frameSync: FrameSyncService;
  recordingService: RecordingService;
};

function RecordingTab({
  frameSync,
  recordingService,
}: RecordingTabProps) {
  const store = useSidebarStore();
  const allTraces = store.allTraces();
  const lastScrollTop = useRef(0);

  const recordView = recordingService.getRecordTabView();

  const onUpdate = useCallback((record: RecordItem, scrollTop: number) => {
    // console.log("scrollTop", lastScrollTop, "newScrollTop", scrollTop, "recordItem", record.id)
    if (lastScrollTop.current !== scrollTop) {
      recordingService.updateTracking(record.id, scrollTop);
      lastScrollTop.current = scrollTop;
    }
  }, [],)

  const rootAction = useMemo(() => {
    return allTraces;
  }, [allTraces])

  const onSelectImage = (id: string) => {
    // get from recordings
    // const selectedStep = store.getSelectedRecordingStep();
    // if (selectedStep) {
    //   frameSync.notifyHost('openImageViewer', selectedStep);
    // }
  }

  const onNewPage = (sessionId: string, userid?: string) => {
    if (userid) {
      frameSync.notifyHost('openNewPage', {sessionId: sessionId, userid: userid});
    }
  }

  const onOpen = (record: RecordItem, scrollTop: number) => {
    recordingService.selectRecordTabView('view', record.id);
    store.setStep(scrollTop);
  };

  const onClose = () => {
    recordingService.selectRecordTabView('list');
    store.setStep(0);
    recordingService.updateTracking();
  };

  const onDataComicsEvent = (step: RecordingStepData) => {
    frameSync.notifyHost('openImageViewer', step);
  }

  return (
    <>
      {recordView === 'list' && (
        <RecordingList onOpen={onOpen}/>
      )}
      {recordView === 'view' && (
        <TimelineList
          onSelectImage={onSelectImage}
          onDataComicsEvent={onDataComicsEvent}
          onNewPage={onNewPage}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      )}
      {recordView === 'ongoing' && (
        <ActionList threads={rootAction}/>
      )}
    </>
  )
}

export default withServices(RecordingTab, ['frameSync', 'recordingService',]);
