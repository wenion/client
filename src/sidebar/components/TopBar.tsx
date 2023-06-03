import {
  GlobeAltIcon,
  HelpIcon,
  IconButton,
  LinkButton,
  ShareIcon,
} from '@hypothesis/frontend-shared';
import classnames from 'classnames';

import type { SidebarSettings } from '../../types/config';
import { serviceConfig } from '../config/service-config';
import { isThirdPartyService } from '../helpers/is-third-party-service';
import { applyTheme } from '../helpers/theme';
import { withServices } from '../service-context';
import { FileTreeService } from '../services/file-tree';
import type { FrameSyncService } from '../services/frame-sync';
import { useSidebarStore } from '../store';
import GroupList from './GroupList';
import PendingUpdatesButton from './PendingUpdatesButton';
import SearchInput from './SearchInput';
import SortMenu from './SortMenu';
import StreamSearchInput from './StreamSearchInput';
import UserMenu from './UserMenu';

export type TopBarProps = {
  /** Flag indicating whether the app is in a sidebar context */
  isSidebar: boolean;

  /** Callback invoked when user clicks "Login" button */
  onLogin: () => void;

  /** Callback invoked when user clicks "Logout" action in account menu */
  onLogout: () => void;

  /** Callback invoked when user clicks "Sign up" button */
  onSignUp: () => void;

  // injected
  fileTreeService: FileTreeService;
  frameSync: FrameSyncService;
  settings: SidebarSettings;
};

/**
 * The toolbar which appears at the top of the sidebar providing actions
 * to switch groups, view account information, sort/filter annotations etc.
 */
function TopBar({
  isSidebar,
  onLogin,
  onLogout,
  onSignUp,
  fileTreeService,
  frameSync,
  settings,
}: TopBarProps) {
  const showSharePageButton = !isThirdPartyService(settings);
  const loginLinkStyle = applyTheme(['accentColor'], settings);

  const store = useSidebarStore();
  const filterQuery = store.filterQuery();
  const isLoggedIn = store.isLoggedIn();
  const hasFetchedProfile = store.hasFetchedProfile();

  const toggleSharePanel = () => {
    store.toggleSidebarPanel('shareGroupAnnotations');
  };

  const toggleFileTreePanel = () => {
    store.toggleSidebarPanel('fileTree');
  }

  const toggleSavePanel = (e: Event) => {
    fileTreeService.uploadFile();
  }

  const isHelpPanelOpen = store.isSidebarPanelOpen('help');
  const isAnnotationsPanelOpen = store.isSidebarPanelOpen(
    'shareGroupAnnotations'
  );
  const isFileTreePanelOpen = store.isSidebarPanelOpen('fileTree');

  /**
   * Open the help panel, or, if a service callback is configured to handle
   * help requests, fire a relevant event instead
   */
  const requestHelp = () => {
    const service = serviceConfig(settings);
    if (service && service.onHelpRequestProvided) {
      frameSync.notifyHost('helpRequested');
    } else {
      store.toggleSidebarPanel('help');
    }
  };

  const requestQuery = async () => {
    const link = await fileTreeService.getClientURL();
    if (!link){
      return;
    }
    window.parent.location = link;
  }

  return (
    <div
      className={classnames(
        'absolute h-10 left-0 top-0 right-0 z-4',
        'text-grey-7 border-b theme-clean:border-b-0 bg-white'
      )}
      data-testid="top-bar"
    >
      <div
        className={classnames(
          'container flex items-center h-full',
          // Text sizing will size icons in buttons correctly
          'text-[16px]'
        )}
        data-testid="top-bar-content"
      >
        {isSidebar ? <GroupList /> : <StreamSearchInput />}
        <div className="grow flex items-center justify-end">
          <button onClick={toggleSavePanel} title="Save the page to your repository">
            <span className="p-1">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20"><path d="M816-672v456q0 29.7-21.15 50.85Q773.7-144 744-144H216q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h456l144 144Zm-72 30L642-744H216v528h528v-426ZM480-252q45 0 76.5-31.5T588-360q0-45-31.5-76.5T480-468q-45 0-76.5 31.5T372-360q0 45 31.5 76.5T480-252ZM264-552h336v-144H264v144Zm-48-77v413-528 115Z"/></svg>
            </span>
          </button>
          {/* <IconButton
            icon={ShareIcon}
            onClick={toggleSavePanel}
            size="xs"
            title="Save the page to your repository"
          /> */}
          {isSidebar && (
            <>
              <PendingUpdatesButton />
              <SearchInput
                query={filterQuery || null}
                onSearch={store.setFilterQuery}
              />
              <SortMenu />
              {/* <ThirdPartyMenu /> */}
            </>
          )}
          <IconButton
            icon={GlobeAltIcon}
            onClick={requestQuery}
            size="xs"
            title="Go to the querying page"
          />
          <IconButton
            icon={HelpIcon}
            expanded={isHelpPanelOpen}
            onClick={requestHelp}
            size="xs"
            title="Help"
          />
          {/* <IconButton
            icon={FolderIcon}
            expanded={isFileTreePanelOpen}
            onClick={toggleFileTreePanel}
            size="xs"
            title="Browser cloud repository"
          /> */}
          {isLoggedIn ? (
            <UserMenu onLogout={onLogout} />
          ) : (
            <div
              className="flex items-center text-md font-medium space-x-1"
              data-testid="login-links"
            >
              {!isLoggedIn && !hasFetchedProfile && <span>⋯</span>}
              {!isLoggedIn && hasFetchedProfile && (
                <>
                  <LinkButton
                    classes="inline"
                    onClick={onSignUp}
                    style={loginLinkStyle}
                  >
                    Sign up
                  </LinkButton>
                  <div>/</div>
                  <LinkButton
                    classes="inline"
                    onClick={onLogin}
                    style={loginLinkStyle}
                  >
                    Log in
                  </LinkButton>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withServices(TopBar, ['fileTreeService', 'frameSync', 'settings']);
