/**
 * This module defines the events that are sent between frames with different
 * roles in the client (guest, host, sidebar).
 */

/**
 * Events that the guest sends to the sidebar
 */
export type SiteToSidebarEvent =
  /**
   * The sidebar is asking the guest(s) to delete an annotation.
   */
  | 'test'
  | 'createVideoAnnotation';

/**
 * Events that the sidebar sends to the guest(s)
 */
export type SidebarToSiteEvent =
  /**
   * Show a banner with information about the current content.
   */
  | 'deleteVideoAnnotation'
  | 'loadVideoAnnotations'
  | 'mouseEnterVideoAnnotation'
  | 'mouseLeaveVideoAnnotation'
  | 'doubleClickVideoAnnotation'
  | 'publicVideoAnnotationCountChanged'
  | 'scrollToVideoAnnotation';
