import { useSidebarStore } from '../../sidebar/store';
import type { Metadata } from '../../types/api'

export type Thread = Metadata & {
  /**
   * Whether this thread should be visible when rendered. true when the thread's
   * annotation matches current annotation filters.
   */
  visible: boolean;
  dataType: string;
};

function getDataType(url: string | undefined, title: string) {
  if (!url || url === undefined)
    return ''
  if (url.endsWith('.mp4') || url.includes('youtube.com') || title.endsWith('.mp4')) {
    return 'video';
  }
  else if (url.endsWith('pdf')) {
    return 'pdf'
  }
  else {
    return ''
  }
}

function getWrongResponse(status: string) {
  if (status === '200') {
    return false;
  }
  return true;
}

/**
 * Transfer Response format to Thread format.
 */
export function convertResponseToThread() {
  const store = useSidebarStore();
  let isErrorOccurred = false;
  let status = '';
  let query = store.queryingWord();
  const response = store.getResponse();
  const children: Thread[] = [];

  if (response) {
    isErrorOccurred = getWrongResponse(response.status);
    status = response.status;
    query = response.query;

    if (!isErrorOccurred) {
      response.context.forEach((innerArray) => {
        innerArray.forEach((item) => {
          children.push({
            id: item.id,
            visible: true,
            dataType: getDataType(item.metadata.url, item.metadata.title),

            title: item.metadata.title ? item.metadata.title : (item.metadata['video name'] ? item.metadata['video name'] : 'untitled'),
            url: item.metadata.url ? item.metadata.url : item.metadata['video url'],

            summary: item.metadata.summary,
            highlights: item.metadata.highlights,
          })
        });
      });
    }
  }

  return {
    isErrorOccurred: isErrorOccurred,
    status: status,
    query: query,
    children: children,
  }
}