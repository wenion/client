import { TrashIcon, EllipsisIcon, SettingsIcon } from '@hypothesis/frontend-shared';
import { useState } from 'preact/hooks';
import classnames from 'classnames';

import { withServices } from '../service-context';
import { useSidebarStore } from '../store';
import type { RecordItem } from '../../types/api';
import type { RecordingService } from '../services/recording';
import ShareIcon from '../../images/icons/shared';
import UnshareIcon from '../../images/icons/unshared';

import Menu from './Menu';
import MenuItem from './MenuItem';
import MenuSection from './MenuSection';


export type RecordingMenuProps = {
  recordingService: RecordingService;
  recordItem: RecordItem;
  onDelete: (recordItem: RecordItem) => void;
};

function RecordingMenu({
  recordingService,
  recordItem,
  onDelete,
}: RecordingMenuProps) {
  const store = useSidebarStore();
  const [isOpen, setOpen] = useState(false);

  const onUpdate = (recordItem: RecordItem, share: boolean) => {
    recordingService.updateRecord(
      recordItem.id,
      {
        shared: share,
      }
    );
  };

  const onOpen = (recordItem: RecordItem) => {
    store.setFocusedRecordItemId(recordItem.id);
    store.toggleSidebarPanel('shareShareFlow', true);
  };

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
            label={recordItem.shared? 'Unshare' : 'Share'}
            icon={recordItem.shared? UnshareIcon: ShareIcon}
            onClick={() => onUpdate(recordItem, !recordItem.shared)}
          />
          <MenuItem
            label='Settings'
            icon={SettingsIcon}
            onClick={() => onOpen(recordItem)}
          />
          <MenuItem
            label='Delete'
            icon={TrashIcon}
            onClick={() => onDelete(recordItem)}
          />
        </MenuSection>
      </Menu>
    </div>
  );
}

export default withServices(RecordingMenu, ['recordingService']);
