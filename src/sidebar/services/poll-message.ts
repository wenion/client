import type { SidebarStore } from '../store';
import type { APIService } from './api';

/**
 * Service for fetching the data needed to render URLs that point to the H
 * service.
 *
 * The H API has an `/api/links` endpoint that returns a map of link name to
 * URL template for URLs that point to the H API. This service fetches that
 * data and persists it in the store.
 *
 * To use a link within a UI component, use `store.getLink(name, params)`.
 *
 * @inject
 */
export class PollMessageService {
  private _api: APIService;
  private _store: SidebarStore;

  constructor(api: APIService, store: SidebarStore, ) {
    this._api = api;
    this._store = store;
  }

  fetchMessage(q: string, interval: number) {
    this._api.message({q: q, interval: interval}).then(
      response => {
        response.map(r => {
          if (r.interval) {
            this._store.setInterval(r.interval)
          }
        })
        this._store.addMessages(response);
        return response;
      }
    )
    setTimeout(() => this.fetchMessage('organisation_event', this._store.getInterval()), this._store.getInterval());
  }

  init() {
    const test = this.fetchMessage('organisation_event', 0)
  }
}
