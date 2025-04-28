import classnames from 'classnames';

import type { QueryResults } from '../../types/api';
import Thread from './Thread';


export type ThreadListProps = {
  threads: QueryResults[];
};

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
