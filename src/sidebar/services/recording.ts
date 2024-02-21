import { TinyEmitter } from 'tiny-emitter';

import type { SidebarStore } from '../store';
import type { APIService } from './api';
import type { SidebarSettings } from '../../types/config';
import { extractHostURL } from '../../shared/custom';
import { generateRandomString } from '../../shared/random';
import type { RecordingStepData, EventData } from '../../types/api';
import type { LocalStorageService } from './local-storage';


type StatusInfo = {
  isSilentMode: boolean;
  showHighlights: boolean;
  recordingStatus: 'off' | 'ready' | 'on';
  recordingSessionId: string;
  recordingTaskName: string;
}

const isStatusInfo = (status: unknown): status is StatusInfo =>
  !!status &&
  typeof status === 'object' &&
  'isSilentMode' in status &&
  typeof status.isSilentMode === 'boolean' &&
  'showHighlights' in status &&
  typeof status.showHighlights === 'boolean' &&
  'recordingStatus' in status &&
  (status.recordingStatus === 'off' || status.recordingStatus === 'ready' || status.recordingStatus === 'on') &&
  'recordingSessionId' in status &&
  typeof status.recordingSessionId === 'string' &&
  'recordingTaskName' in status &&
  typeof status.recordingTaskName === 'string';

function generateStepId() {
  return 'st' + Date.now().toString(36) + generateRandomString(5);
}

// Mapping function
function mapToObjectFormat(inputObject: RecordingStepData): RecordingStepData {
  return {
    type: inputObject.type,
    id: generateStepId(),
    url: inputObject.url,
    description: inputObject.description,
    title: inputObject.title,
    position: inputObject.position,
  };
}

/**
 * A service that manages the association between the route and route parameters
 * implied by the URL and the corresponding route state in the store.
 */
// @inject
export class RecordingService extends TinyEmitter{
  private _statusInfoPromise: Promise<StatusInfo | null> | null;

  private _api: APIService;
  private _localStorage: LocalStorageService;
  private _settings: SidebarSettings;
  private _store: SidebarStore;
  private _window: Window;

  constructor(
    $window: Window,
    api: APIService,
    localStorage: LocalStorageService,
    settings: SidebarSettings,
    store: SidebarStore
  ) {
    super();

    this._statusInfoPromise = null;

    this._api = api;
    this._localStorage = localStorage;
    this._settings = settings;
    this._store = store;
    this._window = $window;

    this._listenForTokenStorageEvents();
  }

  private _listenForTokenStorageEvents() {
    this._window.addEventListener('storage', ({ key }) => {
      if (key === this._storageKey()) {
        this.emit('statusChanged', this._loadStatus());
      }
    });
  }

  private _storageKey() {
    // Use a unique key per annotation service. Currently OAuth tokens are only
    // persisted for the default annotation service. If in future we support
    // logging into other services from the client, this function will need to
    // take the API URL as an argument.
    let apiDomain = new URL(this._settings.apiUrl).hostname;

    // Percent-encode periods to avoid conflict with section delimeters.
    apiDomain = apiDomain.replace(/\./g, '%2E');

    return `hypothesis.oauth.${apiDomain}.status`;
  }

  private _initStatus() {
    const status = this._localStorage.getObject(this._storageKey());
    // init
    if (status === null) {
      this._saveStatus(false, true, 'off', '', '');
      return;
    }
    // update
    if (!!status && typeof status === 'object' && !isStatusInfo(status)) {
      const isSilentMode =
        'isSilentMode' in status && typeof status.isSilentMode === 'boolean' ? status.isSilentMode: false;
      const showHighlights =
        'showHighlights' in status && typeof status.showHighlights === 'boolean' ? status.showHighlights: false;
      const recordingStatus =
        'recordingStatus' in status &&
        (status.recordingStatus === 'off' || status.recordingStatus === 'ready' || status.recordingStatus === 'on') ? status.recordingStatus: 'off';
      const recordingSessionId =
        'recordingSessionId' in status && typeof status.recordingSessionId === 'string' ? status.recordingSessionId : '';
      const recordingTaskName =
        'recordingTaskName' in status && typeof status.recordingTaskName === 'string' ? status.recordingTaskName: '';
      this._saveStatus(isSilentMode, showHighlights, recordingStatus, recordingSessionId, recordingTaskName);
    }
  }

  private _loadStatus() {
    const status = this._localStorage.getObject(this._storageKey());

    if (!isStatusInfo(status)) {
      return null;
    }

    return {
      isSilentMode: status.isSilentMode,
      showHighlights: status.showHighlights,
      recordingStatus: status.recordingStatus,
      recordingSessionId: status.recordingSessionId,
      recordingTaskName: status.recordingTaskName,
    }
  }

