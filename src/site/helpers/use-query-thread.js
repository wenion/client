import { useMemo } from 'preact/hooks';

import { useSidebarStore } from '../../sidebar/store';

/** 
 * @typedef {import('../../types/api').QueryResult} QueryResult
 * @typedef {import('./build-thread').Thread} Thread
 */

/**
 * Default state for new threads
 */
const DEFAULT_THREAD_STATE = {
  collapsed: false,
  depth: 0,
  visible: true,
  replyCount: 0,
};

/**
 * Gather together state relevant to building a root thread of annotations and
 * replies and return an updated root thread when changes occur.
 *
 * @param {QueryResult[]} results
 */
function convertQueryResultToThread(results) {
  /** 
   * @type {Thread[]}
   */
  const threads = [];
  let index = 1;
  results.forEach(result => {
    threads.push({
      annotation: result,
      children: [],
      ...DEFAULT_THREAD_STATE,
      id: index.toString(),
    })
    index += 1;
  });
  return threads;
}

/**
 * Gather together state relevant to building a root thread of annotations and
 * replies and return an updated root thread when changes occur.
 *
 * @return {Thread}
 */
export function useQueryThread() {
  const store = useSidebarStore();
  const annotations = store.allAnnotations();
  const filterQuery = store.filterQuery();
  const route = store.route();
  const selectionState = store.selectionState();
  const filters = store.getFilterValues();
  const results = store.allResults();
  const query = store.queryingWord();

  const threadState = useMemo(() => {
    /** @type {Record<string,string>} */
    return {
      query,
      results,
      annotations,
      route,
      selection: { ...selectionState, filterQuery: filterQuery, filters },
    };
  }, [annotations, query, route, selectionState, filters]);

  return {
    children: convertQueryResultToThread(results),
    ...DEFAULT_THREAD_STATE,
    id: "root",
  };
}

export function useQueryWord() {
  const store = useSidebarStore();
  return store.queryingWord();
}
