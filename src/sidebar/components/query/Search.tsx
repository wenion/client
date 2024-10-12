import { usePopoverShouldClose } from '@hypothesis/frontend-shared';
import { Button, SearchIcon } from '@hypothesis/frontend-shared';
import { MutableRef, useCallback, useEffect, useRef, useState } from 'preact/hooks';
import classnames from 'classnames';

import { withServices } from '../../service-context';
import type { QueryService } from '../../services/query';
import { useSidebarStore } from '../../store';
import SearchDropdownItem from './SearchDropdownItem';
import SearchDropdownKeyboardNavigation from './SearchDropdownKeyboardNavigation';

/**
 * Flag indicating whether the next click event on the menu's toggle button
 * should be ignored, because the action it would trigger has already been
 * triggered by a preceding "mousedown" event.
 */
let ignoreNextClick = false;

export type SearchProps = {
  /**
   * Whether the menu content is aligned with the left (default) or right edges
   * of the toggle element.
   */
  align?: 'left' | 'right';

  /**
   * Whether the menu elements should be positioned relative to the Menu
   * container. When `false`, the consumer is responsible for positioning.
   */
  containerPositioned?: boolean;

  /** Additional CSS classes to apply to the Menu */
  contentClass?: string;

  /**
   * Whether the menu is open when initially rendered. Ignored if `open` is
   * present.
   */
  defaultOpen?: boolean;

  inputRef: MutableRef<HTMLInputElement | null>;

  /** Callback when the Menu is opened or closed. */
  onOpenChanged?: (open: boolean) => void;

  /**
   * Whether the Menu is currently open, when the Menu is being used as a
   * controlled component. In these cases, an `onOpenChanged` handler should
   * be provided to respond to the user opening or closing the menu.
   */
  open?: boolean;

  onQuery: (event: Event) => void;
  queryService: QueryService;
}

const noop = () => {};

/**
 * A drop-down menu of sorting options for a collection of annotations.
 */
