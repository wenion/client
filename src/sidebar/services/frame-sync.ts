import type { ToastMessage } from '@hypothesis/frontend-shared';
import debounce from 'lodash.debounce';
import type { DebouncedFunction } from 'lodash.debounce';
import shallowEqual from 'shallowequal';

import { ListenerCollection } from '../../shared/listener-collection';
import {
  PortFinder,
  PortRPC,
  isMessage,
  isMessageEqual,
} from '../../shared/messaging';
import type { Message } from '../../shared/messaging';
import type { AnnotationData, DocumentInfo } from '../../types/annotator';
import type { Annotation } from '../../types/api'; //RawMessageData
import type {
  SidebarToHostEvent,
  HostToSidebarEvent,
  SidebarToGuestEvent,
  GuestToSidebarEvent,
} from '../../types/port-rpc-events';
import type {
  SiteToSidebarEvent,
  SidebarToSiteEvent,
} from '../../types/site-port-rpc-events';
import { isReply, isPublic } from '../helpers/annotation-metadata';
import { annotationMatchesSegment } from '../helpers/annotation-segment';
import type { SidebarStore } from '../store';
import type { Frame } from '../store/modules/frames';
import { watch } from '../util/watch';
import type { AnnotationsService } from './annotations';
import type { StreamerService } from './streamer';
import type { VideoAnnotationsService } from './video-annotations';
import type { ToastMessengerService } from './toast-messenger';
import { RecordingService } from './recording';
import { ADDITIONAL_TAG } from '../../shared/custom'
/**
 * Return a minimal representation of an annotation that can be sent from the
 * sidebar app to a guest frame.
 *
 * Because this representation will be exposed to untrusted third-party
 * JavaScript, it includes only the information needed to uniquely identify it
 * within the current session and anchor it in the document.
 */
export function formatAnnot({
  $cluster,
  $tag,
  target,
  uri,
}: Annotation): AnnotationData {
  return {
    $cluster,
    $tag,
    target,
    uri,
  };
}

/**
 * Return the frame which best matches an annotation.
 */
function frameForAnnotation(frames: Frame[], ann: Annotation): Frame | null {
  // Choose frame with an exact URL match if possible. In the unlikely situation
  // where multiple frames have the same URL, we'll use whichever connected first.
  const uriMatch = frames.find(f => f.uri === ann.uri);
  if (uriMatch) {
    return uriMatch;
  }

  // If there is no exact URL match, choose the main/host frame for consistent results.
  const mainFrame = frames.find(f => f.id === null);
  if (mainFrame) {
    return mainFrame;
  }

  // If there is no main frame (eg. in VitalSource), fall back to whichever
  // frame connected first.
  return frames[0] ?? null;
}

/**
 * Service that handles communication between the sidebar and guest and host
 * frames.
 *
 * The service's main responsibility is to synchronize annotations between the
 * sidebar and guests. New annotations created in guest frames are added to the
 * store in the sidebar and persisted to the backend.  Annotations fetched from
 * the API and added to the sidebar's store are sent to the appropriate guest
 * to display highlights in the document.
 *
 * Only a minimal subset of annotation data is sent from the sidebar to guests.
 * This is a security/privacy feature to prevent guest frames (which often
 * contain third-party JavaScript) from observing the contents or authors of
 * annotations.
 *
 * In addition to annotation data, this service also handles:
 *
 *  - Synchronizing the selection and hover states of annotations between the
 *    sidebar and guest frames
 *  - Triggering scrolling or navigation of guest frames when an annotation is
 *    clicked in the sidebar
 *  - Sending feature flags to host and guest frames
 *  - Various other interactions with guest and host frames
 *
 * @inject
 */
export class FrameSyncService {
  private _annotationsService: AnnotationsService;
  private _videoAnnotationsService: VideoAnnotationsService;
  private _recordingService: RecordingService;

  /**
   * Map of guest frame ID to channel for communicating with guest.
   *
   * The ID will be `null` for the "main" guest, which is usually the one in
   * the host frame.
   */
  private _guestRPC: Map<
    string | null,
    PortRPC<GuestToSidebarEvent, SidebarToGuestEvent>
  >;

  /** Whether highlights are visible in guest frames. */
  private _highlightsVisible: boolean;

  /**
   * Channel for sidebar-host communication.
   */
  private _hostRPC: PortRPC<HostToSidebarEvent, SidebarToHostEvent>;

  /**
   * Channel for site-sidebar communication. KMASS Project
   */
  private _siteRPC: PortRPC<SiteToSidebarEvent, SidebarToSiteEvent>;

