// var _jsxFileName = "/home/runner/work/frontend-shared/frontend-shared/src/components/feedback/ToastMessages.tsx";
import classnames from 'classnames';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
// import Callout from './Callout';
import { Panel, Tab, TabList } from '@hypothesis/frontend-shared';

import type { ComponentChildren } from 'preact';
// import type { Ref } from 'preact';
// import type { JSX } from 'preact';
import MarkdownView from './MarkdownView';
import { applyTheme } from './Excerpt';


export type ToastMessage = {
  id: string;
  type: 'error' | 'success' | 'notice';
  title: string;
  message: ComponentChildren;
  /**
   * Visually hidden messages are announced to screen readers but not visible.
   * Defaults to false.
   */
  visuallyHidden?: boolean;
  /**
   * Determines if the toast message should be auto-dismissed.
   * Defaults to true.
   */
  autoDismiss?: boolean;
};
type ToastMessageTransitionClasses = {
  /** Classes to apply to a toast message when appended. Defaults to 'animate-fade-in' */
  transitionIn?: string;
  /** Classes to apply to a toast message being dismissed. Defaults to 'animate-fade-out' */
  transitionOut?: string;
};
type ToastMessagesProps = {
  messages: ToastMessage[];
  onMessageDismiss: (id: string) => void;
  transitionClasses?: ToastMessageTransitionClasses;
  setTimeout_?: typeof setTimeout;
};

/**
 * An individual toast message: a brief and transient success or error message.
 * The message may be dismissed by clicking on it. `visuallyHidden` toast
 * messages will not be visible but are still available to screen readers.
 */
function ToastMessageItem({
  message,
  onDismiss
}: {message:ToastMessage; onDismiss:(id: string) => void;}) {
  // Capitalize the message type for prepending; Don't prepend a message
  // type for "notice" messages
  const textStyle = applyTheme(['annotationFontFamily'], {});

  return (
    <Panel
      title={message.title}
      onClose={() => onDismiss(message.id)}
    >
      <MarkdownView
        markdown={message.message as string}
        style={textStyle}
      />
    </Panel>
  )
}
const ToastMessageTransition = ({
  direction,
  onTransitionEnd,
  children,
  transitionClasses = {}
}: {
  direction: string;
  onTransitionEnd: (direction: string) => void;
  children: ComponentChildren;
  transitionClasses: ToastMessageTransitionClasses | undefined;
}) => {
  const isDismissed = direction === 'out';
  const containerRef = useRef(null); //RefObject<HTMLElement>
  const handleAnimation = (e: AnimationEvent) => {
    // Ignore animations happening on child elements
    if (e.target !== containerRef.current) {
      return;
    }
    onTransitionEnd === null || onTransitionEnd === void 0 || onTransitionEnd(direction !== null && direction !== void 0 ? direction : 'in');
  };
  const classes = useMemo(() => {
    const {
      transitionIn = 'animate-fade-in',
      transitionOut = 'animate-fade-out'
    } = transitionClasses;
    return {
      [transitionIn]: !isDismissed,
      [transitionOut]: isDismissed
    };
  }, [isDismissed, transitionClasses]);
  return (
    <div
      data-testid="animation-container"
      onAnimationEnd={handleAnimation}
      ref={containerRef}
      className={classnames(
        // 'relative w-full container',
        'relative w-full',
        classes
      )}
    >
      {children}
    </div>
  )
};
/**
 * A collection of toast messages. These are rendered within an `aria-live`
 * region for accessibility with screen readers.
 */
export function ToastMessages({
  messages,
  onMessageDismiss,
  transitionClasses,
  /* istanbul ignore next - test seam */
  setTimeout_ = setTimeout
}: ToastMessagesProps) {
  // List of IDs of toast messages that have been dismissed and have an
  // in-progress 'out' transition
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
  // Tracks not finished timeouts for auto-dismiss toast messages
  const messageSchedules = useRef(new Map());
  const dismissMessage = useCallback((id: string) => setDismissedMessages(ids => [...ids, id]), []);
  const scheduleMessageDismiss = useCallback((id: string) => {
    const timeout = setTimeout_(() => {
      dismissMessage(id);
      messageSchedules.current.delete(id);
    }, 5000000);
    messageSchedules.current.set(id, timeout);
  }, [dismissMessage, setTimeout_]);
  const onTransitionEnd = useCallback((direction: string, message: ToastMessage) => {
    var _message$autoDismiss;
    const autoDismiss = (_message$autoDismiss = message.autoDismiss) !== null && _message$autoDismiss !== void 0 ? _message$autoDismiss : true;
    if (direction === 'in' && autoDismiss) {
      scheduleMessageDismiss(message.id);
    }
    if (direction === 'out') {
      onMessageDismiss(message.id);
      setDismissedMessages(ids => ids.filter(id => id !== message.id));
    }
  }, [scheduleMessageDismiss, onMessageDismiss]);
  useLayoutEffect(() => {
    // Clear all pending timeouts for not yet dismissed toast messages when the
    // component is unmounted
    const pendingTimeouts = messageSchedules.current;
    return () => {
      pendingTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  return (
    <ul
      aria-live="polite"
      aria-relevant="additions"
      className={classnames(
        'sidebar-message',
        'space-y-10',
        // 'w-full h-min space-y-40',
        'flex flex-col'
      )}
      data-component="ToastMessages"
    >
      {messages.map(message => {
        const isDismissed = dismissedMessages.includes(message.id);
        return (
          <li
            className={classnames(
              // 'sidebar-message',
              // 'absolute left-full h-min z-max',
              {'mb-2': !message.visuallyHidden}
              
            )}
          >
            <ToastMessageTransition
              direction={isDismissed ? 'out' : 'in'}
              onTransitionEnd= {direction => onTransitionEnd(direction, message)}
              transitionClasses={transitionClasses}
            >
              <ToastMessageItem
                message={message}
                onDismiss={dismissMessage}
              />
            </ToastMessageTransition>
          </li>
        )
      })}
    </ul>
  )
}