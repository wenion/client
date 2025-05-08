import { Button, Callout, RadioCheckedIcon } from '@hypothesis/frontend-shared';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import debounce from 'lodash.debounce';
import classnames from 'classnames';

import { withServices } from '../service-context';
import {
  isThirdPartyUser,
  username as getUsername,
} from '../helpers/account-id';
import type { FrameSyncService } from '../services/frame-sync';
import type { RecordingService } from '../services/recording';
import { ListenerCollection } from '../../shared/listener-collection';
import { getElementHeightWithMargins } from '../util/dom';
import { useSidebarStore } from '../store';


type ChatUiTabProps = {
  frameSync: FrameSyncService;
  recordingService: RecordingService;
};

function ChatUiTab({
  frameSync,
  recordingService,
}: ChatUiTabProps) {
  const store = useSidebarStore();

  const baselineRef = useRef<HTMLIFrameElement | null>(null);
  const contentElement = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const activePanelName = store.activePanelName();

  const profile = store.profile();
  const username = getUsername(profile.userid);
  const displayName = profile.user_info?.display_name ?? username;
  const taskName = store.getSync('recordingTaskName') as string | null;

  const url = store.chatUiUrl();
  const model = store.chatUiModel();
  const token = store.chatUiToken();
  const option = store.chatUiOption();
  const src = store.chatUiSrc();
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    // get the base information
    if (url === null || model === null || token === null) {
      frameSync.notifyExtension('customEvent', {
        eventType: 'client',
        custom: 'chatUi',
        tagName: '',
        textContent: 'request',
      });
      setReady(false);
    }

    if (!taskName) {
      setReady(false);
    }

    // validate the link
    if (url && model && token && displayName && taskName) {
      const baseUrl = url;
      const params = new URLSearchParams({
        model: model,
        task_id: taskName,
        subject_id: displayName,
        token: token,
      });
      const fullUrl = `${baseUrl}?${params.toString()}`;

      store.setChatUiSrc(fullUrl);
      setReady(true);
    }
  }, [url, model, token, displayName, taskName]);

  const updateContentSize = () => {
    const offset = 100;

    let sidebarPanelHeight = 0;
    const elements = document.querySelectorAll('[data-component="Dialog"][tabindex="-1"][variant="custom"]');
    for (const el of elements) {
      sidebarPanelHeight += getElementHeightWithMargins(el);
    }
    setContentHeight(window.innerHeight - sidebarPanelHeight - offset);
  };

  useLayoutEffect(() => {
    updateContentSize();
  }, [activePanelName]);

  useLayoutEffect(() => {
    const listeners = new ListenerCollection();

    const updateSize = debounce(
      updateContentSize,
      10,
      { maxWait: 100 },
    );

    listeners.add(window, 'resize', updateSize);
    return () => {
      listeners.removeAll();
      updateSize.cancel();
    };
  }, []);

  const contentStyle: Record<string, number> = {};
  contentStyle['height'] = contentHeight;

  return (
    <>
      {ready && src && (
        <div
          ref={contentElement}
          style={contentStyle}
        >
          <iframe
            ref={baselineRef}
            src={src}
            title="Baseline Tool"
            className={classnames('w-full h-full')}
          />
        </div>
      )}
      {!ready && (
        <>
          {!url && (
            <Callout status="error">
              Missing URL parameter
            </Callout>
          )}
          {!model && (
            <Callout status="error">
              Missing model parameter
            </Callout>
          )}
          {!token && (
            <Callout status="error">
              Missing token parameter 
            </Callout>
          )}
          {(!url || !model || !token) && (
            <>
              <p className={'text-base m-2'}>
                To start using Chat UI, you'll need to provide a model name, access token, and API URL.
              </p>
              <Button
                data-testid="cancel-button"
                classes={'p-2'}
                onClick={() => {option ? window.open(option): {}}}
              >
                Go To Setup
              </Button>
            </>
          )}
          {url && model && token && !taskName && (
            <>
              Click the Record button
              <Button
                classes={classnames("mx-2")}
                title="Record button"
                unstyled
              >
                <RadioCheckedIcon />
              </Button>
              on the left to get started.
            </>
          )}
        </>
      )}
    </>
    
  );
}

export default withServices(ChatUiTab, ['recordingService', 'frameSync']);

