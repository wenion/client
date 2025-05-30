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
          className="flex-none p-4 cursor-pointer"
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
            "grow self-center",
            "text-left text-base font-robo",
            "break-all cursor-pointer truncate",
          )}
          title={thread.title}
          onClick={e => {onClickExpand()}}
        >
          {thread.title}
        </h1>
        <div
          className={classnames(
            "flex items-center",
            "h-min self-center",
            "text-blue-700 bg-blue-50",
            "border-blue-200 border rounded px-1",
            "cursor-pointer",
            "hover:underline"
          )}
          onClick={() => onClickResult(thread)}
        >
          <span>{thread.repository.split('-json', 1)[0]}</span>
        </div>
        <div className="flex-none p-4 cursor-pointer" onClick={ e => { onClickExpand() }}>
          { isExpanded ? <MenuCollapseIcon /> : <MenuExpandIcon />}
        </div>
      </header>
      <div
        class="cursor-pointer hover:text-blue-400"
        ref={content}
      >
        <div
          class="mt-2 mb-4 mx-8"
          data-testid="thread-content"
        >
          <MarkdownView
            markdown={thread.summary}
            classes="text-base leading-relaxed font-sans"
            // style={textStyle}
          />
        </div>
      </div>
    </>
  );
}

export default withServices(Thread, ['queryService']);
