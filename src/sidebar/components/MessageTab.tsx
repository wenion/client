import type { ToastMessengerService } from '../services/toast-messenger';
import { useSidebarStore } from '../store';
import MessageList from './MessageList';

export type MessageTabProps = {
  toastMessenger: ToastMessengerService;
};

export default function MessageTab() {
  const store = useSidebarStore();
  const addtionMessages = store.addtionMessages();
  const shareFlowMessages = store.shareFlowMessages();
  const organizationMessages = store.organizationMessages();

  return (
    <>
      <MessageList id='addition' title='Additional Knowledge' threads={addtionMessages} />
      <MessageList id='shareflow' title='ShareFlow Recommendation' threads={shareFlowMessages} />
      <MessageList id='organization' title='Organisation Event' threads={organizationMessages} />
    </>
  );
}
