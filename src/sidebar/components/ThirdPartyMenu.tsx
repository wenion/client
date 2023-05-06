import { SocialFacebookIcon } from '@hypothesis/frontend-shared/lib/next';

import { useSidebarStore } from '../store';
import { withServices } from '../service-context';
import { FileTreeService } from '../services/file-tree';
import type { FrameSyncService } from '../services/frame-sync';
import Menu from './Menu';
import MenuItem from './MenuItem';

export type ThirdPartyMenuProps = {
  // injected
  fileTreeService: FileTreeService;
  frameSync: FrameSyncService;
};

/**
 * A drop-down menu of sorting options for a collection of annotations.
 */
export function ThirdPartyMenu({fileTreeService, frameSync,}: ThirdPartyMenuProps) {
  const store = useSidebarStore();
  const sortKeysAvailable = ['import from Google drive', 'import from Slack'];
  const mainFrame = store.mainFrame();

  const onClick = async (option: string) => {
    const link = await fileTreeService.getClientURL();
    if (!link) {
      alert('Sorry, Could not get the homepage url');
      return;
    }
      
    if (mainFrame?.uri != link) {
      alert('We need to redirect to homepage to require Google drive access. Please click the button again');
      window.parent.location = link;
    }
    else {
      if (option == 'import from Google drive') {
        frameSync.notifyHost('closeSidebar');
        window.parent.postMessage('Google drive auth', link);
      }
    }
  }

  const menuItems = sortKeysAvailable.map(sortOption => {
    return (
      <MenuItem
        key={sortOption}
        label={sortOption}
        onClick={() => onClick(sortOption)}
      />
    );
  });

  const menuLabel = (
    <span className="p-1">
      <SocialFacebookIcon />
    </span>
  );

  return (
    <div className="SortMenu">
      <Menu
        label={menuLabel}
        title="upload knowledge from other repository"
        align="right"
        menuIndicator={false}
      >
        {menuItems}
      </Menu>
    </div>
  );
}

export default withServices(ThirdPartyMenu, ['fileTreeService', 'frameSync',]);
