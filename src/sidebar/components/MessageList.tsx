import { CaretDownIcon, CaretRightIcon } from '@hypothesis/frontend-shared';
import classnames from 'classnames';

import type { MessageType, RawMessageData } from '../../types/api';
import { useSidebarStore } from '../store';
import MessageCard from './MessageCard';

type MessageListProps = {
  id: MessageType;
  title: string;
  threads: RawMessageData[];
};

export default function MessageList({
  id,
  title,
  threads,
}: MessageListProps) {
  const store = useSidebarStore();
  const expandedMessagePanels = store.isMessagePanelExpanded(id);

  const toggleMessagePanel = () => {
    store.toggleMessagePanelExpansion(id);
  }

  return (
    <>
      <div
        className={classnames(
          'flex items-center p-2 cursor-pointer rounded',
          'shadow hover:shadow-md'
        )}
        onClick={() => toggleMessagePanel()}
      >
        <h4
          className={classnames(
            "text-base text-slate-600",
            "text-blue-curious hover:text-blue-chathams"
          )}
        >
          {title}
        </h4>
        <span className="relative bottom-[3px] left-[2px] text-[10px]">
          {threads.length}
        </span>
        <div className="flex justify-end grow">
          {expandedMessagePanels ? (
            <CaretDownIcon />
          ) : (
            <CaretRightIcon />
          )}
        </div>
      </div>
      {expandedMessagePanels && threads.map(child => (
        <div
          className={classnames(
            // The goal is to space out each annotation card vertically. Typically
            // this is better handled by applying vertical spacing to the parent
            // element (e.g. `space-y-3`) but in this case, the constraints of
            // sibling divs before and after the list of annotation cards prevents
            // this, so a bottom margin is added to each card's wrapping element.
            // 'my-4 overflow-auto',
            // 'shadow-xl rounded-md bg-orange-200',
            // 'hover:drop-shadow-2xl'
            'mb-3',
          )}
          data-testid="thread-card-container"
          id={child.id}
          key={child.id}
        >
          <MessageCard message={child} />
        </div>
      ))}
    </>
  )
}
