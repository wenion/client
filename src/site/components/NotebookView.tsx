import { Pagination } from '@hypothesis/frontend-shared';
import { useEffect, useMemo, useState } from 'preact/hooks';

import { useSidebarStore } from '../../sidebar/store';
import IntroductionPanel from './IntroductionPanel';
import ThreadList from './ThreadList';


export default function NotebookView() {
  const pageSize = 7;
  const store = useSidebarStore();

  const query = store.query();
  const queryResults = store.queryResults();
  const queryStatus = store.queryStatus();

  const [paginationPage, setPaginationPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const onChangePage = (newPage: number) => {
    setPaginationPage(newPage);
  };

  const visibleResults = useMemo(()=> {
    const start = (paginationPage - 1) * pageSize;
    const end = start + pageSize;
    return queryResults.slice(start, end);
  }, [paginationPage, queryResults]);

  useEffect(()=> {
    setTotalPages(Math.ceil(queryResults.length / pageSize));
    setPaginationPage(1);
  }, [queryResults]);

  return (
    <div class="mb-8" data-testid="notebook-container">
      <IntroductionPanel />
      <div>
        {query && (
          <div className="text-md my-4 break-all" data-testid="notebook-group-name">
            Search results for: <b>{query}</b>
          </div>
        )}
        {queryStatus && queryStatus !== '200' && (
          <p className="text-xl">
            'Sorry, error occurred! Error message: {queryStatus}'
          </p>
        )}
        <div>
          <ThreadList threads={visibleResults} />
          {query && (
            <Pagination
              currentPage={paginationPage}
              onChangePage={onChangePage}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>
    </div>
  );
}