  /**
   * Tags of annotations that are currently loaded into guest frames.
   */
  private _inFrame: Set<string>;

  private _listeners: ListenerCollection;
  private _portFinder: PortFinder;
  private _store: SidebarStore;
  private _streamer: StreamerService;
  private _toastMessenger: ToastMessengerService;

  /**
   * Tag of an annotation that should be scrolled to after anchoring completes.
   *
   * This is set when {@link scrollToAnnotation} is called and the document
   * needs to be navigated to a different URL. This can happen in EPUBs.
   */
  private _pendingScrollToTag: string | null;

  /**
   * Tag of an annotation that should be hovered after anchoring completes.
   *
   * See notes for {@link _pendingScrollToTag}.
   */
  private _pendingHoverTag: string | null;

  /**
   * Map of annotation tag to anchoring status. This holds status updates
   * which have been received from guest frames but not yet committed to the store.
   *
   * Commits are batched to reduce the reduce the overhead from re-rendering
   * etc. triggered by `SidebarStore.updateAnchorStatus` calls.
   */
  private _pendingAnchorStatusUpdates: Map<string, 'anchored' | 'orphan'>;

  /**
   * Schedule a commit of the anchoring status updates in
   * {@link _pendingAnchorStatusUpdates} to the store.
   */
  private _scheduleAnchorStatusUpdate: DebouncedFunction<[]>;

  /** Indicates if the sidebar is currently open or closed */
  private _sidebarIsOpen: boolean;

  private _messageChannel: MessageChannel;

  // Test seam
  private _window: Window;

  constructor(
    $window: Window,
    annotationsService: AnnotationsService,
    videoAnnotationsService: VideoAnnotationsService,
    recordingService: RecordingService,
    store: SidebarStore,
    streamer: StreamerService,
    toastMessenger: ToastMessengerService,
  ) {
    this._window = $window;
    this._annotationsService = annotationsService;
    this._videoAnnotationsService = videoAnnotationsService;
    this._recordingService = recordingService;
    this._store = store;
    this._streamer = streamer;
    this._toastMessenger = toastMessenger;
    this._portFinder = new PortFinder({
      hostFrame: this._window.parent,
      source: 'sidebar',
    });
    this._listeners = new ListenerCollection();

    this._hostRPC = new PortRPC();
    this._siteRPC = new PortRPC();
    this._guestRPC = new Map();
    this._inFrame = new Set<string>();
    this._messageChannel =  new MessageChannel();
    this._highlightsVisible = false;

    this._pendingScrollToTag = null;
    this._pendingHoverTag = null;
    this._pendingAnchorStatusUpdates = new Map();

    this._scheduleAnchorStatusUpdate = debounce(() => {
      const records = Object.fromEntries(
        this._pendingAnchorStatusUpdates.entries(),
      );
      this._store.updateAnchorStatus(records);
      this._pendingAnchorStatusUpdates.clear();
    }, 10);

    this._sidebarIsOpen = false;

    this._setupSyncToGuests();
    this._setupHostEvents();
    this._setupSiteEvents();
    this._setupFeatureFlagSync();
    this._setupToastMessengerEvents();
    this._setupStatusSync();
    this._setupMessageChannel();
  }

  private _attachExtraInformation(_data: {
    messageType: string,
    type: string,
    tagName: string,
    textContent: string,
    interactionContext: string,
    eventSource: string,
    xpath: string,
    url: string,
    width: number | null,
    height: number | null,
  }) {
    return Object.assign(_data, {
      userid: this._store.profile().userid,
      timestamp: Date.now(),
      title: this._store.mainFrame()?.metadata.title,
      region: '',
      session_id: this._recordingService.getExtensionStatus().recordingSessionId,
      task_name: this._recordingService.getExtensionStatus().recordingTaskName,
      ip_address: '',
    })
  }

