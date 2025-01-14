import { Scroll } from '@hypothesis/frontend-shared';
import {FolderIcon, FilePdfIcon, FileGenericIcon, Button, CancelIcon, PlusIcon} from '@hypothesis/frontend-shared';
import { useEffect, useMemo, useState, useRef, Ref} from 'preact/hooks';
import classnames from 'classnames';

import type { FileMeta } from '../../types/api';
import type { SidebarSettings } from '../../types/config';
import { withServices } from '../../sidebar/service-context';
import { generateRandomString } from '../../shared/random';
import type { FileTreeService } from '../../sidebar/services/file-tree';
import type { SessionService } from '../../sidebar/services/session';
import { useSidebarStore } from '../../sidebar/store';
import TopBar from './TopBar';

function splitUserName(userid: string) {
  const pattern = /acct:(.*?)@/;
  const match = userid.match(pattern);
  return match ? match[1]: userid;
}

function convertToTime(timestamp: number| undefined) {
  if (timestamp === undefined || timestamp < 10) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit', month: '2-digit', year:'numeric', hour: '2-digit', minute:'2-digit', hour12: true});
}

class FileToUpdate {
  private _id: string;
  private _file: File;
  private _progress: number;
  private _abort: () => void;

  constructor(
    file: File,
    progress: number = 0,
  ) {
    this._id = generateRandomString(10);
    this._file = file;
    this._progress = progress;
    this._abort = () => {};
  }

  get id() {
    return this._id;
  }

  set file(file: File) {
    this._file = file;
  }

  get filename() {
    return this._file.name;
  }

  get type() {
    return this._file.type;
  }

  get size() {
    return this._file.size;
  }

  get progress() {
    return this._progress;
  }

  set progress(progress: number) {
    this._progress = progress;
  }

  abort() {
    this._abort();
  }

  set abortFunction(abort: () => void) {
    this._abort = abort;
  }
}

type FileItemProps = {
  file: FileMeta;
  onDblClick: (file: FileMeta) => void;
  onDelete: (id: string) => void;
};

function FileItem({
  file,
  onDblClick,
  onDelete,
}: FileItemProps) {

  return (
    <tr
      className="hover:bg-sky-100 cursor-pointer"
      onDblClick={() => onDblClick(file)}
    >
      <td>
        <div className="flex items-center">
          <div className="mr-2">
            {file.fileType === 'pdf' ? (
              <FilePdfIcon />
              ): (
              <FileGenericIcon />
            )}
          </div>
          <div>{file.filename}</div>
        </div>
      </td>
      <td>
        <div>{splitUserName(file.userid)}</div>
      </td>
      <td>
        <div>{convertToTime(file.updateStamp)}</div>
      </td>
      <td>
        <Button onClick={() => onDelete(file.id)}>
          <CancelIcon/>
        </Button>
      </td>
    </tr>
  )
}

type ReadyFileItemProps = {
  file: FileToUpdate;
};

function ReadyFileItem({
  file,
}: ReadyFileItemProps) {

  const onCancel = () => {
    file.abort();
  };

  return (
    <tr className="hover:bg-sky-100">
      <td>
        <div className="flex items-center">
          <div className="mr-2">
            {file.type === 'pdf' ? (
              <FilePdfIcon />
              ): (
              <FileGenericIcon />
            )}
          </div>
          <div>{file.filename}</div>
        </div>
      </td>
      <td>
        <div
          id="progress-bar"
          className="border border-black w-20 opacity-10"
        >
          <div
            className="bg-sky-500 border h-10"
            style={{
              width: `${file.progress* 80 / 100}px`,
              transition: "width 0.3s ease", // Optional: smooth transition for the width change
            }}
          />
        </div>
      </td>
      <td>
        <div>{file.progress.toFixed(2)} % uploaded</div>
      </td>
      <td>
        <Button
          onClick={onCancel}
        >
          {"Cancel"}
        </Button>
      </td>
    </tr>
  )
}

