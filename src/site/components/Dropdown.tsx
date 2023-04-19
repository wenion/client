import {
  LinkBase,
  EmailIcon,
  SocialFacebookIcon,
  SocialTwitterIcon,
} from '@hypothesis/frontend-shared/lib/next';
import { useLayoutEffect, useState } from 'preact/hooks';
import { withServices } from '../../sidebar/service-context';
import classnames from 'classnames';
import type { SessionService } from '../../sidebar/services/session';

type AutoSuggestProps={
  item: string;
}

export type AutoSuggestListProps = {
  session: SessionService;
  isFocus: boolean;
  onSelectSuggestItem: (suggest: string | null) => void;
  // threads: AutoSuggestProps[];
};

/**
 * A list of share links to social-media platforms.
 */
function Dropdown({ session, isFocus, onSelectSuggestItem }: AutoSuggestListProps) {
  const [autoSuggestList, setAutoSuggestList] = useState([
    {id: '1', text: 'username 1'},
    {id: '2', text: 'username 2'},
    {id: '3', text: 'username 3'},
    {id: '4', text: 'username 4'},
    {id: '5', text: 'username 5'},
  ]);

  const [selectItem, setSelectItem] = useState('0');

  const toggleItemHover = (target: HTMLInputElement, event: boolean) => {
    if (event) {
      setSelectItem(target.getAttribute('data-suggestion-id')|| '0');
    }
    else {
      setSelectItem('0');
    }
  }

  const selectCurrentItem = (target: HTMLInputElement) => {
    onSelectSuggestItem(target.textContent);
  }

  return (
    <div className={classnames(
      'search-bar__dropdown-menu-container',
      {
        'is-open': isFocus
      }
    )}>
      <ul role="listbox"
          className="search-bar__dropdown-menu">
        {
          autoSuggestList.map(child =>(
            <li role="option"
                className={classnames(
                  'search-bar__dropdown-menu-item',
                  {
                    "js-search-bar-dropdown-menu-item--active": selectItem == child.id,
                  }
                )}
                data-suggestion-id = {child.id}
                onMouseEnter={e => toggleItemHover((e.target as HTMLInputElement), true)}
                onMouseLeave={e => toggleItemHover((e.target as HTMLInputElement), false)}
                onClick={e => selectCurrentItem(e.target as HTMLInputElement)}
            >
              {/* <span class="search-bar__dropdown-menu-explanation"> */}
                {child.text}
              {/* </span> */}
            </li>
        ))}
      </ul>
    </div>
  );
}

export default withServices(Dropdown, ['session']);
