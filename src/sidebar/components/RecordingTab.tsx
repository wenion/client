import { Overlay, Panel, Input, Button, Spinner, SelectNext } from '@hypothesis/frontend-shared';
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
  const store = useSidebarStore();
  const nameEl = useRef<HTMLInputElement>();
  const descriptionEl = useRef<HTMLInputElement>();

  const items = [
    {id: '1', name: 'now', value: 0},
    {id: '2', name: '5 seconds ago', value: -5},
    {id: '3', name: '1 minute ago', value: -60},
    {id: '4', name: '3 minutes ago', value: -60 * 3},
    {id: '5', name: '5 minutes ago', value: -60 * 5},
  ]

  const [nameFeedback, setNameFeedback] = useState('success')
  const [descriptionFeedback, setDescriptionFeedback] = useState('success')
  const [selected, setSelected] = useState<{ id: string; name: string, value: number }>(items[0]);

  const notifyRecordingStatus = (status: 'off' | 'ready' | 'on', taskName?: string, sessionId?: string, description?: string, selected?: number) => {
    frameSync.updateRecordingStatusView(status);
    frameSync.refreshRecordingStatus(status, taskName, sessionId, description, selected, store.focusedGroupId()?? '')
    frameSync.notifyHost('updateRecoringStatusFromSidebar', status)
  }

  const startRecord = () => {
    const taskName = nameEl.current!.value.trim();
    const description = descriptionEl.current!.value.trim();
    if (taskName === '') {
      setNameFeedback('error')
      return;
    }
    else {
      setNameFeedback('success')
    }

    if (description === '') {
      setDescriptionFeedback('error')
      return;
    }
    else {
      setDescriptionFeedback('success')
    }

    if (taskName !== '' && description !== '') {
      notifyRecordingStatus('on', taskName, generateSessionId(), description, selected.value)
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
            <Input aria-label="Enter the task name" classes='min-w-64' elementRef={nameEl} feedback={nameFeedback == 'error'?'error':undefined} />
          </div>
          <div className='flex items-center'>
            <label htmlFor='input-with-label' className='min-w-28 font-semibold'>
              Description
            </label>
            <Input aria-label="Enter the description" classes='min-w-64' elementRef={descriptionEl} feedback={descriptionFeedback == 'error'? 'error': undefined} />
          </div>
          <div className='flex items-center'>
            <label htmlFor='input-with-label' className='min-w-28 font-semibold'>
              Start time
            </label>
            <SelectNext
              value={selected}
              onChange={setSelected}
              buttonContent={
                selected ? (
                  <>
                    {selected.name}
                  </>
                ) : (
                  <>Select one…</>
                )
              }
              aria-label={selected.name}
            >
              {items.map(item => (
                <SelectNext.Option value={item} key={item.id}>
                  {() => (
                    <>
                      {item.name}
                    </>
                  )}
                </SelectNext.Option>
              ))}
            </SelectNext>
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
  const selectedRecording = store.getSelectedRecord();
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
      recordingService.deleteRecording() // TODO use session id later
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
      {recordingStage === 'Idle' && selectedRecording && selectedRecording.action == 'view' && (
        <TimelineList recording={selectedRecording} onSelectImage={onSelectImage}/>
      )}
      {recordingStage === 'Idle' && selectedRecording && selectedRecording.action == 'delete' && (
        <>
          <RecordingList />
          <Overlay class='bg-black/80' onClick={()=>store.clearSelectedRecord()}>
            <div className='flex items-center'>
              <Panel title='Confirm Delete' onClick={(event)=>event.stopPropagation()} buttons={<>
                <Button onClick={()=>store.clearSelectedRecord()}>
                  Cancel
                </Button>
                <Button onClick={()=>deleteRecording()} variant="primary">
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