  private _setupMessageChannel() {
    this._messageChannel.port1.onmessage = (event) => {
      const _data = event.data;
      const _messageType = _data.messageType;

      if (_messageType === 'TraceData') {
        // type === 'getfocus'
        if (_data.type === 'getfocus') {
          const focused = this._store.getDefault('focus') as 'onFocused' | 'onUnfocused';
          if (focused !== _data.textContent) {
            this._store.setDefault('focus', _data.textContent);
            if (_data.textContent === 'onUnfocused') {
              return;
            }
          }
          else {
            return;
          }
        }
        this._streamer.send(this._attachExtraInformation(_data));
      }
      else {
        if (_data.mode) {
          const currentMode = this._store.getDefault('mode') as 'Baseline' | 'GoldMind' | 'Query';
          if (currentMode === 'GoldMind' || currentMode === 'Baseline'|| currentMode === null) {
            this._store.setDefault('mode', _data.mode)
            this._hostRPC.call('changeMode', _data.mode)
          }
          else { // if Query, return the origin mode
            this._messageChannel.port1.postMessage({
              source:"sidebar",
              mode: currentMode === 'Query' ? 'GoldMind': currentMode,
            })
          }
        }
        if (_data.remove) {
          console.log("remove ", _data)
        }
        if (_data.recording && _data.recording === 'request') {
          this._messageChannel.port1.postMessage({
            source:"sidebar",
            recording: this._recordingService.getExtensionStatus(),
          })
        }
        if (_data.model) {
          this._store.setDefault('model', _data.model)
        }
        if(_data.token) {
          this._store.setDefault('token', _data.token)
        }
      }
    }
  }

  sendTraceData(
    eventType: string,
    eventSource: string,
    tagName: string,
    textContent: string,
    interactionContext: string
  ) {
    this._streamer.send({
      messageType: 'TraceData',
      type: eventType,
      tagName: tagName,
      textContent: textContent,
      interactionContext: interactionContext,
      eventSource: eventSource,
      xpath: '',
      width: null,
      height: null,
      userid: this._store.profile().userid,
      timestamp: Date.now(),
      title: this._store.mainFrame()?.metadata.title,
      region: '',
      session_id: this._recordingService.getExtensionStatus().recordingSessionId,
      task_name: this._recordingService.getExtensionStatus().recordingTaskName,
      url: this._store.mainFrame()?.uri ?? '',
      ip_address: '',
    })
  }

  /**
   * Watch for changes to the set of annotations loaded in the sidebar and
   * notify connected guests about new/updated/deleted annotations.
   */
  private _setupSyncToGuests() {
    let prevPublicAnns = 0;

    /**
     * Handle annotations or frames being added or removed in the store.
     */
    const onStoreAnnotationsChanged = (
      annotations: Annotation[],
      frames: Frame[],
      prevAnnotations: Annotation[],
    ) => {
      let publicAnns = 0;
      const inSidebar = new Set<string>();
      const added = [] as Annotation[];

      // Determine which annotations have been added or deleted in the sidebar.
      annotations.forEach(annot => {
        if (isReply(annot)) {
          // The frame does not need to know about replies
          return;
        }

        if (isPublic(annot)) {
          ++publicAnns;
        }

        inSidebar.add(annot.$tag);
        if (!this._inFrame.has(annot.$tag)) {
          added.push(annot);
        }
      });
      const deleted = prevAnnotations.filter(
        annot => !inSidebar.has(annot.$tag),
      );

      // Send added annotations to matching frame.
      if (added.length > 0) {
        const addedByFrame = new Map<string | null, Annotation[]>();

        // List of annotations to immediately mark as anchored, as opposed to
        // waiting for the guest to report the status. This is used for
        // annotations associated with content that is different from what is
        // currently loaded in the guest frame (eg. different EPUB chapter).
        //
        // For these annotations, we optimistically assume they will anchor
        // when the appropriate content is loaded.
        const anchorImmediately = [];

        for (const annotation of added) {
          const frame = frameForAnnotation(frames, annotation);
          if (
            !frame ||
            (frame.segment &&
              !annotationMatchesSegment(annotation, frame.segment))
          ) {
            anchorImmediately.push(annotation.$tag);
            continue;
          }
          const anns = addedByFrame.get(frame.id) ?? [];
          anns.push(annotation);
          addedByFrame.set(frame.id, anns);
        }

        if (anchorImmediately.length > 0) {
          this._updateAnchorStatus(anchorImmediately, 'anchored');
        }

        for (const [frameId, anns] of addedByFrame) {
          const rpc = this._guestRPC.get(frameId);
          if (rpc) {
            rpc.call('loadAnnotations', anns.map(formatAnnot));
          }
        }

        added.forEach(annot => {
          this._inFrame.add(annot.$tag);
        });
      }

      // Remove deleted annotations from frames.
      deleted.forEach(annot => {
        // Delete from all frames. If a guest is not displaying a particular
        // annotation, it will just ignore the request.
        this._guestRPC.forEach(rpc => rpc.call('deleteAnnotation', annot.$tag));
        this._inFrame.delete(annot.$tag);
      });

      // Update elements in host page which display annotation counts.
      if (frames.length > 0) {
        if (frames.every(frame => frame.isAnnotationFetchComplete)) {
          if (publicAnns === 0 || publicAnns !== prevPublicAnns) {
            this._hostRPC.call('publicAnnotationCountChanged', publicAnns);
            prevPublicAnns = publicAnns;
          }
        }
      }
    };

    watch(
      this._store.subscribe,
      () => this._store.isLoggedIn(),
      (isLoggedIn, prevIsLoggedIn) => {
        if (isLoggedIn) {
          this._messageChannel.port1.postMessage({source:"sidebar", loggedIn: isLoggedIn})
          this._recordingService.loadBatchRecords(this._store.mainFrame()?.uri ?? '');
          this._hostRPC.call('isLoggedIn', true)
          this._hostRPC.call('webClipping', {savePage: false})
        }
        // if (isLoggedIn && isLoggedIn !== prevIsLoggedIn) {
        //   this._recordingService.fetchHighlight(this._store.mainFrame()?.uri)
        // }
        else {
          this._recordingService.unloadRecords();
          this._store.clearMessages();
          this._messageChannel.port1.postMessage({source:"sidebar", loggedOut: !isLoggedIn})
          this._hostRPC.call('isLoggedIn', false)
        }
        this._messageChannel.port1.postMessage({source:"sidebar", init: true})
      }
    );

    watch(
      this._store.subscribe,
      () => this._store.isConnected(),
      (isConnected, prevIsConnected) => {
        this._hostRPC.call('websocketConnected', isConnected)
      }
    )

    watch(
      this._store.subscribe,
      () => this._store.mainFrame(),
      (mainFrame, prevMainFrame) => {
        if (mainFrame && !prevMainFrame) {
          this._recordingService.startFecthMessage();
        }
      }
    )

    watch(
      this._store.subscribe,
      () => [this._store.allAnnotations(), this._store.frames()] as const,
      ([annotations, frames], [prevAnnotations]) =>
        onStoreAnnotationsChanged(annotations, frames, prevAnnotations),
      shallowEqual,
    );

    watch(
      this._store.subscribe,
      () => this._store.getContentInfo(),
      contentInfo => {
        // We send the content info to all guests, even though it is only needed
        // by the main one. See notes in `_connectGuest`.
        this._guestRPC.forEach(guest => {
          guest.call('showContentInfo', contentInfo);
        });
      },
    );
  }

