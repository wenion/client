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
  recordingService: RecordingService;
};

function RecordingPopup({
  frameSync,
  recordingService,
}: RecordingPopupProps) {
  const store = useSidebarStore();
  const nameEl = useRef<HTMLInputElement>();
  const descriptionEl = useRef<HTMLInputElement>();
  const startEl = useRef<HTMLInputElement>();

  const [nameFeedback, setNameFeedback] = useState('success')
  const [descriptionFeedback, setDescriptionFeedback] = useState('success')

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
      recordingService.createNewRecording(nameEl.current!.value.trim(), generateSessionId(), descriptionEl.current!.value.trim())
      setNameFeedback('success')
      setDescriptionFeedback('success')
      frameSync.notifyHost('startRecord', nameEl.current!.value.trim());
    }
    else {

    }
  }

  const cancelRecord = () => {
    store.changeRecordingStage('Idle')
  }
  return (
    <Overlay>
      <div className='flex items-center'>
        <Panel title='Recording details'>
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
  const newRecording = store.getNewRecording();

  return (
    <>
      {recordingStage === 'Request' && (
        <>
          <RecordingList />
          <RecordingPopup frameSync={frameSync} recordingService={recordingService}/>
        </>
      )}
      {recordingStage === 'Start' && (
        <>
          <RecordingList />
          <Overlay>
            <div className='flex items-center'>
              <Spinner color='text' size='lg'/>
              <div className='text-2xl'>{newRecording && newRecording.taskName + '  is recording now...'}</div>
            </div>
          </Overlay>
        </>
      )}
      {recordingStage === 'Idle' && selectedRecording == null && (
        <RecordingList />
      )}
      {recordingStage === 'Idle' && selectedRecording != null && (
        <TimelineList recording={selectedRecording} />
      )}
    </>
  );
}

export default withServices(RecordingTab, ['frameSync', 'recordingService',]);
