import {
  CancelIcon,
  IconButton,
  Input,
  SearchIcon,
  useSyncedRef,
} from '@hypothesis/frontend-shared';
import { usePopoverShouldClose } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import type { RefObject, JSX } from 'preact';
import { useEffect, useCallback, useState, useRef } from 'preact/hooks';

import { useShortcut } from '../../../shared/shortcut';
import { useSidebarStore } from '../../store';
import SearchDropdownItem from './SearchDropdownItem';
import SearchDropdownKeyboardNavigation from './SearchDropdownKeyboardNavigation';


/**
 * Flag indicating whether the next click event on the menu's toggle button
 * should be ignored, because the action it would trigger has already been
 * triggered by a preceding "mousedown" event.
 */
let ignoreNextClick = false;

export type SearchFieldProps = {
  /** The current user-entered search query (null if not set yet) */
  query: string | null;

  /** A list of suggested search terms based on the current query */
  querySuggestions: {text: string}[];

  /** Called whenever the search query is updated (null means cleared) */
  onQueryType: (value: string) => void;

  onClearSearch: () => void;

  /**
   * Whether the menu is open when initially rendered. Ignored if `open` is
   * present.
   */
  defaultOpen?: boolean;

  /** Disable input editing or submitting the search field. */
  disabled?: boolean;

  /** Callback for when the current filter query changes */
  onSearch: (value: string) => void;

  /** Callback for when a key is pressed in the input itself */
  // onKeyDown?: JSX.KeyboardEventHandler<HTMLInputElement>;

  /** The input's ref object, in case it needs to be handled by consumers */
  // inputRef?: RefObject<HTMLInputElement | undefined>;
  inputRef: RefObject<HTMLInputElement>;

  /** Callback when the Menu is opened or closed. */
  onOpenChanged?: (open: boolean) => void;

  /**
   * Whether the Menu is currently open, when the Menu is being used as a
   * controlled component. In these cases, an `onOpenChanged` handler should
   * be provided to respond to the user opening or closing the menu.
   */
  open?: boolean;

  /** Classes to be added to the outermost element */
  classes?: string | string[];

  defaultPlaceholder?: string;
};

/**
 * An input field for entering a query that filters annotations (in the sidebar)
 * or searches annotations (in the stream/single annotation view).
 */
