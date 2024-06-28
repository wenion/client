import { TinyEmitter } from 'tiny-emitter';

import type { SidebarStore } from '../store';
import type { APIService } from './api';
import type { SidebarSettings } from '../../types/config';
import { extractHostURL } from '../../shared/custom';
import { generateRandomString } from '../../shared/random';
import type { RecordingStepData, EventData, RawMessageData } from '../../types/api';
import type { FileNode } from '../../types/api';
import type { LocalStorageService } from './local-storage';
import type { StreamerService } from './streamer';
import type { ToastMessengerService } from './toast-messenger';


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
    id: inputObject.id ?? generateStepId(),
    url: inputObject.url,
    description: inputObject.description,
    title: inputObject.title,
    width: inputObject.width,
    height: inputObject.height,
    offsetX: inputObject.offsetX,
    offsetY: inputObject.offsetY,
    position: inputObject.position,
    image: inputObject.image,
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
  private _streamer: StreamerService;
  private _toastMessenger: ToastMessengerService;
  private _window: Window;

  constructor(
    $window: Window,
    api: APIService,
    localStorage: LocalStorageService,
    settings: SidebarSettings,
    store: SidebarStore,
    streamer: StreamerService,
    toastMessenger: ToastMessengerService,
  ) {
    super();

    this._statusInfoPromise = null;

    this._api = api;
    this._localStorage = localStorage;
    this._settings = settings;
    this._store = store;
    this._streamer = streamer;
    this._toastMessenger = toastMessenger;
    this._window = $window;

    this._listenForTokenStorageEvents();
  }

  private _listenForTokenStorageEvents() {
    this._window.addEventListener('storage', ({ key }) => {
      if (key === this._storageKey()) {
        const status = this._loadStatus()
        this.emit('statusChanged', status);
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

  getExtensionStatus(): StatusInfo {
    const status = this._loadStatus();
    if (!status) {
      this._initStatus();
      return this.getExtensionStatus();
    }
    return status;
  }

  async createNewRecording(taskName: string, sessionId: string, description: string, start: number, groupid: string) {
    this.refreshRecordingInfo('on', sessionId, taskName);
    await this._api.recording.create({}, {
      startstamp: Date.now(),
      sessionId: sessionId,
      taskName: taskName,
      session_id: sessionId,
      task_name: taskName,
      description: description,
      target_uri: extractHostURL(this._window.location.hash),
      start: start,
      groupid: groupid
    });
    this._store.selectRecordBySessionId(sessionId, 'view');
  }

  async clearNewRecording(sessionId:string) {
    const result = await this._api.recording.update({
      id: sessionId
    }, {
      endstamp: Date.now(),
      action: 'finish',
    })
    if (result.steps) {
      result.steps = result.steps.map(step => {
        return mapToObjectFormat(step);
      });
    }
    this._store.addRecords([result,]);
    this._store.selectTab('recording');
    this._store.selectRecordBySessionId(sessionId, 'view');
    this.refreshRecordingInfo('off', '', '')
  }

  async loadBatchRecords(uri: string) {
    const results = await this._api.batch({'target_uri': uri ?? ''});
    // results.forEach(recording => {
    //   recording.steps = recording.steps.map(mapToObjectFormat);
    // })
    this._store.addRecords(results);
  }

  unloadRecords() {
    this._store.clearRecords();
    this._store.clearSelectedRecordingStep();
  }

  async getRecording(sessionId: string, userid: string | undefined) {
    this._store.selectRecordBySessionId(sessionId, 'view');
    const selected = this._store.getSelectedRecord();
    if (selected && !selected.steps) {
      const result = await this._api.recording.get({id: sessionId, userid: userid});
      if (result.steps) {
        result.steps = result.steps.map(step => {
          return mapToObjectFormat(step);
        });
      }
      this._store.addRecords([result, ]);
      this._store.selectRecordBySessionId(sessionId, 'view');
    }
  }

  async updateRecording(sessionId: string, shared: boolean) {
    const result = await this._api.recording.update({
      id: sessionId
    }, {
      shared: shared,
      action: 'share',
    })
    this._store.addRecords([result,])
  }

  async deleteRecording() {
    const recording = this._store.getSelectedRecord()

    const result = await this._api.recording.delete({id: recording!.session_id}) as unknown as string
    if (recording!.sessionId === result) {
      this._store.removeRecords([recording!.session_id])
      this._store.clearSelectedRecord();
    }
  }

  async sendUserEvent(eventData: EventData, needToCheck: boolean = true) {
    const sessionId = this._loadStatus()?.recordingSessionId;
    const taskName = this._loadStatus()?.recordingTaskName;

    const userEventData = {
      ...eventData,
      timestamp: Date.now(),
      session_id: sessionId ? sessionId : '',
      task_name: taskName ? taskName : '',
      image: (sessionId && eventData.image) ? eventData.image : undefined,
      title: this._store.mainFrame()?.metadata.title,
      // image: true ? eventData.image : undefined,
    }

    try {
      const url = new URL(userEventData.base_url);
      if (needToCheck) {
        for (const link of this._store.getWhitelist()) {
          if (url.href.includes(link)) {
            this._api.event({}, userEventData);
            break;
          }
        }
      }
      else {
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

  fetchHighlight(url: string| undefined) {
    if (url === undefined) return;
    this._api.pull_recommendation({url: encodeURIComponent(url)}).then(
      response => {
        if (response.id === '') return;
        const notification: RawMessageData = {
          type: 'Highlights',
          id: response.id,
          title: response.title,
          message: response.context,
          date: Date.now()*1000,
          show_flag: true,
          unread_flag: true,
          need_save_flag: false,
        }
        let emptyArray = [];
        emptyArray.push(notification);
        this._store.addMessages(emptyArray);
      }
    )
  }

  async fetchMessage(q: string, interval: number, next: boolean) {
    let _interval = interval;
    let should_next = next;
    try {
      const responses = await this._api.message({q: q, interval: interval, url: this._store.mainFrame()?.uri});
      for (const r of responses) {
        if (r.type === 'instant_message') {
          _interval = r.interval?? interval;
          should_next = r.should_next?? next;
        }
      }
      this._store.addMessages(responses);
    } catch (err) {
      console.log('message catch errors', err)
    }

    if (should_next) {
      if (_interval === 0) {_interval = this._store.getInterval();}
      setTimeout(() => this.fetchMessage('organisation_event', _interval, should_next), _interval);
    }
  }

  startFecthMessage() {
    this.fetchMessage('organisation_event', 0, true)
  }

  saveFile(blob: Blob, metadata: FileNode) {
    this._api.upload({}, blob, metadata)
      .then(
        response => {
          console.log('response', response)
          if (response?.succ !== undefined)
              this._toastMessenger.success('This page (' + response.succ.name + ') has been saved')
            else if (response?.error !== undefined)
              this._toastMessenger.error(response?.error)
        }
      )
      .catch(error => {
        console.error('response', error)
      })
  }
}
