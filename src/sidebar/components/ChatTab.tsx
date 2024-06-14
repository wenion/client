import { useCallback, useEffect, useState, useRef, useMemo } from 'preact/hooks';

import classnames from 'classnames';
import { withServices } from '../service-context';
import type { APIService } from '../services/api';
import type { ToastMessengerService } from '../services/toast-messenger';
import NotebookView from './query/NotebookView';
import Search from './query/Search';
import { QueryService } from '../services/query';

export type ChatTabProps = {
  // injected
  api: APIService;
  toastMessenger: ToastMessengerService;
  mode: 'Baseline' | 'GoldMind' | 'Query';
  queryService: QueryService;
};

/**
 * The main content of the "stream" route (https://hypothes.is/stream)
 */
function ChatTab({ api, toastMessenger, mode, queryService }: ChatTabProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onQuery = (event: Event) => {
    queryService.queryActivity(inputRef.current!.value);
  }

  useEffect(()=> {
    const el = inputRef.current!;
    if (el) {
      el.value = queryService.getQueryWord() ?? '';
    }
  }, [])

  return (
    <div className='chat-height'>
      {mode === 'Baseline' && (
        <iframe
          src="https://chat.kmass.io"
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

export default withServices(ChatTab, ['api', 'toastMessenger', 'queryService']);
