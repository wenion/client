import {
  FolderIcon,
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
import ThirdPartyMenu from './ThirdPartyMenu';
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
          <IconButton
            icon={ShareIcon}
            onClick={toggleSavePanel}
            size="xs"
            title="Save the page to your repository"
          />
          {isSidebar && (
            <>
              <PendingUpdatesButton />
              <SearchInput
                query={filterQuery || null}
                onSearch={store.setFilterQuery}
              />
              <SortMenu />
              <ThirdPartyMenu />
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
