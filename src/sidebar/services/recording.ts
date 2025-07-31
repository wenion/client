import { extractHostURL } from '../../shared/custom';
import { generateHexString } from '../../shared/random';
import type { SidebarStore } from '../store';
import type { APIService } from './api';
import type { RecordStep } from '../../types/api';
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
    const result = await this._api.recordings.list({'document_uri': uri ?? ''});
    this._store.addRecordItems(result);
  }

  unloadRecordItems() {
    this._store.clearRecordItems();
  }

  async saveTraces(id: string, updates: RecordStep[]) {
    this._store.clearRecordSteps();
    const results = await this._api.traces.update({id: id}, updates);
    this._store.addRecordSteps(results);
  }

  async getHistoryList(id: string) {
    const result = await this._api.histories.list({id: id});
    this._store.setHistory(result);
  }

  async deleteHistoryList(id: string) {
    await this._api.histories.delete({id: id});
    this._store.setHistory(null);
  }

  async getHistoryVersion(id: string, version: number) {
    this._store.clearRecordSteps();
    const updates = await this._api.history.get({id: id, version: version});
    this._store.addRecordSteps(updates);
  }

  async autoSaveTraces(id: string, updates: RecordStep[]) {
    this._store.clearRecordSteps();
    const results = await this._api.traces.update(
      {
        id: id,
        "response_mode": "auto"
      }, updates
    );
    this._store.addRecordSteps(results);
    // this._store.addRecordSteps(results);
    // this._store.setHistory(results);
  }

  async updateImage(id: string, imageData: string) {
    this._api.image.update(
      { id: id },
      { image: imageData }
    );
  };

  async getTracesById(id: string) {
    this._store.clearRecordSteps();
    const traceSteps = await this._api.traces.list({ id: id, "response_mode": "metadata" });
    this._store.addRecordSteps(traceSteps);
  }

  async getVersionTracesById(id: string) {
    this._store.clearRecordSteps();
    const traceSteps = await this._api.traces.list({ id: id, "response_mode": "version" });
    this._store.addRecordSteps(traceSteps);
  }

  findStepInView(targetSteps: RecordStep[], steps: RecordStep[]) {
    for(const target of targetSteps) {
      const threadElement = document.getElementById(target.id);
      if (threadElement) {
        console.log("Target found >>", target)
        return target;
      }
    }

    console.log("No direct match found, fallback to previous steps")
    const target = targetSteps[0];
    const targetIndex = steps.findIndex(step => step.id === target.id);
    if (targetIndex === -1) {
      console.error('Fallback target not found in full step list')
      return null;
    }
    for (let i = targetIndex - 1; i >= 0; i--) {
      const targetElement = document.getElementById(steps[i].id);
      if (targetElement) {
        console.log("Fallback target found >>", steps[i])
        return steps[i];
      }
    }
    console.log("No match found at all")
    return null;
  }

  async goToStep(session_id: string, type: string, stepId?: string) {
    const recordItem = this._store.getRecordItemByPk(session_id);
    if (recordItem) {
      const id = recordItem.id;
      this._store.selectTab('shareflow');
      this._store.setRecordTabView(id);

      const subSteps: RecordStep[] = [];

      // if push step is empty, set expert step as target step
      const step = this._store.getRecordStepByPk(stepId??'');
      if (step !== null) {
        subSteps.push(step);
        if (type === "expertStep") {
          this._store.setExpertStep(step);
        }
      }

      setTimeout(() => {
        const target = this.findStepInView(subSteps, this._store.recordSteps());
        if (target) {
          this.scrollTo(target.id);
        }
      }, 500);
    }
    else {
      console.error("can't find the shareflow with session id " + session_id)
    }
  }

  async selectRecordTabViewByPk(pk: string, current_step: string[], expertStepId?: string) {
    const recordItem = this._store.getRecordItemByPk(pk);
    if (recordItem) {
      const id = recordItem.id;
      this._store.clearRecordSteps();
      const traceSteps = await this._api.traces.list({ id: id, "response_mode": "metadata" });
      this._store.addRecordSteps(traceSteps);
      this._store.selectTab('shareflow');
      this._store.setRecordTabView(id);

      const subSteps = current_step
        .map(stepId => this._store.getRecordStepByPk(stepId))
        .filter(step => step !== null);

      // if push step is empty, set expert step as target step
      const exportStep = this._store.getRecordStepByPk(expertStepId??'');
      if (exportStep !== null) {
        subSteps.push(exportStep);
        this._store.setExpertStep(exportStep);
      }

      setTimeout(() => {
        const target = this.findStepInView(subSteps, this._store.recordSteps());
        if (target) {
          this.scrollTo(target.id);
        }
      }, 1000);
    }
    else {
      console.error("can't find the shareflow with pk " + pk)
    }
  }

  async selectRecordTabView(newView: 'list' | 'view' | 'ongoing', id?: string, scrollTop: number = 0) {
    const currentView = this._store.getRecordTabView();

    if (newView !== currentView) {
      if (newView === 'view' && id) {
        try {
          this._store.clearRecordSteps();
          const traceSteps = await this._api.traces.list({ id: id, "response_mode": "metadata" });
          this._store.addRecordSteps(traceSteps);
          this._store.selectTab('shareflow');
          this._store.setRecordTabView(id);
          this._store.setFocusedRecordItemId(id);
        } catch (err) {
          this._store.setRecordTabView('list');
          this._toastMessenger.error('This shareflow is not accessible. Error: ' + err.message);
        }
      }
      else {
        this._store.selectTab('shareflow');
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
    groups: string[],
    generate: boolean,
  ) {
    const result = await this._api.recording.create({}, {
      sessionId: sessionId,
      taskName: taskName,
      description: description,
      startstamp: Date.now(),
      backdate: backdate,
      groups: groups,
      generate: generate,
    });
    if (result && 'groups' in result) {
      this._store.addRecordItems([result]);
    }
    this.updateSyncRecording(true, result.id, result.taskName);
  }

  async stopRecord(id: string, options: {endstamp: number, generate: boolean}) {
    try {
      const recordItem = await this._api.recording.update(
        { id: id },
        options
      );
      this._store.updateRecordItem(recordItem);
      // for backend
      if (options.generate) {
        setTimeout(() => {
          this.selectRecordTabView('view', recordItem.id);
        }, 2000);
      }
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
      this._toastMessenger.success(recordItem.taskName + ' is updated!');
    } catch (err) {
      if (err.response.status === 404) {
        this._toastMessenger.error('Error: '+ err.response.status);
      }
    }
  }

  async syncUpdateRecord(id: string, options: Record<string, any>) {
    const recordItem = await this._api.recording.update(
      { id: id },
      options
    );
    return recordItem;
  }

  async toggleRecordPin(id: string, value: boolean) {
    const recordItem = await this._api.recording.update(
      { id: id },
      { pin: value }
    );
    this._store.setDefault('focusedShareflow', value ? recordItem.id : null);
  };

  async setRecordScore(id: string, value: number) {
    const recordItem = await this._api.recording.update(
      { id: id },
      { score: value }
    );
    this._store.updateRecordItem(recordItem);
  };

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

  scrollTo(scrollToId: string | null, activate: boolean = true) {
    this._store.setFocusedStepId(scrollToId);
    this._store.setShouldScroll(activate);
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

  // isInWhitelist(url?: string) {
  //   if (url) {
  //     const whitelist = this._store.getWhitelist();
  //     return whitelist.some(whitelist => url.includes(whitelist));
  //   }
  //   return false;
  // }

  async loadMessages() {
    // Load user account's messages
    const url = this._store.mainFrame()?.uri;
    const responses = await this._api.pull({q: "q", interval: 0, url: url});
    this._toastMessenger.message(responses);
  }

  updateTracking(): void;
  updateTracking(id: string): void;
  updateTracking(id: string, scrollToId: string): void;
  updateTracking(id?: string, scrollToId?: string): void {
    this._api.tracking.update({}, {
      id: id || null,
      scrollToId: scrollToId || null,
    });
  }

  async readTracking() {
    return await this._api.tracking.read({});
  }

  async saveFile(
    name: string,
    size: number,
    type: string,
    path: string,
    access: string,
    data: Blob,
    onFinished: () => void,
  ) {
    const xhrCallback = {
      onProgress: () => {},
      onFinished: onFinished,
      onAbortReference: (()=>{}),
    }
    await this._api.upload(
      {
        'name': name,
        'size': size,
        'type': type,
        'path': path,
        'access': access,
      },
      data,
      xhrCallback,
    );
  }
}