export default function SearchField({
  classes,
  defaultPlaceholder,
  defaultOpen = false,
  disabled = false,
  inputRef,
  open,
  onOpenChanged,
  onClearSearch,
  // onKeyDown,
  onSearch,
  query,
  querySuggestions,
  onQueryType,
}: SearchFieldProps) {
  const store = useSidebarStore();
  const isLoading = store.isLoading();
  const input = useSyncedRef(inputRef);

  const [pendingQuery, setPendingQuery] = useState(query);
  
  useEffect(() => {
    if (query && input.current) {
      input.current.value = query;
    }
  }, [query]); // run this only when `query` changes

  const noop = () => {};

  let [isOpen, setOpen]: [boolean, (open: boolean) => void] =
    useState(query ? defaultOpen : true);
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

    setOpen(!isOpen);
  };

  // As long as this input is mounted, pressing `/` should make it recover focus
  useShortcut('/', e => {
    if (document.activeElement !== input.current) {
      e.preventDefault();
      input.current?.focus();
    }
  });

  const closeMenu = useCallback(() => setOpen(false), [setOpen]);

  // Set up an effect which adds document-level event handlers when the menu
  // is open and removes them when the menu is closed or removed.
  //
  // These handlers close the menu when the user taps or clicks outside the
  // menu or presses Escape.
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Menu element should close via `closeMenu` whenever it's open and there
  // are user interactions outside of it (e.g. clicks) in the document
  usePopoverShouldClose(menuRef, () => setTimeout(() => {closeMenu();}), { enabled: isOpen });

  const stopPropagation = (e: Event) => e.stopPropagation();

  // It should also close if the user presses a key which activates menu items.
  const handleMenuKeyDown = (event: KeyboardEvent) => {
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      input.current!.focus();
      // The browser will not open the link if the link element is removed
      // from within the keypress event that triggers it. Add a little
      // delay to work around that.
      setTimeout(() => {
        closeMenu();
      });
    }
  };

  const onKeyDownInput = (event: KeyboardEvent) => {
    let handled = false;
    let focusedIndex = -1;
    switch (event.key) {
      case 'Enter':
        closeMenu();
        break;
      case 'ArrowUp':
        if (!isOpen) {
          setOpen(true);
          break;
        }
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
        if (!isOpen) {
          setOpen(true);
          break;
        }
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
      input.current!.value = menuItems[focusedIndex].key;
      setPendingQuery(menuItems[focusedIndex].key);
      event.stopPropagation();
      event.preventDefault();
      setOpen(true);
    }
  };

  const onSubmit = (e: Event) => {
    e.preventDefault();
    const text = input.current?.value
    if (text && text !== '') {
      onSearch(text);
    } else {
      onClearSearch();
    }
  };

  const onClear = () => {
    input.current!.value = '';
    setPendingQuery(null);
  };

  const onItemSelect = (element : HTMLElement, index : number) => {
    const text = menuItems[index].key;
    input.current!.value = text;
    // input.current!.focus();
    setPendingQuery(text);
  }

  const menuItems = querySuggestions.map((option, index) => (
    <SearchDropdownItem
      key={option.text}
      label={option.text}
      // onClick={() => onSuggestItemClick(option.text)}
      // isSelected={selectedIndex === index}
    />
  ));

  const onInput = async (event: Event) => {
    const text = (event.target as HTMLInputElement).value;
    setPendingQuery(text);
    onQueryType(text);
    setOpen(true);
  }

  return (
    <form
      name="searchForm"
      onSubmit={onSubmit}
      className={classnames('space-y-3', classes)}
    >
      <div className="flex">
        <div
          className="flex-1 relative"
          // ref={menuRef}
          // Don't close the menu if the mouse is released over one of the menu
          // elements outside the content area (eg. the arrow at the top of the
          // content).
          onClick={stopPropagation}
          // Don't close the menu if the user presses the mouse down on menu elements
          // except for the toggle button.
          onMouseDown={stopPropagation}
        >
          <Input
            aria-label="Query"
            aria-haspopup="true"
            autocapitalize="off"
            autocomplete="off"
            classes={classnames(
              'pr-8', // Add padding so input does not overlap search/clear buttons.
              'disabled:text-grey-6', // Dim text when input is disabled
              'text-base touch:text-touch-base', // Larger font on touch devices
            )}
            data-testid="search-input"
            dir="auto"
            name="q"
            placeholder={(isLoading && 'Loading…') || defaultPlaceholder}
            // disabled={disabled || isLoading}
            elementRef={input}
            onMouseDown={toggleMenu}
            onClick={toggleMenu}
            onInput={onInput}
            onKeyDown={onKeyDownInput}
          />
          {(
            <div
              className={classnames(
                'focus-visible-ring',
                // Position menu content near bottom of menu label/toggle control
                'absolute',// top-[calc(100%+5px)]
                'z-1',
                'bg-white text-md',
                'left-0',
                'right-0',
                {
                  'border shadow': pendingQuery && pendingQuery != '',
                }
                // contentClass
              )}
              data-testid="menu-content"
              role="menu"
              ref={menuRef}
              tabIndex={-1}
              // onClick={closeMenu}
              onKeyDown={handleMenuKeyDown}
            >
              {isOpen && (
                <SearchDropdownKeyboardNavigation
                  className={classnames('absolute w-full')}
                  inputRef={inputRef}
                  onItemSelect={onItemSelect}
                >
                  {menuItems}
                </SearchDropdownKeyboardNavigation>
              )}
            </div>
          )}
        </div>
        {pendingQuery && (
          <IconButton
            // classes="absolute right-0 text-[16px] top-[50%] translate-y-[-50%]"
            size="lg"
            icon={CancelIcon}
            data-testid="clear-button"
            title="Clear search"
            onClick={onClear}
            disabled={disabled}
          />
        )}
        <IconButton
          // Vertically center icon on left side of input. Increase the text
          // size to make the icon the same size as the top bar icons.
          // classes="absolute left-0 text-[16px] top-[50%] translate-y-[-50%]"
          icon={SearchIcon}
          size="lg"
          title="Search"
          type="submit"
          disabled={disabled}
        />
      </div>
    </form>
  );
}
