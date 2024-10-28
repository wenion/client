import { TrashIcon, EllipsisIcon } from '@hypothesis/frontend-shared';
import { useState } from 'preact/hooks';
import classnames from 'classnames';

import { withServices } from '../service-context';
import { useSidebarStore } from '../store';
import ShareIcon from '../../images/icons/shared';
import UnshareIcon from '../../images/icons/unshared';
import type { RecordingService } from '../services/recording';
import type { Recording } from '../../types/api';

import Menu from './Menu';
import MenuItem from './MenuItem';
import MenuSection from './MenuSection';


export type RecordingMenuProps = {
  recordingService: RecordingService;
  recording: Recording;
};

function RecordingMenu({
  recordingService,
  recording,
}: RecordingMenuProps) {
  const store = useSidebarStore();
  const [isOpen, setOpen] = useState(false);

  const menuLabel = (
    <span className="rotate-90 p-2">
      <EllipsisIcon />
    </span>
  );

  return (
    <div
      className={classnames(
        'flex items-center font-semibold rounded',
        'text-grey-7 bg-grey-1',
        'enabled:hover:text-grey-9 enabled:hover:bg-grey-2',
        'aria-pressed:text-grey-9 aria-expanded:text-grey-9',
        'grow-0 m-1 bg-grey-0 hover:bg-blue-400',
      )}
    >
      <Menu
        label={menuLabel}
        title='More actions'
        align="right"
        menuIndicator={false}
        open={isOpen}
        onOpenChanged={setOpen}
      >
        <MenuSection>
          <MenuItem
            label={!!recording.shared? 'Unshare' : 'Share'}
            icon={!!recording.shared? UnshareIcon: ShareIcon}
            onClick={() => {
              recordingService.updateRecording(recording.session_id, !recording.shared);
            }}
          />
          <MenuItem
            label='Delete'
            icon={TrashIcon}
            onClick={() => {
              store.selectRecordBySessionId(recording.sessionId, 'delete')
            }}
          />
        </MenuSection>
      </Menu>
    </div>
  );
}

export default withServices(RecordingMenu, ['recordingService']);
