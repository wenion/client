import type { ComponentChildren, RefObject} from 'preact';
import { useEffect, useRef, MutableRef } from 'preact/hooks';

function isElementVisible(element: HTMLElement) {
  return element.offsetParent !== null;
}

export type SearchKeyboardNavigationProps = {
  className?: string;

  /** Callback invoked when the menu is closed via a keyboard command. */
  closeMenu?: (e: KeyboardEvent) => void;

  /** Content to display, which is typically a list of `<MenuItem>` elements. */
  children: ComponentChildren;

  inputRef: RefObject<HTMLInputElement>;

  onItemSelect?: (element : HTMLElement, index : number) => void;
};

/**
 * Helper component used by Menu and MenuItem to facilitate keyboard navigation of a
 * list of <MenuItem> components. This component should not be used directly.
 *
 * Note that `ArrowRight` shall be handled by the parent <MenuItem> directly and
 * all other focus() related navigation is handled here.
 */
export default function SearchKeyboardNavigation({
  className,
  closeMenu,
  children,
  inputRef,
  onItemSelect,
}: SearchKeyboardNavigationProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  const onKeyDown = (event: KeyboardEvent) => {
    const menuItems = Array.from(
      menuRef.current!.querySelectorAll(
        '[role^="menuitem"]'
      ) as NodeListOf<HTMLElement>
    ).filter(isElementVisible);

    let focusedIndex = menuItems.findIndex(el =>
      el.contains(document.activeElement)
    );

    let handled = false;

    switch (event.key) {
      case 'ArrowLeft':
      case 'Escape':
        if (closeMenu) {
          closeMenu(event);
          handled = true;
        }
        break;
      case 'ArrowUp':
        focusedIndex -= 1;
        if (focusedIndex < 0) {
          inputRef.current!.focus();
        }
        handled = true;
        break;
      case 'ArrowDown':
        focusedIndex += 1;
        if (focusedIndex === menuItems.length) {
          inputRef.current!.focus();
        }
        handled = true;
        break;
      case 'Home':
        focusedIndex = 0;
        handled = true;
        break;
      case 'End':
        focusedIndex = menuItems.length - 1;
        handled = true;
        break;
    }

    if (handled && focusedIndex >= 0 && focusedIndex < menuItems.length) {
      event.stopPropagation();
      event.preventDefault();
      menuItems[focusedIndex].focus();
      if (typeof onItemSelect === 'function')
        onItemSelect(menuItems[focusedIndex], focusedIndex);
    }
  };

  return (
    // This element needs to have role="menu" to facilitate readers
    // correctly enumerating discrete submenu items, but it also needs
    // to facilitate keydown events for navigation. Disable the linter
    // error so it can do both.
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div role="menu" className={className} ref={menuRef} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}
