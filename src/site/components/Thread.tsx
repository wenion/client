import {
  BookmarkIcon,
  BookmarkFilledIcon,
  FileGenericIcon,
  FilePdfIcon,
  ImageIcon,
  PreviewIcon,
} from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useEffect, useLayoutEffect, useMemo, useState } from 'preact/hooks';

import type { Thread as IThread } from '../helpers/build-thread';
import { withServices } from '../../sidebar/service-context';
import type { QueryService } from '../../sidebar/services/query';
import type { ThreadsService } from '../../sidebar/services/threads';
import MarkdownView from './MarkdownView';

export type ThreadProps = {
  thread: IThread;

  // injected
  threadsService: ThreadsService;
  queryService: QueryService;
};

/**
 * A thread, which comes from convertResponseToThread(), was imported by NotebookView and its
 * recursively-rendered children (i.e. replies).
 *
 */
function Thread({ thread, threadsService, queryService}: ThreadProps) {
  const onClickResult = (thread: IThread) => {
    if (thread.url) {
      queryService.pushRecommandation({
        id: thread.id,
        title: 'Highlights',
        context: thread.highlights,
        type:'self',
        url: encodeURIComponent(thread.url),})
      window.location.href = thread.url;
    }
  }

  return (
    <>
      <div class="flex min-h-max">
        <section className="grow m-4" data-testid="thread-container">
            <div class="flex gap-6">
              <div class="flex-none flex items-center">
                {thread.dataType === "pdf" ? (
                  <FilePdfIcon className="w-8 h-8"
                  />
                ) : (thread.dataType === "image" ? (
                  <ImageIcon className="w-8 h-8"
                    />
                ) : (thread.dataType === "video" ? (
                  <PreviewIcon className="w-8 h-8"
                  />
                ) : (
                  <FileGenericIcon className="w-8 h-8"
                  />
                )
                ))}
              </div>
              <div
                className={classnames(
                  // Set a max-width to ensure that annotation content does not exceed
                  // the width of the container
                  'grow max-w-full gap-8 p-2'
                )}
                data-testid="thread-content"
              >
                {thread.url? (
                  <h1
                    class="text-2xl font-robo finger-cursor hover:text-red-400"
                    onClick={() => onClickResult(thread)}
                  >
                    {thread.title}
                  </h1>
                ) : (
                  <h1 class="text-2xl font-robo">
                    {thread.title}
                  </h1>
                )}
                <MarkdownView
                  markdown={thread.summary}
                  classes="text-lg leading-relaxed font-sans"
                  // style={textStyle}
                />
              </div>
            </div>
        </section>
        <div className="mt-4 mr-4 finger-cursor" onClick={ e => { queryService.setBookmark(thread.id, !thread.isBookmark) }}>
          { thread.isBookmark ? <BookmarkFilledIcon /> : <BookmarkIcon />}
        </div>
      </div>
      <footer className="mb-8">
        <p className="ml-16 font-bold"><em>source</em>: {thread.repository}</p>
        {/* <MarkdownView
          markdown={thread.repository}
          classes="text-base ml-16 font-sans"
          // style={textStyle}
        /> */}
      </footer>
    </>
  );
}

export default withServices(Thread, ['threadsService', 'queryService']);
