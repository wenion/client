import { Overlay, Panel, Input, Button, Spinner, SelectNext } from '@hypothesis/frontend-shared';
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
  const mode = store.getDefault('mode') as 'Baseline' | 'GoldMind' | 'Query';

  const recordingStage = store.currentRecordingStage();
  const selectedRecording = store.getSelectedRecord();
  const taskName = recordingService.getExtensionStatus().recordingTaskName;

  const onSelectImage = (id: string) => {
    // get from recordings
    const selectedStep = store.getSelectedRecordingStep();
    if (selectedStep) {
      frameSync.notifyHost('openImageViewer', selectedStep);
    }
  }

  // useEffect(() => {
  //   console.log("RecordingTab useEffect mode ")

  // }, [mode])

  useEffect(() => {
    if (selectedRecording && selectedRecording.action === 'view') {
      frameSync.notifyHost('expandSidebar', {action: 'open'});
    }
    else {
      //margin-left: -428px;
      frameSync.notifyHost('expandSidebar', {action: 'close'});
    }
  }, [selectedRecording]);

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
          <Overlay class='bg-black/80'>
            <div className='flex items-center'>
              <Spinner color='text' size='lg'/>
              <div className='text-2xl'>{taskName && taskName + '  is recording now...'}</div>
            </div>
          </Overlay>
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
              <TimelineList recording={selectedRecording} onSelectImage={onSelectImage} onDataComicsEvent={onDataComicsEvent}/>
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
