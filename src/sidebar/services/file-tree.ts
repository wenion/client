import type { APIService } from './api';
import type { SidebarStore } from '../store';
import type { FileMeta } from '../../types/api';

/**
 * Send messages to configured ancestor frame on annotation activity
 */
// @inject
export class FileTreeService {
  private _api: APIService;
  private _store: SidebarStore;

  constructor(
    api: APIService,
    store: SidebarStore,
    ) {
    this._api = api;
    this._store = store;
  }

  async initFileTree() {
    const init = await this._api.files.list({});
    this._store.changeDir(init.dir);
    this._store.addFiles(init.files);
  }

  async uploadBlob(
    name: string,
    size: number,
    type: string,
    path: string,
    data: Blob,
    onProgress: (loaded: number, total: number) => void,
    onFinished: () => void,
    onAbortReference: (abort: () => void) => void,
  ) {
    const item = await this._api.upload(
      {
        'name': name,
        'size': size,
        'type': type,
        'path': path,
      },
      data,
      {
        onProgress,
        onFinished,
        onAbortReference,
      }
    );

    this._store.addFiles([item,]);
  }

  async deleteFile(file: FileMeta) {
    await this._api.file.delete({id: file.id});
    this._store.removeFiles([file, ]);
  }
}
