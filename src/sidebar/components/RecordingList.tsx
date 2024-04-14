import { Overlay, Panel, Input, Button, Spinner } from '@hypothesis/frontend-shared';
import {PreviewIcon, CaretRightIcon, TrashIcon } from '@hypothesis/frontend-shared';
import { Table, TableHead, TableBody, TableRow } from '@hypothesis/frontend-shared';
import classnames from 'classnames';

import { useSidebarStore } from '../store';
import ShareIcon from '../../images/icons/share';


/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
export default function RecordingList() {
  const store = useSidebarStore();
  const recordings = store.Records();

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
              onClick={(event) => {event.stopPropagation(); store.selectRecordBySessionId(child.sessionId, 'view')}}
              >
              <div className={classnames('flex')}>
                <div className="grow text-lg items-center flex gap-x-2">
                  <PreviewIcon/>
                  {child.taskName}
                </div>
                {/* <Button
                  classes={classnames('grow-0 m-1 bg-grey-0 hover:bg-red-40 ' )}
                >
                  <ShareIcon/>
                </Button> */}
                <Button
                  classes={classnames('grow-0 m-1 bg-grey-0 hover:bg-red-400' )}
                  onClick={(event) => {
                    event.stopPropagation();
                    store.selectRecordBySessionId(child.sessionId, 'delete')
                  }}
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
