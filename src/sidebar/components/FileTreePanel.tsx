import {Table, TableHead, TableBody, TableRow, Scroll, Input } from '@hypothesis/frontend-shared';
import {
  FilePdfIcon,
  FolderIcon,
  LinkIcon,
  CancelIcon,
  ButtonBase,
} from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useEffect, useState } from 'preact/hooks';

import type { SidebarSettings } from '../../types/config';
import { username } from '../helpers/account-id';
import { withServices } from '../service-context';
import type { FileTreeService } from '../services/file-tree';
import type { SessionService } from '../services/session';
import { useSidebarStore } from '../store';
import SidebarPanel from './SidebarPanel';

/**
 * Metadata collected from a `<link>` element on a document, or equivalent
 * source of related-URL information.
 */
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

  const currentTree = store.getCurrentFileNode();
  const isTopDirectory = store.isTopDirectory();

  const [dragging, setDragging] = useState(false);

  const panelTitle = 'Cloud Repository';

  useEffect(() => {
    store.openSidebarPanel('fileTree');
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
          const metadata: DocumentMetadata = {
            title: file!.name,
            link: [link,],
          };
          fileTreeService.uploadFile(file!, metadata);
          console.log(">>>> test >>>>>",file)
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

  const onDeleteClick = (path: string) => {
    const result = fileTreeService.delete(path);
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <SidebarPanel
      title={panelTitle}
      panelName="fileTree"
    >
      <div
        onDrop={onDrop}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
      >
        {dragging ? (
          <div
            className={classnames([
              'h-[20rem] flex justify-center',
            ])}
          >
            <h3 className={classnames('text-xl')}>Drop the file over here to upload</h3>
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
                          onClick={ () => onDeleteClick(child.path)}>
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
    </SidebarPanel>
  );
}

export default withServices(FileTreePanel, ['fileTreeService', 'session', 'settings']);
