import type { SidebarSettings } from '../../types/config';
import type { APIService } from './api';
import type { SidebarStore } from '../store';

/**
 * Send messages to configured ancestor frame on annotation activity
 */
// @inject
export class FileTreeService {
  private _api: APIService;
  private _store: SidebarStore;

  constructor(
    settings: SidebarSettings,
    api: APIService,
    store: SidebarStore,
    ) {
    this._api = api;
    this._store = store;
  }

  _initialize() {

  }

  getCurrentDir() {
    return this._store.currentDir();
  }

  getAllFiles() {
    return this._store.allFiles();
  }

    /**
     * @typedef FileTreeResult
     * @prop {string} current_path
     * @prop {FileStat[]} current_dir
     */

  /* update cloud files*/
  async updateFileTree() {
    const result = await this._api.repository({});
    this._store.addFileStats(result.current_path, result.current_dir);
    return result
  }

  /* upload file to repository*/
  async uploadFile() {
    const mainFrame = this._store.mainFrame();
    if (mainFrame && mainFrame.uri) {
      await fetch(mainFrame.uri)
              .then(response => response.blob())
              .then(blob => {
                return this._api.upload({}, blob, mainFrame.metadata);
              })
              .then(response => {
                console.log('response', response)
                // handle response
              })
              .catch(error => {
                console.log('response', error)
                // handle error
              });
    }

  }
}
