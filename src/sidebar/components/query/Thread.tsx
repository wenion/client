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

import { withServices } from '../../service-context';
import type { QueryService } from '../../services/query';
import type { QueryResults } from '../../../types/api';
import MarkdownView from '../MarkdownView';


export type ThreadProps = {
  thread: QueryResults;

  // injected
  queryService: QueryService;
};

/**
 * A thread, which comes from convertResponseToThread(), was imported by NotebookView and its
 * recursively-rendered children (i.e. replies).
 *
 */
function Thread({ thread, queryService}: ThreadProps) {
  const content = useRef<HTMLDivElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const onClickResult = (thread: QueryResults) => {
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
        <div
          className="grow-0 p-4 cursor-pointer"
        >
          {(() => {
            switch (thread.dataType) {
              case "pdf":
                return <FilePdfIcon />;
              case "image":
                return <ImageIcon />;
              case "video":
                return <PreviewIcon />;
              default:
                return <FileGenericIcon />;
            }
          })()}
        </div>
        <h1
          className={classnames(
            "grow self-center ",
            "text-left ml-2 text-base font-robo",
            "break-all cursor-pointer truncate",
          )}
          title={thread.title}
          onClick={e => {onClickExpand()}}
        >
          {thread.title}
        </h1>
        {/* <div
          className="grow-0 p-4 cursor-pointer"
          onClick={ e => { queryService.setBookmark(thread.id, !thread.isBookmark) }}
        >
          { thread.isBookmark ? <BookmarkFilledIcon /> : <BookmarkIcon />}
        </div> */}
        <div className="grow-0 p-4 cursor-pointer" onClick={ e => { onClickExpand() }}>
          { isExpanded ? <MenuCollapseIcon /> : <MenuExpandIcon />}
        </div>
      </header>
      <div
        class="cursor-pointer hover:text-blue-400"
        ref={content}
        onClick={() => onClickResult(thread)}
      >
        <div
          class="my-4 mx-12 cursor-pointer"
          data-testid="thread-content"
        >
          <MarkdownView
            markdown={thread.summary}
            classes="cursor-pointer text-base leading-relaxed font-sans"
            // style={textStyle}
          />
        </div>
        <footer className="my-8">
          <p className="ml-4 font-bold"><em>source</em>: {thread.repository}</p>
        </footer>
      </div>
    </>
  );
}

export default withServices(Thread, ['queryService']);
