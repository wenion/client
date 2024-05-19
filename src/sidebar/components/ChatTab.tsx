import { useCallback, useEffect, useState, useRef, useMemo } from 'preact/hooks';
import {
  Tab,
  TabList,
  Card,
  Button,
  CancelIcon,
} from '@hypothesis/frontend-shared';

import classnames from 'classnames';
import { parseHypothesisSearchQuery } from '../helpers/query-parser';
import { withServices } from '../service-context';
import type { APIService } from '../services/api';
import type { ToastMessengerService } from '../services/toast-messenger';
import { useSidebarStore } from '../store';
import ThreadList from './ThreadList';
import { useRootThread } from './hooks/use-root-thread';

export type ChatTabProps = {
  // injected
  api: APIService;
  toastMessenger: ToastMessengerService;
  mode: 'Baseline' | 'GoldMind';
};

/**
 * The main content of the "stream" route (https://hypothes.is/stream)
 */
function ChatTab({ api, toastMessenger, mode }: ChatTabProps) {
  return (
    <div className='chat-height'>
      {mode === 'Baseline' && (
        <iframe
          src="https://chat.kmass.io"
          title="Baseline Tool"
          className={classnames('w-full h-full')}
        />
      )}
      {mode === 'GoldMind' && (
        <iframe
          src="https://colam.kmass.cloud.edu.au/query"
          title="GoldMind Tool"
          className={classnames('w-full h-full')}
        />
      )}
    </div>
  );
}

export default withServices(ChatTab, ['api', 'toastMessenger']);
