// Load polyfill for :focus-visible pseudo-class.
import 'focus-visible';
import { render } from 'preact';
// Enable debugging checks for Preact. Removed in prod builds by Rollup config.
import 'preact/debug';

import { parseJsonConfig } from './parse-json-config';
import { Injector } from '../shared/injector';
import type { ConfigFromSidebar } from '../types/config';
import type { SidebarSettings } from '../types/config';
import SiteApp from './components/SiteApp';
import LaunchErrorPanel from '../sidebar/components/LaunchErrorPanel';
import { buildSettings } from '../sidebar/config/build-settings';
import { checkEnvironment } from '../sidebar/config/check-env';
import {
  startServer as startRPCServer,
  preStartServer as preStartRPCServer,
} from '../sidebar/cross-origin-rpc';
import { ServiceContext } from '../sidebar/service-context';
import { AnnotationActivityService } from '../sidebar/services/annotation-activity';
import { AnnotationsService } from '../sidebar/services/annotations';
import { APIService } from '../sidebar/services/api';
import { APIRoutesService } from '../sidebar/services/api-routes';
import { AuthService } from '../sidebar/services/auth';
import { AutosaveService } from '../sidebar/services/autosave';
// import { FileTreeService } from '../sidebar/services/file-tree';
import { FrameSyncService } from '../sidebar/services/frame-sync';
import { GroupsService } from '../sidebar/services/groups';
import { LoadAnnotationsService } from '../sidebar/services/load-annotations';
import { LocalStorageService } from '../sidebar/services/local-storage';
import { PersistedDefaultsService } from '../sidebar/services/persisted-defaults';
// import { RouterService } from '../sidebar/services/router';
import { ServiceURLService } from '../sidebar/services/service-url';
import { SessionService } from '../sidebar/services/session';
import { StreamFilter } from '../sidebar/services/stream-filter';
import { StreamerService } from '../sidebar/services/streamer';
import { TagsService } from '../sidebar/services/tags';
import { ThreadsService } from '../sidebar/services/threads';
import { ToastMessengerService } from '../sidebar/services/toast-messenger';
import { QueryService } from '../sidebar/services/query';
import { VideoAnnotationsService } from '../sidebar/services/video-annotations';
import { createSidebarStore } from '../sidebar/store';
import type { SidebarStore } from '../sidebar/store';
import { disableOpenerForExternalLinks } from '../sidebar/util/disable-opener-for-external-links';
import * as sentry from '../sidebar/util/sentry';

// Read settings rendered into sidebar app HTML by service/extension.
const configFromSidebar = parseJsonConfig(document) as ConfigFromSidebar;

// Check for known issues which may prevent the client from working.
//
// If any checks fail we'll log warnings and disable error reporting, but try
// and continue anyway.
const envOk = checkEnvironment(window);

if (configFromSidebar.sentry && envOk) {
  // Initialize Sentry. This is required at the top of this file
  // so that it happens early in the app's startup flow
  sentry.init(configFromSidebar.sentry);
}

// Prevent tab-jacking.
disableOpenerForExternalLinks(document.body);

/**
 * @inject
 */
function setupApi(api: APIService, streamer: StreamerService) {
  api.setClientId(streamer.clientId);
}

/**
 * Perform the initial fetch of groups and user profile and then set the initial
 * route to match the current URL.
 *
 * @inject
 */
function setupRoute(
  groups: GroupsService,
  session: SessionService,
  // router: RouterService
) {
  groups.load();
  session.load();
  // router.sync();
}

/**
 * Initialize background processes provided by various services.
 *
 * These processes include persisting or synchronizing data from one place
 * to another.
 *
 * @inject
 */
function initServices(
  autosaveService: AutosaveService,
  persistedDefaults: PersistedDefaultsService,
  serviceURL: ServiceURLService
) {
  autosaveService.init();
  persistedDefaults.init();
  serviceURL.init();
}

/**
 * @inject
 */
function setupFrameSync(frameSync: FrameSyncService, store: SidebarStore) {
  if (store.route() === 'sidebar') {
    frameSync.connect();
  }
}

/**
 * Launch the client application corresponding to the current URL.
 *
 * @param appEl - Root HTML container for the app
 */
function startApp(settings: SidebarSettings, appEl: HTMLElement) {
  const container = new Injector();

  // Register services.
  container
    .register('annotationsService', AnnotationsService)
    .register('videoAnnotationsService', VideoAnnotationsService)
    .register('annotationActivity', AnnotationActivityService)
    .register('api', APIService)
    .register('apiRoutes', APIRoutesService)
    .register('auth', AuthService)
    .register('autosaveService', AutosaveService)
    // .register('fileTreeService', FileTreeService)
    .register('frameSync', FrameSyncService)
    .register('groups', GroupsService)
    .register('loadAnnotationsService', LoadAnnotationsService)
    .register('localStorage', LocalStorageService)
    .register('persistedDefaults', PersistedDefaultsService)
    // .register('router', RouterService)
    .register('serviceURL', ServiceURLService)
    .register('session', SessionService)
    .register('streamer', StreamerService)
    .register('streamFilter', StreamFilter)
    .register('tags', TagsService)
    .register('threadsService', ThreadsService)
    .register('toastMessenger', ToastMessengerService)
    // .register('videoAnnotationsService', VideoAnnotationsService)
    .register('queryService', QueryService)
    .register('store', { factory: createSidebarStore });

  // Register utility values/classes.
  //
  // nb. In many cases these can be replaced by direct imports in the services
  // that use them, since they don't depend on instances of other services.
  container
    .register('$window', { value: window })
    .register('settings', { value: settings });

  // Initialize services.
  container.run(initServices);
  container.run(setupApi);
  container.run(setupRoute);
  container.run(startRPCServer);
  container.run(setupFrameSync);

  // Render the UI.
  render(
    <ServiceContext.Provider value={container}>
      <SiteApp />
    </ServiceContext.Provider>,
    appEl
  );
}

function reportLaunchError(error: Error, appEl: HTMLElement) {
  // Report error. In the sidebar the console log is the only notice the user
  // gets because the sidebar does not appear at all if the app fails to start.
  console.error('Failed to start Hypothesis client: ', error);

  // For apps where the UI is visible (eg. notebook, single-annotation view),
  // show an error notice.
  render(<LaunchErrorPanel error={error} />, appEl);
}

const appEl = document.querySelector('main') as HTMLElement;

// Start capturing RPC requests before we start the RPC server (startRPCServer)
preStartRPCServer();

buildSettings(configFromSidebar)
  .then(settings => {
    startApp(settings, appEl);
  })
  .catch(err => reportLaunchError(err, appEl));
