import type { SidebarSettings } from '../../types/config';
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

  async initFileTree() {
    const result = await this._api.repository({});
    this._store.initFileTree(result);
  }

  changeCurrentPath(path: string) {
    this._store.changeCurrentPath(path);
  }

  /* upload file to repository*/
  async uploadFile(data?: Blob, metadata?: DocumentMetadata) {
    /** for drag file */
    if (data && metadata) {
      return this._api.upload({}, data, metadata);
    }
    /** the file from Google drive */
    const mainFrame = this._store.mainFrame();
    if (mainFrame && mainFrame.uri) {
      fetch(mainFrame!.uri)
        .then(response => {
          if (response.ok) {
            return response.blob();
          } else {
            throw new Error('File request failed');
          }
        })
        .then(blob => {
          return this._api.upload({}, blob, mainFrame.metadata);
        })
          .then(response => {
            console.log('response', response)
            // handle response
          })
          .catch(error => {
            console.log('error', error)
            // handle error
          });
    }
  }

    /* delete file to repository*/
    async delete(path: string) {
        this._api.delete({file: path}).then(
          response => {
            this.initFileTree();
          }
        );
        /**
         *  TODO check and handle the return
         *  in_param file meta
         *  const result = this._api.delete(file_meta)
         *  call file-tree service to remove current_dir according json return
         */
    }

  /* TODO temporally put it here */
  async getClientURL() {
    if (!this._store.getClientURL())
    {
      const result = await this._api.clentURL({});
      const url = new URL(result.url_string, result.base_url);
      this._store.setClientURL(url.href);
      return url.href;
    }
    return this._store.getClientURL();
  }
}
