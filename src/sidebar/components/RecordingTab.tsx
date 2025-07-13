import { useCallback, useMemo, useState } from 'preact/hooks';

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

  const group = store.focusedGroup();

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
    const fillUrl = new URL("/shareflow", url);
    fillUrl.searchParams.set('id', recordItem.id);
    window.open(fillUrl.toString(), "_blank");
  }

  const onOpen = (record: RecordItem) => {
    let id = record.id;
    if (record.timestamp < 1733800000000) {
      id = record.sessionId;
    }
    recordingService.selectRecordTabView('view', id);
    recordingService.updateTracking(record.id);
  };

  const onShare = useCallback(async (recordItem: RecordItem) => {
    if (group) {
      await recordingService.updateRecord(recordItem.id, {
        group: group.id,
        action: 'add'
      });
    }
  }, [group]);

  const onClose = (id: string) => {
    setLastId(id);
    recordingService.selectRecordTabView('list');
    recordingService.updateTracking();

    const hasFocused = store.getDefault('focusedShareflow');
    if (hasFocused) {
      recordingService.toggleRecordPin(id, false);
    }
  };

  const onPin = (recordItem: RecordItem, value: boolean) => {
    recordingService.toggleRecordPin(recordItem.id, value);
  }

  const onScore = (recordItem: RecordItem, value: number) => {
    recordingService.setRecordScore(recordItem.id, value);
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
          onShare={onShare}
          onDelete={onDelete}
        />
      )}
      {recordView === 'view' && (
        <ComicList
          onOpen={onPageOpen}
          onClose={onClose}
          onPin={onPin}
          onScore={onScore}
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
