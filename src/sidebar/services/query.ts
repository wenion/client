import { isShared } from '../helpers/permissions';
import * as postMessageJsonRpc from '../util/postmessage-json-rpc';
import type { SidebarSettings } from '../../types/config';
import type { APIService } from './api';
import type { SidebarStore } from '../store';

/**
 * Send messages to configured ancestor frame on annotation activity
 */
// @inject
export class QueryService {
  private _api: APIService;
  private _store: SidebarStore;

  constructor(
    settings: SidebarSettings,
    api: APIService,
    store: SidebarStore,
    ) {
    // this._rpc = settings.rpc;
    this._api = api;
    this._store = store;
  }

  _initialize() {

  }

  getQueryWord() {
    return this._store.queryingWord();
  }

  getQueryResults() {
    return this._store.allResults();
  }

  /* submit query*/
  async queryActivity() {
    const queryParams = {
      q: 'test',
    };
    const result = await this._api.query(queryParams);
    console.log("queryActivity", result)
  }
}
