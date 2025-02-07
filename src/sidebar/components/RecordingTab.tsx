import { useMemo, useState } from 'preact/hooks';

import { withServices } from '../service-context';
import type { FrameSyncService } from '../services/frame-sync';
import type { RecordingService } from '../services/recording';
import { useSidebarStore } from '../store';
import ActionList from './ActionList';
import RecordingList from './RecordingList';
import TimelineList from './TimelineList';
import ComicList from './ComicsList';
import type { RecordItem, RecordStep } from '../../types/api';

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

  const recordView = recordingService.getRecordTabView();
  const [lastId, setLastId] = useState<string | null>(null);

  const onRefreshStep = (id: string | null, scrollToId: string | null) => {
    if (id && scrollToId) {
      recordingService.updateTracking(id, scrollToId);
    } else if (id && !scrollToId) {
      recordingService.updateTracking(id);
    } else {
      recordingService.updateTracking();
    }
  }

  const rootAction = useMemo(() => {
    return allTraces;
  }, [allTraces])

  // const onSelectImage = (id: string) => {
  //   // get from recordings
  //   // const selectedStep = store.getSelectedRecordingStep();
  //   // if (selectedStep) {
  //   //   frameSync.notifyHost('openImageViewer', selectedStep);
  //   // }
  // }

  const onPageOpen = (recordItem: RecordItem, recordSteps: RecordStep[], topThread: RecordStep) => {
    frameSync.notifyHost('openNewPage', {recordItem: recordItem, recordSteps: recordSteps, topThread: topThread});
  }

  const onOpen = (record: RecordItem) => {
    let id = record.id;
    if (record.timestamp < 1733800000000) {
      id = record.sessionId;
    }
    recordingService.selectRecordTabView('view', id);
    recordingService.updateTracking(record.id);
  };

  const onClose = (id: string) => {
    setLastId(id);
    recordingService.selectRecordTabView('list');
    recordingService.updateTracking();
  };

  return (
    <>
      {recordView === 'list' && (
        <RecordingList onOpen={onOpen} id={lastId}/>
      )}
      {recordView === 'view' && (
        <ComicList
          onOpen={onPageOpen}
          onClose={onClose}
          onRefreshStep={onRefreshStep}
        />
      )}
      {recordView === 'ongoing' && (
        <ActionList threads={rootAction}/>
      )}
    </>
  )
}

export default withServices(RecordingTab, ['recordingService', 'frameSync']);
