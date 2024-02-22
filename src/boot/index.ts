// This is the main entry point for the Hypothesis client in the host page
// and the sidebar application.
//
// The same boot script is used for both entry points so that the browser
// already has it cached when it encounters the reference in the sidebar
// application.
//
// @ts-ignore - This file is generated before the boot bundle is built.
import manifest from '../../build/manifest.json';
import { bootHypothesisClient, bootSidebarApp } from './boot';
import type { AnnotatorConfig, SidebarAppConfig } from './boot';
import { isBrowserSupported } from './browser-check';
import { getExtensionId, hasExtensionConfig } from './browser-extension-utils';
import { parseJsonConfig } from './parse-json-config';
import { processUrlTemplate } from './url-template';

if (isBrowserSupported()) {
  const config = parseJsonConfig(document) as
    | AnnotatorConfig
    | SidebarAppConfig;
  const assetRoot = processUrlTemplate(config.assetRoot || '__ASSET_ROOT__');

  // Check whether this is a mini-app (indicated by the presence of a
  // `<hypothesis-app>` element) and load the appropriate part of the client.
  if (document.querySelector('hypothesis-app')) {
    const sidebarConfig = config as SidebarAppConfig;
    bootSidebarApp(document, {
      assetRoot,
      manifest,
      apiUrl: sidebarConfig.apiUrl,
    });
  } else {
    // When the boot script is executed from the browser extension on a host
    // frame, a config generated by that specific extension is required
    const extensionId = getExtensionId();
    if (extensionId && !hasExtensionConfig(extensionId)) {
      throw new Error(
        'Could not start Hypothesis extension as configuration is missing',
      );
    }

    // nb. If new asset URLs are added here, the browser extension and
    // `hypothesis-injector.ts` need to be updated.
    const annotatorConfig = config as AnnotatorConfig;
    const notebookAppUrl = processUrlTemplate(
      annotatorConfig.notebookAppUrl || '__NOTEBOOK_APP_URL__',
    );
    const profileAppUrl = processUrlTemplate(
      annotatorConfig.profileAppUrl || '__PROFILE_APP_URL__',
    );
    const sidebarAppUrl = processUrlTemplate(
      annotatorConfig.sidebarAppUrl || '__SIDEBAR_APP_URL__',
    );
    bootHypothesisClient(document, {
      assetRoot,
      manifest,
      notebookAppUrl,
      profileAppUrl,
      sidebarAppUrl,
    });
  }
} else {
  // Show a "quiet" warning to avoid being disruptive on non-Hypothesis sites
  // that embed the client.
  //
  // In Via or when using the bookmarklet we could show something louder.
  console.warn(
    'The GoldMind annotation tool is not supported in this browser. See https://colam.kmass.cloud.edu.au/help/which-browsers-are-supported-by-hypothesis/.',
  );
}
