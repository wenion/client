import {Table, TableHead, TableBody, TableRow, Scroll, Input } from '@hypothesis/frontend-shared';
import {FolderIcon, FilePdfIcon, FileGenericIcon, LinkIcon, Button, CancelIcon, SpinnerSpokesIcon} from '@hypothesis/frontend-shared';
import { useEffect, useMemo, useState, useRef, Ref} from 'preact/hooks';
import classnames from 'classnames';

import type { SidebarSettings } from '../../types/config';
import { withServices } from '../../sidebar/service-context';
import type { FrameSyncService } from '../../sidebar/services/frame-sync';
import type { FileTreeService } from '../../sidebar/services/file-tree';
import type { SessionService } from '../../sidebar/services/session';
import type { ToastMessengerService } from '../../sidebar/services/toast-messenger';
import { useSidebarStore } from '../../sidebar/store';
import TopBar from './TopBar';


function Tooltip({elementRef}: {elementRef: Ref<HTMLDivElement>} ) {
  return (
  <div
    className="absolute overflow-auto invisible bg-sky-300 border text-lg h-12 p-3.5 shadow-lg rounded-lg"
    ref={elementRef}
  >
  </div>)
}

export type FileNode = {
  id : string;
  name : string;
  path: string;
  type: string;
  link?: string;
  depth: number;
  children: FileNode[];
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
  const isLoggedIn = store.isLoggedIn();

  const currentPath = store.getCurrentPath();
  const fileTree = store.getFileTree();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const pathChanged = store.getPathChangedStatus();

  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [clickTimes, setClickTimes] = useState(0);

  const currentTree = useMemo(() => {
    const ret = find(fileTree, currentPath);
    return ret;
  }, [currentPath, fileTree, clickTimes, pathChanged]);

  function joinPaths(...segments: string[]): string{
    return segments.join('/').replace(/\/{2,}/g, '/');
  }

  const reduceCharacters = (title: string) => {
    const limitLenght = 50;
    return title.length > limitLenght? title.slice(0, limitLenght) + '...' : title;
  }

  function find(fileNode: FileNode| null, path: string): FileNode|null {
    if (fileNode == null)
      return null;

    if (path == fileNode.path) {
      return fileNode;
    }

    for (const child of fileNode.children) {
      let newPath = joinPaths(fileNode.path , child.name)
      if (path.startsWith(newPath)) {
        return find(child, path);
      }
    }
    return null;
  };

  useEffect(() => {
    if (isLoggedIn) {
      fileTreeService.initFileTree();
    }
  }, [session, isLoggedIn]);

  const onDrop = (e: Event) => {
    e.preventDefault();

    if (e instanceof DragEvent && e.dataTransfer?.items) {
    {
        Array.from(e.dataTransfer.items).forEach((item, i) => {
        // If dropped items aren't files, reject them
        if (item.kind === 'file') {
          const file = item.getAsFile();
          // const link: Link = {
          //   href: '',
          // }
          if (file) {
            setIsUploading(true);
            fileTreeService.uploadFile(
              file, {
                id: currentPath,
                depth: currentTree? currentTree.depth : 0,
                name: file.name,
                path: joinPaths(currentPath, file.name),
                type:"file",
                children:[],
            }).then(
              response => {
                console.log(">>>> test >>>>>",file, response)
                if (response.succ) {
                  fileTreeService.addFileNode(response.succ, response.succ.id)
                  if (response.tab) {
                    alert("The file was uploaded. But the ingestion failed. Reason:\n" + response.tab)
                  }
                }
                if (response.error) {
                  alert("Sorry, something went wrong. Reason:\n" + response.error);
                }
              }
            ).catch(
              error => console.log("upload error", error)
            ).finally(() =>
              {setIsUploading(false);}
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
    setClickTimes(previousState => {return previousState + 1});
    setDragging(false);
  }

  const onDragOver = (e: Event) => {
    e.preventDefault();
    setDragging(true);
  }

  const onDblClick = (id: string, type: string, link?: string) => {
    if (type == 'dir') {
      fileTreeService.changeCurrentPath(id)
    }
    else {
      if (link) {
        // window.parent.location = link;
        window.open(link);
      }
    }
  }

  const onMouseEvent = (event: MouseEvent, name: string, out: boolean) => {
    if (name.length <= 50) return;
    if(out) {
      tooltipRef.current!.style.visibility = 'hidden';
    }
    else
    {
      tooltipRef.current!.style.visibility = 'visible';
      tooltipRef.current!.style.top = (event.clientY - 5).toString() + 'px';
      tooltipRef.current!.style.left = (event.clientX + 10).toString() + 'px';

      tooltipRef.current!.innerText = name;
    }
  }

  const onGoBack = () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    fileTreeService.changeCurrentPath(parentPath)
  }

  const onDeleteClick = (path: string, filename: string) => {
    const result = window.confirm('Are you sure you want to delete "' + filename +'"?')
    if (result) {
      fileTreeService.delete(path).then(
        response => {
          console.log(">>>> test >>>>>",path, response)
          if (response.succ) {
            fileTreeService.removeFileNode(response.succ.filepath, response.succ.parent_filepath);
            setClickTimes(previousState => {return previousState + 1});
          }
        }).catch(
          error => console.log("error", error)
        ).finally(
        )
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
        <h1>Repository</h1>
        <Tooltip elementRef={tooltipRef}/>
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
            ) : isUploading ? (
              <div
                className={classnames(
                  'h-[32rem] flex justify-center',
                  'bg-slate-300'
                )}
              >
                <SpinnerSpokesIcon className={classnames('self-center')}/>
                <h3 className={classnames('text-xl text-zinc-500 self-center')}>The file is currently being uploaded. Please wait...</h3>
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
                    {currentTree && currentTree.depth != 0 && (
                      <TableRow
                        onDblClick={() => onGoBack()}
                        >
                        <div className={classnames('flex justify-between', 'h-6 relative')}>
                          <div className="text-lg items-center flex gap-x-2">
                            <FolderIcon className="w-em h-em" />..
                          </div>
                        </div>
                      </TableRow>
                    )}
                    {currentTree && currentTree.children.map(child => (
                      <TableRow
                        id={child.path}
                        key={child.path}
                        onDblClick={() => onDblClick(child.id, child.type, child.link)}
                        >
                        <div className={classnames('flex justify-between')}>
                          <div
                            className="text-lg items-center flex gap-x-2"
                            id={child.path}
                            onMouseOver={(event)=>onMouseEvent(event, child.name, false)}
                            onMouseOut={(event)=>onMouseEvent(event, child.name, true)}
                          >
                          {child.type === 'dir' ? (
                            <FolderIcon className="w-em h-em" />
                          ) : (
                            child.type === 'file' ? (
                              child.name.endsWith(".pdf") ? (
                              <FilePdfIcon className="w-em h-em" />
                              ) : (
                              <FileGenericIcon className="w-em h-em" />
                              )
                            ) : (
                              <LinkIcon className="w-em h-em" />
                            )
                          )}
                          <p>{reduceCharacters(child.name)}</p>
                          </div>
                          <Button
                            classes={classnames('border bg-grey-0 hover:bg-red-400 m-1' )}
                            onClick={() => onDeleteClick(child.path, child.name)}>
                            <CancelIcon className="w-3 h-3"/>
                          </Button>
                        </div>
                      </TableRow>
                    ))}
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
