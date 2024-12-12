import type { SidebarSettings } from '../../types/config';
import type { APIService } from './api';
import type { SidebarStore } from '../store';
import type { FileNode } from '../../types/api';
import type { ToastMessengerService } from './toast-messenger';

/**
 * Send messages to configured ancestor frame on annotation activity
 */
// @inject
export class FileTreeService {
  private _api: APIService;
  private _store: SidebarStore;
  private _toastMessenger: ToastMessengerService;

  constructor(
    settings: SidebarSettings,
    api: APIService,
    store: SidebarStore,
    toastMessenger: ToastMessengerService,
    ) {
    this._api = api;
    this._store = store;
    this._toastMessenger = toastMessenger;
  }

  _initialize() {

  }

  async initFileTree() {
    const result = await this._api.repository({});
    this._store.initFileTree(result);
  }

  changeCurrentPath(path: string) {
    this._store.changeCurrentPath(path);
  }

  addFileNode(newfileNode: FileNode, parentPath: string) {
    this._store.addFileNode(newfileNode, parentPath);
  }

  removeFileNode(newfilepath: string, parentPath: string) {
    this._store.removeFileNode(newfilepath, parentPath);
  }

  changePath() {
    this._store.changePath();
  }

  /* upload file to repository*/
  async uploadFile(data?: Blob, metadata?: FileNode) {
    /** for drag file */
    if (data && metadata) {
      return this._api.upload({}, data, metadata);
    }
    /** the file from Save Panel */
    const mainFrame = this._store.mainFrame();
    if (mainFrame && mainFrame.uri) {
      fetch(mainFrame.uri)
        .then(response => {
          if (response.ok) {
            return response.blob();
          } else {
            throw new Error('File request failed');
          }
        })
        .then(blob => {
          const metadata = {
            id: "",
            name: mainFrame.metadata.title,
            path: "",
            type: "html",
            link: mainFrame.uri,
            depth: 0,
            children: [],
          }
          return this._api.upload({}, blob, metadata);
        })
          .then(response => {
            if (response?.succ !== undefined)
              this._toastMessenger.success('This page (' + response.succ.name + ') has been saved')
            else if (response?.error !== undefined)
              this._toastMessenger.error(response?.error)
            // handle response
          })
          .catch(error => {
            this._toastMessenger.error(error)
            // handle error
          });
    }
  }

  /* delete file to repository*/
  async delete(path: string) {
    return this._api.delete({file: path});
  }
}