  /**
   * Schedule an update of the anchoring status of annotation(s) in the store.
   */
  private _updateAnchorStatus(
    tag: string | string[],
    state: 'orphan' | 'anchored',
  ) {
    const tags = Array.isArray(tag) ? tag : [tag];
    for (const tag of tags) {
      this._pendingAnchorStatusUpdates.set(tag, state);
    }
    this._scheduleAnchorStatusUpdate();
  }

  /**
   * Set up a connection to a new guest frame.
   *
   * @param port - Port for communicating with the guest
   * @param sourceId - Identifier for the guest frame
   */
  private _connectGuest(port: MessagePort, sourceId: string | null) {
    const guestRPC = new PortRPC<GuestToSidebarEvent, SidebarToGuestEvent>();

    this._guestRPC.set(sourceId, guestRPC);

    // Update document metadata for this guest. The guest will call this method
    // immediately after it connects to the sidebar. It may call it again
    // later if the document in the guest frame is navigated.
    guestRPC.on('documentInfoChanged', (info: DocumentInfo) => {
      this._store.connectFrame({
        id: sourceId,
        metadata: info.metadata,
        uri: info.uri,
        segment: info.segmentInfo,
        persistent: info.persistent,
      });
    });

    // TODO - Close connection if we don't receive a "connect" message within
    // a certain time frame.

    guestRPC.on('close', () => {
      const frame = this._store.frames().find(f => f.id === sourceId);
      if (frame && !frame.persistent) {
        this._store.destroyFrame(frame);
      }

      // Mark annotations as no longer being loaded in the guest, even if
      // the frame was marked as `persistent`. In that case if a new guest
      // connects with the same ID as the one that just went away, we'll send
      // the already-loaded annotations to the new guest.
      this._inFrame.clear();

      guestRPC.destroy();
      this._guestRPC.delete(sourceId);
    });

    // A new annotation, note or highlight was created in the frame
    guestRPC.on('createAnnotation', (annot: AnnotationData) => {
      // If user is not logged in, or groups haven't loaded yet, we can't create
      // a meaningful highlight or annotation. Instead, we need to open the
      // sidebar, show an error, and delete the (unsaved) annotation so it gets
      // un-selected in the target document
      const isLoggedIn = this._store.isLoggedIn();
      const hasGroup = this._store.focusedGroup() !== null;

      if (!isLoggedIn || !hasGroup) {
        this._hostRPC.call('openSidebar');
        if (!isLoggedIn) {
          this._store.openSidebarPanel('loginPrompt');
        }
        this._guestRPC.forEach(rpc => rpc.call('deleteAnnotation', annot.$tag));
        return;
      }

      this._inFrame.add(annot.$tag);

      // Open the sidebar so that the user can immediately edit the draft
      // annotation.
      if (!annot.$highlight) {
        this._hostRPC.call('openSidebar');
      }

      // Ensure that the highlight for the newly-created annotation is visible.
      // Currently we only support a single, shared visibility state for all highlights
      // in all frames, so this will make all existing highlights visible too.
      this._hostRPC.call('showHighlights');

      // Create the new annotation in the sidebar.
      this._annotationsService.create(annot);
    });

    // Anchoring an annotation in the frame completed
    guestRPC.on('syncAnchoringStatus', ({ $tag, $orphan }: AnnotationData) => {
      this._inFrame.add($tag);
      this._updateAnchorStatus($tag, $orphan ? 'orphan' : 'anchored');

      if ($tag === this._pendingHoverTag) {
        this._pendingHoverTag = null;
        guestRPC.call('hoverAnnotations', [$tag]);
      }
      if (this._pendingScrollToTag) {
        if ($tag === this._pendingScrollToTag) {
          this._pendingScrollToTag = null;
          guestRPC.call('scrollToAnnotation', $tag);
        }
      }
    });

    guestRPC.on(
      'showAnnotations',
      (tags: string[], focusFirstInSelection = false) => {
        // Since annotations are selected by ID rather than tag, this logic
        // currently only supports saved annotations.
        const ids = this._store.findIDsForTags(tags);
        this._store.selectAnnotations(ids);
        this._store.selectTab('annotation');

        // Attempt to transfer keyboard focus to the first selected annotation.
        //
        // To do this we need to focus both the annotation card and the frame
        // itself. It doesn't matter in which order.
        if (ids.length > 0 && focusFirstInSelection) {
          // Request the annotation card to be focused. This is handled asynchronously.
          this._store.setAnnotationFocusRequest(ids[0]);

          // Focus the sidebar frame. This may fail in WebKit-based browsers
          // if the user has no interacted with the frame since it loaded.
          window.focus();
        }
      },
    );

    // receive from src/annotator/guest.ts this._sidebarRPC.call('hoverAnnotations', tags);
    guestRPC.on('hoverAnnotations', (tags: string[]) => {
      this._store.hoverAnnotations(tags || []);

      if (tags.length) {
        tags.map(tag => {
          const annot = this._store.findAnnotationByTag(tag);
          if (annot && annot.tags.includes(ADDITIONAL_TAG)) {
            guestRPC.call('showAnnotationTags', {tag: tag, tags: [ADDITIONAL_TAG,]})
          }
        })
      }
      else {
        guestRPC.call('showAnnotationTags', {tag: '', tags: []})
      }
    });

    guestRPC.on('toggleAnnotationSelection', (tags: string[]) => {
      this._store.toggleSelectedAnnotations(this._store.findIDsForTags(tags));
    });

    guestRPC.on('openSidebar', () => {
      this._hostRPC.call('openSidebar');
    });

    guestRPC.on('closeSidebar', () => {
      this._hostRPC.call('closeSidebar');
    });

    guestRPC.connect(port);

    // Synchronize highlight visibility in this guest with the sidebar's controls.
    guestRPC.call('setHighlightsVisible', this._highlightsVisible);
    guestRPC.call('featureFlagsUpdated', this._store.features());

    // If we have content banner data, send it to the guest. If there are
    // multiple guests the banner is likely only appropriate for the main one.
    // Current contexts that use the banner only have one guest, so we can get
    // the data to the guest faster by sending it immediately, rather than
    // waiting for the `documentInfoChanged` event to tell us which is the main
    // guest.
    const contentInfo = this._store.getContentInfo();
    if (contentInfo) {
      guestRPC.call('showContentInfo', contentInfo);
    }
  }

