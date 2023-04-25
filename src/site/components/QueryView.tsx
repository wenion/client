import { useEffect, useMemo } from 'preact/hooks';

import type { SidebarSettings } from '../../types/config';
import { serviceConfig } from '../../sidebar/config/service-config';
import { shouldAutoDisplayTutorial } from '../../sidebar/helpers/session';
import { withServices } from '../../sidebar/service-context';
import type { AuthService } from '../../sidebar/services/auth';
import type { FrameSyncService } from '../../sidebar/services/frame-sync';
import type { SessionService } from '../../sidebar/services/session';
import type { ToastMessengerService } from '../../sidebar/services/toast-messenger';
import { useSidebarStore } from '../../sidebar/store';
import NotebookView from './NotebookView';
import TopBar from './TopBar';

export type QueryViewProps = {
  /** Flag indicating whether the app is in a sidebar context */
  isSidebar: boolean;

  /** Callback invoked when user clicks "Login" button */
  onLogin: () => void;

  /** Callback invoked when user clicks "Logout" action in account menu */
  onLogout: () => void;

  /** Callback invoked when user clicks "Sign up" button */
  onSignUp: () => void;

  auth: AuthService;
  frameSync: FrameSyncService;
  settings: SidebarSettings;
  session: SessionService;
  toastMessenger: ToastMessengerService;
};

/**
 * The root component for the Hypothesis client.
 *
 * This handles login/logout actions and renders the top navigation bar
 * and content appropriate for the current route.
 */
function QueryView({
  isSidebar,
  onLogin,
  onLogout,
  onSignUp,
  settings }: QueryViewProps) {
  const store = useSidebarStore();
  const profile = store.profile();
  const route = store.route();
  // const isModalRoute = route === 'notebook' || route === 'profile';

  // const backgroundStyle = useMemo(
  //   () => applyTheme(['appBackgroundColor'], settings),
  //   [settings]
  // );
  // const isThemeClean = settings.theme === 'clean';

  // const isSidebar = route === 'sidebar';

  useEffect(() => {
    if (shouldAutoDisplayTutorial(isSidebar, profile, settings)) {
      store.openSidebarPanel('help');
    }
  }, [isSidebar, profile, settings, store]);

  // const promptToLogout = async () => {
  //   const drafts = store.countDrafts();
  //   if (drafts === 0) {
  //     return true;
  //   }

  //   let message = '';
  //   if (drafts === 1) {
  //     message =
  //       'You have an unsaved annotation.\n' +
  //       'Do you really want to discard this draft?';
  //   } else if (drafts > 1) {
  //     message =
  //       'You have ' +
  //       drafts +
  //       ' unsaved annotations.\n' +
  //       'Do you really want to discard these drafts?';
  //   }
  //   return confirm({
  //     title: 'Discard drafts?',
  //     message,
  //     confirmAction: 'Discard',
  //   });
  // };

  return (
    <>
      <TopBar
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
        isSidebar={true}
      />
      <div className="container">
        <main>
          <NotebookView />
        </main>
      </div>
    </>
  );
}

export default withServices(QueryView, [
  'auth',
  'frameSync',
  'session',
  'settings',
  'toastMessenger',
]);