function Search({
  align = 'left',
  containerPositioned = true,
  contentClass,
  defaultOpen = false,
  inputRef,
  open,
  onOpenChanged,
  onQuery,
  queryService,
}: SearchProps) {
  const store = useSidebarStore();
  const suggestResults = store.getSuggestResults();

  let [isOpen, setOpen]: [boolean, (open: boolean) => void] =
    useState(defaultOpen);
  if (typeof open === 'boolean') {
    isOpen = open;
    setOpen = onOpenChanged || noop;
  }

  // Notify parent when menu is opened or closed.
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    if (typeof onOpenChanged === 'function' && wasOpen.current !== isOpen) {
      wasOpen.current = isOpen;
      onOpenChanged(isOpen);
    }
  }, [isOpen, onOpenChanged]);

  /**
   * Toggle menu when user presses toggle button. The menu is shown on mouse
   * press for a more responsive/native feel but also handles a click event for
   * activation via other input methods.
   */
  const toggleMenu = (event: Event) => {
    // If the menu was opened on press, don't close it again on the subsequent
    // mouse up ("click") event.
    if (event.type === 'mousedown') {
      ignoreNextClick = true;
    } else if (event.type === 'click' && ignoreNextClick) {
      // Ignore "click" event triggered from the mouse up action.
      ignoreNextClick = false;
      event.stopPropagation();
      event.preventDefault();
      return;
    }

    setOpen(true);
  };

  const closeMenu = useCallback(() => setOpen(false), [setOpen]);

  // Set up an effect which adds document-level event handlers when the menu
  // is open and removes them when the menu is closed or removed.
  //
  // These handlers close the menu when the user taps or clicks outside the
  // menu or presses Escape.
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Menu element should close via `closeMenu` whenever it's open and there
  // are user interactions outside of it (e.g. clicks) in the document
  usePopoverShouldClose(menuRef, closeMenu, { enabled: isOpen });

  const stopPropagation = (e: Event) => e.stopPropagation();

  // It should also close if the user presses a key which activates menu items.
  const handleMenuKeyDown = (event: KeyboardEvent) => {
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      // The browser will not open the link if the link element is removed
      // from within the keypress event that triggers it. Add a little
      // delay to work around that.
      setTimeout(() => {
        closeMenu();
      });
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent) => {
    let handled = false;
    let focusedIndex = -1;
    switch (event.key) {
      case 'Enter':
        closeMenu();
        break;
      case 'ArrowUp':
        // The focus won't work without delaying rendering.
        const lastItem = menuRef.current!.querySelector(
          '[role^="menuitem"]:last-of-type'
        ) as HTMLElement;
        if (lastItem) {
          lastItem.focus();
        }
        handled = true;
        focusedIndex = menuItems.length - 1;
        break;
      case 'ArrowDown':
        // The focus won't work without delaying rendering.
        const firstItem = menuRef.current!.querySelector(
          '[role^="menuitem"]'
        ) as HTMLElement;
        if (firstItem) {
          firstItem.focus();
        }
        handled = true;
        focusedIndex = 0;
        break;
    }

    if (handled) {
      inputRef.current!.value = menuItems[focusedIndex].key;
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const onSearchBarInput = (event: Event) => {
    const text = (event.target as HTMLInputElement).value;
    queryService.getSuggestion(text)
  }

  const onItemSelect = (element : HTMLElement, index : number) => {
    const el = inputRef.current!;
    el.value = element.innerHTML;
  }

  const onSuggestItemClick = (option: string) => {
    const el = inputRef.current!;
    el.value = option;
    el.focus();
  }

  const menuItems = suggestResults.map(option => (
    <SearchDropdownItem
      key={option.text}
      label={option.text}
      onClick={() => onSuggestItemClick(option.text)}
      // isSelected={sortOption === sortKey}
    />
  ));

  const containerStyle = {
    position: containerPositioned ? 'relative' : 'static',
  };

  return (
    <div
      // className={classnames(
      //   {
      //     'max-w-lg nav-bar__search': !isOpen,
      //     'w-[32rem]': isOpen,
      //   }
      // )}
      data-testid="menu-container"
      ref={menuRef}
      // Add inline styles for positioning
      style={containerStyle}
      // Don't close the menu if the mouse is released over one of the menu
      // elements outside the content area (eg. the arrow at the top of the
      // content).
      onClick={stopPropagation}
      // Don't close the menu if the user presses the mouse down on menu elements
      // except for the toggle button.
      onMouseDown={stopPropagation}
    >
      <div className="flex">
        <input
          className={classnames(
            'flex-1 border rounded p-2',
          )}
          aria-autocomplete="list"
          aria-label=""
          aria-haspopup="true"
          autocapitalize="off"
          autocomplete="off"
          type="text"
          ref={inputRef}
          name="q"
          placeholder="Search…"
          role="combobox"
          onMouseDown={toggleMenu}
          onClick={toggleMenu}
          onKeyDown={handleInputKeyDown}
          onInput={onSearchBarInput}
          />
        <Button
          classes={"search-bar__icon"}
          onClick={e => {onQuery(e); closeMenu()}}
        >
          <SearchIcon />
        </Button>
      </div>
      {isOpen && (
        <>
          <div
            className={classnames(
              'focus-visible-ring',
              // Position menu content near bottom of menu label/toggle control
              'absolute',// top-[calc(100%+5px)]
              'z-1 border shadow',
              'bg-white text-md',
              'left-0',
              'right-0',
              // {
              //   'left-0': align === 'left',
              //   'right-0': align === 'right',
              // },
              contentClass
            )}
            data-testid="menu-content"
            role="menu"
            tabIndex={-1}
            onClick={closeMenu}
            onKeyDown={handleMenuKeyDown}
          >
            <SearchDropdownKeyboardNavigation inputRef={inputRef} onItemSelect={onItemSelect}>
              {menuItems}
            </SearchDropdownKeyboardNavigation>
          </div>
        </>
      )}
    </div>
  );
}

export default withServices(Search, [
  'queryService',
]);