  updateRecordingStatusView(status: 'off' | 'ready' | 'on') {
    if (status === 'off') {
      this._store.changeRecordingStage('Idle');
    }
    else if (status === 'ready') {
      this._store.selectTab('recording');
      this._store.changeRecordingStage('Request')
    }
    else {
      this._store.selectTab('recording');
      this._store.changeRecordingStage('Start')
    }
  }

  async refreshRecordingStatus(status: 'off' | 'ready' | 'on', taskName?: string, sessionId?: string, description?: string, start?: number, groupid?: string) {
    if (status === 'off') {
      const taskName = this._recordingService.getExtensionStatus().recordingTaskName;
      const sessionId = this._recordingService.getExtensionStatus().recordingSessionId;
      if (sessionId) {
        this.sendTraceData('click', 'RECORDING', 'RECORD', 'end', JSON.stringify({taskName:taskName, sessionId:sessionId}))
        await this._recordingService.clearNewRecording(sessionId);
      }
      this._messageChannel.port1.postMessage({
        source:"sidebar",
        recording: this._recordingService.getExtensionStatus(),
      })
    }
    else if (status === 'on') {
      this._recordingService.createNewRecording(taskName!, sessionId!, description!, start!, groupid?? '');
      this.sendTraceData('click', 'RECORDING', 'RECORD', 'start', JSON.stringify({taskName:taskName, sessionId:sessionId}))
      this._messageChannel.port1.postMessage({
        source:"sidebar",
        recording: this._recordingService.getExtensionStatus(),
      })
      // TODO checkout the return
    }
  }

