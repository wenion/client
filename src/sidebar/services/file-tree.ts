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
    const init = await this._api.trees.list({});
    this._store.changeDir(init.dir);
    this._store.addFiles(init.files);
  }

  async uploadBlob(
    name: string,
    size: number,
    type: string,
    path: string,
    data: Blob,
    access: string,
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
        'access': access,
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

  async updateFile(id: string, file: FileMeta) {
    const item = await this._api.tree.update({id: id}, file);
    this._store.updateFile(item);
  }

  async deleteFile(file: FileMeta) {
    await this._api.tree.delete({id: file.id});
    this._store.removeFiles([file, ]);
  }
}
