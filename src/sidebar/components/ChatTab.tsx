import { useCallback, useEffect, useState, useRef, useMemo } from 'preact/hooks';

import classnames from 'classnames';
import { withServices } from '../service-context';
import { username } from '../helpers/account-id';
import type { APIService } from '../services/api';
import type { ToastMessengerService } from '../services/toast-messenger';
import type { RecordingService } from '../services/recording';
import { useSidebarStore } from '../store';
import NotebookView from './query/NotebookView';
import Search from './query/Search';
import { QueryService } from '../services/query';

export type ChatTabProps = {
  // injected
  api: APIService;
  toastMessenger: ToastMessengerService;
  mode: 'Baseline' | 'GoldMind' | 'Query';
  queryService: QueryService;
  recordingService: RecordingService;
};

/**
 * The main content of the "stream" route (https://hypothes.is/stream)
 */
function ChatTab({ api, toastMessenger, mode, queryService, recordingService}: ChatTabProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const baselineRef = useRef<HTMLIFrameElement | null>(null);
  const store = useSidebarStore();
  const subjectId = username(store.profile().userid);
  const taskId = recordingService.getExtensionStatus().recordingTaskName;
  const model = store.getDefault('model');
  const token = store.getDefault('token');

  const onQuery = (event: Event) => {
    queryService.queryActivity(inputRef.current!.value);
  }

  useEffect(()=> {
    const el = inputRef.current!;
    if (el) {
      el.value = queryService.getQueryWord() ?? '';
    }
  }, [])

  const link = useMemo(()=> {
    return `https://chat.kmass.io/?model=${model}&task_id=${taskId}&subject_id=${subjectId}&token=${token}`
  }, [subjectId, taskId, model, token])

  useEffect(()=> {
    const bl = baselineRef.current!;
    if (bl && subjectId && taskId !== '' && model && token) {
      bl.src = link;
    }
    else if (bl) {
      bl.src = 'https://chat.kmass.io/'
    }
  }, [subjectId, taskId, model, token])

  return (
    <div className='chat-height'>
      {mode === 'Baseline' && (
        <iframe
          ref={baselineRef}
          src="https://chat.kmass.io/"
          title="Baseline Tool"
          className={classnames('w-full h-full')}
        />
      )}
      {mode === 'Query' && (
        <>
          <Search inputRef={inputRef} onQuery={onQuery}/>
          <NotebookView />
        </>
      )}
    </div>
  );
}

export default withServices(ChatTab, ['api', 'toastMessenger', 'queryService', 'recordingService']);
