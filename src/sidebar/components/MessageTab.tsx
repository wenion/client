import { useSidebarStore } from '../store';
import MessageList from './MessageList';

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
export default function MessageTab() {
  const store = useSidebarStore();
  const additionalThread = store.allAdditionalMessages();
  const organisationEventThreads = store.allOrganisationEventMessages();
  const instanceThreads = store.allInstanceMessages().sort((a, b) => b.date - a.date);
  const sortableThreads = organisationEventThreads.sort((a, b) => b.date - a.date); // Z -> A

  return (
    <>
      <MessageList id='addition' title='Additional knowledge' threads={additionalThread} />
      <MessageList id='shareflow' title='ShareFlow recommendation' threads={instanceThreads} />
      <MessageList id='organization' title='Organisation event' threads={sortableThreads} />
    </>
  );
}
