import type { SidebarSettings } from '../../types/config';
import type { FileStat } from '../../types/api'
import type { APIService } from './api';
import type { SidebarStore } from '../store';

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

  /* update cloud files*/
  async updateFileTree() {
    if (this._store.isLoggedIn()) {
      const result = await this._api.repository({});
      this._store.addFileStats(result.current_path, result.current_dir);
    }
  }

  /* upload file to repository*/
  async uploadFile(data?: Blob, metadata?: DocumentMetadata) {
    if (data && metadata) {
      return this._api.upload({}, data, metadata);
    }
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

    /* delete file to repository*/
    async delete(fileStat: FileStat) {
        this._api.delete(fileStat);
        /**
         *  TODO check and handle the return
         *  in_param file meta
         *  const result = this._api.delete(file_meta)
         *  call file-tree service to remove current_dir according json return
         */
    }

  /* TODO temporally put it here */
  async getClientURL() {
    const result = await this._api.clentURL({});
    return result;
  }
}
