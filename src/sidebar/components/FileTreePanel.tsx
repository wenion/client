import {Table, TableHead, TableBody, TableRow, Scroll } from '@hypothesis/frontend-shared/lib/next';
import {
  FilePdfIcon,
  FolderIcon,
  LinkIcon,
} from '@hypothesis/frontend-shared/lib/next';
import { useEffect } from 'preact/hooks';

import type { SidebarSettings } from '../../types/config';
import { username } from '../helpers/account-id';
import { withServices } from '../service-context';
import type { FileTreeService } from '../services/file-tree';
import type { SessionService } from '../services/session';
import { useSidebarStore } from '../store';
import SidebarPanel from './SidebarPanel';

type FileTreePanelProps = {
  fileTreeService: FileTreeService;
  session: SessionService;
  settings: SidebarSettings;
};

function FileTreePanel({
  fileTreeService,
  session,
  settings }: FileTreePanelProps) {
  const store = useSidebarStore();
  const isLoggedIn = store.isLoggedIn();
  const profile = store.profile();
  const displayName =
    profile.user_info?.display_name ?? username(profile.userid);

  const current_dir = store.allFiles();
  const current_path = store.currentDir();

  const panelTitle = 'Cloud Repository';

  useEffect(() => {
    store.openSidebarPanel('fileTree');
    fileTreeService.updateFileTree();
  }, [profile, settings, store]);

  const onDrop = (e: Event) => {
    console.log('onDrop', e)
  }

  const onDragLeave = (e: Event) => {
    console.log('onDragLeave', e)
  }

  const onDragOver = (e: Event) => {
    console.log('onDragOver', e)
  }

  const onDblClick = (e: Event) => {
    console.log(e)
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <SidebarPanel
      title={panelTitle}
      panelName="fileTree"
    >
      <div>
      <Scroll>
        <Table
          title="table test"
          interactive
          onDrop={onDrop}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
        >
          <TableHead>
            <TableRow>
            <div className="text-xl">
              {current_path}
            </div>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              current_dir.map(child => (
              <TableRow onDblClick={onDblClick}>
                <div className="text-lg items-center flex gap-x-2">
                  {child.type === 'dir' ? (
                    <FolderIcon className="w-em h-em" />
                  ) : (
                    child.type === 'file' ? (
                      <FilePdfIcon className="w-em h-em" />
                    ) : (
                      <LinkIcon className="w-em h-em" />
                    )
                  )}
                  {child.name}
                </div>
              </TableRow>
              ))
            }          
          </TableBody>
        </Table>
        </Scroll>
      </div>
    </SidebarPanel>
  );
}

export default withServices(FileTreePanel, ['fileTreeService', 'session', 'settings']);
