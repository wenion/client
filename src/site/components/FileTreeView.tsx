import {Table, TableHead, TableBody, TableRow, Scroll, Input } from '@hypothesis/frontend-shared';
import {FolderIcon, FilePdfIcon, LinkIcon, ButtonBase, CancelIcon} from '@hypothesis/frontend-shared';
import { useEffect, useMemo, useState } from 'preact/hooks';
import classnames from 'classnames';

import type { SidebarSettings } from '../../types/config';
import { withServices } from '../../sidebar/service-context';
import type { FrameSyncService } from '../../sidebar/services/frame-sync';
import type { FileTreeService } from '../../sidebar/services/file-tree';
import type { SessionService } from '../../sidebar/services/session';
import type { ToastMessengerService } from '../../sidebar/services/toast-messenger';
import { useSidebarStore } from '../../sidebar/store';
import TopBar from './TopBar';

export type Link = {
  rel?: string;
  type?: string;
  href: string;
};

export type DocumentMetadata = {
  title: string;
  link: Link[];

  // HTML only
  dc?: Record<string, string[]>;
  eprints?: Record<string, string[]>;
  facebook?: Record<string, string[]>;
  highwire?: Record<string, string[]>;
  prism?: Record<string, string[]>;
  twitter?: Record<string, string[]>;
  favicon?: string;

  // HTML + PDF
  documentFingerprint?: string;
};

type FileTreeViewProps = {
  /** Callback invoked when user clicks "Login" button */
  onLogin: () => void;

  /** Callback invoked when user clicks "Logout" action in account menu */
  onLogout: () => void;

  /** Callback invoked when user clicks "Sign up" button */
  onSignUp: () => void;
  fileTreeService: FileTreeService;
  session: SessionService;
  settings: SidebarSettings;
};

/**
 * The root component for the Hypothesis client.
 *
 * This handles login/logout actions and renders the top navigation bar
 * and content appropriate for the current route.
 */
function FileTreeView({
  onLogin,
  onLogout,
  onSignUp,
  fileTreeService,
  session,
  settings }: FileTreeViewProps) {
  const store = useSidebarStore();
  const profile = store.profile();
  const currentTree = store.getCurrentFileNode();
  const isTopDirectory = store.isTopDirectory();

  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    fileTreeService.initFileTree();
  }, [profile, settings, dragging, store]);

  const onDrop = (e: Event) => {
    e.preventDefault();

    if (e instanceof DragEvent && e.dataTransfer?.items) {
    {
        Array.from(e.dataTransfer.items).forEach((item, i) => {
        // If dropped items aren't files, reject them
        if (item.kind === 'file') {
          const file = item.getAsFile();
          const link: Link = {
            href: '',
          }
          if (file) {
            fileTreeService.uploadFile(
              file, {
              title: file.name,
              link: [link,],
            }).then(
              response => {
                console.log(">>>> test >>>>>",file)
              }
            )
          }
        }
      });
    }
    } else if (e instanceof DragEvent && e.dataTransfer?.files) {
      Array.from(e.dataTransfer.files).forEach((file, i) => {
        console.log(`… file[${i}].name = ${file.name} start else branch...`);
      });
    }

    setDragging(false);
  }

  const onDragLeave = (e: Event) => {
    e.preventDefault();
    setDragging(false);
  }

  const onDragOver = (e: Event) => {
    e.preventDefault();
    setDragging(true);
  }

  const onDblClick = (id: string, type: string, link?: string) => {
    if (type == 'dir') {
      fileTreeService.findFile(id);
    }
    else {
      if (link) {
        window.parent.location = link;
      }
    }
  }

  const onGoBack = () => {
    fileTreeService.goBack();
  }

  const onDeleteClick = (path: string, filename: string) => {
    const result = window.confirm('Are you sure you want to delte "' + filename +'"?')
    if (result) {
      fileTreeService.delete(path);
    }
  }

  return (
    <>
      <TopBar
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
        isSidebar={true}
      />
      <div className="container">
        <main>
          <div
            onDrop={onDrop}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            className={classnames(
              'w-full mt-8',
            )}
          >
            {dragging ? (
              <div
                className={classnames(
                  'h-[32rem] flex justify-center',
                  'bg-clip-padding bg-blue-400 border-4 border-violet-300 border-dashed'
                )}
              >
                <h3 className={classnames('text-4xl text-zinc-500 self-center')}>Drop the file over here to upload</h3>
              </div>
            ) : (
              <Scroll>
                <Table
                  title="table test"
                  interactive
                >
                  <TableHead>
                    <Input aria-label="Input example" value={currentTree?.path} />
                  </TableHead>
                  <TableBody>
                    {!isTopDirectory && (
                      <TableRow
                        onDblClick={() => onGoBack()}
                        >
                        <div className={classnames('flex justify-between', 'h-6')}>
                          <div className="text-lg items-center flex gap-x-2">
                            <FolderIcon className="w-em h-em" />..
                          </div>
                        </div>
                      </TableRow>
                    )}
                    {
                      currentTree?.children.map(child => (
                        <TableRow
                          key={child.id}
                          onDblClick={() => onDblClick(child.id, child.type, child.link)}
                          >
                          <div className={classnames('flex justify-between', 'h-6')}>
                            <div className="text-lg items-center flex gap-x-2" id={child.id}>
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
                            <ButtonBase
                              classes={classnames('border bg-grey-0 hover:bg-red-400 m-1' )}
                              onClick={ () => onDeleteClick(child.path, child.name)}>
                              <CancelIcon className="w-3 h-3"/>
                            </ButtonBase>
                          </div>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </Scroll>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default withServices(FileTreeView, [
  'auth',
  'fileTreeService',
  'frameSync',
  'session',
  'settings',
  'toastMessenger',
]);
