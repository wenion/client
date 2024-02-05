import { TinyEmitter } from 'tiny-emitter';

import type { SidebarStore } from '../store';
import type { APIService } from './api';
import type { SidebarSettings } from '../../types/config';
import { generateRandomString } from '../../shared/random';
import type { RecordingStepData, EventData } from '../../types/api';
import type { LocalStorageService } from './local-storage';


type StatusInfo = {
  isSilentMode: boolean;
  recordingSessionId: string;
  recordingTaskName: string;
}

const isStatusInfo = (status: unknown): status is StatusInfo =>
  !!status &&
  typeof status === 'object' &&
  'isSilentMode' in status &&
  typeof status.isSilentMode === 'boolean' &&
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
    
    this._initStatus();
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
    const status = this._loadStatus();
    if (!status) {
      this._saveStatus(false, '', '');
    }
  }

  private _loadStatus() {
    const status = this._localStorage.getObject(this._storageKey());

    if (!isStatusInfo(status)) {
      return null;
    }

    return {
      isSilentMode: status.isSilentMode,
      isRecording: status.recordingSessionId === ''? false : true,
      recordingSessionId: status.recordingSessionId,
      recordingTaskName: status.recordingTaskName,
    }
  }

  private _saveStatus(isSilentMode: boolean, recordingSessionId: string, recordingTaskName: string) {
    const status = {
      isSilentMode: isSilentMode,
      recordingSessionId: recordingSessionId,
      recordingTaskName: recordingTaskName,
    }
    this._localStorage.setObject(this._storageKey(), status)
  }

  refreshSilentMode(isSilentMode: boolean) {
    const status = this._loadStatus();
    if (status) {
      this._saveStatus(isSilentMode, status.recordingSessionId, status.recordingTaskName)
      return true
    }
    return false
  }

  refreshRecordingInfo(recordingSessionId: string, recordingTaskName: string) {
    const status = this._loadStatus();
    if (status) {
      this._saveStatus(status.isSilentMode, recordingSessionId, recordingTaskName)
      return true
    }
    return false
  }

  createUserEventNode(
    stage: string,
    sessionId: string,
    taskName: string,
    width: number,
    height: number,
    docId: string,
    userid: string) {
    const userEvent: EventData = {
      event_type: stage,
      timestamp: Date.now(),
      base_url: '',
      tag_name: 'RECORD',
      text_content: '',
      interaction_context: '',
      event_source: '',
      target: '',
      x_path: '',
      offset_x: 0,
      offset_y: 0,
      session_id: sessionId,
      task_name: taskName,
      width: width,
      height: height,
      doc_id: docId,
      userid: userid,
    };
    return userEvent;
  }
  

  createNewRecording(taskName: string, sessionId: string, description: string) {
    this._store.createNewRecording(taskName, sessionId, description)
    this._store.changeRecordingStage('Start')
    this.refreshRecordingInfo(sessionId, taskName)
    this._api.event({}, this.createUserEventNode('START', sessionId, taskName, 0, 0, '', ''))
  }

  clearNewRecording() {
    this._store.removeNewRecording()
    this._store.changeRecordingStage('Idle')
    this.refreshRecordingInfo('', '')
    this._api.event({}, this.createUserEventNode('END', '', '', 0, 0, '', ''))
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

  async init() {
    this.emit('statusChanged', this._loadStatus());
  }
}
