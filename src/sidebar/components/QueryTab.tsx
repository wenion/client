import { useEffect, useRef } from 'preact/hooks';

import { useShortcut } from '../../shared/shortcut';
import { withServices } from '../service-context';
import NotebookView from './query/NotebookView';
import Search from './query/Search';
import { QueryService } from '../services/query';

export type QueryTabProps = {
  queryService: QueryService;
};

/**
 * The main content of the "stream" route (https://hypothes.is/stream)
 */
function QueryTab({queryService}: QueryTabProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onQuery = () => {
    queryService.queryActivity(inputRef.current!.value);
  }

  useEffect(()=> {
    const el = inputRef.current!;
    if (el) {
      el.value = queryService.getQueryWord() ?? '';
    }
  }, [])

  useShortcut('Enter', () => onQuery());

  return (
    <div className='chat-height'>
      <Search inputRef={inputRef} onQuery={onQuery}/>
      <NotebookView />
    </div>
  );
}

export default withServices(QueryTab, ['queryService',]);
