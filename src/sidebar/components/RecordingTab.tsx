import { useMemo, useState } from 'preact/hooks';

import { withServices } from '../service-context';
import type { FrameSyncService } from '../services/frame-sync';
import type { RecordingService } from '../services/recording';
import { confirm } from '../../shared/prompts';
import { useSidebarStore } from '../store';
import ActionList from './ActionList';
import RecordingList from './RecordingList';
import TimelineList from './TimelineList';
import ComicList from './ComicList';
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
    const url = store.getLink('home');
    const pathname = "/shareflow/" + recordItem.id;
    window.open(url + pathname, "_blank");
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

  const onPin = (recordItem: RecordItem, value: boolean) => {
    recordingService.toggleRecordPin(recordItem.id, value);
  }

  const onDelete = async (recordItem: RecordItem) => {
    if (
      await confirm({
        title: `Delete ${recordItem.taskName.toLowerCase()}?`,
        message: `Are you sure you want to delete ${recordItem.taskName.toLowerCase()}?`,
        confirmAction: 'Delete',
      })
    ) {
      try {
        recordingService.deleteRecord(recordItem.id);
        console.log('framsync send delete')
        frameSync.sendTraceData(
          "record",
          "RECORD",
          "delete",
          JSON.stringify({sessionId: recordItem.id, taskName: recordItem.taskName}),
        )
      } catch (err) {
        // toastMessenger.error(err.message);
        console.error(err);
      }
    }
  };

  return (
    <>
      {recordView === 'list' && (
        <RecordingList
          onOpen={onOpen}
          onDelete={onDelete}
        />
      )}
      {recordView === 'view' && (
        <ComicList
          onOpen={onPageOpen}
          onClose={onClose}
          onPin={onPin}
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
