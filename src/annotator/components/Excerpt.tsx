import { LinkButton } from '@hypothesis/frontend-shared';
import type { ThemeProperty } from '../../types/config';


// import type { JSX } from 'preact';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';

import type { ComponentChildren } from 'preact';
import type { ButtonProps } from '@hypothesis/frontend-shared/lib/components/input/Button';
import type {
  IconComponent,
  PresentationalProps,
} from '@hypothesis/frontend-shared/lib/types';
import classnames from 'classnames';
import type { JSX, RefObject } from 'preact';
import { ListenerCollection } from '../../shared/listener-collection';
import type { SidebarSettings } from '../../types/config';


const supportedThemeProperties: Record<ThemeProperty, string> = {
  accentColor: 'color',
  appBackgroundColor: 'backgroundColor',
  ctaBackgroundColor: 'backgroundColor',
  ctaTextColor: 'color',
  selectionFontFamily: 'fontFamily',
  annotationFontFamily: 'fontFamily',
};

/**
 * Subset of the config from the host page which includes theme configuration.
 */
export type Settings = {
  branding?: Record<ThemeProperty, string>;
};

/**
 * Return a React `style` object suitable for use as the value of the `style`
 * attr in a React element, with styling rules for the requested set of
 * `themeProperties`.
 *
 * `supportedThemeProperties` defines a whitelist of properties that may be
 * set by a partner's configuration for theme customization. For a given theme
 * property's styling to be present in the returned style object, all of the
 * following must be true:
 *
 * - The theme property is present in the `supportedThemeProperties` whitelist
 * - `settings.branding` (derived from client configuration) has an entry
 *    for this theme property
 *
 * See https://reactjs.org/docs/dom-elements.html#style
 *
 * @param themeProperties - Which of the supported theme properties should have
 *   applied rules in the `style` object
 * @return Object that can be passed as the `style` prop
 *
 * @example
 * let themeProperties = ['accentColor', 'ctaTextColor', 'foo'];
 * let settings = { branding: {
 *     accentColor: '#ffc',
 *     selectionFontFamily: 'Times New Roman'
 *   }
 * };
 * // Only two of the `themeProperties` are whitelisted and
 * // only one of those has a value in the `settings` object, so:
 * applyTheme(themeProperties, settings); // -> { color: '#ffc '}
 */
export function applyTheme(
  themeProperties: ThemeProperty[],
  settings: Settings,
): Record<string, string> {
  const style: Record<string, string> = {};
  if (!settings.branding) {
    return style;
  }
  const { branding } = settings;
  themeProperties.forEach(themeProp => {
    const propertyName = supportedThemeProperties[themeProp];
    const propertyValue = branding[themeProp];
    if (propertyName && propertyValue) {
      style[propertyName] = propertyValue;
    }
  });

  return style;
}


/**
 * Watch for changes in the size (`clientWidth` and `clientHeight`) of
 * an element.
 *
 * Returns a cleanup function which should be called to remove observers when
 * updates are no longer needed.
 *
 * @param element - HTML element to watch
 * @param onSizeChanged - Callback to invoke with the `clientWidth` and
 *   `clientHeight` of the element when a change in its size is detected.
 */
export function observeElementSize(
  element: Element,
  onSizeChanged: (width: number, height: number) => void,
): () => void {
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() =>
      onSizeChanged(element.clientWidth, element.clientHeight),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }
  const listeners = new ListenerCollection();

  // Fallback method which listens for the most common events that result in
  // element size changes:
  //
  // - Window size change
  // - Media loading and adjusting size to content
  // - DOM changes
  //
  // This is not comprehensive but it is simple to implement and good-enough for
  // our current use cases.

  let prevWidth = element.clientWidth;
  let prevHeight = element.clientHeight;

  const check = () => {
    if (
      prevWidth !== element.clientWidth ||
      prevHeight !== element.clientHeight
    ) {
      prevWidth = element.clientWidth;
      prevHeight = element.clientHeight;
      onSizeChanged(prevWidth, prevHeight);
    }
  };

  listeners.add(element, 'load', check);
  listeners.add(window, 'resize', check);
  const observer = new MutationObserver(check);
  observer.observe(element, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  return () => {
    listeners.removeAll();
    observer.disconnect();
  };
}


type InlineControlsProps = {
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  linkStyle: Record<string, string>;
};

/**
 * An optional toggle link at the bottom of an excerpt which controls whether
 * it is expanded or collapsed.
 */
function InlineControls({
  isCollapsed,
  setCollapsed,
  linkStyle,
}: InlineControlsProps) {
  return (
    <div
      className={classnames(
        // Position these controls at the bottom right of the excerpt
        'absolute block right-0 bottom-0',
        // Give extra width for larger tap target and gradient fade
        // Fade transparent-to-white left-to-right to make the toggle
        // control text (More/Less) more readable above other text.
        // This gradient is implemented to-left to take advantage of Tailwind's
        // automatic to-transparent calculation: this avoids Safari's problem
        // with transparents in gradients:
        // https://bugs.webkit.org/show_bug.cgi?id=150940
        // https://tailwindcss.com/docs/gradient-color-stops#fading-to-transparent
        'w-20 bg-gradient-to-l from-white',
      )}
    >
      <div className="flex justify-end">
        <LinkButton
          variant="text"
          onClick={() => setCollapsed(!isCollapsed)}
          expanded={!isCollapsed}
          title="Toggle visibility of full excerpt text"
          style={linkStyle}
          underline="always"
          inline
        >
          {isCollapsed ? 'More' : 'Less'}
        </LinkButton>
      </div>
    </div>
  );
}

