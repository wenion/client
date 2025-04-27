import { Card, CardContent, Dialog } from '@hypothesis/frontend-shared';
import { useEffect, useMemo, useRef } from 'preact/hooks';

import { withServices } from '../../service-context';
import type { QueryService } from '../../services/query';
import { useSidebarStore } from '../../store';
import SearchField from './SearchField';

export type SearchBarProps = {
  queryService: QueryService;
};

function SearchBar({
  queryService
}: SearchBarProps) {
  const store = useSidebarStore();
  const query = store.query();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const querySuggestions = store.querySuggestions();

  const onSearch = (value: string) => {
    queryService.queryActivity(value);
    store.setQuery(value);
  };

  const onClearSearch = () => {
    store.setQuery(null);
    store.clearQuerySuggestions();
  };

  const onQueryType = (text: string) => {
    queryService.getQuerySuggestions(text);
  }

  // const defaultPlaceholder = useMemo(
  //   () => "Search " + selectedTab + "s…",
  //   [selectedTab]
  // );

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
              // defaultPlaceholder={''}
              // Disable the input when there is a selection, as the selection
              // replaces any other filters.
              // disabled={hasSelection}
              query={query}
              onQueryType={onQueryType}
              querySuggestions={querySuggestions}
              onClearSearch={onClearSearch}
              onSearch={onSearch}
            />
          </div>
        </CardContent>
      </Card>
    </Dialog>
  );
}

export default withServices(SearchBar, [
  'queryService',
]);
