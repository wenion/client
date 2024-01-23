import type { SidebarStore } from '../store';
import type { APIRoutesService } from './api-routes';
import type { QueryService } from './query';
import type { ToastMessengerService } from './toast-messenger'
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
  private _toastMessenger: ToastMessengerService;
  private _store: SidebarStore;
  private _pollTimer: number | undefined;

  constructor(api: APIService, toastMessenger: ToastMessengerService, store: SidebarStore, ) {
    this._api = api;
    this._toastMessenger = toastMessenger;
    this._store = store;
    this._pollTimer = undefined;
  }
  
  async init() {
    const fetchNewMessage = () => {
      this._api.message({q: 'organisation_event'}).then(
        response => {
          this._store.addMessages(response)
        }
      )
    }
    fetchNewMessage();
    this._pollTimer = setInterval(fetchNewMessage, 60000);
  }
}
