import { Card, CardContent, CardHeader } from '@hypothesis/frontend-shared';
import { useEffect, useState } from 'preact/hooks';
import classnames from 'classnames';

import { useSidebarStore } from '../store';
import MarkdownView from './MarkdownView';
import { applyTheme } from '../helpers/theme';


/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
export default function MessageTab() {
  const store = useSidebarStore();
  const isLoggedIn = store.isLoggedIn();
  const visibleThreads = store.allMessages();
  const sortableThreads = visibleThreads.sort((a, b) => b.date - a.date); // Z -> A

  const textStyle = applyTheme(['annotationFontFamily'], {});


  return (
    <>
      {isLoggedIn && sortableThreads.map(child => (
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
            <CardHeader>
              <div className='flex gap-x-1 items-baseline flex-wrap-reverse'>
                <h3 className='text-color-text font-bold'>
                  {child.title}
                </h3>
                <div className='justify-end grow' />
                <a
                  title='date'
                  className='text-xs leading-3 font-normal tracking-wide text-gray-400'
                >
                  {new Date(child.date/1000).toLocaleDateString('en-AU', {
                    day: '2-digit', month: '2-digit', year:'numeric', hour: '2-digit', minute:'2-digit', hour12: true})}
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <article className='space-y-4'>
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
    </>
  );
}

