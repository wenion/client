import { useMemo } from 'preact/hooks';

import { withServices } from '../service-context';
import type { RecordingService } from '../services/recording';
import { useSidebarStore } from '../store';
import ActionList from './ActionList';
import RecordingList from './RecordingList';
import TimelineList from './TimelineList';
import ComicList from './DataComics';
import type { RecordItem, RecordStep } from '../../types/api';

type RecordingTabProps = {
  recordingService: RecordingService;
};

function RecordingTab({
  recordingService,
}: RecordingTabProps) {
  const store = useSidebarStore();
  const allTraces = store.allTraces();

  const recordView = recordingService.getRecordTabView();

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

  const onNewPage = (sessionId: string, userid?: string) => {
    // if (userid) {
    //   frameSync.notifyHost('openNewPage', {sessionId: sessionId, userid: userid});
    // }
  }

  const onOpen = (record: RecordItem) => {
    let id = record.id;
    if (record.timestamp < 1733800000000) {
      id = record.sessionId;
    }
    recordingService.selectRecordTabView('view', id);
    recordingService.updateTracking(record.id);
  };

  const onClose = () => {
    recordingService.selectRecordTabView('list');
    recordingService.updateTracking();
  };

  return (
    <>
      {recordView === 'list' && (
        <RecordingList onOpen={onOpen}/>
      )}
      {recordView === 'view' && (
        <ComicList
          onRefreshStep={onRefreshStep}
          onClose={onClose}
        />
      )}
      {recordView === 'ongoing' && (
        <ActionList threads={rootAction}/>
      )}
    </>
  )
}

export default withServices(RecordingTab, ['recordingService',]);
