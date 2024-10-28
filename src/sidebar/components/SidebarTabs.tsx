import {
  AnnotateIcon,
  Button,
  Card,
  CardContent,
  LinkButton,
  PlusIcon,
} from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import type { ComponentChildren } from 'preact';

import { pluralize } from '../../shared/pluralize';
import type { SidebarSettings } from '../../types/config';
import type { TabName } from '../../types/sidebar';
import { applyTheme } from '../helpers/theme';
import { withServices } from '../service-context';
import type { AnnotationsService } from '../services/annotations';
import { useSidebarStore } from '../store';
import ThreadList from './ThreadList';
import VideoThreadList from './VideoThreadList';
import { useRootThread } from './hooks/use-root-thread';
import { useRootVideoThread } from './hooks/use-root-video-thread';
import MessageTab from './MessageTab';
import RecordingTab from './RecordingTab';

const idForTab = (name: TabName) => `${name}-tab`;
const idForPanel = (name: TabName) => `${name}-panel`;

type TabProps = {
  children: ComponentChildren;

  /** The total number of annotations for this tab */
  count: number;

  /** Is this tab the currently-active tab? */
  isSelected: boolean;

  /** Are there any annotations still waiting to anchor? */
  isWaitingToAnchor: boolean;

  label: string;
  name: TabName;

  /** Callback to invoke when this tab is selected */
  onSelect: () => void;
};

/**
 * Display name of the tab and annotation count
 */
function Tab({
  children,
  count,
  isWaitingToAnchor,
  isSelected,
  label,
  onSelect,
  name,
}: TabProps) {
  const selectTab = () => {
    if (!isSelected) {
      onSelect();
    }
  };

  const title = count > 0 ? `${label} (${count} available)` : label;

  return (
    <LinkButton
      classes={classnames('bg-transparent min-w-[5.25rem]', {
        'font-bold': isSelected,
      })}
      variant="text"
      // Listen for `onMouseDown` so that the tab is selected when _pressed_
      // as this makes the UI feel faster. Also listen for `onClick` as a fallback
      // to enable selecting the tab via other input methods.
      onClick={selectTab}
      onMouseDown={selectTab}
      pressed={!!isSelected}
      role="tab"
      id={idForTab(name)}
      aria-controls={idForPanel(name)}
      tabIndex={0}
      title={title}
      underline="none"
    >
      <>
        {children}
        {count > 0 && !isWaitingToAnchor && (
          <span className="relative bottom-[3px] left-[2px] text-[10px]">
            {count}
          </span>
        )}
      </>
    </LinkButton>
  );
}

export type SidebarTabsProps = {
  /** Are we waiting on any annotations from the server? */
  isLoading: boolean;

  // injected
  settings: SidebarSettings;
  annotationsService: AnnotationsService;
};

/**
 * Tabbed display of annotations and notes
 */
