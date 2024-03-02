import { render } from 'preact';

import type { Destroyable } from '../types/annotator';
import ImageViewerModal from './components/ImageViewerModal';
import type { EventBus } from './util/emitter';
import { createShadowRoot } from './util/shadow-root';

export class ImageViewer implements Destroyable {
  private _outerContainer: HTMLElement;
  private _shadowRoot: ShadowRoot;

  /**
   * @param eventBus - Enables communication between components sharing the
   *   same eventBus
   */
  constructor(
    element: HTMLElement,
    eventBus: EventBus,
  ) {
    /**
     * Un-styled shadow host for the notebook content.
     * This isolates the notebook from the page's styles.
     */
    this._outerContainer = document.createElement('hypothesis-image-viewer');
    element.appendChild(this._outerContainer);
    this._shadowRoot = createShadowRoot(this._outerContainer);

    render(
      <ImageViewerModal eventBus={eventBus}/>,
      this._shadowRoot,
    );
  }

  destroy() {
    render(null, this._shadowRoot);
    this._outerContainer.remove();
  }
}