  /**
   * Listen for messages coming from the host frame.
   */
  private _setupHostEvents() {
    this._hostRPC.on('sidebarOpened', () => {
      this._sidebarIsOpen = true;
      this._store.setSidebarOpened(true);
    });
    this._hostRPC.on('sidebarClosed', () => {
      this._sidebarIsOpen = false;
    });

    this._hostRPC.on('selectDataComics', (arg : {session_id: string, user_id: string})=> {
      this._store.selectTab('recording');
      this._store.changeRecordingStage('Idle');
      this._recordingService.getRecording(arg.session_id, arg.user_id)
    })

    // When user toggles the highlight visibility control in the sidebar container,
    // update the visibility in all the guest frames.
    this._hostRPC.on('setHighlightsVisible', (visible: boolean) => {
      this._highlightsVisible = visible;
      this._guestRPC.forEach(rpc => rpc.call('setHighlightsVisible', visible));
      this._recordingService.refreshShowHighlights(visible);
    });

    this._hostRPC.on('setVisuallyHidden', (visible: boolean) => {
      this._recordingService.refreshSilentMode(visible);
    });

    this._hostRPC.on('openChat', (value: boolean) => {
      const currentMode = this._store.getDefault('mode') as 'Baseline' | 'GoldMind' | 'Query';

      if (currentMode === 'GoldMind' && value) this._store.setDefault('mode', 'Query');
      if (currentMode === 'Query' && (!value)) this._store.setDefault('mode', 'GoldMind');

    });

    this._hostRPC.on('updateRecoringStatusFromHost', (status: 'off' | 'ready' | 'on') => {
      // off
      this.updateRecordingStatusView(status);
      this.refreshRecordingStatus(status);
    })

    this._hostRPC.on('traceData', (message:
      {
        eventType:string,
        eventSource: string,
        tagName: string,
        textContent:string,
        interactionContext:string
      }) => {
      this.sendTraceData(
        message.eventType,
        message.eventSource,
        message.tagName,
        message.textContent,
        message.interactionContext);
    });

    this._hostRPC.on('webPage', (htmlContent: string, title: string, url: string, savePage: boolean = true) => {
      if (savePage) {
        this._recordingService.saveFile(new Blob([htmlContent], { type: 'text/html' }), {
          id: "",
          name: title,
          content: htmlContent,
          path: "",
          type: "html",
          link: url,
          depth: 0,
          children: [],}
        )
      }
      else {
        this._streamer.send({
          messageType: 'PageData',
          textContent: htmlContent,
          title: title,
          url: url,
        })
      }
    });

    // this._hostRPC.on('postRating', (data: PullingData) => {
    //   this._queryService.postRating(data);
    // });
  }

