import { Overlay, Panel, Input, Button, Spinner } from '@hypothesis/frontend-shared';
import { useEffect, useRef, useState } from 'preact/hooks';

import { useSidebarStore } from '../store';
import { withServices } from '../service-context';
import type { FrameSyncService } from '../services/frame-sync';
import type { RecordingService } from '../services/recording';
import TimelineList from './TimelineList';
import RecordingList from './RecordingList';
import RecordingPopup from './RecordingPopup';
import type { RecordingStepData } from '../../types/api';


type RecordingTabProps = {
  frameSync: FrameSyncService;
  recordingService: RecordingService;
};

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
function RecordingTab({
  frameSync,
  recordingService,
}: RecordingTabProps) {

  const store = useSidebarStore();
  console.log("recording tab")

  const recordingStage = store.currentRecordingStage();
  const selectedRecording = store.getSelectedRecord();

  const onSelectImage = (id: string) => {
    // get from recordings
    const selectedStep = store.getSelectedRecordingStep();
    if (selectedStep) {
      frameSync.notifyHost('openImageViewer', selectedStep);
    }
  }

  const onNewPage = (sessionId: string, userid?: string) => {
    if (userid) {
      frameSync.notifyHost('openNewPage', {sessionId: sessionId, userid: userid});
    }
  }

  const onClose = () => {
    store.clearSelectedRecord();
    recordingService.updateTracking(undefined, '', 0)
    store.setStep(0);
  }

  const onDataComicsEvent = (step: RecordingStepData) => {
    frameSync.notifyHost('openImageViewer', step);
  }

  const deleteRecording = () => {
    if (selectedRecording) {
      recordingService.deleteRecording() // TODO use session id later
    }
  }

  return (
    <>
      {recordingStage === 'Request' && (
        <>
          <RecordingList />
          <RecordingPopup/>
        </>
      )}
      {recordingStage === 'Start' && (
        <>
          <RecordingList />
          {/* <Overlay class='bg-black/80'>
            <div className='flex items-center'>
              <Spinner color='text' size='lg'/>
              <div className='text-2xl'>{taskName && taskName + '  is recording now...'}</div>
            </div>
          </Overlay> */}
        </>
      )}
      {recordingStage === 'Idle' && (
        <>
          {selectedRecording ? (
            <>
            {selectedRecording.action == 'delete' ? (
              <>
                <RecordingList />
                <Overlay class='bg-black/80' onClick={()=>store.clearSelectedRecord()}>
                  <div className='flex items-center'>
                    <Panel title='Confirm Delete'
                      onClick={(event)=>event.stopPropagation()}
                      buttons={(
                        <>
                          <Button onClick={()=>store.clearSelectedRecord()}>Cancel</Button>
                          <Button onClick={()=>deleteRecording()} variant="primary">Delete</Button>
                        </>)}
                    >
                      <p>Are you sure you want to delete "<b>{selectedRecording.taskName}</b>"?</p>
                    </Panel>
                  </div>
                </Overlay>
              </>
            ) : (
              <TimelineList
                recording={selectedRecording}
                onSelectImage={onSelectImage}
                onDataComicsEvent={onDataComicsEvent}
                onNewPage={onNewPage}
                onClose={onClose}
              />
            )}
            </>
          ) : (
            <RecordingList />
          )}
        </>
      )}
    </>
  );
}

export default withServices(RecordingTab, ['frameSync', 'recordingService',]);
