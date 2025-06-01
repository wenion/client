import { EllipsisIcon } from '@hypothesis/frontend-shared';
import { useState } from 'preact/hooks';
import classnames from 'classnames';

import { formatRelativeDate } from '../../sidebar/util/time';
import { withServices } from '../../sidebar/service-context';
import { useSidebarStore } from '../../sidebar/store';
import type { RecordingService } from '../../sidebar/services/recording';

import Menu from './Menu';
import MenuItem from './MenuItem';
import MenuSection from './MenuSection';


export type HistoryMenuProps = {
  recordingService: RecordingService;
  id: string;
};

function HistoryMenu({
  recordingService,
  id,
}: HistoryMenuProps) {
  const store = useSidebarStore();
  const [isOpen, setOpen] = useState(false);
  const history = store.getHistory();

  const now = new Date();

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
      {history && history.length === 1 ? (
        <MenuItem
          label={`item.title - ${formatRelativeDate(new Date(history[0].created), now)}`}
        />
      ) : (
        <Menu
          label="history"
          title="More..."
          align="right"
          menuIndicator={false}
          open={isOpen}
          onOpenChanged={setOpen}
        >
          <MenuSection>
            {history && history.slice(1).map(item => (
              <MenuItem
                label={`${item.title} - ${formatRelativeDate(new Date(item.created), now)}`}
                onClick={() => {
                  recordingService.getHistoryVersion(id, item.version);
                  // recordingService.getHistoryList(id);
                }}
              />
              )
            )}
          </MenuSection>
        </Menu>
      )}
    </div>
  );
}

export default withServices(HistoryMenu, ['recordingService']);
