import {
  BookmarkIcon,
  BookmarkFilledIcon,
  FileGenericIcon,
  FilePdfIcon,
  MenuCollapseIcon,
  MenuExpandIcon,
  ImageIcon,
  PreviewIcon,
} from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useEffect, useLayoutEffect, useMemo, useState, useRef } from 'preact/hooks';

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
  const content = useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const onClickResult = (thread: IThread) => {
    if (isExpanded) {
      if (thread.url) {
        queryService.pushRecommendation({
          id: thread.id,
          title: 'Highlights',
          context: thread.pageContent,
          type:'self',
          query: thread.query ? thread.query: '',
          url: thread.url,
        })
        window.open(thread.url);
      }
    }
    else if (!isExpanded && content.current) {
      setIsExpanded(true)
    }
  }

  const onClickExpand = () => {
    setIsExpanded(!isExpanded)
  }

  useEffect(() => {
    if (content.current && isExpanded) {
      content.current.className = "block"
    }
    else if (content.current && !isExpanded) {
      content.current.className = "hidden"
    }
  }, [isExpanded])

  return (
    <>
      <header class="flex">
        {thread.url? (
          <h1
            class="grow self-center text-left ml-10 text-2xl font-robo finger-cursor hover:text-red-400"
            onClick={() => onClickResult(thread)}
          >
            {thread.title}
          </h1>
        ) : (
          <h1 class="grow self-center text-left ml-10 text-2xl font-robo">
            {thread.title}
          </h1>
        )}
        <div className="grow-0 p-4 finger-cursor" onClick={ e => { queryService.setBookmark(thread.id, !thread.isBookmark) }}>
          { thread.isBookmark ? <BookmarkFilledIcon /> : <BookmarkIcon />}
        </div>
        <div className="grow-0 p-4 finger-cursor" onClick={ e => { onClickExpand() }}>
          { isExpanded ? <MenuCollapseIcon /> : <MenuExpandIcon />}
        </div>
      </header>
      <div ref={content}>
        <div class="flex gap-4">
          <div class="flex-none self-center items-center">
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
            <MarkdownView
              markdown={thread.summary}
              classes="text-lg leading-relaxed font-sans"
              // style={textStyle}
            />
          </div>
        </div>
        <footer className="mb-8">
          <p className="ml-16 font-bold"><em>source</em>: {thread.repository}</p>
        </footer>
      </div>
    </>
  );
}

export default withServices(Thread, ['threadsService', 'queryService']);
