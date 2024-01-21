import { render } from 'preact';

import { isTouchDevice } from '../shared/user-agent';
import type { Destroyable } from '../types/annotator';
import { createShadowRoot } from './util/shadow-root';
import classnames from 'classnames';

export enum ArrowDirection {
  DOWN = 1,
  UP = 2,
}

type Target = {
  /** Offset from left edge of viewport */
  left: number;
  /** Offset from top edge of viewport */
  top: number;
  /** Direction of the adder's arrow */
  arrowDirection: ArrowDirection;
};

function toPx(pixels: number) {
  return pixels.toString() + 'px';
}

const ARROW_HEIGHT = 35;

// The preferred gap between the end of the text selection and the adder's
// arrow position.
const ARROW_H_MARGIN = -10;

/**
 * Return the closest ancestor of `el` which has been positioned.
 * If no ancestor has been positioned, returns the root element.
 */
function nearestPositionedAncestor(el: Element): Element {
  let parentEl = el.parentElement!;
  while (parentEl.parentElement) {
    if (getComputedStyle(parentEl).position !== 'static') {
      break;
    }
    parentEl = parentEl.parentElement;
  }
  return parentEl;
}

/**
 * Container for the 'adder' toolbar which provides controls for the user to
 * annotate and highlight the selected text.
 *
 * The toolbar implementation is split between this class, which is
 * the container for the toolbar that positions it on the page and isolates
 * it from the page's styles using shadow DOM, and the `AdderToolbar` Preact
 * component which actually renders the toolbar.
 */
export class Tag implements Destroyable {
  private _outerContainer: HTMLElement;
  private _shadowRoot: ShadowRoot;
  private _view: Window;
  private _isVisible: boolean;
  private _arrowDirection: 'up' | 'down';
  /** Annotation tags associated with the current selection. */
  // private _annotationsForSelection: string[];

  /**
   * Create the toolbar's container and hide it.
   *
   * The adder is initially hidden.
   *
   * @param element - The DOM element into which the adder will be created
   * @param text - Options object specifying `onAnnotate` and `onHighlight`
   *        event handlers.
   */
  constructor(element: HTMLElement) {
    this._outerContainer = document.createElement('hypothesis-tooltip');
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
    this._arrowDirection = 'up';

    this._render([]);
  }

  /** Hide the adder */
  hide() {
    this._isVisible = false;
    this._render([]);
    // Reposition the outerContainer because it affects the responsiveness of host page
    // https://github.com/hypothesis/client/issues/3193
    Object.assign(this._outerContainer.style, {
      top: 0,
      left: 0,
    });
  }

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
  show(selectionRect: DOMRect, isRTLselection: boolean, tags: string[]) {
    const { left, top, arrowDirection } = this._calculateTarget(
      selectionRect,
      isRTLselection,
    );
    if (this._isVisible) {
      return;
    }
    this._showAt(left, top);

    this._isVisible = true;
    this._arrowDirection = arrowDirection === ArrowDirection.UP ? 'up' : 'down';

    this._render(tags);
  }

  private _width(): number {
    const firstChild = this._shadowRoot.firstChild as Element;
    return firstChild.getBoundingClientRect().width;
  }

  private _height(): number {
    const firstChild = this._shadowRoot.firstChild as Element;
    return firstChild.getBoundingClientRect().height;
  }

  /**
   *  Determine the best position for the Tag and its pointer-arrow.
   * - Position the pointer-arrow near the end of the selection (where the user's
   *   cursor/input is most likely to be)
   * - Position the Tag to center horizontally on the pointer-arrow
   * - Position the Tag below the selection (arrow pointing up) for LTR selections
   *   and above (arrow down) for RTL selections
   *
   * @param selectionRect - The rect of text to target, in viewport coordinates.
   * @param isRTLselection - True if the selection was made right-to-left, such
   *        that the focus point is mostly likely at the top-left edge of
   *        `targetRect`.
   */
  private _calculateTarget(
    selectionRect: DOMRect,
    isRTLselection: boolean,
  ): Target {
    // Set the initial arrow direction based on whether the selection was made
    // forwards/upwards or downwards/backwards.
    let arrowDirection: ArrowDirection;
    if (isRTLselection && !isTouchDevice()) {
      arrowDirection = ArrowDirection.DOWN;
    } else {
      // Render the adder below the selection for touch devices due to competing
      // space with the native copy/paste bar that typical (not always) renders above
      // the selection.
      arrowDirection = ArrowDirection.UP;
    }
    let top;
    let left;

    // Position the adder such that the arrow it is above or below the selection
    // and close to the end.
    const hMargin = Math.min(ARROW_H_MARGIN, selectionRect.width);
    const adderWidth = this._width();
    // Render the adder a little lower on touch devices to provide room for the native
    // selection handles so that the interactions with selection don't compete with the adder.
    const touchScreenOffset = isTouchDevice() ? 10 : 0;
    const adderHeight = this._height();
    if (isRTLselection) {
      left = selectionRect.left - adderWidth / 2 + hMargin;
    } else {
      left =
        selectionRect.left + selectionRect.width - adderWidth / 2 - hMargin;
    }

    // Flip arrow direction if adder would appear above the top or below the
    // bottom of the viewport.
    if (
      selectionRect.top - adderHeight < 0 &&
      arrowDirection === ArrowDirection.DOWN
    ) {
      arrowDirection = ArrowDirection.UP;
    } else if (selectionRect.top + adderHeight > this._view.innerHeight) {
      arrowDirection = ArrowDirection.DOWN;
    }

    if (arrowDirection === ArrowDirection.UP) {
      top =
        selectionRect.top +
        selectionRect.height +
        ARROW_HEIGHT +
        touchScreenOffset;
    } else {
      top = selectionRect.top - adderHeight - ARROW_HEIGHT;
    }

    // Constrain the adder to the viewport.
    left = Math.max(left, 0);
    left = Math.min(left, this._view.innerWidth - adderWidth);

    top = Math.max(top, 0);
    top = Math.min(top, this._view.innerHeight - adderHeight);

    return { top, left, arrowDirection };
  }

