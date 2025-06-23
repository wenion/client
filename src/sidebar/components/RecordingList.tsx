import {
  Button,
  Card,
  CardContent,
  EllipsisIcon,
  FileGenericIcon,
  PreviewIcon,
  RadioCheckedIcon,
} from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import debounce from 'lodash.debounce';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';

import { ListenerCollection } from '../../shared/listener-collection';
import { useSidebarStore } from '../store';
import type { Group, RecordItem } from '../../types/api';
import { getElementHeightWithMargins } from '../util/dom';
import { formatRelativeDate } from '../util/time';
import Slider from './Slider'
import RecordingMenu from './RecordingMenu';

const capitalize = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

const getUserName = (userid: string) => {
  const pattern = /acct:(.*?)@/;
  const match = userid.match(pattern);
  return match? capitalize(match[1]): userid;
}

type TagProps = {
  sharedby: boolean;
  tag: string;
  classes?: string,
};

function Tag({
  sharedby,
  tag,
  classes,
}: TagProps) {
  return (
    <>
      {sharedby && (
        <em>shared by</em>
      )}
      <div
        className={classnames(
          "text-blue-700 bg-blue-50 border-blue-200",
          "border rounded px-1 ml-1",
          classes
        )}
      >
        <span>{tag}</span>
      </div>
    </>
  )
}

type FilterToggleProps = {
  /** A short description of what the filter matches (eg. "Pages 10-20") */
  label: string;

  /**
   * A longer description of what the filter matches (eg. "Show annotations
   * on pages 10-20").
   */
  description: string;

  url?: string;

  /** Is the filter currently active? */
  active: boolean;

  testId?: string;
  classes?: string;

  // disabled?: boolean;
};

function FilterToggle({
  label,
  description,
  url,
  active = true,
  testId,
  classes,
}: FilterToggleProps) {
  return (
    <Button
      data-testid={testId}
      classes={classnames({
        // Compared to our regular buttons, these have less vertical padding,
        // stronger rounding and slightly thinner text.
        'font-medium rounded-lg py-1': true,
        'text-grey-1 bg-grey-5': active,
        // 'text-grey-1 bg-grey-7': active,
        // 'opacity-50': disabled,
      },
        classes,)}
      variant="custom"
      title={description}
      onClick={() => window.open(url, "_blank")}
    >
      <span className="max-w-36 truncate">{label}</span>
    </Button>
  );
}

export type RecordingSliderProps = {
  recordItem: RecordItem;
  isSubmenuVisible?: boolean;
  onToggleSubmenu?: (e: Event) => void;
};

