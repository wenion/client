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

  async getRecommandation(url: string) {
    return await this._api.pull_recommandation({url: encodeURIComponent(url)});
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

  async setBookmark(id: string, isBookmark: boolean) {
    if (!this._store.isLoggedIn())
      return;
    if (this._store.queryingWord()){
      const bookmarkData = {
        id: id,
        query: this._store.queryingWord()!,
        is_bookmark: isBookmark,
      }
      await this._api.bookmark({}, bookmarkData)
      this._store.setBookmark(id, isBookmark);
    }
  }

  async getSuggestion(query: string) {
    let result = await this._api.typing({q: query});
    this._store.addSuggestResults(result);
  }

  async pushRecommandation(data: {id:string, title:string, context:string, type:string, url:string}) {
    let result = await this._api.push_recommandation({}, data);
  }

}
