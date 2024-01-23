import { Card, CardContent } from '@hypothesis/frontend-shared';
import { useEffect, useState } from 'preact/hooks';
import classnames from 'classnames';

import { useSidebarStore } from '../store';
import SidebarContentError from './SidebarContentError';
import { useRootThread } from './hooks/use-root-thread';
import MarkdownView from './MarkdownView';
import type { RawMessageData  } from '../../types/api';
import { applyTheme } from '../helpers/theme';

type AnnotationViewProps = {
  onLogin: () => void;

  // Injected
  // queryService: QueryService;
};

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
export default function MessageList({
  // queryService,
  onLogin,
}: AnnotationViewProps) {
  const store = useSidebarStore();
  const annotationId = store.routeParams().id ?? '';
  const rootThread = useRootThread();
  const userid = store.profile().userid;

  const visibleThreads = store.allMessages();

  const textStyle = applyTheme(['annotationFontFamily'], {});

  const [fetchError, setFetchError] = useState(false);

  return (
    <>
      {fetchError && (
        // This is the same error shown if a direct-linked annotation cannot
        // be fetched in the sidebar. Fortunately the error message makes sense
        // for this scenario as well.
        <SidebarContentError errorType="annotation" onLoginRequest={onLogin} />
      )}
      <div>
      {visibleThreads.map(child => (
        <div
          className={classnames(
            // The goal is to space out each annotation card vertically. Typically
            // this is better handled by applying vertical spacing to the parent
            // element (e.g. `space-y-3`) but in this case, the constraints of
            // sibling divs before and after the list of annotation cards prevents
            // this, so a bottom margin is added to each card's wrapping element.
            'mb-3',
          )}
          data-testid="thread-card-container"
          id={child.id}
          key={child.id}
        >
          <Card
            classes="cursor-pointer focus-visible-ring theme-clean:border-none"
            data-testid="thread-card"
            tabIndex={-1}
            // onMouseEnter={() => setThreadHovered(thread.annotation ?? null)}
            // onMouseLeave={() => setThreadHovered(null)}
            key={child.id}
          >
            <CardContent>
              <article className='space-y-4'>
                <header>
                  <div className='flex gap-x-1 items-baseline flex-wrap-reverse'>
                    <h3 className='text-color-text font-bold'>
                      {child.title}
                    </h3>
                    <div className='flex justify-end grow'>
                      <a
                        title='date'
                        className='text-xs leading-3 font-normal tracking-wide text-gray-400'
                      >
                        {child.date}
                      </a>
                    </div>
                  </div>
                </header>
                <div className='space-y-4'>
                  <MarkdownView
                    markdown={child.message as string}
                    style={textStyle}
                  />
                </div>
              </article>
            </CardContent>
          </Card>
        </div>
      ))}
      </div>
    </>
  );
}