function RecordingSlider({
  recordItem,
  isSubmenuVisible,
}: RecordingSliderProps) {
  const store = useSidebarStore();
  const allGroups = store.allGroups();
  const userid = store.profile().userid;

  const now = new Date();
  const createdDate = new Date(recordItem.timestamp);

  const [shareWithGroups, setShareWithGroups] = useState<(Group | string)[]>([]);

  useEffect(()=>{
    if (recordItem && recordItem.groups) {
      const groups = recordItem.groups.map(groupId => {
        const found = allGroups.find(g => g.id === groupId);
        if (found) {
          return found;
        }
        else if (recordItem.userid === userid){
          return groupId;
        }
        else {
          return undefined; // skip this entry
        }
      }).filter((g): g is Group | string => g !== undefined);

      setShareWithGroups(groups);
    }
  }, [recordItem, allGroups])

  return (
    <Slider direction={isSubmenuVisible ? 'in' : 'out'}>
      <Card>
        <CardContent>
          <div>
            <b>Description:</b>
            <div title={recordItem.description}>
              <p className="word-break-word hyphens-auto indent-2">{recordItem.description}</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              Created by:&nbsp;
              <div class="text-blue-700">{getUserName(recordItem.userid!)}</div>
            </div>
            <div>
              Teaching Role:&nbsp;
              <div class="text-blue-700">{recordItem.role}</div>
            </div>
            <div>
              Date Created:&nbsp;
              <div class="text-blue-700">{formatRelativeDate(createdDate, now)}</div>
            </div>
          </div>
          {shareWithGroups.length > 0 && (
            <div
              className="flex flex-row flex-wrap gap-2 items-center"
              data-testid="filter-controls"
            >
              <b>Currently shared with:</b>
              {shareWithGroups.map(groupInfo => {
                if (typeof groupInfo === 'object') {
                  return (
                    <FilterToggle
                      label={groupInfo.name}
                      description={`Share with ${groupInfo.name}`}
                      url={groupInfo.links.html}
                      active={true}
                      testId="selection-toggle"
                    />
                  )
                }
                else {
                  return (
                    <FilterToggle
                      label={`unknown group - ${groupInfo}`}
                      description={`This group no longer exists or you’ve left it. To access it again, please rejoin.`}
                      // url={groupInfo.links.html}
                      active={true}
                      testId="selection-toggle"
                      classes='bg-red-700'
                    />
                  )
                }
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Slider>
  )
}

export type LabelProps = {
  query: boolean;
};

function Label({
  query,
}: LabelProps) {
  return (
    <>
      <p className={"flex"}>
        {query ? (
          <>
            No results found.
          </>
        ) : (
          <>
            Click the Record button
            <Button
              classes={classnames("mx-2")}
              title="Record button"
              unstyled
            >
              <RadioCheckedIcon />
            </Button>
            to start recording the shareflow.
          </>
        )}
      </p>
    </>
  )
}

export type RecordingListProps = {
  onOpen: (record: RecordItem) => void;
  onShare: (recordItem: RecordItem) => void;
  onDelete: (record: RecordItem) => void;
};

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
export default function RecordingList({
  onOpen,
  onShare,
  onDelete,
}: RecordingListProps) {
  const store = useSidebarStore();
  const recordItems = store.recordItems();
  const focusedRecordItemId = store.focusedRecordItemId();
  const userid = store.profile().userid;
  const query = store.filterQuery();
  const filters = store.getFilterValues();
  const sortKey = store.sortKey();
  const activePanelName = store.activePanelName();
  const allGroups = store.allGroups();
  const focusedGroup = store.focusedGroup();

  const contentElement = useRef<HTMLDivElement | null>(null);
  const scollRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState(0);

  let hoverTimer: number | undefined;
  const sorters = {
    Newest: (a: RecordItem, b: RecordItem) => {
      const dateA = a.timestamp;
      const dateB = b.timestamp;
      return dateB - dateA;
    },

    Oldest: (a: RecordItem, b: RecordItem) => {
      const dateA = a.timestamp;
      const dateB = b.timestamp;
      return dateA - dateB;
    },

    User: (a: RecordItem, b: RecordItem) => {
      return a.userid.localeCompare(b.userid);
    },

    Location: (a: RecordItem, b: RecordItem) => {
      return a.userid.localeCompare(b.userid);
    },
  }

  const sortedRecordItems = useMemo(() => {
    const filter = recordItems.filter(recordItem => {
      if (query) {
        const _query = query.toLowerCase();

        const exist = recordItem.groups.find(groupId => groupId === focusedGroup?.id);
        if (!exist) {
          return false;
        }

        const groups = recordItem.groups
          .map(groupId => allGroups.find(group => group.id === groupId))
          .filter((group): group is Group => group !== undefined);

        return (
          recordItem.taskName.toLowerCase().includes(_query) ||
          recordItem.description.toLowerCase().includes(_query) ||
          recordItem.userid.toLowerCase().includes(_query) ||
          groups.some(
            group => group.name.toLowerCase().includes(_query))
        )
      } else {
        return recordItem.groups.find(groupId => groupId === focusedGroup?.id) ||
          recordItem.userid === userid;
      }
    });

    const sorted = filter.sort(sorters[sortKey]);
    return sorted;

  }, [sortKey, recordItems, query, filters]);

  const [expandedRecording, setExpandedRecording] = useState<RecordItem | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const contentStyle: Record<string, number> = {};
  contentStyle['height'] = contentHeight;

  const onMouseEnter = (event: Event, record: RecordItem) => {
    event.stopPropagation();
    event.preventDefault();

    // The focus won't work without delaying rendering.
    hoverTimer = setTimeout(() => {
      setExpandedRecording(record);
      setIsExpanded(true);
    }, 600);
  };

  const onMouseLeave = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
    clearTimeout(hoverTimer);
    setExpandedRecording(null);
    setIsExpanded(false);
  };

  const updateContentSize = () => {
    setTimeout(() => {
      const offset = 100;

      let sidebarPanelHeight = 0;
      const elements = document.querySelectorAll('[data-component="Dialog"][tabindex="-1"][variant="custom"]');
      for (const el of elements) {
        sidebarPanelHeight += getElementHeightWithMargins(el);
      }
      setContentHeight(window.innerHeight - sidebarPanelHeight - offset);
    }, 10);
  };

  useLayoutEffect(() => {
    updateContentSize();
  }, [activePanelName]);

  useEffect(() => {
    return () => {
      // unmount
      clearTimeout(hoverTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const listeners = new ListenerCollection();

    let threadIndex = sortedRecordItems.findIndex(t => t.id === focusedRecordItemId);
    if (threadIndex === -1) {
      threadIndex = 0;
    } else {
      setExpandedRecording(sortedRecordItems[threadIndex]);
      setIsExpanded(true);
    }
    const yOffset = sortedRecordItems
      .slice(0, threadIndex)
      .reduce((total, thread) => total + getElementHeightWithMargins(document.getElementById("list"+ thread.id)!), 0)

    scollRef.current!.scrollTo({
      top: yOffset,
    })

    setExpandedRecording(sortedRecordItems[threadIndex]);
    setIsExpanded(true);

    const updateSize = debounce(
      updateContentSize,
      10,
      { maxWait: 100 },
    );

    listeners.add(window, 'resize', updateSize);
    return () => {
      listeners.removeAll();
      updateSize.cancel();
    };
  }, []);

  return (
    <div
      ref={contentElement}
      style={contentStyle}
    >
      <div
        className={'h-full overflow-y-auto'}
        ref={scollRef}
      >
      {sortedRecordItems.map(record => (
        <div
          id={'list' + record.id}
          className={classnames(
            'cursor-pointer',
            'shadow-lg hover:drop-shadow-2xl'
          )}
          onClick={() => onOpen(record)}
          onMouseEnter={(event) => onMouseEnter(event, record)}
          onMouseLeave={onMouseLeave}
        >
          <div
            className={classnames('flex items-center mx-2 gap-x-2 min-h-10')}
          >
            <div><PreviewIcon /></div>
            <div data-component="title" className="w-0.7 text-lg truncate">
              <span>{record.taskName}</span>
            </div>
            <div className="flex items-center justify-end grow">
              {record.groups && record.groups.length !== 0 ? (
                <Tag
                  sharedby={userid !== record.userid}
                  tag={userid === record.userid? "shared" : getUserName(record.userid!)}
                />
              ) : (
                <Tag
                  sharedby={false}
                  tag={'private'}
                  classes='text-orange-500 bg-orange-50 border-orange-200'
                />
              )}
              {userid === record.userid && (
                <RecordingMenu
                  recordItem={record}
                  onShare={onShare}
                  onDelete={onDelete}
                />
              )}
            </div>
          </div>
          <RecordingSlider
            recordItem={record}
            isSubmenuVisible={expandedRecording == record && isExpanded}
          />
        </div>
      ))}
      {sortedRecordItems.length === 0 && (
        <Label query={query !== "" && query !== null}/>
      )}
      </div>
    </div>
  );
}
