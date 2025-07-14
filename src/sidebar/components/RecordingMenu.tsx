import { TrashIcon, EllipsisIcon, SettingsIcon } from '@hypothesis/frontend-shared';
import { useState } from 'preact/hooks';
import classnames from 'classnames';

import { withServices } from '../service-context';
import { useSidebarStore } from '../store';
import type { RecordingService } from '../services/recording';
import type { RecordItem } from '../../types/api';

import Menu from './Menu';
import MenuItem from './MenuItem';
import MenuSection from './MenuSection';
import ShareIcon from '../../images/icons/shared';
import ModelingIcon from '../../images/icons/modeling';


export type RecordingMenuProps = {
  recordItem: RecordItem;
  onShare: (recordItem: RecordItem) => void;
  onDelete: (recordItem: RecordItem) => void;
  recordingService: RecordingService;
};

function RecordingMenu({
  recordItem,
  onShare,
  onDelete,
  recordingService,
}: RecordingMenuProps) {
  const store = useSidebarStore();
  const [isOpen, setOpen] = useState(false);

  const onRegenerate = (recordItem: RecordItem) => {
    recordingService.updateRecord(
      recordItem.id,
      {
        regenerate: true,
      }
    );
  };

  const group = store.focusedGroup();

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
        title="More..."
        align="right"
        menuIndicator={false}
        open={isOpen}
        onOpenChanged={setOpen}
      >
        <MenuSection>
          {/* <MenuItem
            label='Regenerate'
            icon={ModelingIcon}
            onClick={() => onRegenerate(recordItem)}
          /> */}
          {group && (
            <MenuItem
              label={`Share with ${group.name.slice(0, 10)} `}
              icon={ShareIcon}
              onClick={() => onShare(recordItem)}
            />
          )}
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
