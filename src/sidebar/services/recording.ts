import { extractHostURL } from '../../shared/custom';
import type { FileNode } from '../../types/api';
import type { SidebarStore } from '../store';
import type { APIService } from './api';
import type { ToastMessengerService } from './toast-messenger';

/**
 * A service that manages the association between the route and route parameters
 * implied by the URL and the corresponding route state in the store.
 */
// @inject
export class RecordingService {
  private _store: SidebarStore;
  private _api: APIService;
  private _toastMessenger: ToastMessengerService;

  constructor(
    store: SidebarStore,
    api: APIService,
    toastMessenger: ToastMessengerService,
  ) {
    this._store = store;
    this._api = api;
    this._toastMessenger = toastMessenger;
  }

  async loadRecordItems(uri: string) {
    const result = await this._api.recordings.list({'target_uri': uri ?? ''});
    this._store.addRecordItems(result);
    return await this._api.tracking.read({});
  }

  unloadRecordItems() {
    this._store.clearRecordItems();
  }

  async selectRecordTabView(newView: 'list' | 'view' | 'ongoing', id?: string, scrollTop: number = 0) {
    const currentView = this._store.getRecordTabView();

    if (newView !== currentView) {
      if (newView === 'view' && id) {
        try {
          const traceSteps = await this._api.traces.list({ id: id });
          traceSteps.map(step => {
            if (step.image)
              step.image = this._store.getLink('index') + 'api/image/' + step.image + '.jpg'
          })
          this._store.addRecordSteps(traceSteps);
          this._store.selectTab('recording');
          this._store.setRecordTabView(id);
        } catch (err) {
          this._store.setRecordTabView('list');
          this._toastMessenger.error('This shareflow is not accessible. Error: ' + err.message);
        }
      }
      else {
        this._store.selectTab('recording');
        this._store.setRecordTabView(newView);
      }
    }
  }

  getRecordTabView() {
    const currentView = this._store.getRecordTabView();
    if (currentView !== 'list' && currentView !== 'ongoing') {
      return 'view';
    } else {
      return currentView;
    }
  }

  getSessionId() {
    const currentView = this._store.getRecordTabView();
    if (currentView !== 'list' && currentView !== 'ongoing') {
      return null;
    } else {
      return currentView;
    }
  }

  updateSyncRecording(isRecording: boolean, id?: string | null, taskName?: string | null) {
    if (isRecording && id && taskName) {
      this._store.setSync('recording', true);
      this._store.setSync('recordingSessionId', id);
      this._store.setSync('recordingTaskName', taskName);
    } else {
      this._store.setSync('recording', false);
      this._store.setSync('recordingSessionId', null);
      this._store.setSync('recordingTaskName', null);
    }
  }

  async createRecord(
    taskName: string,
    sessionId: string,
    description: string,
    backdate: number,
  ) {
    // try {
    const result = await this._api.recording.create({}, {
      sessionId: sessionId,
      taskName: taskName,
      description: description,
      startstamp: Date.now(),
      backdate: backdate,
    });
    this._store.addRecordItems([result]);
    this.updateSyncRecording(true, result.id, result.taskName);
    // } catch (err) {
    //   this.updateSyncRecording(false);
    // }
  }

  async stopRecord(id: string, options: Record<string, any>) {
    try {
      const recordItem = await this._api.recording.update(
        { id: id },
        options
      );
      this._store.updateRecordItem(recordItem);
      this.selectRecordTabView('view', recordItem.id);
    } catch (err) {
      if (err.response.status === 404) {
        this._toastMessenger.error('Error: '+ err.response.status);
      }
    }
    this.updateSyncRecording(false);
  }

  async updateRecord(id: string, options: Record<string, any>) {
    try {
      const recordItem = await this._api.recording.update(
        { id: id },
        options
      );
      this._store.updateRecordItem(recordItem);
    } catch (err) {
      if (err.response.status === 404) {
        this._toastMessenger.error('Error: '+ err.response.status);
      }
    }
  }

  async deleteRecord(id: string) {
    await this._api.recording.delete({ id: id });
    this._store.removeRecordItem(id);
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

  // fetchHighlight(url: string| undefined) {
  //   if (url === undefined) return;
  //   this._api.pull_recommendation({url: encodeURIComponent(url)}).then(
  //     response => {
  //       if (response.id === '') return;
  //       const notification: RawMessageData = {
  //         type: 'Highlights',
  //         id: response.id,
  //         title: response.title,
  //         message: response.context,
  //         date: Date.now()*1000,
  //         show_flag: true,
  //         unread_flag: true,
  //         need_save_flag: false,
  //       }
  //       let emptyArray = [];
  //       emptyArray.push(notification);
  //       this._store.addMessages(emptyArray);
  //     }
  //   )
  // }

  isInWhitelist(url?: string) {
    if (url) {
      const whitelist = this._store.getWhitelist();
      return whitelist.some(whitelist => url.includes(whitelist));
    }
    return false;
  }

  async loadMessages() {
    // Load user account's messages
    const url = this._store.mainFrame()?.uri;
    const responses = await this._api.pull({q: "q", interval: 0, url: url});
    this._toastMessenger.message(responses);
  }

  updateTracking(id?: string, scrollTop: number = 0) {
    if (id) {
      this._api.tracking.update({}, {id: id, scrollTop: scrollTop});
    }
    else {
      this._api.tracking.update({}, {id: null, scrollTop: null});
    }
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