  /**
   * Listen for messages coming from the site frame.
   */
  private _setupSiteEvents() {
    let prevPublicAnns = 0;

    // A new video annotation was created in the sitepage.
    this._siteRPC.on('createVideoAnnotation', (annot: AnnotationData) => {
      // If user is not logged in, we can't really create a meaningful highlight
      // or annotation. Instead, we need to open the sidebar, show an error,
      // and delete the (unsaved) annotation so it gets un-selected in the
      // target document
      if (!this._store.isLoggedIn()) {
        this._hostRPC.call('openSidebar');
        this._store.openSidebarPanel('loginPrompt');
        // TODO this._guestRPC.forEach(rpc => rpc.call('deleteAnnotation', annot.$tag));
        return;
      }
      // this._inFrame.add(annot.$tag);

      this._hostRPC.call('openSidebar');

      this._videoAnnotationsService.create(annot);
    });

    /**
     * Handle annotations or frames being added or removed in the store.
     */
    const onStoreVideoAnnotationsChanged = (
      annotations: Annotation[],
      frames: Frame[],
      prevAnnotations: Annotation[]
    ) => {
      let publicAnns = 0;
      const inSidebar = new Set<string>();
      const added = [] as Annotation[];

      // Determine which annotations have been added or deleted in the sidebar.
      annotations.forEach(annot => {
        if (isReply(annot)) {
          // The frame does not need to know about replies
          return;
        }

        if (isPublic(annot)) {
          ++publicAnns;
        }

        inSidebar.add(annot.$tag);
        added.push(annot);
      });
      const deleted = prevAnnotations.filter(
        annot => !inSidebar.has(annot.$tag)
      );

      // Send added annotations to matching frame.
      if (added.length > 0) {
        const addedByFrame = new Map<string | null, Annotation[]>();

        // List of annotations to immediately mark as anchored, as opposed to
        // waiting for the guest to report the status. This is used for
        // annotations associated with content that is different from what is
        // currently loaded in the guest frame (eg. different EPUB chapter).
        //
        // For these annotations, we optimistically assume they will anchor
        // when the appropriate content is loaded.
        const anchorImmediately = [];

        for (const annotation of added) {
          const frame = frameForAnnotation(frames, annotation);
          if (
            !frame ||
            (frame.segment &&
              !annotationMatchesSegment(annotation, frame.segment))
          ) {
            anchorImmediately.push(annotation.$tag);
            continue;
          }
          const anns = addedByFrame.get(frame.id) ?? [];
          anns.push(annotation);
          addedByFrame.set(frame.id, anns);
        }

        for (const [frameId, anns] of addedByFrame) {
          this._siteRPC.call('loadVideoAnnotations', anns.map(formatAnnot));
        }
      }

      // Remove deleted annotations from frames.
      deleted.forEach(annot => {
        // Delete from all frames. If a guest is not displaying a particular
        // annotation, it will just ignore the request.
        this._siteRPC.call('deleteVideoAnnotation', annot.$tag);
        this._inFrame.delete(annot.$tag);
      });

      // Update elements in host page which display annotation counts.
      if (frames.length > 0) {
        if (frames.every(frame => frame.isAnnotationFetchComplete)) {
          if (publicAnns === 0 || publicAnns !== prevPublicAnns) {
            this._siteRPC.call('publicVideoAnnotationCountChanged', publicAnns);
            prevPublicAnns = publicAnns;
          }
        }
      }
    };

    watch(
      this._store.subscribe,
      () => [this._store.allVideoAnnotations(), this._store.frames()] as const,
      ([annotations, frames], [prevAnnotations]) => {
      onStoreVideoAnnotationsChanged(annotations, frames, prevAnnotations)},
      shallowEqual
    );
  }

  /**
   * Set up synchronization of feature flags to host and guest frames.
   */
  private _setupFeatureFlagSync() {
    const getFlags = () => this._store.features();

    const sendFlags = (flags: Record<string, boolean>) => {
      this._hostRPC.call('featureFlagsUpdated', flags);
      for (const guest of this._guestRPC.values()) {
        guest.call('featureFlagsUpdated', flags);
      }
    };

    // Send current flags to host when it connects, and any already-connected
    // guests.
    sendFlags(getFlags());

    // Watch for future flag changes.
    watch(this._store.subscribe, getFlags, sendFlags);
  }

  private _setupToastMessengerEvents() {
    this._toastMessenger.on('toastMessageAdded', (message: ToastMessage) => {
      // Forward hidden messages to "host" when sidebar is collapsed, with the
      // intention that another container can be used to render those messages
      // there, ensuring screen readers announce them.
      if (!this._recordingService.getExtensionStatus().isSilentMode && 'show_flag' in message) {
        // to src/annotator/sidebar.tsx
        this.notifyHost('toastMessageAdded', message);
      }
    });
    this._toastMessenger.on('toastMessageDismissed', (messageId: string) => {
      this.notifyHost('toastMessageDismissed', messageId);
    });
  }

