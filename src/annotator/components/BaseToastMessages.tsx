// var _jsxFileName = "/home/runner/work/frontend-shared/frontend-shared/src/components/feedback/ToastMessages.tsx";
import classnames from 'classnames';
import { Card, CardHeader, CardContent } from '@hypothesis/frontend-shared';
import { IconButton, DottedCircleIcon, ArrowRightIcon, SchoolIcon, Dialog } from '@hypothesis/frontend-shared';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

import { formatSortableDateTime } from '../../shared/time';
import type { ExtraDataComics } from '../../types/api';
import { username as getUsername } from '../../sidebar/helpers/account-id';
import StyledText from './StyledText';
import MarkdownView from './MarkdownView';
import { applyTheme } from './Excerpt';

export type ToastMessage = {
  id: string;
  type: 'error' | 'success' | 'notice' | 'message' | 'instant_message';
  title: string;
  message: ComponentChildren;
  linkName?: string;
  date: number;
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
  extra?: ExtraDataComics[];
};
type ToastMessageTransitionClasses = {
  /** Classes to apply to a toast message when appended. Defaults to 'animate-fade-in' */
  transitionIn?: string;
  /** Classes to apply to a toast message being dismissed. Defaults to 'animate-fade-out' */
  transitionOut?: string;
};

type ToastMessageContextProps = {
  message: ToastMessage;
  onDismiss: (id: string) => void;
  callback: (args: Record<any, any>) => void;
};

/**
 * An individual toast message: a brief and transient success or error message.
 * The message may be dismissed by clicking on it. `visuallyHidden` toast
 * messages will not be visible but are still available to screen readers.
 */
function ToastMessageContext({
  message,
  onDismiss,
  callback
}: ToastMessageContextProps) {
  // Capitalize the message type for prepending; Don't prepend a message
  // type for "notice" messages
  const textStyle = applyTheme(['annotationFontFamily'], {});
  const time = "date" in message ? new Date(message.date/1000): new Date();

  const onClick = (e: ExtraDataComics) => {
    callback({
      messageType: 'push',
      type: "click",
      message: e
    });
    onDismiss(message.id);
  }

  return (
    <Card>
      <CardHeader title={message.title} onClose={() => onDismiss(message.id)} />
      <CardContent classes="m-2">
        <StyledText>
          <MarkdownView
            markdown={message.message as string}
            classes={'text-black'}
            style={textStyle}
          />
        </StyledText>
        {message.linkName && (
          <div>
            <b>{message.linkName}</b>
          </div>
        )}
        {message.extra && message.extra.map(e => {
          if (e.url) {
            return (
              <a
                className={classnames(
                  "cursor-pointer",
                  "text-blue-curious hover:text-blue-chathams underline underline-offset-1",
                )}
                href={e.url}
              >
                <b>{e.task_name}</b>
              </a>
            )
          } else {
            return (
              <div title={e.description}>
                <div className={'flex'}>
                  <div
                    className={classnames(
                      "cursor-pointer",
                      "text-blue-curious hover:text-blue-chathams underline underline-offset-1",
                    )}
                    onClick={() => onClick(e)}
                  >
                    <b>{e.task_name}</b>
                  </div>
                  {e.role && (
                    <p className="indent-2">
                      created by <strong>{e.role?.teaching_role} ({getUsername(e.user_id)})</strong>
                    </p>
                  )}
                </div>
                <p className="text-md indent-2 truncate italic text-gray-500">{e.description}</p>
              </div>
            )
          }
        })}
        <div className='flex flex-row justify-end'>
          {formatSortableDateTime(time)}
        </div>
      </CardContent>
    </Card>
  )
}

type ToastMessageContextComponentProps = {
  message:ToastMessage;
  onDismiss:(id: string) => void;
  callback:(args: Record<any, any>) => void;
};

