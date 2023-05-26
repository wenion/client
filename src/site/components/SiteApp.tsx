import classnames from 'classnames';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import  Router from 'preact-router';
import type  { VideoJsPlayer, VideoJsPlayerOptions  } from 'video.js';
import  videojs from 'video.js';

import { confirm } from '../../shared/prompts';
import type { SidebarSettings } from '../../types/config';
import { serviceConfig } from '../../sidebar/config/service-config';
import { shouldAutoDisplayTutorial } from '../../sidebar/helpers/session';
import { applyTheme } from '../../sidebar/helpers/theme';
import { withServices } from '../../sidebar/service-context';
import type { AuthService } from '../../sidebar/services/auth';
import type { FrameSyncService } from '../../sidebar/services/frame-sync';
import type { SessionService } from '../../sidebar/services/session';
import type { ToastMessengerService } from '../../sidebar/services/toast-messenger';
import { useSidebarStore } from '../../sidebar/store';
import QueryView from './QueryView';
import VideoView from './VideoView';

import { PortRPC } from '../../shared/messaging';
import { PortFinder } from '.././helpers/port-finder';
import type { Profile } from '../../types/api'

const _sidebarRPC = new PortRPC();
const _portFinder = new PortFinder({
  hostFrame: window,
  source: 'site',
  sourceId: undefined,
});

_portFinder.discover('sidebar')
  .then((hostPort) =>{
    _sidebarRPC.connect(hostPort);
  })

_sidebarRPC.on('updateProfile', (profile: Profile) => {
  console.log('profile', profile)
})

export type HypothesisAppProps = {
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
function SiteApp({
  auth,
  frameSync,
  settings,
  session,
  toastMessenger,
}: HypothesisAppProps) {
  const store = useSidebarStore();
  const profile = store.profile();
  const route = store.route();
  const isModalRoute = route === 'notebook' || route === 'profile';

  const backgroundStyle = useMemo(
    () => applyTheme(['appBackgroundColor'], settings),
    [settings]
  );
  const isThemeClean = settings.theme === 'clean';

  const isSidebar = route === 'sidebar';
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const videoJsOptions: VideoJsPlayerOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [{
      src: 'http://techslides.com/demos/sample-videos/small.mp4',
      type: 'video/mp4'
    }]
  };

  const handlePlayerReady = (player: VideoJsPlayer) => {
    playerRef.current = player;

    console.log("on ready")

    // You can handle player events here, for example:
    player.on('waiting', () => {
      videojs.log('player is waiting');
      console.log('player is waiting');
    });

    player.on('seeked', () => {
      videojs.log('player will seeked');
      console.log('player will seeked');
    });

    player.on('dispose', () => {
      videojs.log('player will dispose');
      console.log('player will dispose');
    });
  };

  useEffect(() => {
    if (shouldAutoDisplayTutorial(isSidebar, profile, settings)) {
      store.openSidebarPanel('help');
    }
  }, [isSidebar, profile, settings, store]);

  const login = async () => {
    if (serviceConfig(settings)) {
      // Let the host page handle the login request
      frameSync.notifyHost('loginRequested');
      return;
    }

    try {
      await auth.login();

      store.closeSidebarPanel('loginPrompt');
      store.clearGroups();
      session.reload();
    } catch (err) {
      toastMessenger.error(err.message);
    }
  };

  const signUp = () => {
    if (serviceConfig(settings)) {
      // Let the host page handle the signup request
      frameSync.notifyHost('signupRequested');
      return;
    }
    window.open(store.getLink('signup'));
  };

  const promptToLogout = async () => {
    const drafts = store.countDrafts();
    if (drafts === 0) {
      return true;
    }

    let message = '';
    if (drafts === 1) {
      message =
        'You have an unsaved annotation.\n' +
        'Do you really want to discard this draft?';
    } else if (drafts > 1) {
      message =
        'You have ' +
        drafts +
        ' unsaved annotations.\n' +
        'Do you really want to discard these drafts?';
    }
    return confirm({
      title: 'Discard drafts?',
      message,
      confirmAction: 'Discard',
    });
  };

  const logout = async () => {
    if (!(await promptToLogout())) {
      return;
    }
    store.clearGroups();
    store.removeAnnotations(store.unsavedAnnotations());
    store.discardAllDrafts();

    if (serviceConfig(settings)) {
      frameSync.notifyHost('logoutRequested');
      return;
    }

    session.logout();
  };

  return (
    <div
      className={classnames(
        'js-thread-list-scroll-root'
      )}
      data-testid="hypothesis-app"
      style={backgroundStyle}
    >
      <Router>
        <div path="/">
          <h1>Homepage is building.</h1>
          <h4><a href='/query'>Welcome to KMASS, please click link to query page.</a></h4>
        </div>
        <QueryView path="/query"
          onLogin={login}
          onSignUp={signUp}
          onLogout={logout}
          isSidebar={isSidebar} />
        <VideoView path="/video"
          onLogin={login}
          onSignUp={signUp}
          onLogout={logout}
          isSidebar={isSidebar}
          options={videoJsOptions}
          onReady={handlePlayerReady} />
      </Router>
    </div>
  );
}

export default withServices(SiteApp, [
  'auth',
  'frameSync',
  'session',
  'settings',
  'toastMessenger',
]);
