import { SocialFacebookIcon } from '@hypothesis/frontend-shared';

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

  window.addEventListener('message', event=> {
    if (event.data && event.data.data && event.data.data.action === 'picked') {
      console.log('Received message from parent:', event.data, event.origin);
      const meta = {
        title: event.data.data.docs[0].name,
        link: [{href: event.data.data.docs[0].embedUrl}],
      }
      fileTreeService.uploadFile(event.data.blob, meta);

    }
  });

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
      <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 96 960 960" width="20"><path d="M732 912V804H624v-72h108V624h72v108h108v72H804v108h-72Zm-494 24q-20 0-36.5-9.5T175 900L84 741q-10-17-10-36t10-36l242-417q10-17 27-26.5t36-9.5h182q19 0 36 9.5t27 26.5l177 304q-11-2-21.5-3t-21.5-1q-11 0-21 1t-20 3L571 288H389L146 705l92 159h337q11 21 25 39t32 33H238Zm62-171-27-48 173-302h69l109 192q-15 13-27 28t-21 33l-96-168-111 194 196-1q-7 17-10 35t-3 37H300Z"/></svg>
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
