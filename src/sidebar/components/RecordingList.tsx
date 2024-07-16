import {PreviewIcon, TrashIcon, EllipsisIcon } from '@hypothesis/frontend-shared';
import { Table, TableHead, TableBody, TableRow } from '@hypothesis/frontend-shared';
import classnames from 'classnames';

import { withServices } from '../service-context';
import { useSidebarStore } from '../store';
import ShareIcon from '../../images/icons/shared';
import UnshareIcon from '../../images/icons/unshared';
import type { RecordingService } from '../services/recording';

import Menu from './Menu';
import MenuItem from './MenuItem';
import MenuSection from './MenuSection';

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

  
  const menuLabel = (
    <div className="rotate-90">
      <EllipsisIcon />
    </div>
  );

  return (
    <>
      <h1 className='m-4 text-xl'>Saved ShareFlow</h1>
      <Table
        title="Saved ShareFlow"
        interactive
      >
        <TableBody>
          {recordings.map(child => (
            <TableRow
              onClick={(event) => {event.stopPropagation(); recordingService.getRecording(child.sessionId, child.userid);}}
              >
              <div className={classnames('flex')}>
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
                <div
                  className={classnames(
                    'flex items-center font-semibold rounded',
                    'text-grey-7 bg-grey-1',
                    'enabled:hover:text-grey-9 enabled:hover:bg-grey-2',
                    'aria-pressed:text-grey-9 aria-expanded:text-grey-9',
                    'p-2 gap-x-2 grow-0 m-1 bg-grey-0 hover:bg-blue-400',
                  )}>
                  <Menu
                    label={menuLabel}
                    title='More actions'
                    align="right"
                    menuIndicator={false}
                  >
                    <MenuSection>
                      {userid && child.userid && userid === child.userid && (
                        <>
                          <MenuItem
                            label={!!child.shared? 'Unshare' : 'Share'}
                            icon={!!child.shared? UnshareIcon: ShareIcon}
                            onClick={() => {
                              recordingService.updateRecording(child.session_id, !child.shared);
                            }}
                          />
                          <MenuItem
                            label='Delete'
                            icon={TrashIcon}
                            onClick={() => {
                              store.selectRecordBySessionId(child.sessionId, 'delete')
                            }}
                          />
                        </>
                      )}
                    </MenuSection>
                  </Menu>
                </div>
              </div>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

export default withServices(RecordingList, ['recordingService']);
