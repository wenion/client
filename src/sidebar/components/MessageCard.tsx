import { Card, CardContent } from '@hypothesis/frontend-shared';
import classnames from 'classnames';

import { formatRelativeDate } from '../util/time';
import { withServices } from '../service-context';
import type { RawMessageData } from '../../types/api';
import { useSidebarStore } from '../store';
import Excerpt from './Excerpt';
import StyledText from './StyledText';
import MarkdownView from './MarkdownView';
import { applyTheme } from '../helpers/theme';
import type { RecordingService } from '../services/recording';
import type { ToastMessengerService } from '../services/toast-messenger';

type MessageCardProps = {
  message: RawMessageData;
  recordingService: RecordingService;
  toastMessenger: ToastMessengerService;
};

function MessageCard({
  message,
  recordingService,
  toastMessenger,
}: MessageCardProps) {
  const now = new Date();
  const createdDate = new Date(message.date/1000);

  const store = useSidebarStore();
  const textStyle = applyTheme(['annotationFontFamily'], {});

  const markMessageRead = (message: RawMessageData) => {
    message.unread_flag = false;
    store.updateMessage(message);
  };

  return (
    <Card
      classes="cursor-pointer focus-visible-ring theme-clean:border-none"
      data-testid="thread-card"
      tabIndex={-1}
      key={message.id}
      onMouseEnter={() => markMessageRead(message)}
    >
      <CardContent>
        <section className="flex" data-testid="thread-container">
          <div
            className={classnames(
              // Set a max-width to ensure that annotation content does not exceed
              // the width of the container
              'grow max-w-full min-w-0',
            )}
            data-testid="thread-content"
          >
            <article className="space-y-4 relative">
              <header>
                <div className="flex gap-x-1 items-baseline flex-wrap-reverse">
                  <h3 className="text-color-text font-bold">{message.title}</h3>
                  <div className="flex justify-end grow">
                    {formatRelativeDate(createdDate, now)}
                  </div>
                </div>
              </header>
              {message.unread_flag && (
                <span
                  className={classnames(
                    "absolute -right-4 -top-8",
                    "inline-block w-4 h-4 bg-red-600 rounded-full"
                  )}
                />
              )}
              <div className='space-y-4'>
                <Excerpt
                  collapsedHeight={400}
                  inlineControls={false}
                  overflowThreshold={20}
                >
                  <StyledText>
                    <MarkdownView
                      markdown={message.message as string}
                      style={textStyle}
                    />
                  </StyledText>
                </Excerpt>
              </div>
              {message.linkName && (
                <div>
                  <b>{message.linkName}</b>
                </div>
              )}
              <div className="flex flex-col space-y-2">
                {message.extra && message.extra.map(e => {
                  return (
                    <div className="items-center" title={e.description}>
                      <div className="flex grow px-1.5 touch:p-2">
                        <div
                          className={classnames(
                            "cursor-pointer",
                            "text-blue-curious hover:text-blue-chathams underline underline-offset-1",
                          )}
                          title={e.description}
                          onClick={() => {
                            store.selectTab('shareflow');
                            recordingService.selectRecordTabView('view', e.session_id);
                            setTimeout(() => {
                              const jumpMessage = {
                                type: 'jump',
                                id: e.session_id,
                                title: "Jump To...",
                                message: "Choose where to scroll:",
                                date: Date.now()*1000,
                                show_flag: true,
                                unread_flag: true,
                                need_save_flag: true,
                                extra: [e,],
                                autoDismiss: false,
                              }
                              toastMessenger.message([jumpMessage,]);
                            }, 3000);
                          }}
                        >
                          <b>{e.task_name}</b>
                        </div>
                        {e.role && (<b>{` - ${e.role?.teaching_role}`}</b>)}
                      </div>
                      <p className="text-xs ml-2 truncate">{e.description}</p>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </section>
      </CardContent>
    </Card>
  )
}

export default withServices(MessageCard, [
  'recordingService',
  'toastMessenger',
]);