  private _setupStatusSync() {
    this._recordingService.on(
      'statusChanged', (
        status: {
        isSilentMode: boolean,
        showHighlights: boolean,
        recordingStatus: 'off' | 'ready' | 'on',
        recordingSessionId: string,
        recordingTaskName: string,
      }) => {
        if (status) {
          this.updateRecordingStatusView(status.recordingStatus);
          this._hostRPC.call('statusUpdated', status)
          this._messageChannel.port1.postMessage({
            source:"sidebar",
            recording: this._recordingService.getExtensionStatus(),
          })
        }
    })
  }

  /**
   * Connect to the host frame and guest frame(s) in the current browser tab.
   */
  async connect() {
    // Create channel for sidebar-host communication.
    const hostPort = await this._portFinder.discover('host');
    this._hostRPC.connect(hostPort, [JSON.stringify(this._recordingService.getExtensionStatus())]);

    // Listen for guests connecting to the sidebar.
    this._listeners.add(hostPort, 'message', event => {
      const { data, ports } = event;

      const message = data as Message | unknown;
      if (!isMessage(message)) {
        return;
      }

      if (
        isMessageEqual(message, {
          frame1: 'guest',
          frame2: 'sidebar',
          type: 'offer',
        })
      ) {
        this._connectGuest(ports[0], message.sourceId ?? null);
      }
      else if ( // KMASS Project
        isMessageEqual(message, {
          frame1: 'site',
          frame2: 'sidebar',
          type: 'offer',
        })
      ) {
        this._siteRPC.connect(ports[0]);
        // setTimeout(()=>{this._siteRPC.call('updateProfile'); console.log('sent update profile')}, 5000);
      }
    });
    this._window.parent.postMessage(
      {
        frame1: 'sidebar',
        frame2: 'extension',
        type: 'request',
      },
      '*',
      [this._messageChannel.port2]);
  }

  /**
   * Send an RPC message to the host frame.
   */
  notifyHost(method: SidebarToHostEvent, ...args: unknown[]) {
    this._hostRPC.call(method, ...args);
  }

  /**
   * Send an RPC message to the site.
   */
  notifySite(method: SidebarToSiteEvent, ...args: unknown[]) {
    this._siteRPC.call(method, ...args);
  }

  notification(data: {id:string, title: string, context: string}) {
    this._hostRPC.call('pullRecommendation', data);
  }

  /**
   * Mark annotation as hovered.
   *
   * This is used to indicate the highlights in the document that correspond
   * to a hovered annotation in the sidebar.
   *
   * This function only accepts a single annotation because the user can only
   * hover one annotation card in the sidebar at a time. Hover updates in the
   * other direction (guest to sidebar) support multiple annotations since a
   * user can hover multiple highlights in the document at once.
   */
  hoverAnnotation(ann: Annotation | null) {
    this._pendingHoverTag = null;

    const tags = ann ? [ann.$tag] : [];
    this._store.hoverAnnotations(tags);

    if (!ann) {
      this._guestRPC.forEach(rpc => rpc.call('hoverAnnotations', []));
      return;
    }

    // If annotation is not currently anchored in a guest, schedule hover for
    // when annotation is anchored. This can happen if an annotation is for a
    // different chapter of an EPUB than the currently loaded one. See notes in
    // `scrollToAnnotation`.
    const frame = frameForAnnotation(this._store.frames(), ann);
    if (
      !frame ||
      (frame.segment && !annotationMatchesSegment(ann, frame.segment))
    ) {
      this._pendingHoverTag = ann.$tag;
      return;
    }
    this._guestRPC.forEach(rpc => rpc.call('hoverAnnotations', tags));
  }

  /**
   * Scroll the frame to the highlight for an annotation.
   */
  scrollToAnnotation(ann: Annotation) {
    const frame = frameForAnnotation(this._store.frames(), ann);
    if (!frame) {
      return;
    }
    const guest = this._guestRPC.get(frame?.id);
    if (!guest) {
      return;
    }

    // If this annotation is for a different segment of a book than is loaded
    // in the guest, then ask the guest to navigate to the appropriate segment.
    //
    // In EPUBs, this will cause the guest to disconnect and a new guest will
    // connect when the new content has loaded. We will then need to wait for
    // the annotation to anchor in the new guest frame before we can actually
    // scroll to it.
    if (frame.segment && !annotationMatchesSegment(ann, frame.segment)) {
      // Schedule scroll once anchoring completes.
      this._pendingScrollToTag = ann.$tag;
      guest.call('navigateToSegment', formatAnnot(ann));
      return;
    }

    guest.call('scrollToAnnotation', ann.$tag);
  }

  // Only used to cleanup tests
  destroy() {
    this._portFinder.destroy();
    this._listeners.removeAll();
  }
}
