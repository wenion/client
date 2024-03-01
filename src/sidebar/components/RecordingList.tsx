import { Overlay, Panel, Input, Button, Spinner } from '@hypothesis/frontend-shared';
import {PreviewIcon, CaretRightIcon, TrashIcon } from '@hypothesis/frontend-shared';
import { Table, TableHead, TableBody, TableRow } from '@hypothesis/frontend-shared';
import { useEffect, useRef, useState } from 'preact/hooks';
import classnames from 'classnames';

import { useSidebarStore } from '../store';

type RecordingListProps = {
  // frameSync: FrameSyncService;
};

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
export default function RecordingList({
  // frameSync,
}: RecordingListProps) {
  const store = useSidebarStore();
  const recordings = store.Recordings();
  const deleteConfirmation = (taskName: string) => {
    store.updateDeleteConfirmation(taskName, true)
  }

  return (
    <>
      <h1 className='m-4 text-xl'>Saved ShareFlows</h1>
      <Table
        title="Saved ShareFlows"
        interactive
      >
        <TableBody>
          {recordings.map(child => (
            <TableRow
              onClick={() => store.selectRecording(child.taskName)}
              >
              <div className={classnames('flex')}>
                <div className="grow text-lg items-center flex gap-x-2">
                  <PreviewIcon/>
                  {child.taskName}
                </div>
                <Button
                  classes={classnames('grow-0 m-1 bg-grey-0 hover:bg-red-40 ' )}
                >
                  <CaretRightIcon/>
                </Button>
                <Button
                  classes={classnames('grow-0 m-1 bg-grey-0 hover:bg-red-400' )}
                  onClick={() => deleteConfirmation(child.taskName)}
                >
                  <TrashIcon/>
                </Button>
              </div>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

// export default withServices(RecordingList, ['frameSync', ]);
