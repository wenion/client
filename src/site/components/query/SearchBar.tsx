import { useEffect, useRef } from 'preact/hooks';

import { withServices } from '../../../sidebar/service-context';
import type { QueryService } from '../../../sidebar/services/query';
import { useSidebarStore } from '../../../sidebar/store';
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

  useEffect(() => {
    const param = window.location.search.match(/[\?&]q=([^&]+)/);
    if (param) {
      console.log("inside", param)
      if (param && param[1]) {
        const queryWord = param[1]!.replace(/\+/g, ' ')
        const text = decodeURIComponent(queryWord);
        store.setQuery(text);
        queryService.query(text);
      };
    }
  }, []);

  const onSearch = (value: string) => {
    queryService.query(value);
    store.setQuery(value);
  };

  const onClearSearch = () => {
    queryService.clearQuery();
  };

  const onQueryType = (text: string) => {
    queryService.getQuerySuggestions(text);
  }

  // const defaultPlaceholder = useMemo(
  //   () => "Search " + selectedTab + "s…",
  //   [selectedTab]
  // );

  return (
    <div className="flex grow items-center">
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
  );
}

export default withServices(SearchBar, [
  'queryService',
]);
