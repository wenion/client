import { Overlay, Panel, Input, Button, Spinner } from '@hypothesis/frontend-shared';
import { useEffect, useRef, useState } from 'preact/hooks';

import { useSidebarStore } from '../store';
import { withServices } from '../service-context';
import type { FrameSyncService } from '../services/frame-sync';
import type { RecordingService } from '../services/recording';
import TimelineList from './TimelineList';
import RecordingList from './RecordingList';
import { generateRandomString } from '../../shared/random';


function generateSessionId() {
  return 'se' + Date.now().toString(36) + generateRandomString(5);
}


type RecordingPopupProps = {
  frameSync: FrameSyncService;
};

function RecordingPopup({
  frameSync,
}: RecordingPopupProps) {
  const nameEl = useRef<HTMLInputElement>();
  const descriptionEl = useRef<HTMLInputElement>();
  const startEl = useRef<HTMLInputElement>();

  const [nameFeedback, setNameFeedback] = useState('success')
  const [descriptionFeedback, setDescriptionFeedback] = useState('success')

  const notifyRecordingStatus = (status: 'off' | 'ready' | 'on', taskName?: string, sessionId?: string, description?: string) => {
    frameSync.updateRecordingStatusView(status);
    frameSync.refreshRecordingStatus(status, taskName, sessionId, description)
    frameSync.notifyHost('updateRecoringStatusFromSidebar', status)
  }

  const startRecord = () => {
    if (!nameEl.current!.value || nameEl.current!.value.trim() == '') {
      setNameFeedback('error')
      return;
    }
    if (!descriptionEl.current!.value || descriptionEl.current!.value.trim() == '') {
      setDescriptionFeedback('error')
      return;
    }

    if (nameEl.current!.value && descriptionEl.current!.value) {
      setNameFeedback('success')
      setDescriptionFeedback('success')
      notifyRecordingStatus('on', nameEl.current!.value.trim(), generateSessionId(), descriptionEl.current!.value.trim())
    }
  }

  const cancelRecord = () => {
    notifyRecordingStatus('off')
  }

  return (
    <Overlay>
      <div className='flex items-center'>
        <Panel title='New ShareFlow'>
          <div className='flex items-center'>
            <label htmlFor='input-with-label' className='min-w-28 font-semibold'>
              Task name
            </label>
            <Input classes='min-w-64' elementRef={nameEl} feedback={nameFeedback == 'error'?'error':undefined} placeholder="" />
          </div>
          <div className='flex items-center'>
            <label htmlFor='input-with-label' className='min-w-28 font-semibold'>
              Description
            </label>
            <Input classes='min-w-64' elementRef={descriptionEl} feedback={descriptionFeedback == 'error'? 'error': undefined} placeholder="" />
          </div>
          <div className='flex items-center'>
            <label htmlFor='input-with-label' className='min-w-28 font-semibold'>
              Start time
            </label>
            <Input elementRef={startEl} placeholder="now" disabled />
          </div>
          <div className='flex items-center'>
            <Button onClick={() => startRecord()}>
              Record
            </Button>
            <div className='grow'/>
            <Button onClick={() => cancelRecord()}>
              Cancel
            </Button>
          </div>
        </Panel>
      </div>
    </Overlay>
  )
}

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

  const recordingStage = store.currentRecordingStage();
  const selectedRecording = store.getSelectedRecording();
  const deleteConfirmation = store.deleteConfirmation();
  const taskName = recordingService.getExtensionStatus().recordingTaskName;

  const onSelectImage = (id: string) => {
    // get from recordings
    const selectedStep = store.getSelectedRecordingStep();
    if (selectedStep) {
      frameSync.notifyHost('openImageViewer', selectedStep)
    }
  }

  const deleteRecording = () => {
    if (selectedRecording) {
      recordingService.deleteRecording(selectedRecording.taskName)
    }
  }

  return (
    <>
      {recordingStage === 'Request' && (
        <>
          <RecordingList />
          <RecordingPopup frameSync={frameSync}/>
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
      {recordingStage === 'Idle' && selectedRecording == null && (
        <RecordingList />
      )}
      {recordingStage === 'Idle' && selectedRecording != null && !deleteConfirmation && (
        <TimelineList recording={selectedRecording} onSelectImage={onSelectImage}/>
      )}
      {recordingStage === 'Idle' && selectedRecording != null && deleteConfirmation && (
        <>
        <RecordingList />
        <Overlay class='bg-black/80' onClick={()=>store.resetDeleteConfirmation()}>
          <div className='flex items-center'>
            <Panel title='Confirm Delete' onClick={(event)=>event.stopPropagation()} buttons={<>
              <Button onClick={()=>store.resetDeleteConfirmation()}>
                Cancel
              </Button>
              <Button onClick={()=>deleteRecording()}variant="primary">
                Delete
              </Button>
            </>}>
              <p>Are you sure you want to delete "<b>{selectedRecording.taskName}</b>"?</p>
            </Panel>
          </div>
        </Overlay>
      </>
      )}
    </>
  );
}

export default withServices(RecordingTab, ['frameSync', 'recordingService',]);