function SidebarTabs({
  annotationsService,
  isLoading,
  settings,
}: SidebarTabsProps) {
  const { rootThread, tabCounts } = useRootThread();
  const rootVideoThread = useRootVideoThread();
  const store = useSidebarStore();
  const selectedTab = store.selectedTab();
  const noteCount = tabCounts.note;

  const allMessageCount = store.allMessageCount();
  const allRecordingsCount = store.allRecordingsCount();
  const videoAnnotationCount = store.videoAnnotationCount();

  const annotationCount = tabCounts.annotation;
  const orphanCount = tabCounts.orphan;
  const isWaitingToAnchorAnnotations = store.isWaitingToAnchorAnnotations();

  const selectTab = (tabId: TabName) => {
    store.selectTab(tabId);
  };

  const showAnnotationsUnavailableMessage =
    selectedTab === 'annotation' &&
    annotationCount === 0 &&
    !isWaitingToAnchorAnnotations;

  const showNotesUnavailableMessage = selectedTab === 'note' && noteCount === 0;

  const tabCountsSummaryPieces = [];
  if (annotationCount > 0) {
    const term = pluralize(annotationCount, 'annotation', 'annotations');
    tabCountsSummaryPieces.push(`${annotationCount} ${term}`);
  }
  if (noteCount > 0) {
    const term = pluralize(noteCount, 'note', 'notes');
    tabCountsSummaryPieces.push(`${noteCount} ${term}`);
  }
  if (orphanCount > 0) {
    const term = pluralize(noteCount, 'orphan', 'orphans');
    tabCountsSummaryPieces.push(`${orphanCount} ${term}`);
  }
  const tabCountsSummary = tabCountsSummaryPieces.join(', ');

  return (
    <>
      <div aria-live="polite" role="status" className="sr-only">
        {tabCountsSummary}
      </div>
      <div
        className={classnames(
          // 9px balances out the space above the tabs
          'space-y-3 pb-[9px]',
        )}
      >
        <div className="flex gap-x-6 theme-clean:ml-[15px] mt-1" role="tablist">
          <Tab
            count={annotationCount}
            isWaitingToAnchor={isWaitingToAnchorAnnotations}
            isSelected={selectedTab === 'annotation'}
            label="Annotations"
            name="annotation"
            onSelect={() => selectTab('annotation')}
          >
            Annotations
          </Tab>
          <Tab
            count={allRecordingsCount}
            isWaitingToAnchor={isWaitingToAnchorAnnotations}
            isSelected={selectedTab === 'recording'}
            label="ShareFlows"
            name="recording"
            onSelect={() => selectTab('recording')}
          >
            ShareFlows
          </Tab>
          <Tab
            count={allMessageCount}
            isWaitingToAnchor={isWaitingToAnchorAnnotations}
            isSelected={selectedTab === 'message'}
            label="Notifications"
            name="message"
            onSelect={() => selectTab('message')}
          >
            Notifications
          </Tab>
          {noteCount > 0 && (
            <Tab
              count={noteCount}
              isWaitingToAnchor={isWaitingToAnchorAnnotations}
              isSelected={selectedTab === 'note'}
              label="Page notes"
              name="note"
              onSelect={() => selectTab('note')}
            >
              Page Notes
           </Tab>
          )}
          {orphanCount > 0 && (
            <Tab
              count={orphanCount}
              isWaitingToAnchor={isWaitingToAnchorAnnotations}
              isSelected={selectedTab === 'orphan'}
              label="Orphans"
              name="orphan"
              onSelect={() => selectTab('orphan')}
            >
              Orphans
            </Tab>
          )}
          {/* <Tab
            count={videoAnnotationCount}
            isWaitingToAnchor={isWaitingToAnchorAnnotations}
            isSelected={selectedTab === 'video'}
            label="Video annotations"
            name="video"
            onSelect={() => selectTab('video')}
          >
            Video annotations
          </Tab> */}
        </div>
        <div
          className="space-y-3"
          role="tabpanel"
          id={idForPanel(selectedTab)}
          aria-labelledby={idForTab(selectedTab)}
        >
          {selectedTab === 'note' &&
            settings.enableExperimentalNewNoteButton && (
              <div className="flex justify-end">
                <Button
                  data-testid="new-note-button"
                  onClick={() => annotationsService.createPageNote()}
                  variant="primary"
                  style={applyTheme(['ctaBackgroundColor'], settings)}
                >
                  <PlusIcon />
                  New note
                </Button>
              </div>
            )}
          {!isLoading && showNotesUnavailableMessage && (
            <Card data-testid="notes-unavailable-message" variant="flat">
              <CardContent classes="text-center">
                There are no page notes in this group.
              </CardContent>
            </Card>
          )}
          {!isLoading && showAnnotationsUnavailableMessage && (
            <Card data-testid="annotations-unavailable-message" variant="flat">
              <CardContent
                // TODO: Remove !important spacing class after
                // https://github.com/hypothesis/frontend-shared/issues/676 is addressed
                classes="text-center !space-y-1"
              >
                <p>There are no annotations in this group.</p>
                <p>
                  Create one by selecting some text and clicking the{' '}
                  <AnnotateIcon
                    className="w-em h-em inline m-0.5 -mt-0.5"
                    title="Annotate"
                  />{' '}
                  button.
                </p>
              </CardContent>
            </Card>
          )}
          {selectedTab === 'message' && <MessageTab />}
          {selectedTab === 'recording' && <RecordingTab />}
          {/* {selectedTab == 'video' && <VideoThreadList threads={rootVideoThread.children} />} */}
          {(selectedTab === 'annotation' || selectedTab === 'note' || selectedTab === 'orphan' ) && (
            <ThreadList threads={rootThread.children} />
          )}
        </div>
      </div>
    </>
  );
}

export default withServices(SidebarTabs, ['annotationsService', 'settings']);
