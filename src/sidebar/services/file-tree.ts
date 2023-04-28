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
     * @prop {FileStatResult[]} current_dir
     */

  /* submit query*/
  async updateFileTree() {
    const result = await this._api.repository({});
    this._store.addFileStats(result.current_path, result.current_dir);
  }
}