type FileTreeViewProps = {
  /** Callback invoked when user clicks "Login" button */
  onLogin: () => void;

  /** Callback invoked when user clicks "Logout" action in account menu */
  onLogout: () => void;

  /** Callback invoked when user clicks "Sign up" button */
  onSignUp: () => void;
  fileTreeService: FileTreeService;
  session: SessionService;
  // settings: SidebarSettings;
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
  // settings
}: FileTreeViewProps) {
  const store = useSidebarStore();
  const isLoggedIn = store.isLoggedIn();

  const files = store.getFiles();
  const dir = store.getDir();

  const divRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [filesToUpdated, setFilesToUpdated] = useState(() => new Map());

  useEffect(() => {
    if (isLoggedIn) {
      fileTreeService.initFileTree();
    }
  }, [session, isLoggedIn]);

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    const base = divRef.current!;

    if (base.contains(target) && base.contains(relatedTarget)) {
      return;
    }
    if(base.contains(target) && !base.contains(relatedTarget)) {
      setIsDraggingOver(false);
    }
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      if (!e.dataTransfer.types.includes('Files')) {
        return;
      }
      const files = e.dataTransfer.files;
      inputRef.current!.files = files;
      handleFile(files[0]);
    }
    setIsDraggingOver(false);
  }

  const onDblClick = (file: FileMeta) => {
    if (file.fileType == 'directory') {
    }
    else {
      window.open(file.url);
    }
  }

  const onDelete = (id: string) => {
    const file = store.getFiles().find(item => item.id === id);
    const result = window.confirm('Are you sure you want to delete "' + file!.filename +'"?')
    if (result && file) {
      fileTreeService.deleteFile(file);
    }
  }

  const onChange = () => {
    const files = inputRef.current!.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const onClick = () => {
    inputRef.current!.click();
  }

  const addFileToUpdate = (file: File): FileToUpdate => {
    const newFile = new FileToUpdate(file = file);
    setFilesToUpdated(
      (prev) => new Map(prev.set(newFile.id, newFile))
    );
    return newFile;
  };

  const updateFileProgress = (fileId: string, progress: number) => {
    setFilesToUpdated((prev) => {
      const updateMap = new Map(prev);
      const fileToUpdate = updateMap.get(fileId);
      if (fileToUpdate) {
        fileToUpdate.progress = progress;
      }
      return updateMap;
    });
  };

  const deleteFileFromUpload = (fileId: string) => {
    setFilesToUpdated((prev) => {
      const updatedMap = new Map(prev);
      updatedMap.delete(fileId); // Delete the file with the given ID
      return updatedMap;
    })
  };

  const handleFile = (file: File) => {
    if (!validateFile(file)) {
      return;
    };

    const fileToUpdate = addFileToUpdate(file);

    fileTreeService.uploadBlob(
      file.name,
      file.size,
      file.type,
      dir,
      file,
      (loaded, total) => {
        const progress = loaded/total * 100;
        updateFileProgress(fileToUpdate.id, progress);
      },
      () => {
        deleteFileFromUpload(fileToUpdate.id);
      },
      (abort) => {fileToUpdate.abortFunction = abort},
    );
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'text/html', 'text/plain'];
    const maxSizeInBytes = 20 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type');
      return false;
    }
    if (file.size > maxSizeInBytes) {
      alert('Invalid file size');
      return false;
    }

    return true;
  };

  return (
    <div className="w-full">
      <TopBar
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
        isSidebar={true}
      />
      <div>
        <h1 className="mx-4 my-8">Repository</h1>
        <div
          className={classnames(
            "flex flex-col items-center p-2 mb-10",
          )}
        >
          <div
            className={classnames(
              "relative rounded",
            )}
            style={"height: 70svh;"}
            ref={divRef}
            onDrop={onDrop}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            {isDraggingOver && (
              <div
                className={classnames(
                  "absolute",
                  "flex justify-center items-center",
                  "w-full h-full",
                  "bg-sky-300 opacity-80", 
                  "rounded border-4 border-dashed border-sky-700"
                )}
                id="overlay"
              >
                <p className="text-4xl text-slate-50">Drop it here!</p>
              </div>
            )}
            <Scroll>
              <table
                className={classnames(
                  "content-table",
                  {"border-2 border-dashed" : isDraggingOver},
                )}
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>User</th>
                    <th>Modified Time</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(filesToUpdated.values()).map(child => (
                    <ReadyFileItem file={child} />
                    )
                  )}
                  {files.map(child => (
                    <FileItem
                      file={child}
                      onDblClick={onDblClick}
                      onDelete={onDelete}
                    />
                  ))}
                </tbody>
              </table>
            </Scroll>
            <div
              className="flex justify-center cursor-pointer items-center border rounded w-full h-12"
              onClick={onClick}
            >
              <PlusIcon />
              <input
                ref={inputRef}
                type="file"
                onChange={onChange}
                hidden
              />
            </div>
          </div>
        </div>
      </div>
    </div>
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
