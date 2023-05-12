import { useSidebarStore } from '../../sidebar/store';

export type Thread = {
  /**
   * The thread's id, which equivalent to the id of its annotation. For unsaved
   * annotations, the id is derived from the annotation's local `$tag` property.
   */
  id?: string;

  /**
   * Whether this thread should be visible when rendered. true when the thread's
   * annotation matches current annotation filters.
   */
  visible: boolean;
  data_type: string;
  title: string;
  context: string;
  author?: string;
  url: string;
};

function getDataType(url: string) {
  if (url.endsWith('.mp4')) {
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
        innerArray.forEach((record) => {
          children.push({
            id: record.id,
            visible: true,
            data_type: getDataType(record.metadata!.url),
            title: record.metadata.heading,
            context: record.page_content,
            url: record.metadata!.url,
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