import { Pagination } from '@hypothesis/frontend-shared';
import { useEffect, useMemo, useState } from 'preact/hooks';

import { useSidebarStore } from '../../store';
import ThreadList from './ThreadList';


/**
 * The main content of the "notebook" route (chrome-extension://extension_id/query.html)
 *
 * @param {NotebookViewProps} props
 */
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
      <hr class="mx-auto bg-black my-2" />
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
  );
}
