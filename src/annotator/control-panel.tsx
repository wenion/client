import { render } from 'preact';
import classnames from 'classnames';
import debounce from 'lodash.debounce';

import { ListenerCollection } from '../shared/listener-collection';
import type { Destroyable } from '../types/annotator';
import ControlBar from './components/ControlBar';
import { createShadowRoot } from './util/shadow-root';


function toPx(pixels: number) {
  return pixels.toString() + 'px';
}

type Options = {
  /** Callback invoked when "Annotate" button is clicked */
  onToggleHide: (value: string) => void;
  /** Callback invoked when "Highlight" button is clicked */
  onHome: () => void;
};

/**
 * Container for the 'adder' toolbar which provides controls for the user to
 * annotate and highlight the selected text.
 *
 * The toolbar implementation is split between this class, which is
 * the container for the toolbar that positions it on the page and isolates
 * it from the page's styles using shadow DOM, and the `AdderToolbar` Preact
 * component which actually renders the toolbar.
 */
export class ControlPanel implements Destroyable {
  private _outerContainer: HTMLElement;
  private _shadowRoot: ShadowRoot;
  private _view: Window;
  private _isVisible: boolean;
  private _listeners: ListenerCollection;
  private _onToggleHide: (value: string) => void;
  private _onHome: () => void;

  private _dragState: {isDragging: boolean, offsetX: number, offsetY: number};
  // private _isDragging: boolean;

  /**
   * Create the toolbar's container and hide it.
   *
   * The adder is initially hidden.
   *
   * @param element - The DOM element into which the adder will be created
   * @param options - Options object specifying `onAnnotate` and `onHighlight`
   *        event handlers.
   */
  constructor(element: HTMLElement, options: Options) {
    this._outerContainer = document.createElement('hypothesis-control-panel');
    element.appendChild(this._outerContainer);
    this._shadowRoot = createShadowRoot(this._outerContainer);

    // Set initial style
    Object.assign(this._outerContainer.style, {
      // take position out of layout flow initially
      position: 'absolute',
      top: 0,
      left: 0,
    });

    this._view = element.ownerDocument.defaultView!;
    this._isVisible = false;
    this._dragState = {isDragging: false, offsetX: 0, offsetY: 0};

    this._onToggleHide = options.onToggleHide;
    this._onHome = options.onHome;

    this._listeners = new ListenerCollection();
    this._setupElementEvents(element);

    this._render();
  }

  _setupElementEvents(element: HTMLElement) {
    this._listeners.add(this._outerContainer, 'mousedown', (e) => {
      e.stopPropagation();
      this._dragState.isDragging = true;
      const firstChild = this._shadowRoot.firstChild as Element;
      const left = firstChild.getBoundingClientRect().left;
      const top = firstChild.getBoundingClientRect().top;

      this._dragState.offsetX = e.clientX - left;
      this._dragState.offsetY = e.clientY - top;
    });

    this._listeners.add(element, 'mousemove', (e)=> {
      e.stopPropagation();
      if (this._dragState.isDragging) {
        this._showAt(e.clientX, e.clientY, this._dragState.offsetX, this._dragState.offsetY);
      }
    });

    this._listeners.add(this._outerContainer, 'mouseup', (e) => {
      e.stopPropagation();
      this._dragState.isDragging = false;
    });

    const updatePosition = debounce(
      () => {
        const firstChild = this._shadowRoot.firstChild as Element;
        let left = firstChild.getBoundingClientRect().left;
        let top = firstChild.getBoundingClientRect().top;

        const right = firstChild.getBoundingClientRect().width + left;
        const bottom = firstChild.getBoundingClientRect().height + top;
        if (right > window.innerWidth)
          left = window.innerWidth - firstChild.getBoundingClientRect().width;
        if (bottom > window.innerHeight)
          top = window.innerHeight - firstChild.getBoundingClientRect().height;
        this._showAt(left, top, 0, 0);
      },
      10,
      { maxWait: 100 },
    );
    this._listeners.add(window, 'resize', updatePosition);
  }

  /** Hide the adder */
  // hide() {
  //   this._isVisible = false;
  //   this._render();
  //   // Reposition the outerContainer because it affects the responsiveness of host page
  //   // https://github.com/hypothesis/client/issues/3193
  //   Object.assign(this._outerContainer.style, {
  //     // top: 0,
  //     // left: 0,
  //     // background: "transparent",
  //     // color: "transparent",
  //     visibility: 'hidden',
  //   });
  // }

  destroy() {
    render(null, this._shadowRoot); // First, unload the Preact component
    this._outerContainer.remove();
  }

  /**
   * Display the adder in the best position in order to target the
   * selected text in `selectionRect`.
   *
   * @param selectionRect - The rect of text to target, in viewport coordinates.
   * @param isRTLselection - True if the selection was made right-to-left, such
   *        that the focus point is mostly likely at the top-left edge of
   *        `targetRect`.
   */
  show(left: number, top: number) {
    this._showAt(left, top, 0, 0);
    this._render();
  }

  _width(): number {
    const firstChild = this._shadowRoot.firstChild as Element;
    return firstChild.getBoundingClientRect().width;
  }

  _height(): number {
    const firstChild = this._shadowRoot.firstChild as Element;
    return firstChild.getBoundingClientRect().height;
  }

  /**
   * Show the adder at the given position and with the arrow pointing in
   * `arrowDirection`.
   *
   * @param left - Horizontal offset from left edge of viewport.
   * @param top - Vertical offset from top edge of viewport.
   */
  private _showAt(clientX: number, clientY: number, offsetX: number = 0, offsetY: number = 0) {
    // Translate the (left, top) viewport coordinates into positions relative to
    // the adder's nearest positioned ancestor (NPA).
    //
    // Typically, the adder is a child of the `<body>` and the NPA is the root
    // `<html>` element. However, page styling may make the `<body>` positioned.
    // See https://github.com/hypothesis/client/issues/487.
    let left = clientX - offsetX;
    let top = clientY - offsetY;

    if (left < 0) left = 0;
    if (left > window.innerWidth - this._width()) left = window.innerWidth - this._width();

    if (top < 0) top = 0;
    if (top > window.innerHeight - this._height()) top = window.innerHeight - this._height();

    Object.assign(this._outerContainer.style, {
      left: toPx(left),
      top: toPx(top),
    });
  }

  get visible() {
    return this._isVisible ? 'on' : 'off';
  }

  set visible(value: 'on' | 'off' | null) {
    this._isVisible = value === 'on'? true : false;
    this._render();
  }

  private _render() {
    render(
      <ControlBar
        isVisible={this._isVisible}
        onToggleHide={this._onToggleHide}
        onHome={this._onHome}
      />,
      this._shadowRoot,
    );
  }
}
