import {Table, TableHead, TableBody, TableRow, Scroll } from '@hypothesis/frontend-shared/lib/next';
import {
  FilePdfIcon,
  FolderIcon,
  LinkIcon,
} from '@hypothesis/frontend-shared/lib/next';
import type { ComponentChildren as Children } from 'preact';
import { useCallback, useMemo, useState } from 'preact/hooks';

import { username } from '../helpers/account-id';
import { withServices } from '../service-context';
import type { SessionService } from '../services/session';
import { useSidebarStore } from '../store';
import SidebarPanel from './SidebarPanel';

type HelpPanelProps = {
  session: SessionService;
};

function FileTreePanel({ session }: HelpPanelProps) {
  const store = useSidebarStore();
  const isLoggedIn = store.isLoggedIn();
  const profile = store.profile();
  const displayName =
    profile.user_info?.display_name ?? username(profile.userid);

  const panelTitle = 'Your Cloud Repository';

  const currentDirectory = {
    current_path: '/home/user',
    current_dir: [
      {name: '..', path: './..', type: 'dir'},
      {name: '.babelrc', path: './.babelrc', type: 'file'},
      {name: '.eslintignore', path: './.eslintignore', type: 'file'},
      {name: '.eslintrc', path: './.eslintrc', type: 'file'},
      {name: '.git', path: './.git', type: 'dir'},
      {name: '.github', path: './.github', type: 'dir'},
      {name: '.gitignore', path: './.gitignore', type: 'file'},
      {name: '.npmignore', path: './.npmignore', type: 'file'},
      {name: '.npmrc', path: './.npmrc', type: 'file'},
      {name: '.prettierignore', path: './.prettierignore', type: 'file'},
      {name: '.python-version', path: './.python-version', type: 'file'},
    ]}

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
      <div className="h-[350px]">
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
              {currentDirectory.current_path}
            </div>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              currentDirectory.current_dir.map(child => (
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

export default withServices(FileTreePanel, ['session']);