function ToastMessageContextComponent({
  message,
  onDismiss,
  callback
}: ToastMessageContextComponentProps) {
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [expertStep, setExpertStep] = useState<string | null>(null);

  useEffect(() => {
    if (message.extra && message.extra[0]) {
      const extra = message.extra[0];
      if (extra.expert_step) {
        setExpertStep(extra.expert_step);
      }

      if (extra.current_step && extra.current_step.length === 1) {
        setCurrentStep(extra.current_step[0]);
        setNextStep(extra.current_step[0]);
      }

      if (extra.current_step && extra.current_step.length > 1) {
        setNextStep(extra.current_step[0]);
        setCurrentStep(extra.current_step[1]);
      }
    }
  }, []);

  const onClick = (type: string, value: string) => {
    callback({
      messageType: 'jump',
      type: type,
      message: message.extra![0]
    });
    setTimeout(() => {onDismiss(message.id)}, 500);
  }

  return (
    <Dialog
      title={message.title}
      onClose={() => onDismiss(message.id)}
      initialFocus={'manual'}
      classes={'w-80 justify-self-center'}
    >
      <p>Choose where to scroll:</p>
      {
        message.extra && message.extra[0] && (
          <>
            {currentStep && (
              <IconButton
                size="lg"
                icon={DottedCircleIcon}
                title="Current Step"
                data-testid="current-button"
                classes={"border border-black rounded-lg justify-start"}
                onClick={() => onClick('currentStep', currentStep)}
              >
                Current Step
              </IconButton>
            )}
            {nextStep && (
              <IconButton
                size="lg"
                icon={ArrowRightIcon}
                title="Next Step"
                data-testid="next-button"
                classes={"border border-black rounded-lg justify-start"}
                onClick={() => onClick('nextStep', nextStep)}
              >
                Next Step
              </IconButton>
            )}
            {expertStep && (
              <IconButton
                size="lg"
                icon={SchoolIcon}
                title="Next Expert Step"
                data-testid="next-expert-button"
                classes={"border border-black rounded-lg justify-start"}
                onClick={() => onClick('expertStep', expertStep)}
              >
                Next Expert Step
              </IconButton>
            )}
          </>
        )
      }
    </Dialog>
  )
}

const ToastMessageTransition = ({
  direction,
  onTransitionEnd,
  children,
  transitionClasses = {},
  type,
}: {
  direction: string;
  onTransitionEnd: (direction: string) => void;
  children: ComponentChildren;
  transitionClasses: ToastMessageTransitionClasses | undefined;
  type: 'horizontal' | 'vertical';
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
      transitionIn = type === 'vertical' ? 'animate-fade-in' : 'animate-slide-in-from-right',
      transitionOut = type === 'vertical' ? 'animate-fade-out': 'animate-slide-out-from-left'
    } = transitionClasses;
    return {
      [transitionIn]: !isDismissed,
      [transitionOut]: isDismissed
    };
  }, [isDismissed, transitionClasses, type]);

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

type ToastMessagesProps = {
  messages: ToastMessage[];
  onMessageDismiss: (id: string) => void;
  transitionClasses?: ToastMessageTransitionClasses;
  setTimeout_?: typeof setTimeout;
  callback: (args: Record<any, any>) => void;
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
  setTimeout_ = setTimeout,
  callback,
}: ToastMessagesProps) {
  // List of IDs of toast messages that have been dismissed and have an
  // in-progress 'out' transition
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
  // Tracks not finished timeouts for auto-dismiss toast messages
  const messageSchedules = useRef(new Map());
  const dismissMessage = useCallback((id: string) => {setDismissedMessages(ids => [...ids, id])}, []);
  const delayTime = 10000 // ms
  const scheduleMessageDismiss = useCallback((id: string, index: number) => {
    // index: show animation-fade-out in order
    const timeout = setTimeout_(() => {
      dismissMessage(id);
      messageSchedules.current.delete(id);
    }, delayTime + 1000 * index);
    messageSchedules.current.set(id, timeout);
  }, [dismissMessage, setTimeout_]);

  const onTransitionEnd = useCallback((direction: string, message: ToastMessage, index: number) => {
    var _message$autoDismiss;
    const autoDismiss = (_message$autoDismiss = message.autoDismiss) !== null && _message$autoDismiss !== void 0 ? _message$autoDismiss : true;
    if (direction === 'in' && autoDismiss) {
      scheduleMessageDismiss(message.id, index);
    }
    if (direction === 'out') {
      onMessageDismiss(message.id);
      setDismissedMessages(ids => ids.filter(id => id !== message.id));
    }
  }, [onMessageDismiss]);

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
        'space-y-6',
        // 'w-full h-min space-y-40',
        'flex flex-col'
      )}
      data-component="ToastMessages"
    >
      {messages.map((message, index) => {
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
              onTransitionEnd={direction => onTransitionEnd(direction, message, index)}
              transitionClasses={transitionClasses}
              type={message.type === 'instant_message'? 'vertical' : 'horizontal'}
            >
              {
                message.type === 'instant_message' ? (
                  <ToastMessageContext
                    message={message}
                    onDismiss={dismissMessage}
                    callback={callback}
                  />
                ): (
                  <ToastMessageContextComponent
                    message={message}
                    onDismiss={dismissMessage}
                    callback={callback}
                  />
                )
              }
            </ToastMessageTransition>
          </li>
        )
      })}
    </ul>
  )
}
