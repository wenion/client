import { useSidebarStore } from '../../sidebar/store';

export type Thread = {
  /**
   * Whether this thread should be visible when rendered. true when the thread's
   * annotation matches current annotation filters.
   */
  id: string;
  title: string;
  url: string | undefined;
  summary: string;
  highlights: string;
  deleted?: boolean | undefined;
  expired?: boolean | undefined;
  repository: string;
  query: string | null;

  visible: boolean;
  dataType: string;
  score: number;
  pageContent: string;
  isBookmark: boolean;
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

function getFirst100Words(str: string) {
  const words = str.split(' ');
  const first1000Words = words.slice(0, 100);
  return first1000Words.join(' ') + '...';
}

function getWrongResponse(status: string) {
  if (status === '200') {
    return false;
  }
  return true;
}

function processHighlight(context: string) {
  if (context && context.includes("\n")) {
    context = "* "+ context.replace(/\n/g, "\n* ");
  }
  return context;
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
            isBookmark: item.is_bookmark ? item.is_bookmark : false,
            pageContent: item.page_content,
            score: Number(item.metadata.score),
            query: query,

            title: item.metadata.title ? item.metadata.title : (item.metadata['video name'] ? item.metadata['video name'] : 'untitled'),
            url: item.metadata.url ? item.metadata.url : item.metadata['video url'],

            summary: item.metadata.summary ? item.metadata.summary : getFirst100Words(item.page_content),
            highlights: processHighlight(item.metadata.highlights),
            repository: item.metadata.repository ? item.metadata.repository : "",
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