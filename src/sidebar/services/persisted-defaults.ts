import type { SidebarStore } from '../store';
import type { Key } from '../store/modules/defaults';
import type { Key as SyncKey} from '../store/modules/sync-storage';
import { entries } from '../util/collections';
import { watch } from '../util/watch';
import type { LocalStorageService } from './local-storage';

const SYNC_MUTED_KEY = 'goldmind.sync.muted';
const SYNC_HIGHLIGHTS_KEY = 'goldmind.sync.highlights';
const SYNC_RECORDING_KEY = 'goldmind.sync.recording';
const SYNC_RECORDING_TASK_NAME_KEY = 'goldmind.sync.recording.taskName';
const SYNC_RECORDING_SESSION_ID_KEY = 'goldmind.sync.recording.sessionId';

const SYNC_KEYS: Record<SyncKey, string> = {
  muted: SYNC_MUTED_KEY,
  highlightsVisible: SYNC_HIGHLIGHTS_KEY,
  recording: SYNC_RECORDING_KEY,
  recordingTaskName: SYNC_RECORDING_TASK_NAME_KEY,
  recordingSessionId: SYNC_RECORDING_SESSION_ID_KEY,
};

const DEFAULT_KEYS: Record<Key, string> = {
  annotationPrivacy: 'hypothesis.privacy',
  focusedGroup: 'hypothesis.groups.focus',
};

/**
 * A service for reading and persisting convenient client-side defaults for
 * the (browser) user.
 *
 * @inject
 */
export class PersistedDefaultsService {
  private _storage: LocalStorageService;
  private _store: SidebarStore;
  private _window: Window;
  private _callback: Function;

  constructor($window: Window, localStorage: LocalStorageService, store: SidebarStore) {
    this._storage = localStorage;
    this._store = store;
    this._window = $window;
    this._callback = ({}) => {};

    this._listenForSyncStorageEvents();
  }

  private _listenForSyncStorageEvents() {
    this._window.addEventListener('storage', ({key, newValue}) => {
      for (const [defaultKey, value] of entries(SYNC_KEYS)) {
        if (key === value) {
          if (newValue === 'true') {
            this._store.setSync(defaultKey, true);
          } else if (newValue === 'false') {
            this._store.setSync(defaultKey, false);
          } else if (newValue === 'null') {
            this._store.setSync(defaultKey, null);
          } else {
            this._store.setSync(defaultKey, newValue);
          }
          break;
        }
      }
    });
  }

  register_sync_changed_event(callback: Function) {
    this._callback = callback;
  }

  /**
   * Initially populate the store with any available persisted defaults,
   * then subscribe to the store in order to persist any changes to
   * those defaults.
   */
  init() {
    /**
     * Store subscribe callback for persisting changes to defaults. It will only
     * persist defaults that it "knows about" via `DEFAULT_KEYS`.
     */
    const persistChangedDefaults = (
      defaults: Record<Key, any>,
      prevDefaults: Record<Key, any>,
    ) => {
      for (const [defaultKey, newValue] of entries(defaults)) {
        if (
          prevDefaults[defaultKey] !== newValue &&
          defaultKey in DEFAULT_KEYS
        ) {
          this._storage.setItem(DEFAULT_KEYS[defaultKey], newValue);
        }
      }
    };

    const persistChangedSyncStorage = (
      sync: Record<SyncKey, any>,
      prevSync: Record<SyncKey, any>,
    ) => {
      for (const [defaultKey, newValue] of entries(sync)) {
        if (
          prevSync[defaultKey] !== newValue &&
          defaultKey in SYNC_KEYS
        ) {
          this._storage.setItem(SYNC_KEYS[defaultKey], newValue);
          // Changes to synchronized persistent variables trigger callback function to produce effects
          this._callback(sync);
        }
      }
    };

    // Read persisted defaults into the store
    for (const [defaultKey, key] of entries(DEFAULT_KEYS)) {
      // `localStorage.getItem` will return `null` for a non-existent key
      const defaultValue = this._storage.getItem(key);
      this._store.setDefault(defaultKey, defaultValue);
    }

    // Listen for changes to those defaults from the store and persist them
    watch(
      this._store.subscribe,
      () => this._store.getDefaults(),
      persistChangedDefaults,
    );

    watch(
      this._store.subscribe,
      () => this._store.getAllSync(),
      persistChangedSyncStorage,
    );

    /**
     * Ensure the `watch` function is fully set up before processing execute
     * the following snippet.
     */
    for (const [defaultKey, key] of entries(SYNC_KEYS)) {
      // `localStorage.getItem` will return `null` for a non-existent key
      const defaultValue = this._storage.getItem(key);
      if (defaultValue === 'true') {
        this._store.setSync(defaultKey, true);
      } else if (defaultValue === 'false') {
        this._store.setSync(defaultKey, false);
      } else if (defaultValue === 'null') {
        this._store.setSync(defaultKey, null);
      } else {
        this._store.setSync(defaultKey, defaultValue);
      }
    }
  }
}
