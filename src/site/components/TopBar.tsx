import {
  FolderIcon,
  EditIcon,
  IconButton,
  LinkButton,
} from '@hypothesis/frontend-shared';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { route } from 'preact-router';

import type { SidebarSettings } from '../../types/config';
import { applyTheme } from '../../sidebar/helpers/theme';
import { withServices } from '../../sidebar/service-context';
import type { FileTreeService } from '../../sidebar/services/file-tree';
import type { FrameSyncService } from '../../sidebar/services/frame-sync';
import type { QueryService } from '../../sidebar/services/query';
import { useSidebarStore } from '../../sidebar/store';
import ThirdPartyMenu from './ThirdPartyMenu';
import Search from './Search';
import UserMenu from './UserMenu';
import LogoIcon from '../static/logo';
import ExtensionIcon from '../static/extension';

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
  queryService: QueryService;
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
  frameSync,
  queryService,
  settings,
}: TopBarProps) {
  const loginLinkStyle = applyTheme(['accentColor'], settings);

  const store = useSidebarStore();
  const isLoggedIn = store.isLoggedIn();
  const hasFetchedProfile = store.hasFetchedProfile();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const recordItem = store.getRecordItem();
  const profile = store.profile();

  const toggleFileTreeView = () => {
    window.location.href = '/files';
  };

  const own = useMemo(()=> {
    return profile.userid === recordItem?.userid;
  }, [profile, recordItem])

  const showEdit = useMemo(() => {
    const [first, shareflow, id] = window.location.pathname.split("/");
    const isShareflow = shareflow === "shareflow";
    if (isLoggedIn && isShareflow && id) {
      return true;
    }
    return false;
  }, [isLoggedIn]);

  const displayMode = useMemo(() => {
    if (showEdit && window.location.pathname.endsWith("/edit")) {
      return "Save";
    }
    return "Edit";
  }, [showEdit]);

  const toggleEditMode = () => {
    const pathname = window.location.pathname;
    if (pathname.endsWith('/edit')) {
      route(pathname.slice(0, -5));
    } else {
      route(pathname + "/edit");
    }
  };

  const param = window.location.search.match(/[\?&]q=([^&]+)/);
  useEffect(() => {
    if (param) {
      const el = inputRef.current!;
      const queryWord = param[1]!.replace(/\+/g, ' ');
      el.value = decodeURIComponent(queryWord);
      queryService.queryActivity(queryWord);
    }
  }, []);

  return (
    <div>
      <header class="nav-bar">
        <div class="nav-bar__content justify-center">
          <a href="https://colam.kmass.cloud.edu.au/" title="GoldMind homepage" class="nav-bar__logo-container mx-12">
            <LogoIcon />
          </a>
          {!showEdit && (<Search inputRef={inputRef} />)}
          <nav className="nav-bar-links mx-14">
            {isLoggedIn && !showEdit ? (
              <>
                <ThirdPartyMenu />
                <a class='p-1' href={store.getLink('download')}>
                  <ExtensionIcon />
                </a>
                <span class='p-1'>
                  <IconButton
                    icon={FolderIcon}
                    onClick={toggleFileTreeView}
                    size="xs"
                    title="Browser cloud repository"
                  />
                </span>
                <UserMenu onLogout={onLogout} />
              </>
            ) : (
              <div
                className="flex items-center text-md font-medium space-x-1 nav-bar-links__item"
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
          </nav>
          {showEdit && own && (
            <div
              className="flex m-auto border border-black rounded-sm cursor-pointer"
            >
              <IconButton
                icon={EditIcon}
                onClick={toggleEditMode}
                size="lg"
                title="Edit Shareflow"
              >
                {displayMode}
              </IconButton>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default withServices(TopBar, ['fileTreeService', 'frameSync', 'settings', 'queryService']);
