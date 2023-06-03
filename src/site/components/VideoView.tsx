import {
  Input,
  Button,
} from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import type { RefObject } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { VideoJsPlayer, VideoJsPlayerOptions } from 'video.js';
import  videojs from 'video.js';

import type {
  SidebarToSiteEvent,
  SiteToSidebarEvent,
} from '../../types/site-port-rpc-events';
import type { AnnotationData, DocumentMetadata } from '../../types/annotator';
import type { VideoAnnotation, VideoPositionSelector } from '../../types/api';
import { generateRandomString } from '../../shared/random';
import { PortRPC } from '../../shared/messaging';
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
  // isSidebar: boolean;

  /** Callback invoked when user clicks "Login" button */
  onLogin: () => void;

  /** Callback invoked when user clicks "Logout" action in account menu */
  onLogout: () => void;

  /** Callback invoked when user clicks "Sign up" button */
  onSignUp: () => void;

  onAnchor: (annotation: AnnotationData) => void;

  options: VideoJsPlayerOptions,
  onReady: (player: VideoJsPlayer) => void,
  sidebarRPC: PortRPC<SidebarToSiteEvent, SiteToSidebarEvent>;

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
function VideoView({
  onLogin,
  onLogout,
  onSignUp,
  options,
  onReady,
  onAnchor,
  sidebarRPC,
  settings }: QueryViewProps) {
  const store = useSidebarStore();
  const profile = store.profile();
  const route = store.route();

  const annot = store.allVideoAnnotations();


  const param = new URLSearchParams(window.location.search);
  const videoSrc = param.get('file');
  if (!videoSrc) {
    return (<></>);
  }
  const format = videoSrc.substring(videoSrc.lastIndexOf(".") + 1);

  if (format === 'mov') {
    options.sources!.push({src: videoSrc, type: 'video/quicktime'})
  }
  else if (format === 'mp4') {
    options.sources!.push({src: videoSrc, type: 'video/mp4'})
  }

  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered');

      if (videoSrc == null || undefined) {
        return;
      }

      videoRef.current?.appendChild(videoElement);

      const player =  playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready', player);
        onReady && onReady(player);
      });
    }
    else {
      const player: VideoJsPlayer = playerRef.current;
      if (options.autoplay)
        player.autoplay(options.autoplay);
      if (options.sources)
        player.src(options.sources);
      player.responsive(true);
    }

  }, [options, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  const onClick = (player:RefObject<VideoJsPlayer>) => {
    const timeAux = player.current?.currentTime();
    const duration = player.current?.duration()
    if (!timeAux || !duration)
      return;
    const documentMetadata: DocumentMetadata = {
      title: document.title === '' ? videoSrc: document.title,
      link: [{href: videoSrc}]
    }
    const videoPositionSelector: VideoPositionSelector = {type: 'VideoPositionSelector', start: timeAux, end: duration};
    const annotation: AnnotationData = {
      uri: decodeURIComponent(videoSrc),
      document: documentMetadata,
      target: [{source: window.location.origin, selector:[videoPositionSelector]}],
      $cluster: 'other-content',
      $tag: generateRandomString(16),
    };

    sidebarRPC.call('createVideoAnnotation', annotation);

    onAnchor(annotation);

    return annotation;
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
          <div className="flex">
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

export default withServices(VideoView, [
  'auth',
  'frameSync',
  'session',
  'settings',
  'toastMessenger',
]);
