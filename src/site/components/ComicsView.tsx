import { useCallback, useEffect, useState} from 'preact/hooks';
import classnames from 'classnames';

import {
  getElementHeightWithMargins,
} from '../../sidebar/util/dom';
import { withServices } from '../../sidebar/service-context';
import type { RecordingService } from '../../sidebar/services/recording';
import type { SessionService } from '../../sidebar/services/session';
import { useSidebarStore } from '../../sidebar/store';

import { ComicHeader, ComicItem, ImageComicsCard, TextComicsCard} from './ComicsCard';
import TopBar from './TopBar';

type ComicsViewProps = {
  // sessionId: string;
  /** Callback invoked when user clicks "Login" button */
  onLogin: () => void;

  /** Callback invoked when user clicks "Logout" action in account menu */
  onLogout: () => void;

  /** Callback invoked when user clicks "Sign up" button */
  onSignUp: () => void;
  session: SessionService;
  recordingService: RecordingService;
};

/**
 * The root component for the Hypothesis client.
 *
 * This handles login/logout actions and renders the top navigation bar
 * and content appropriate for the current route.
 */
function ComicsView({
  // sessionId,
  onLogin,
  onLogout,
  onSignUp,
  session,
  recordingService,
}: ComicsViewProps) {
  const store = useSidebarStore();
  const recordSteps = store.recordSteps();
  const links = store.getLink("index");

  const [id, setId] = useState< null | string>(null);

  useEffect(() => {
    const url = window.location.href;
    const queryString = url.split('?')[1] || '';
    const params = new URLSearchParams(queryString);
    setId(params.get('id')??null);
  }, []);

  useEffect(() => {
    if (id) {
      recordingService.getTracesById(id);
    }
  }, [id, links]);

  const [imageThreads, setImageThreads] = useState(() => new Map());
  const [threadHeights, setThreadHeights] = useState(() => new Map());

  let n = 0;
  let navId = 0;
  let dataId = 0;

  // When the set of TimelineCard height changes, recalculate the real rendered
  // heights of thread cards and update `threadHeights` state if there are changes.
  const onRendered = useCallback((id: string) => {
    const imageId = 'img' + id;
    const threadElement = document.getElementById(id)!;
    const imageElement = document.getElementById(imageId);

    setThreadHeights(prevHeights => {
      const changedHeights = new Map();

      if (!threadElement) {
        // This could happen if the `ThreadList` DOM is not connected to the document.
        //
        // Errors earlier in the render can also potentially cause this (see
        // https://github.com/hypothesis/client/pull/3665#issuecomment-895857072),
        // although we don't in general try to make all effects robust to that
        // as it is a problem that needs to be handled elsewhere.
        console.warn(
          'ThreadList could not measure thread. Element not found.',
        );
        return prevHeights;
      }

      if (threadElement && !threadElement.hasAttribute('data-id')) {
        return prevHeights;
      }

      let imageHeight = 0;
      // if (imageElement && imageElement.classList.contains('hidden')) {
      //   imageHeight = getElementHeightWithMargins(imageElement);
      // }

      const height = getElementHeightWithMargins(threadElement) - imageHeight;
      if (height !== prevHeights.get(id)) {
        changedHeights.set(id, height);
      }

    // Skip update if no heights changed from previous measured values
    // (or defaults).
    if (changedHeights.size === 0) {
      return prevHeights;
    }

    return new Map([...prevHeights, ...changedHeights]);
  });

  setImageThreads(prevThreads => {
    const changedThreads = new Map();
    if (imageElement) {
      if (prevThreads.has(imageId)) {
        changedThreads.set(imageId, true);
      } else {
        changedThreads.set(imageId, false);
      }
    }
    return new Map([...prevThreads, ...changedThreads]);
  });
  }, []);

  return (
    <div className="w-full">
      <TopBar
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
        isSidebar={true}
      />
      <div
        className={"mx-auto max-w-3xl"}
      >
        {/* <div style={{ height: offscreenUpperHeight }} /> */}
        {
          recordSteps.map((step, index) => {
            if (index !== n) {
              return;
            } else {
              if (step.tagName === "Navigate" || step.tagName === "Switch") {
                n++;
                navId++;
                dataId++;
                return (
                  <>
                    <ComicHeader
                      id ={navId}
                      dataId={dataId}
                      trace={step}
                      onElementSizeChanged={onRendered}
                      classes={classnames({ "data-comics-nav": navId !== 1 })}
                    />
                  </>
                )
              } else if (step.image) {
                let accumulated = 0;
                let i = index + 1;
                let current = recordSteps[i];
                while (
                  current &&
                  current.image === null &&
                  current.tagName !== "Navigate" &&
                  current.tagName !== "Switch" &&
                  accumulated < 2 // TODO decide by media screen size
                ) {
                  // calculate the number of the following step which is without the image
                  accumulated++;
                  i = i + 1;
                  current = recordSteps[i];
                }
                n = n + accumulated + 1;
                dataId++;
                return (
                  <ImageComicsCard
                    onImageClick={(id) => {}}
                    onElementSizeChanged={onRendered}
                    step={step}
                    dataId={dataId}
                  >
                    {recordSteps.slice(index, index + accumulated + 1).map(s =>
                      <ComicItem
                        trace={s}
                        isAlign={s.image ? true: false}
                        onElementSizeChanged={onRendered}
                      />
                    )}
                  </ImageComicsCard>
                )
              } else {
                let accumulated = 0;
                let i = index + 1;
                let current = recordSteps[i];
                while (
                  current &&
                  current.image === null &&
                  current.tagName !== "Navigate" &&
                  current.tagName !== "Switch" &&
                  accumulated < 1
                ) {
                  accumulated++;
                  i = i + 1;
                  current = recordSteps[i];
                }
                n = n + accumulated + 1;
                dataId++;
                return (
                  <TextComicsCard
                    step={step}
                    dataId={dataId}
                  >
                    {recordSteps.slice(index, index + accumulated + 1).map(s =>
                      <ComicItem
                        trace={s}
                        isAlign={s.image ? true: false}
                        onElementSizeChanged={onRendered}
                        classes='mr-0.5'
                      />
                    )}
                  </TextComicsCard>
                )
              }
            }
          })
        }
        {/* <div style={{ height: offscreenLowerHeight }} /> */}
      </div>
    </div>
  );
}

export default withServices(ComicsView, [
  'recordingService',
  'session',
]);
