import { useEffect, useRef, useState } from 'preact/hooks';
import {
  Tab,
} from '@hypothesis/frontend-shared';

import classnames from 'classnames';
import { tabForAnnotation } from '../helpers/tabs';
import { withServices } from '../service-context';
import type { FrameSyncService } from '../services/frame-sync';
import type { LoadAnnotationsService } from '../services/load-annotations';
import type { RecordingService } from '../services/recording';
import type { StreamerService } from '../services/streamer';
import { useSidebarStore } from '../store';
import LoggedOutMessage from './LoggedOutMessage';
import LoginPromptPanel from './LoginPromptPanel';
import SelectionTabs from './SelectionTabs';
import SidebarContentError from './SidebarContentError';
import ThreadList from './ThreadList';
import VideoThreadList from './VideoThreadList';
import MessageTab from './MessageTab';
import RecordingTab from './RecordingTab';
import ChatTab from './ChatTab';
import { useRootThread } from './hooks/use-root-thread';
import { useRootVideoThread } from './hooks/use-root-video-thread';
import FilterStatus from './old-search/FilterStatus';
import FilterAnnotationsStatus from './search/FilterAnnotationsStatus';

export type SidebarViewProps = {
  onLogin: () => void;
  onSignUp: () => void;

  // injected
  frameSync: FrameSyncService;
  loadAnnotationsService: LoadAnnotationsService;
  recordingService: RecordingService;
  streamer: StreamerService;
};

/**
 * Render the content of the sidebar, including tabs and threads (annotations)
 */
function SidebarView({
  frameSync,
  onLogin,
  onSignUp,
  loadAnnotationsService,
  recordingService,
  streamer,
}: SidebarViewProps) {
  const rootThread = useRootThread();
  const rootVideoThread = useRootVideoThread();

  // Store state values
  const store = useSidebarStore();
  const focusedGroupId = store.focusedGroupId();
  const hasAppliedFilter =
    store.hasAppliedFilter() || store.hasSelectedAnnotations();
  const isLoading = store.isLoading();
  const isLoggedIn = store.isLoggedIn();

  const linkedAnnotationId = store.directLinkedAnnotationId();
  const linkedAnnotation = linkedAnnotationId
    ? store.findAnnotationByID(linkedAnnotationId)
    : undefined;
  const directLinkedTab = linkedAnnotation
    ? tabForAnnotation(linkedAnnotation)
    : 'annotation';

  const searchUris = store.searchUris();
  const selectedTab = store.selectedTab();
  const sidebarHasOpened = store.hasSidebarOpened();
  const userId = store.profile().userid;
  const mode = store.getDefault('mode') as 'Baseline' | 'GoldMind' ;

  // If, after loading completes, no `linkedAnnotation` object is present when
  // a `linkedAnnotationId` is set, that indicates an error
  const hasDirectLinkedAnnotationError =
    !isLoading && linkedAnnotationId ? !linkedAnnotation : false;

  const hasDirectLinkedGroupError = store.directLinkedGroupFetchFailed();

  const hasContentError =
    hasDirectLinkedAnnotationError || hasDirectLinkedGroupError;

  const searchPanelEnabled = store.isFeatureEnabled('search_panel');
  const showFilterStatus = !hasContentError && !searchPanelEnabled;
  const showTabs = (!hasContentError && !hasAppliedFilter) && selectedTab !== 'chat';

  // Show a CTA to log in if successfully viewing a direct-linked annotation
  // and not logged in
  const showLoggedOutMessage =
    linkedAnnotationId &&
    !isLoggedIn &&
    !hasDirectLinkedAnnotationError &&
    !isLoading;

  const prevGroupId = useRef(focusedGroupId);

  // Reload annotations when group, user or document search URIs change
  useEffect(() => {
    if (!prevGroupId.current || prevGroupId.current !== focusedGroupId) {
      // Clear any selected annotations and filters when the focused group
      // changes.
      // We don't clear the selection/filters on the initial load when
      // the focused group transitions from null to non-null, as this would clear
      // any filters intended to be used for the initial display (eg. to focus
      // on a particular user).
      if (prevGroupId.current) {
        // Respect applied focus-mode filtering when changing focused group
        const restoreFocus = store.focusState().active;

        store.clearSelection();
        if (restoreFocus) {
          store.toggleFocusMode({ active: true });
        }
      }
      prevGroupId.current = focusedGroupId;
    }
    if (focusedGroupId && searchUris.length) {
      loadAnnotationsService.load({
        groupId: focusedGroupId,
        uris: searchUris,
      });
    }
  }, [store, loadAnnotationsService, focusedGroupId, userId, searchUris]);

  useEffect(() => {
    if (isLoggedIn) {
      const topLevelFrame = store.mainFrame();
      if (topLevelFrame && topLevelFrame.uri)
        recordingService.loadBatchRecords(topLevelFrame.uri)
    }
    else {
      recordingService.unloadRecords();
      store.clearMessages();
    }
    // const mainFrame = store.mainFrame();
    // if (isLoggedIn && mainFrame && mainFrame.uri){
    //   queryService.getRecommendation(mainFrame.uri).then(
    //     result => frameSync.notification(result)
    //   )
    // }
  }, [store, isLoggedIn])

  // When a `linkedAnnotationAnchorTag` becomes available, scroll to it
  // and focus it
  useEffect(() => {
    if (linkedAnnotation && linkedAnnotation.$orphan === false) {
      frameSync.hoverAnnotation(linkedAnnotation);
      frameSync.scrollToAnnotation(linkedAnnotation);
      store.selectTab(directLinkedTab);
    } else if (linkedAnnotation) {
      // Make sure to allow for orphaned annotations (which won't have an anchor)
      store.selectTab(directLinkedTab);
    }
  }, [directLinkedTab, frameSync, linkedAnnotation, store]);

  // Connect to the streamer when the sidebar has opened or if user is logged in
  const hasFetchedProfile = store.hasFetchedProfile();
  useEffect(() => {
    if (hasFetchedProfile && (sidebarHasOpened || isLoggedIn)) {
      streamer.connect({ applyUpdatesImmediately: false });
    }
  }, [hasFetchedProfile, isLoggedIn, sidebarHasOpened, streamer]);

  return (
    <div>
      {mode === 'Baseline' && (
        <ChatTab mode={mode}/>
      )}
      {mode === 'GoldMind' && (
        <>
          <h2 className="sr-only">Annotations</h2>
          {showFilterStatus && <FilterStatus />}
          {searchPanelEnabled && <FilterAnnotationsStatus />}
          <LoginPromptPanel onLogin={onLogin} onSignUp={onSignUp} />
          {hasDirectLinkedAnnotationError && (
            <SidebarContentError
              errorType="annotation"
              onLoginRequest={onLogin}
              showClearSelection={true}
            />
          )}
          {hasDirectLinkedGroupError && (
            <SidebarContentError errorType="group" onLoginRequest={onLogin} />
          )}
          {showTabs && <SelectionTabs isLoading={isLoading} />}
          {selectedTab == 'chat' && <ChatTab mode={mode}/>}
          {selectedTab == 'video' && <VideoThreadList threads={rootVideoThread.children} />}
          {selectedTab == 'message' && <MessageTab />}
          {selectedTab == 'recording' && <RecordingTab />}
          {selectedTab == 'annotation' && (
            <ThreadList threads={rootThread.children}/>
          )}
          {showLoggedOutMessage && <LoggedOutMessage onLogin={onLogin} />}
        </>
      )}
    </div>
  );
}

export default withServices(SidebarView, [
  'frameSync',
  'loadAnnotationsService',
  'recordingService',
  'streamer',
]);
