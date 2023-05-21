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
    this._initialize();
  }

  _initialize() {
    this._store.addSuggestResults([
      {id: '1', text: 'test case 1'},
      {id: '2', text: 'test case 2'},
      {id: '3', text: 'test case 3'},
      {id: '4', text: 'test case 4'},
      {id: '5', text: 'test case 5'},
    ])
  }

  getQueryWord() {
    return this._store.queryingWord();
  }

  getSuggestResult() {
    return this._store.getSuggestResults();
  }

  getSuggestIndex() {
    return this._store.getSuggestIndex();
  }

  clearSuggestIndex() {
    this._store.clearIndex();
  }

  /* submit query*/
  async queryActivity(query: string | null) {
    if (!query)
      return;
    let result = await this._api.query({q: query});
    if (result) {
      this._store.addResponse(query, result);
    }
  }
}
