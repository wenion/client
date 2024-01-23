import type { SidebarStore } from '../store';
import type { APIRoutesService } from './api-routes';

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
export class TimerService {
  private _apiRoutes: APIRoutesService;
  private _store: SidebarStore;
  private _pollTimer: number | undefined;

  constructor(apiRoutes: APIRoutesService, store: SidebarStore) {
    this._apiRoutes = apiRoutes;
    this._store = store;
    this._pollTimer = undefined;
  }
  
  async init() {    
    const display = () => {
    }
    
    this._pollTimer = setInterval(display, 6000);
  }
}
