import { CaretDownIcon, CaretRightIcon } from '@hypothesis/frontend-shared';
import { useEffect, useState } from 'preact/hooks';
import classnames from 'classnames';
import { withServices } from '../service-context';

import type { RawMessageData } from '../../types/api';
import { useSidebarStore } from '../store';
import MarkdownView from './MarkdownView';
import { applyTheme } from '../helpers/theme';

import type { RecordingService } from '../services/recording';

type MessageListProps = {
  title: string;
  threads: RawMessageData[];
  recordingService: RecordingService;
};

function MessageList({
  title,
  threads,
  recordingService,
}: MessageListProps) {
  const store = useSidebarStore();
  const isLoggedIn = store.isLoggedIn();
  const textStyle = applyTheme(['annotationFontFamily'], {});

  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
  }, [collapsed])

  return (
    <>
      <div
        className='flex items-center gap-x-1 cursor-pointer'
        onClick={() => setCollapsed(!collapsed)}
      >
        <h4 class="text-lg border-b border-stone-300 text-slate-600 font-normal my-2">
          {title + ' [' + threads.length +']'}
        </h4>
        {collapsed ? <CaretDownIcon className='grow-0'/> : <CaretRightIcon className='grow-0'/>}
      </div>
      {!collapsed && threads.map(child => (
        <div
          className={classnames(
            // The goal is to space out each annotation card vertically. Typically
            // this is better handled by applying vertical spacing to the parent
            // element (e.g. `space-y-3`) but in this case, the constraints of
            // sibling divs before and after the list of annotation cards prevents
            // this, so a bottom margin is added to each card's wrapping element.
            'my-4 overflow-auto',
            'shadow-xl rounded-md bg-orange-200',
            'hover:drop-shadow-2xl'
            // hover drop-shadow-2xl
          )}
          data-testid="thread-card-container"
          id={child.id}
          key={child.id}
        >
          <div
            className="cursor-pointer focus-visible-ring theme-clean:border-none"
            data-testid="thread-card"
            tabIndex={-1}
            // onMouseEnter={() => setThreadHovered(thread.annotation ?? null)}
            // onMouseLeave={() => setThreadHovered(null)}
            key={child.id}
          >
            <div className='border-b border-slate-300 flex gap-x-1 items-baseline flex-wrap-reverse'>
              <h3 className='mt-2 mx-2 text-color-text font-bold'>
                {child.title}
              </h3>
              <div className='justify-end grow' />
              <a
                title='date'
                className='mx-2 text-xs leading-3 font-normal tracking-wide text-gray-400'
              >
                {new Date(child.date/1000).toLocaleDateString('en-AU', {
                  day: '2-digit', month: '2-digit', year:'numeric', hour: '2-digit', minute:'2-digit', hour12: true})}
              </a>
            </div>
            <div className='m-2 space-y-4'>
              <MarkdownView
                markdown={child.message as string}
                style={textStyle}
              />
              {child.extra && child.extra.map(e => (
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
            ))}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
function MessageTab({recordingService}: {recordingService: RecordingService;}) {
  const store = useSidebarStore();
  const additionalThread = store.allAdditionalMessages();
  const organisationEventThreads = store.allOrganisationEventMessages();
  const instanceThreads = store.allInstanceMessages().sort((a, b) => b.date - a.date);
  const sortableThreads = organisationEventThreads.sort((a, b) => b.date - a.date); // Z -> A

  return (
    <>
      <MessageList title='Additional knowledge' threads={additionalThread} recordingService={recordingService} />
      <MessageList title='ShareFlow recommendation' threads={instanceThreads} recordingService={recordingService} />
      <MessageList title='Organisation event' threads={sortableThreads} recordingService={recordingService} />
    </>
  );
}

export default withServices(MessageTab, ['recordingService']);