const noop = () => {};

export type ExcerptProps = {
  children?: ComponentChildren;
  /**
   * If `true`, the excerpt provides internal controls to expand and collapse
   * the content. If `false`, the caller sets the collapsed state via the
   * `collapse` prop.  When using inline controls, the excerpt is initially
   * collapsed.
   */
  inlineControls?: boolean;
  /**
   * If the content should be truncated if its height exceeds
   * `collapsedHeight + overflowThreshold`. This prop is only used if
   * `inlineControls` is false.
   */
  collapse?: boolean;
  /**
   * Maximum height of the container, in pixels, when it is collapsed.
   */
  collapsedHeight: number;
  /**
   * An additional margin of pixels by which the content height can exceed
   * `collapsedHeight` before it becomes collapsible.
   */
  overflowThreshold?: number;
  /**
   * Called when the content height exceeds or falls below
   * `collapsedHeight + overflowThreshold`.
   */
  onCollapsibleChanged?: (isCollapsible: boolean) => void;
  /**
   * When `inlineControls` is `false`, this function is called when the user
   * requests to expand the content by clicking a zone at the bottom of the
   * container.
   */
  onToggleCollapsed?: (collapsed: boolean) => void;

  // Injected
  settings: object;
};

export function Excerpt({
  children,
  collapse = false,
  collapsedHeight,
  inlineControls = true,
  onCollapsibleChanged = noop,
  onToggleCollapsed = noop,
  overflowThreshold = 0,
  settings = {},
}: ExcerptProps) {
  const [collapsedByInlineControls, setCollapsedByInlineControls] =
    useState(true);

  const contentElement = useRef<HTMLDivElement | null>(null);

  // Measured height of `contentElement` in pixels
  const [contentHeight, setContentHeight] = useState(0);

  // Update the measured height of the content container after initial render,
  // and when the size of the content element changes.
  const updateContentHeight = useCallback(() => {
    const newContentHeight = contentElement.current!.clientHeight;
    setContentHeight(newContentHeight);

    // prettier-ignore
    const isCollapsible =
      newContentHeight > (collapsedHeight + overflowThreshold);
    onCollapsibleChanged(isCollapsible);
  }, [collapsedHeight, onCollapsibleChanged, overflowThreshold]);

  useLayoutEffect(() => {
    const cleanup = observeElementSize(
      contentElement.current!,
      updateContentHeight,
    );
    updateContentHeight();
    return cleanup;
  }, [updateContentHeight]);

  // Render the (possibly truncated) content and controls for
  // expanding/collapsing the content.
  // prettier-ignore
  const isOverflowing = contentHeight > (collapsedHeight + overflowThreshold);
  const isCollapsed = inlineControls ? collapsedByInlineControls : collapse;
  const isExpandable = isOverflowing && isCollapsed;

  const contentStyle: Record<string, number> = {};
  if (contentHeight !== 0) {
    contentStyle['max-height'] = isExpandable ? collapsedHeight : contentHeight;
  }

  const setCollapsed = (collapsed: boolean) =>
    inlineControls
      ? setCollapsedByInlineControls(collapsed)
      : onToggleCollapsed(collapsed);

  return (
    <div
      data-testid="excerpt-container"
      className={classnames(
        'relative overflow-hidden',
        'transition-[max-height] ease-in duration-150',
      )}
      style={contentStyle}
    >
      <div
        className={classnames(
          // Establish new block-formatting context to prevent margin-collapsing
          // in descendent elements from potentially "leaking out" and pushing
          // this element down from the top of the container.
          // See https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
          // See https://github.com/hypothesis/client/issues/1518
          'inline-block w-full',
        )}
        data-testid="excerpt-content"
        ref={contentElement}
      >
        {children}
      </div>
      <div
        data-testid="excerpt-expand"
        role="presentation"
        onClick={() => setCollapsed(false)}
        className={classnames(
          // This element provides a clickable area at the bottom of an
          // expandable excerpt to expand it.
          'transition-[opacity] duration-150 ease-linear',
          'absolute w-full bottom-0 h-touch-minimum',
          {
            // For expandable excerpts not using inlineControls, style this
            // element with a custom shadow-like gradient
            'bg-gradient-to-b from-excerpt-stop-1 via-excerpt-stop-2 to-excerpt-stop-3':
              !inlineControls && isExpandable,
            'bg-none': inlineControls,
            // Don't make this shadow visible OR clickable if there's nothing
            // to do here (the excerpt isn't expandable)
            'opacity-0 pointer-events-none': !isExpandable,
          },
        )}
        title="Show the full excerpt"
      />
      {isOverflowing && inlineControls && (
        <InlineControls
          isCollapsed={collapsedByInlineControls}
          setCollapsed={setCollapsed}
          linkStyle={applyTheme(['selectionFontFamily'], settings)}
          // linkStyle={applyTheme(['selectionFontFamily'])}
        />
      )}
    </div>
  );
}