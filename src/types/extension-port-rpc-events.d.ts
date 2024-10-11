/**
 * This module defines the events that are sent between frames with different
 * roles in the client (extension, sidebar).
 */

/**
 * Events that the extension sends to the sidebar
 */
export type ExtensionToSidebarEvent =
  /**
   * The guest is asking the sidebar to create an annotation.
   */
  | 'traceData'

  /**
   * The guest is asking the sidebar to relay the message to the host to close the sidebar.
   */
  | 'cmdData'

  /**
   * Indicate in the sidebar which annotation cards correspond to hovered
   * highlights in the guest.
   */
  | 'hoverAnnotations'

  /**
   * The guest is asking the sidebar to relay the message to the host to open the sidebar.
   */
  | 'openSidebar'

  /** The guest is notifying the sidebar of the current document metadata and URIs. */
  | 'documentInfoChanged'

  /**
   * The guest is asking the sidebar to display some annotations.
   */
  | 'showAnnotations'

  /**
   * The guest informs the sidebar whether annotations were successfully anchored
   */
  | 'syncAnchoringStatus'

  /**
   * The guest is asking the sidebar to toggle some annotations.
   */
  | 'toggleAnnotationSelection';

/**
 * Events that the sidebar sends to the extension
 */
export type SidebarToExtensionEvent =
  /**
   * The sidebar informs the extension of recording status.
   */
  | 'recording';
