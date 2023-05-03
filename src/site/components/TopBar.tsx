import {
  LinkButton,
} from '@hypothesis/frontend-shared/lib/next';
import { useEffect, useRef } from 'preact/hooks';

import type { SidebarSettings } from '../../types/config';
import { applyTheme } from '../../sidebar/helpers/theme';
import { withServices } from '../../sidebar/service-context';
import type { QueryService } from '../../sidebar/services/query';
import type { FrameSyncService } from '../../sidebar/services/frame-sync';
import { useSidebarStore } from '../../sidebar/store';
import Search from './Search';
import UserMenu from './UserMenu';
import LogoIcon from '../static/logo-monash';

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

  const param = window.location.search.match(/[\?&]q=([^&]+)/);
  useEffect(() => {
    if (param) {
      const el = inputRef.current!;
      el.value = param[1];
      queryService.queryActivity(param[1]);
    }
  }, [param]);

  return (
    <div>
      <header class="nav-bar">
        <div class="nav-bar__content justify-center">
          <a href="https://colam.kmass.cloud.edu.au/" title="CoLAM homepage" class="nav-bar__logo-container mx-12">
            <LogoIcon />
          </a>
          <Search inputRef={inputRef} />
          <nav className="nav-bar-links mx-14">
            {isLoggedIn ? (
              <UserMenu onLogout={onLogout} />
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
        </div>
      </header>
    </div>
  );
}

export default withServices(TopBar, ['frameSync', 'settings', 'queryService']);
