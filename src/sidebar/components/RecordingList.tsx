import {PreviewIcon, TrashIcon, EllipsisIcon } from '@hypothesis/frontend-shared';
import { Table, TableHead, TableBody, TableRow } from '@hypothesis/frontend-shared';
import classnames from 'classnames';

import { withServices } from '../service-context';
import { useSidebarStore } from '../store';
import type { RecordingService } from '../services/recording';
import RecordingMenu from './RecordingMenu';


const capitalize = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const getUserName = (userid: string) => {
  const pattern = /acct:(.*?)@/;
  const match = userid.match(pattern);
  return match? capitalize(match[1]): userid;
}

export type RecordingListProps = {
  recordingService: RecordingService;
};

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
function RecordingList({
  recordingService,
}: RecordingListProps) {
  const store = useSidebarStore();
  const recordings = store.Records();
  const userid = store.profile().userid;

  return (
    <>
      <h1 className='m-4 text-xl'>Saved ShareFlow (Comic)</h1>
      <Table
        title="Saved ShareFlow"
        interactive
      >
        <TableBody>
          {recordings.map(child => (
            <TableRow>
              <div
                className={classnames('flex')}
                onClick={(event) => {
                  event.stopPropagation();
                  recordingService.getRecording(child.sessionId, child.userid);
                }}
              >
                <div id="shareflow" className="grow text-lg items-center flex gap-x-2">
                  <PreviewIcon/>
                  {child.taskName}
                </div>
                {/* <div className='flex items-center gap-x-2'>
                  {child.timestamp && new Date(child.timestamp).toLocaleDateString('en-AU', {
                    day: '2-digit', month: '2-digit', year:'numeric', hour: '2-digit', minute:'2-digit', hour12: false})}
                </div> */}
                {userid && child.userid && userid === child.userid && !!child.shared &&
                <div className='flex items-center'>
                  <div class="text-blue-700 bg-blue-50 border-blue-200 border rounded">&nbsp;shared&nbsp;</div>
                </div>
                }
                {userid && child.userid && userid !== child.userid && (
                  <div className='flex items-center'>
                    <em>shared by&nbsp;</em>
                    <div class="text-blue-700 bg-blue-50 border-blue-200 border rounded">
                      &nbsp;{getUserName(child.userid)}&nbsp;
                    </div>
                  </div>
                )}
                {userid && child.userid && userid === child.userid ? (
                  <RecordingMenu
                    recording={child}
                  />
                ) : (
                  <div
                    className={classnames(
                      'flex items-center font-semibold rounded',
                      'text-grey-7 bg-grey-1',
                      'enabled:hover:text-grey-9 enabled:hover:bg-grey-2',
                      'aria-pressed:text-grey-9 aria-expanded:text-grey-9',
                      'grow-0 m-1 bg-grey-0 hover:bg-blue-400',
                    )}
                    onClick={(event) => {event.stopPropagation();}}
                  >
                    <span className="rotate-90 p-2">
                      <EllipsisIcon />
                    </span>
                  </div>
                )}
              </div>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

export default withServices(RecordingList, ['recordingService']);
