import type { SidebarSettings } from '../../types/config';
import type { APIService } from './api';
import type { SidebarStore } from '../store';
import type { QueryResults } from '../../types/api';

/**
 * Send messages to configured ancestor frame on annotation activity
 */
// @inject
export class QueryService {
  private _api: APIService;
  private _store: SidebarStore;
  private _controller: AbortController | null;

  constructor(
    settings: SidebarSettings,
    api: APIService,
    store: SidebarStore,
    ) {
    // this._rpc = settings.rpc;
    this._api = api;
    this._store = store;
    this._controller = null;
  }

  async getRecommendation(url: string): Promise<{id: string; url: string; type: string; title: string; query: string; context: string}>{
    return await this._api.pull_recommendation({url: url});
  }

  // async getMessage(): Promise<RawMessageData[]>{
  //   return await this._api.message({q: 'organisation_event'});
  // }

  getQueryWord() {
    const query = this._store.queryingWord();
    if (query) {
      return decodeURIComponent(query);
    }
  }

  /* submit query*/
  async queryActivity(query: string) {
    let result = await this._api.query({q: query});
    if (result) {
      this._store.addResponse(query, result);
    }
  }

  private _getDataType(url: string | undefined, title: string) {
    if (!url || url === undefined)
      return ''
    if (url.endsWith('.mp4') || url.includes('youtube.com') || title.endsWith('.mp4')) {
      return 'video';
    }
    else if (url.endsWith('pdf')) {
      return 'pdf'
    }
    else {
      return ''
    }
  }

  private _getFirst100Words(str: string) {
    const words = str.split(' ');
    const first1000Words = words.slice(0, 100);
    return first1000Words.join(' ') + '...';
  }

  private _processHighlight(context: string) {
    if (context && context.includes("\n")) {
      context = "* "+ context.replace(/\n/g, "\n* ");
    }
    return context;
  }

  async query(text: string) {
    let result = await this._api.query({q: text});
    this._store.setQueryStatus(result.status);
    if (result.status === '200') {
      const children: QueryResults[] = [];
      result.context.forEach((innerArray) => {
        innerArray.forEach((item) => {
          children.push({
            id: item.id,
            visible: true,
            dataType: this._getDataType(item.metadata.url, item.metadata.title),
            isBookmark: item.is_bookmark ? item.is_bookmark : false,
            pageContent: item.page_content,
            score: Number(item.metadata.score),
            query: text,

            title: item.metadata.title ? item.metadata.title : (item.metadata['video name'] ? item.metadata['video name'] : 'untitled'),
            url: item.metadata.url ? item.metadata.url : item.metadata['video url'],

            summary: item.metadata.summary ? item.metadata.summary : this._getFirst100Words(item.page_content),
            highlights: this._processHighlight(item.metadata.highlights),
            repository: item.metadata.repository ? item.metadata.repository : "",
          })
        });
      });
      this._store.addQueryResults(children);
      this._store.setQuery(text);
    } else {
      this._store.clearQueryResults();
    }
  }

  clearQuery(){
    this._store.setQuery(null);
    this._store.clearQueryResults();
    this._store.setQueryStatus(null);
    this._store.clearQuerySuggestions();
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

  async getQuerySuggestions(query: string) {
    this._controller && this._controller.abort();
    this._controller = new AbortController();
    // let result = await this._api.typing({q: query});
    let result = await this._api.typing({q: query}, undefined, {signal: this._controller.signal});
    this._store.addQuerySuggestions(result);
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
