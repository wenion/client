import { Overlay, Panel, Input, Button } from '@hypothesis/frontend-shared';
import { useEffect, useRef, useState } from 'preact/hooks';

import { useSidebarStore } from '../store';
import { withServices } from '../service-context';
import type { FrameSyncService } from '../services/frame-sync';
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
  const timeEl = useRef<HTMLInputElement>();

  const items = [
    {id: '1', name: 'now', value: 0},
    {id: '2', name: '5 seconds ago', value: -5},
    {id: '3', name: '1 minute ago', value: -60},
    {id: '4', name: '3 minutes ago', value: -60 * 3},
    {id: '5', name: '5 minutes ago', value: -60 * 5},
  ]

  const [nameFeedback, setNameFeedback] = useState('success')
  const [descriptionFeedback, setDescriptionFeedback] = useState('success')
  const [timeFeedback, setTimeFeedback] = useState('success')

  // const [selected, setSelected] = useState<{ id: string; name: string, value: number }>(items[0]);

  const notifyRecordingStatus = (status: 'off' | 'ready' | 'on', taskName?: string, sessionId?: string, description?: string, selected?: number) => {
    frameSync.updateRecordingStatusView(status);
    frameSync.refreshRecordingStatus(status, taskName, sessionId, description, selected, store.focusedGroupId()?? '')
    frameSync.notifyHost('updateRecoringStatusFromSidebar', {status: status})
  }

  const startRecord = () => {
    const taskName = nameEl.current!.value.trim();
    const description = descriptionEl.current!.value.trim();
    const startTime = parseInt(timeEl.current!.value);
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

    if (Number.isNaN(startTime) || startTime < -1800 || startTime > 0) {
      setTimeFeedback('error')
      return;
    }
    else {
      setTimeFeedback('success')
    }

    if (taskName !== '' && description !== '') {
      notifyRecordingStatus('on', taskName, generateSessionId(), description, startTime)
    }
  }

  const cancelRecord = () => {
    notifyRecordingStatus('off')
  }

  return (
    <Overlay>
      <div className='flex items-center'>
        <Panel title='New ShareFlow' onClose={() =>cancelRecord()}>
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
              Backdate time (secs)
            </label>
            <Input aria-label="Enter the start time in seconds" classes='min-w-64' elementRef={timeEl} placeholder={'Maximum value allowed is: -1800'} feedback={timeFeedback == 'error'? 'error': undefined} />

            {/* <SelectNext
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
            </SelectNext> */}
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

export default withServices(RecordingPopup, ['frameSync',]);
