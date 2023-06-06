import { useCallback, useEffect, useState, useRef } from 'preact/hooks';
import { Panel } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import type { JSX, RefObject } from 'preact';

import MarkdownView from './MarkdownView';

export type Data = {
  id: string;
  title: string;
  context: string;
};

export type NotificationElement = {
  element: RefObject<HTMLDivElement>;
  data: Data;
  isLatest: boolean;
};

export type NotificationProps = {
  notification: NotificationElement;
  onClose: (element: NotificationElement) => void;
};

/**
 * A component that renders toast messages published from the sidebar, in a way
 * that they "appear" in the viewport even when the sidebar is collapsed.
 * This is useful to make sure screen readers announce hidden messages.
 */
export default function Notification({
  notification,
  onClose,
}: NotificationProps) {

  return (
    <div
      className={classnames(
        'absolute -left-96 w-96 top-2 rounded-lg z-2',
        'text-px-base leading-none' // non-scaling sizing
      )}
      ref={notification.element}
    >
      <Panel title={notification.data.title} onClose={()=> onClose(notification)}>
        <MarkdownView
          markdown={notification.data.context}
          classes="text-lg leading-relaxed font-sans"
          // style={textStyle}
        />
      </Panel>
    </div>
  );
}
