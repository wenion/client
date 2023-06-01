import classnames from 'classnames';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import  Router from 'preact-router';
import type  { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import  videojs from 'video.js';

import { confirm } from '../../shared/prompts';
import type { SidebarSettings } from '../../types/config';
import type { AnnotationData, DocumentMetadata } from '../../types/annotator';
import type { VideoAnnotation, VideoPositionSelector } from '../../types/api';
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

import type {
  SidebarToSiteEvent,
  SiteToSidebarEvent,
} from '../../types/site-port-rpc-events';
import { PortRPC, PortFinder } from '../../shared/messaging';
import type { Profile } from '../../types/api'

const _sidebarRPC: PortRPC<SidebarToSiteEvent, SiteToSidebarEvent> = new PortRPC();
const _portFinder = new PortFinder({
  hostFrame: window,
  source: 'site',
  sourceId: undefined,
});

const anchor = (annotation: AnnotationData) => {
  if (annotation.target[0] && annotation.target[0].selector && annotation.target[0].selector[0] && annotation.target[0].selector[0].type === 'VideoPositionSelector')
  {
    const timestamp = annotation.target[0].selector[0].start;
    const duration = annotation.target[0].selector[0].end;

    const progessControl = document.querySelector('.vjs-progress-control')
    if (!progessControl) {
      return;
    }
    if (document.querySelector(`.${annotation.$tag}`)) {
      return;
    }
    const markerEl = document.createElement('div');
    markerEl.className = classnames(annotation.$tag, 'vjs-marker');
    markerEl.style.left = (timestamp/duration * 100).toString() + '%'
    progessControl.appendChild(markerEl);
    markerEl.addEventListener('click', e => {
      console.log('test')
    })
  }
  else {
    return;
  }
};

const deleteMarker = ($tag: string) => {
  let el = document.querySelector(`.${$tag}`)
  if (el) {
    el.remove();
  }
}

_portFinder.discover('sidebar')
  .then((hostPort) =>{
    _sidebarRPC.on('loadVideoAnnotations', (annotations: AnnotationData[]) => {
      annotations.forEach(annotation => anchor(annotation))
    });
    _sidebarRPC.on('deleteVideoAnnotation', ($tag: string) => {
      deleteMarker($tag);
    });
    _sidebarRPC.on('publicVideoAnnotationCountChanged', (publicAnns: number) => {
    });
    _sidebarRPC.on('doubleClickVideoAnnotation', (annotation: VideoAnnotation) => {
      if (annotation.target[0] && annotation.target[0].selector &&
        annotation.target[0].selector[0] && annotation.target[0].selector[0].type === 'VideoPositionSelector') {
          _player?.currentTime(annotation.target[0].selector[0].start)
      }
    });
    _sidebarRPC.on('mouseEnterVideoAnnotation', (annotation: VideoAnnotation) => {
      const markerEl = document.querySelector(`.${annotation.$tag}`) as HTMLDivElement
      if (markerEl) {
        markerEl.style.background = 'blue';
      }
    });
    _sidebarRPC.on('mouseLeaveVideoAnnotation', (annotation: VideoAnnotation) => {
      const markerEl = document.querySelector(`.${annotation.$tag}`) as HTMLDivElement
      if (markerEl) {
        markerEl.style.background = 'red';
      }
    });
    _sidebarRPC.connect(hostPort);
  })

let _player: VideoJsPlayer| null = null;

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

  const backgroundStyle = useMemo(
    () => applyTheme(['appBackgroundColor'], settings),
    [settings]
  );

  const isSidebar = route === 'sidebar';
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const videoJsOptions: VideoJsPlayerOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: []
  };

  const handlePlayerReady = (player: VideoJsPlayer) => {
    playerRef.current = player;

    _player = player;

    // You can handle player events here, for example:
    player.on('waiting', () => {
      console.log('player is waiting');
    });

    player.on('seeked', () => {
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
          onAnchor={anchor}
          options={videoJsOptions}
          onReady={handlePlayerReady}
          sidebarRPC={_sidebarRPC} />
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
