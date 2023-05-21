import {
  Button,
  ButtonBase,
  BookmarkIcon,
  BookmarkFilledIcon,
  CaretRightIcon,
  MenuExpandIcon,
  FileGenericIcon,
  FilePdfIcon,
  ImageIcon,
  PreviewIcon,
} from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useEffect, useLayoutEffect, useMemo, useState } from 'preact/hooks';

import type { Thread as IThread } from '../helpers/build-thread';
import { withServices } from '../../sidebar/service-context';
import type { ThreadsService } from '../../sidebar/services/threads';
// import AnnotationUser from './Annotation/AnnotationUser';
import MarkdownView from './MarkdownView';

export type ThreadProps = {
  thread: IThread;

  // injected
  threadsService: ThreadsService;
};

function getFirst100Words(str: string) {
  const words = str.split(' ');
  const first1000Words = words.slice(0, 100);
  return first1000Words.join(' ') + '...';
}

/**
 * A thread, which comes from convertResponseToThread(), was imported by NotebookView and its
 * recursively-rendered children (i.e. replies).
 *
 */
function Thread({ thread, threadsService }: ThreadProps) {
  const [isBookmark, setIsBookmark]= useState(false)

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
                  <a href={thread.url}>
                    <h1 class="text-2xl font-robo">
                      {thread.title}
                    </h1>
                  </a>
                ) : (
                  <h1 class="text-2xl font-robo">
                    {thread.title}
                  </h1>
                )}
                <MarkdownView
                  markdown={thread.summary}
                  classes="text-lg leading-relaxed indent-8 font-sans"
                  // style={textStyle}
                />
              </div>
            </div>
        </section>
        <div className="mt-4 mr-4 finger-cursor" onClick={ e => { setIsBookmark(!isBookmark) }}>
          { isBookmark ? <BookmarkFilledIcon /> : <BookmarkIcon />}
        </div>
      </div>
      <footer className="m-4">
        {/* <AnnotationUser authorLink={url} displayName={authorName? authorName : 'anonymous'} /> */}
        <p className="ml-16 italic font-bold">highlights</p>
        <MarkdownView
          markdown={thread.highlights}
          classes="text-base ml-16 font-sans"
          // style={textStyle}
        />
      </footer>
    </>
  );
}

export default withServices(Thread, ['threadsService']);
