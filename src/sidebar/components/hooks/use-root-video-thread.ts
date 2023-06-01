import { useMemo } from 'preact/hooks';

import type { Thread } from '../../helpers/build-thread';
import { threadAnnotations } from '../../helpers/thread-annotations';
import type { ThreadState } from '../../helpers/thread-annotations';
import { useSidebarStore } from '../../store';

export function useRootVideoThread(): Thread {
  const store = useSidebarStore();
  const annotations = store.allVideoAnnotations();
  const query = store.filterQuery();
  const route = store.route();
  const selectionState = store.selectionState();
  const filters = store.getFilterValues();

  const threadState = useMemo((): ThreadState => {
    return {
      annotations,
      route,
      selection: { ...selectionState, filterQuery: query, filters },
    };
  }, [annotations, query, route, selectionState, filters]);

  return threadAnnotations(threadState);
}