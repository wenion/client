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

    /**
     * @typedef QuerySearchResult
     * @prop {string} query
     * @prop {QueryResult[]} rows
     * @prop {number} total
     */

  /* submit query*/
  async queryActivity(query: string | null) {
    if (!query)
      return;
    const queryParams = {
      q: query,
    };
    let result = await this._api.query({q: query});
    if (result) {
      this._store.addResults(result.query, result.rows);
    }
  }
}