  private _saveStatus(isSilentMode: boolean, showHighlights: boolean, recordingStatus: 'off' | 'ready' | 'on', recordingSessionId: string, recordingTaskName: string) {
    const status = {
      isSilentMode: isSilentMode,
      showHighlights: showHighlights,
      recordingStatus: recordingStatus,
      recordingSessionId: recordingSessionId,
      recordingTaskName: recordingTaskName,
    }
    this._localStorage.setObject(this._storageKey(), status)
  }

  refreshSilentMode(isSilentMode: boolean) {
    const status = this._loadStatus();
    if (status) {
      this._saveStatus(isSilentMode, status.showHighlights, status.recordingStatus, status.recordingSessionId, status.recordingTaskName)
      return true
    }
    return false
  }

  refreshShowHighlights(showHighlights: boolean) {
    const status = this._loadStatus();
    if (status) {
      this._saveStatus(status.isSilentMode, showHighlights, status.recordingStatus, status.recordingSessionId, status.recordingTaskName)
      return true
    }
    return false
  }

  refreshRecordingInfo(recordingStatus: 'off' | 'ready' | 'on', recordingSessionId: string, recordingTaskName: string) {
    const status = this._loadStatus();
    if (status) {
      this._saveStatus(status.isSilentMode, status.showHighlights, recordingStatus, recordingSessionId, recordingTaskName)
      return true
    }
    return false
  }

  createSimplifiedUserEventNode(
    eventType: string,
    tagName: string,
    url: string = '',
    textContent: string ='',
    interactionContext: string ='',
    eventSource: string = 'RESOURCE PAGE',
    docId: string = '',
    width: number = window.innerWidth,
    height: number = window.innerHeight,
    ) {
    return {
      event_type: eventType,
      timestamp: 0,
      base_url: url,
      tag_name: tagName,
      text_content: textContent,
      interaction_context: interactionContext,
      event_source: eventSource,
      target: '',
      x_path: '',
      offset_x: 0,
      offset_y: 0,
      session_id: '',
      task_name: '',
      width: width,
      height: height,
      doc_id: docId,
      userid: '',
    };
  }

  getExtensionStatus(): StatusInfo {
    const status = this._loadStatus();
    if (!status) {
      this._initStatus();
      return this.getExtensionStatus();
    }
    return status;
  }

  createNewRecording(taskName: string, sessionId: string, description: string) {
    this._store.createNewRecording(taskName, sessionId, description)
    this.refreshRecordingInfo('on', sessionId, taskName)
    this.sendUserEvent(this.createSimplifiedUserEventNode('START', 'RECORD', extractHostURL(this._window.location.hash)))
  }

  clearNewRecording() {
    this.sendUserEvent(this.createSimplifiedUserEventNode('END', 'RECORD', extractHostURL(this._window.location.hash)))
    this._store.removeNewRecording()
    this.refreshRecordingInfo('off', '', '')
  }

  async updateRecordings() {
    if (this._store.isLoggedIn()) {
      let response = await this._api.expertReplay({})
      response.forEach(recording => {
        recording.steps = recording.steps.map(mapToObjectFormat);
      })
      this._store.addRecordings(response);
    }
  }

  clearRecordings() {
    this._store.clearRecordings();
  }

  async sendUserEvent(eventData: EventData, needFilter: boolean = true) {
    const sessionId = this._loadStatus()?.recordingSessionId;
    const taskName = this._loadStatus()?.recordingTaskName;

    const userEventData = {
      ...eventData,
      timestamp: Date.now(),
      session_id: sessionId ? sessionId : '',
      task_name: taskName ? taskName : '',
    }

    try {
      const url = new URL(userEventData.base_url);
      for (const link of this._store.getWhitelist()) {
        if (link === url.hostname) {
          this._api.event({}, userEventData);
          break;
        }
      }
      if (!needFilter) {
        this._api.event({}, userEventData)
      }
    } catch (err) {
      this._api.event({}, userEventData);
    }
  }

  isOnRequestPage(hostname: string) {
    const providedURL = extractHostURL(window.location.hash)
      try {
        const url = new URL(providedURL)
        if (url.hostname === hostname) {
          return true;
        }
      } catch (err) {
        // console.error(err)
        return false;
      }
      return false;
  }

  fetchMessage(q: string, interval: number, start: boolean) {
    if ((this._store.getActivated() && this.isOnRequestPage('lms.monash.edu')) || start) {
      this._api.message({q: q, interval: interval}).then(
        response => {
          response.map(r => {
            if (r.interval) {
              this._store.setInterval(r.interval)
            }
          })
          this._store.addMessages(response);
        }
      )
    }
    setTimeout(() => this.fetchMessage('organisation_event', this._store.getInterval(), false), this._store.getInterval());
  }

  startFecthMessage() {
    this.fetchMessage('organisation_event', 0, true)
  }
}
