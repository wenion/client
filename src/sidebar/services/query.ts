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

  async getRecommendation(url: string): Promise<{id: string; url: string; type: string; title: string; query: string; context: string}>{
    return await this._api.pull_recommendation({url: url});
  }

  getQueryWord() {
    const query = this._store.queryingWord();
    if (query) {
      return decodeURIComponent(query);
    }
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

  async pushRecommendation(data: {id:string, title:string, context:string, type:string, url:string, query:string}) {
    try {
      await this._api.push_recommendation({}, data);
    } catch (err) {
      console.error(err);
    }
  }

  async postRating(data: {timestamp:number, base_url:string, relevance:string, timeliness:string}) {
    try {
      data.base_url = this._store.mainFrame()!.uri;
      data.timestamp = Math.floor(Date.now() / 1000);
      await this._api.rating({}, data);
    } catch (err) {
      console.error(err);
    }
  }

}
