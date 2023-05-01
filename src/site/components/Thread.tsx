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
} from '@hypothesis/frontend-shared/lib/next';
import classnames from 'classnames';

import type { Thread as IThread } from '../helpers/build-thread';
import { withServices } from '../../sidebar/service-context';
import type { ThreadsService } from '../../sidebar/services/threads';
import AnnotationUser from './Annotation/AnnotationUser';

export type ThreadProps = {
  thread: IThread;

  // injected
  threadsService: ThreadsService;
};

/**
 * A thread, which contains a single annotation at its top level, and its
 * recursively-rendered children (i.e. replies).
 *
 * - Threads with parents (replies) may be "collapsed". Top-level threads are
 *   never collapsed.
 * - Any thread may be "hidden" because it does not match current filters.
 *
 * Each reply thread renders as a two-column "row", with a control to toggle
 * the thread's collapsed state at left and the content for the thread and its
 * children to the right.
 *
 * Top-level threads do not render a collapse control, as they are not
 * collapsible.
 */
function Thread({ thread, threadsService }: ThreadProps) {
  const dataType = thread.annotation?.data_type;
  const link = thread.annotation?.url;
  const title = thread.annotation?.title;
  const text = thread.annotation?.context;
  const authorName = thread.annotation?.author;
  const url = thread.annotation?.url;

  return (
    <>
      <div class="flex">
        <section className="grow p-2" data-testid="thread-container">
          <a href={link}>
            <div class="flex gap-6">
              <div class="flex-none flex items-center">
                {dataType === "pdf" ? (
                  <FilePdfIcon className="w-16 h-16"
                  />
                ) : (dataType === "image" ? (
                  <ImageIcon className="w-16 h-16"
                    />
                ) : (dataType === "video" ? (
                  <PreviewIcon className="w-16 h-16"
                  />
                ) : (
                  <FileGenericIcon className="w-16 h-16"
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
                <h1 class="font-robo">
                  {title}
                </h1>
                <p className="text-base font-open">
                  {text}
                </p>
            </div>
            </div>
          </a>
        </section>
        <div className="flex justify-end">
          <BookmarkIcon />
        </div>
      </div>
      <footer className="flex ml-8">
        <AnnotationUser authorLink={url} displayName={authorName? authorName : 'anonymous'} />
      </footer>
    </>
  );
}

export default withServices(Thread, ['threadsService']);
