import { Link, Panel } from '@hypothesis/frontend-shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import scrollIntoView from 'scroll-into-view';

import { convertResponseToThread } from '../../../site/helpers/build-thread';
import { withServices } from '../../service-context';
import type { QueryService } from '../../services/query';
import { useSidebarStore } from '../../store';
import PaginatedThreadList from './PaginatedThreadList';

export type NotebookViewProps = {
  // injected
  queryService: QueryService;
  // streamer: StreamerService;
};
/**
 * The main content of the "notebook" route (chrome-extension://extension_id/query.html)
 *
 * @param {NotebookViewProps} props
 */
function NotebookView({ queryService }: NotebookViewProps) {
  const store = useSidebarStore();

  const filters = store.getFilterValues();
  const focusedGroup = store.focusedGroup();
  const isLoading = store.isLoading();
  const resultCount = store.annotationResultCount();

  const responseData = convertResponseToThread();

  const lastPaginationPage = useRef(1);
  const [paginationPage, setPaginationPage] = useState(1);

  const [hasTooManyAnnotationsError, setHasTooManyAnnotationsError] =
    useState(false);

  // Load all annotations in the group, unless there are more than 5000
  // of them: this is a performance safety valve.
  const maxResults = 5000;

  const onChangePage = (newPage: number) => {
    setPaginationPage(newPage);
  };

  // When filter values or focused group are changed, reset pagination to page 1
  useEffect(() => {
    onChangePage(1);
  }, [filters, focusedGroup]);

  // Scroll back to here when pagination page changes
  const threadListScrollTop = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    // TODO: Transition and effects here should be improved
    if (paginationPage !== lastPaginationPage.current) {
      if (threadListScrollTop.current) {
        scrollIntoView(threadListScrollTop.current);
      }
      lastPaginationPage.current = paginationPage;
    }
  }, [paginationPage]);

  return (
    <div>
      <div className="text-xl my-4 break-all" data-testid="notebook-group-name">
        Search results for: {queryService.getQueryWord()}
      </div>
      <p className="text-xl">
        {
          responseData.isErrorOccurred ? 'Sorry, error occurred! Error message: ' + responseData.status :
            responseData.children.length == 0 ? '' : responseData.children.length + ' results found'
        }
      </p>
      <hr class="mx-auto bg-black my-2" />
      <div>
        {hasTooManyAnnotationsError && (
          <div className="py-4" data-testid="notebook-messages">
            <Panel title="Too many results to show">
              <p>
                This preview of the Notebook can show{' '}
                <strong>up to {maxResults} results</strong> at a time (there are{' '}
                {resultCount} to show here).
              </p>
              <p>
                <Link
                  href="mailto:goldmindtools@gmail.com?subject=Hypothesis%20Notebook&body=Please%20notify%20me%20when%20the%20Hypothesis%20Notebook%20is%20updated%20to%20support%20more%20than%205000%20annotations"
                  underline="always"
                >
                  Contact us
                </Link>{' '}
                if you would like to be notified when support for more
                annotations is available.
              </p>
            </Panel>
          </div>
        )}
        <PaginatedThreadList
          currentPage={paginationPage}
          isLoading={isLoading}
          onChangePage={onChangePage}
          threads={responseData.children}
        />
      </div>
    </div>
  );
}

export default withServices(NotebookView, [
  'queryService',
]);