  /**
   * Find a Z index value that will cause the adder to appear on top of any
   * content in the document when the adder is shown at (left, top).
   *
   * @param left - Horizontal offset from left edge of viewport.
   * @param top - Vertical offset from top edge of viewport.
   * @return greatest zIndex (default value of 1)
   */
  private _findZindex(left: number, top: number): number {
    if (document.elementsFromPoint === undefined) {
      // In case of not being able to use `document.elementsFromPoint`,
      // default to the large arbitrary number (2^15)
      return 32768;
    }

    const adderWidth = this._width();
    const adderHeight = this._height();

    // Find the Z index of all the elements in the screen for five positions
    // around the adder (left-top, left-bottom, middle-center, right-top,
    // right-bottom) and use the greatest.

    // Unique elements so `getComputedStyle` is called the minimum amount of times.
    const elements = new Set([
      ...document.elementsFromPoint(left, top),
      ...document.elementsFromPoint(left, top + adderHeight),
      ...document.elementsFromPoint(
        left + adderWidth / 2,
        top + adderHeight / 2,
      ),
      ...document.elementsFromPoint(left + adderWidth, top),
      ...document.elementsFromPoint(left + adderWidth, top + adderHeight),
    ]);

    const zIndexes = [...elements]
      .map(element => +getComputedStyle(element).zIndex)
      .filter(Number.isInteger);

    // Make sure the array contains at least one element,
    // otherwise `Math.max(...[])` results in +Infinity
    zIndexes.push(0);

    return Math.max(...zIndexes) + 1;
  }

  /**
   * Show the adder at the given position and with the arrow pointing in
   * `arrowDirection`.
   *
   * @param left - Horizontal offset from left edge of viewport.
   * @param top - Vertical offset from top edge of viewport.
   */
  private _showAt(left: number, top: number) {
    // Translate the (left, top) viewport coordinates into positions relative to
    // the adder's nearest positioned ancestor (NPA).
    //
    // Typically, the adder is a child of the `<body>` and the NPA is the root
    // `<html>` element. However, page styling may make the `<body>` positioned.
    // See https://github.com/hypothesis/client/issues/487.
    const positionedAncestor = nearestPositionedAncestor(this._outerContainer);
    const parentRect = positionedAncestor.getBoundingClientRect();

    const zIndex = this._findZindex(left, top);

    Object.assign(this._outerContainer.style, {
      left: toPx(left - parentRect.left),
      top: toPx(top - parentRect.top),
      zIndex,
    });
  }

  private _render(tags: string[]) {
    const arrowDirection = this._arrowDirection;
    const isVisible = this._isVisible;

    render(
      <div
        className={classnames(
          // Reset all inherited properties to their initial values. This prevents
          // CSS property values from the host page being inherited by elements of
          // the Adder, even when using Shadow DOM.
          'all-initial',
          // As we've reset all properties to initial values, we cannot rely on
          // default border values from Tailwind and have to be explicit about all
          // border attributes.
          'absolute select-none bg-white rounded shadow-intense',
          // Start at a very low opacity as we're going to fade-in in the animation
          'opacity-5',
          {
            'animate-adder-pop-up': arrowDirection === 'up' && isVisible,
            'animate-adder-pop-down': arrowDirection === 'down' && isVisible,
          },
        )}
        data-component="Tag"
        dir="ltr"
        style={{
          visibility: isVisible ? 'visible' : 'hidden',
        }}
      >
        {tags.map(tag => (
          <div
            className={classnames(
              'p-1',
              'whitespace-nowrap',
            )}
          >
            {tag}
          </div>
        ))}
      </div>,
      this._shadowRoot,
    );
  }
}
