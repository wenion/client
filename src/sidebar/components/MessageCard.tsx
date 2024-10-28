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

type MessageCardProps = {
  message: RawMessageData;
  recordingService: RecordingService;
};

function MessageCard({ message, recordingService }: MessageCardProps) {
  const now = new Date();
  const createdDate = new Date(message.date/1000);

  const store = useSidebarStore();
  const textStyle = applyTheme(['annotationFontFamily'], {});

  return (
    <Card
      classes="cursor-pointer focus-visible-ring theme-clean:border-none"
      data-testid="thread-card"
      tabIndex={-1}
      key={message.id}
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
            <article className="space-y-4">
              <header>
                <div className="flex gap-x-1 items-baseline flex-wrap-reverse">
                  <h3 className="text-color-text font-bold">{message.title}</h3>
                  <div className="flex justify-end grow">
                    {formatRelativeDate(createdDate, now)}
                  </div>
                </div>
              </header>
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
              <div className="flex flex-col space-y-2">
                {message.extra && message.extra.map(e => {
                  return (
                    <div className="flex items-center">
                      <div className="grow px-1.5 touch:p-2">
                        <div
                          className={classnames(
                            "cursor-pointer",
                            "text-blue-curious hover:text-blue-chathams underline underline-offset-1",
                          )}
                          onClick={() => {
                            if (e.session_id && e.user_id) {
                              store.selectTab('recording');
                              store.changeRecordingStage('Idle');
                              recordingService.getRecording(e.session_id, e.user_id)
                            }
                          }}
                        >
                          <b>{e.task_name}</b>
                        </div>
                      </div>
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

export default withServices(MessageCard, ['recordingService']);
