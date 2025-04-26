import { Card, CardContent, Dialog } from '@hypothesis/frontend-shared';
import { useMemo, useRef } from 'preact/hooks';

import { useSidebarStore } from '../../store';
import FilterControls from './FilterControls';
import SearchField from './SearchField';
import SortMenu from '../SortMenu';

export default function SearchBar() {
  const store = useSidebarStore();
  const filterQuery = store.filterQuery();
  const selectedTab = store.selectedTab();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasSelection = store.hasSelectedAnnotations();

  const clearSearch = () => {
    // store.closeSidebarPanel('searchAnnotations');
  };

  const defaultPlaceholder = useMemo(
    () => "Search " + selectedTab + "s…",
    [selectedTab]
  );

  return (
    <Dialog
      initialFocus={inputRef}
      restoreFocus
      classes="mb-4"
      variant="custom"
    >
      <Card>
        <CardContent>
          <div className="flex items-center">
            <SearchField
              inputRef={inputRef}
              classes="grow"
              defaultPlaceholder={defaultPlaceholder}
              // Disable the input when there is a selection, as the selection
              // replaces any other filters.
              disabled={hasSelection}
              query={filterQuery || null}
              onClearSearch={clearSearch}
              onSearch={store.setFilterQuery}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  clearSearch();
                }
              }}
            />
            <SortMenu />
          </div>
          <FilterControls />
        </CardContent>
      </Card>
    </Dialog>
  );
}
