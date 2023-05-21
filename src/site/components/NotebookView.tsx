import { Link, Panel } from '@hypothesis/frontend-shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import scrollIntoView from 'scroll-into-view';

import { convertResponseToThread } from '../helpers/build-thread';
import { ResultSizeError } from '../../sidebar/search-client';
import { withServices } from '../../sidebar/service-context';
import type { LoadAnnotationsService } from '../../sidebar/services/load-annotations';
import type { QueryService } from '../../sidebar/services/query';
import type { StreamerService } from '../../sidebar/services/streamer';
import { useSidebarStore } from '../../sidebar/store';
import PaginatedThreadList from './PaginatedThreadList';

export type NotebookViewProps = {
  // injected
  loadAnnotationsService: LoadAnnotationsService;
  queryService: QueryService;
  streamer: StreamerService;
};
/**
 * The main content of the "notebook" route (chrome-extension://extension_id/query.html)
 *
 * @param {NotebookViewProps} props
 */
function NotebookView({ loadAnnotationsService, queryService, streamer }: NotebookViewProps) {
  const store = useSidebarStore();

  const filters = store.getFilterValues();
  const focusedGroup = store.focusedGroup();
  const isLoading = store.isLoading();
  const resultCount = store.annotationResultCount();

  const responseData = convertResponseToThread();

  // Get the ID of the group to fetch annotations from.
  //
  // Once groups have been fetched and one has been focused, use its ID. If
  // groups haven't been fetched yet but we know the ID of the group that is
  // likely to be focused (eg. because the notebook has been configured to
  // display a particular group when launched), we can optimistically fetch
  // annotations from that group.
  const groupId = focusedGroup?.id || store.directLinkedGroupId();

  const lastPaginationPage = useRef(1);
  const [paginationPage, setPaginationPage] = useState(1);

  const [hasTooManyAnnotationsError, setHasTooManyAnnotationsError] =
    useState(false);

  // Load all annotations in the group, unless there are more than 5000
  // of them: this is a performance safety valve.
  const maxResults = 5000;

  const onLoadError = (error: Error) => {
    if (error instanceof ResultSizeError) {
      setHasTooManyAnnotationsError(true);
    }
  };

  const hasFetchedProfile = store.hasFetchedProfile();

  // Establish websocket connection
  useEffect(() => {
    if (hasFetchedProfile) {
      streamer.connect({ applyUpdatesImmediately: false });
    }
  }, [hasFetchedProfile, streamer]);

  // Load all annotations; re-load if `focusedGroup` changes
  useEffect(() => {
    // NB: In current implementation, this will only happen/load once (initial
    // annotation fetch on application startup), as there is no mechanism
    // within the Notebook to change the `focusedGroup`. If the focused group
    // is changed within the sidebar and the Notebook re-opened, an entirely
    // new iFrame/app is created. This will need to be revisited.
    store.setSortKey('Newest');
    if (groupId) {
      loadAnnotationsService.load({
        groupId,
        // Load annotations in reverse-chronological order because that is how
        // threads are sorted in the notebook view. By aligning the fetch
        // order with the thread display order we reduce the changes in visible
        // content as annotations are loaded. This reduces the amount of time
        // the user has to wait for the content to load before they can start
        // reading it.
        //
        // Fetching is still suboptimal because we fetch both annotations and
        // replies together from the backend, but the user initially sees only
        // the top-level threads.
        sortBy: 'updated',
        sortOrder: 'desc',
        maxResults,
        onError: onLoadError,
        streamFilterBy: 'group',
      });
    }
  }, [loadAnnotationsService, groupId, store]);

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
    <div class="mb-8" data-testid="notebook-container">
      <header className="leading-none lg:col-span-2" ref={threadListScrollTop}>
        <h1 className="text-4xl font-robo my-12" data-testid="notebook-group-name">
          Search results for: {queryService.getQueryWord()}
        </h1>
        <p className="text-xl font-sans mb-8">
          {responseData.isErrorOccurred ? 'Sorry, error occurred! Error message: ' + responseData.status : responseData.children.length + ' results found'}
        </p>
        <hr class="mx-auto bg-black mb-8" />
      </header>
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
                  href="mailto:support@hypothes.is?subject=Hypothesis%20Notebook&body=Please%20notify%20me%20when%20the%20Hypothesis%20Notebook%20is%20updated%20to%20support%20more%20than%205000%20annotations"
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
  'loadAnnotationsService',
  'queryService',
  'streamer',
]);
