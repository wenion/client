import {
  LinkButton,
  SearchIcon,
} from '@hypothesis/frontend-shared/lib/next';
import { useRef } from 'preact/hooks';

import type { SidebarSettings } from '../../types/config';
import { isThirdPartyService } from '../../sidebar/helpers/is-third-party-service';
import { applyTheme } from '../../sidebar/helpers/theme';
import { withServices } from '../../sidebar/service-context';
import type { FrameSyncService } from '../../sidebar/services/frame-sync';
import { useSidebarStore } from '../../sidebar/store';
import UserMenu from './UserMenu';
import LogoIcon from '../static/logo';

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
  settings,
}: TopBarProps) {
  const showSharePageButton = !isThirdPartyService(settings);
  const loginLinkStyle = applyTheme(['accentColor'], settings);

  const store = useSidebarStore();
  const filterQuery = store.filterQuery();
  const isLoggedIn = store.isLoggedIn();
  const hasFetchedProfile = store.hasFetchedProfile();
  const input = useRef<HTMLInputElement | null>(null);

  const toggleSharePanel = () => {
    store.toggleSidebarPanel('shareGroupAnnotations');
  };

  const isHelpPanelOpen = store.isSidebarPanelOpen('help');
  const isAnnotationsPanelOpen = store.isSidebarPanelOpen(
    'shareGroupAnnotations'
  );

  const onSubmit = (e: Event) => {
    e.preventDefault();
    console.log("on_submit")
  };

  const onInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    // const { value } = e.target | null;
    // this.setState({ value })
  }

  return (
    <div>
      <header class="nav-bar">
        <div class="nav-bar__content">
          <a href="https://colam.kmass.cloud.edu.au/" title="Hypothesis homepage" class="nav-bar__logo-container">
            <LogoIcon />
          </a>
          <div class="nav-bar__search js-search-bar" data-ref="searchBar">
            <form class="search-bar"
                  data-ref="searchBarForm"
                  id="search-bar"
                  role="search"
                  onSubmit={onSubmit}
                  >

              {/* <input type="submit" class="nav-bar__search-hidden-input"/> */}


              <div class="search-bar__lozenges" data-ref="searchBarLozenges">

                <input class="search-bar__input js-input-autofocus"
                      aria-autocomplete="list"
                      aria-label=""
                      aria-haspopup="true"
                      autocapitalize="off"
                      autocomplete="off"
                      data-ref="searchBarInput"
                      name="q"
                      placeholder="Search…"
                      role="combobox"
                      value=""
                      onInput={onInput}
                      />
                <div>
                  <input type="submit" class="nav-bar__search-hidden-input"/>
                  <div className="search-bar__icon">
                    <SearchIcon />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div class="u-stretch"></div>
          <nav className="nav-bar-links">
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

export default withServices(TopBar, ['frameSync', 'settings']);
