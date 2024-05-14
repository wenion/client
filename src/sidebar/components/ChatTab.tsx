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
  show: boolean;
};

/**
 * The main content of the "stream" route (https://hypothes.is/stream)
 */
function ChatTab({ api, toastMessenger, show }: ChatTabProps) {
  const store = useSidebarStore();
  const [selectedTab, setSelectedTab] = useState("baseline")

  const onClick = (tab: string) => {
    setSelectedTab(tab)
  }

  return (
    <>
    <div role="tablist" className={classnames("flex")}>
      <Tab variant="tab" selected={selectedTab === 'baseline'} onClick={()=> onClick('baseline')}>
        Baseline
      </Tab>
      <Tab variant="tab" selected={selectedTab === 'goldmind'} onClick={()=> onClick('goldmind')}>
        GoldMind
      </Tab>
    </div>
    <iframe
      src="https://chat.kmass.io"
      title="Baseline Tool"
      className={classnames('w-full h-[85dvh]',
      {
        'hidden': selectedTab === 'goldmind',
      },
      )}
    />
    <iframe
      src="https://colam.kmass.cloud.edu.au/query"
      title="GoldMind Tool"
      className={classnames('w-full h-[85dvh]',
      {
        'hidden': selectedTab === 'baseline',
      },
      )}
    />
    </>
  );
}

export default withServices(ChatTab, ['api', 'toastMessenger']);
