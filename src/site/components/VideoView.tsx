import {
  Input,
  Button,
} from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import type { RefObject } from 'preact';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import type { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import  videojs from 'video.js';

import type { SidebarSettings } from '../../types/config';
import { serviceConfig } from '../../sidebar/config/service-config';
import { shouldAutoDisplayTutorial } from '../../sidebar/helpers/session';
import { withServices } from '../../sidebar/service-context';
import type { AuthService } from '../../sidebar/services/auth';
import type { FrameSyncService } from '../../sidebar/services/frame-sync';
import type { SessionService } from '../../sidebar/services/session';
import type { ToastMessengerService } from '../../sidebar/services/toast-messenger';
import { useSidebarStore } from '../../sidebar/store';
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

  options: VideoJsPlayerOptions,
  onReady: (player: VideoJsPlayer) => void,

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
  options,
  onReady,
  settings }: QueryViewProps) {
  const store = useSidebarStore();
  const profile = store.profile();
  const route = store.route();

  const hostURL = new URL(window.location.href);
  console.log('hostURL', hostURL)
  hostURL.hash = '';
  const appURL = hostURL.toString();
  console.log('hostURL', hostURL, 'appURL',appURL)

  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    console.log("first init")
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered');

      // console.log("videoElement", videoElement)
      
      // if (videoRef && videoRef.current)
      videoRef.current?.appendChild(videoElement);

      const player =  playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready', player);
        onReady && onReady(player);
      });

      player.responsive(true);

      // if (player) {
      //   playerRef.current = player;
      //   console.log("playerRef.current ", playerRef.current )
      // }
        
    }
    else {
      console.log("second")
      const player: VideoJsPlayer = playerRef.current;
      if (options.autoplay)
        player.autoplay(options.autoplay);
      if (options.sources)
      player.src(options.sources);
    }

  }, [options, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;
    console.log("exit")

    return () => {
      if (player && !player.isDisposed()) {
        console.log("clear")
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  const onClick = (player:RefObject<VideoJsPlayer>) => {
    const timeAUX = player.current?.currentTime();
    console.log(timeAUX)

  }

  return (
    <>
      <TopBar
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
        isSidebar={true}
      />
      <div className="video-container">
        <main>
          <div
            data-vjs-player
            className="mt-8"
          >
            <div ref={videoRef} />
          </div>
          <div className="flex ">
            <Input class={classnames('grow')} aria-label="Input example" placeholder="Placeholder..." />
            <Button class={classnames('flex-none')} onClick={() => onClick(playerRef as RefObject<VideoJsPlayer>)}>
              Create annotation
            </Button>
          </div>
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
