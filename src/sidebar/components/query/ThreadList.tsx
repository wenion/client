import classnames from 'classnames';

import type { QueryResults } from '../../../types/api';
import Thread from './Thread';


export type ThreadListProps = {
  threads: QueryResults[];
};

/**
 * Render a list of threads.
 *
 * The thread list is "virtualized", meaning that only threads in or near the
 * viewport are rendered. This is critical for performance and memory usage as
 * annotations (and replies) are complex interactive components whose
 * user-defined content may include rich media such as images, audio clips,
 * embedded YouTube videos, rendered math and more.
 */
export default function ThreadList({ threads }: ThreadListProps) {
  // Client height of the scroll container.

  return (
    <div class="flex flex-col" >
      {threads.map(child => (
        <div
          className={classnames(
            'mb-4 border bg-white'
          )}
          data-testid="thread-card-container"
        >
          <Thread thread={child} />
        </div>
      ))}
    </div>
  );
}
