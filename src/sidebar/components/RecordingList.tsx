import {
  Card,
  CardContent,
  EllipsisIcon,
  PreviewIcon,
  Slider,
} from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useState } from 'preact/hooks';

import { formatRelativeDate } from '../util/time';
import { useSidebarStore } from '../store';
import type { RecordItem } from '../../types/api';
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
};

function Tag({
  sharedby,
  tag,
}: TagProps) {
  return (
    <>
      {sharedby && (
        <em>shared by</em>
      )}
      <div class="text-blue-700 bg-blue-50 border-blue-200 border rounded px-1 ml-1">
        <span>{tag}</span>
      </div>
    </>
  )
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
  const now = new Date();
  const createdDate = new Date(recordItem.timestamp);

  return (
    <Slider direction={isSubmenuVisible ? 'in' : 'out'}>
      <Card>
        <CardContent>
          Description: {recordItem.description}
          <div class="grid grid-cols-2 gap-4">
            <div>
              Created by:&nbsp;
              <div class="text-blue-700">{getUserName(recordItem.userid!)}</div>
            </div>
            <div>
              Date Created:&nbsp;
              <div class="text-blue-700">{formatRelativeDate(createdDate, now)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Slider>
  )
}

export type RecordingListProps = {
  onOpen: (record: RecordItem) => void;
};

/**
 * The main content for the single annotation page (aka. https://hypothes.is/a/<annotation ID>)
 */
export default function RecordingList({
  onOpen,
}: RecordingListProps) {
  const store = useSidebarStore();
  const recordItems = store.recordItems();
  const userid = store.profile().userid;

  const [expandedRecording, setExpandedRecording] = useState<RecordItem | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <h1 className='m-4 text-xl'>Saved ShareFlow (Comic)</h1>
      {recordItems.map(record => (
        <div
          className={classnames(
            'cursor-pointer',
            'shadow-lg hover:drop-shadow-2xl'
          )}
          onClick={() => onOpen(record)}
          onMouseEnter={(event) => {
            event.stopPropagation();
            event.preventDefault();
            setExpandedRecording(record);
            setIsExpanded(true);
          }}
          onMouseLeave={(event) => {
            event.stopPropagation();
            event.preventDefault();
            setExpandedRecording(null);
            setIsExpanded(false);
          }}
        >
          <div
            className={classnames('flex items-center mx-2 gap-x-2')}
          >
            <PreviewIcon />
            <div data-component="title" className="text-lg">
              <span>{record.taskName}</span>
            </div>
            <div className="flex items-center justify-end grow">
              {!!record.shared && (
                <Tag
                  sharedby={userid !== record.userid}
                  tag={userid === record.userid? "shared" : getUserName(record.userid!)}
                />
              )}
              {userid === record.userid ? (
                <RecordingMenu recordItem={record}/>
              ) : (
                <div
                  className={classnames(
                    'flex items-center font-semibold rounded',
                    'text-grey-7 bg-grey-1',
                    'enabled:hover:text-grey-9 enabled:hover:bg-grey-2',
                    'aria-pressed:text-grey-9 aria-expanded:text-grey-9',
                    'grow-0 m-1 bg-grey-0 hover:bg-blue-400',
                  )}
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="rotate-90 p-2">
                    <EllipsisIcon />
                  </span>
                </div>
              )}
            </div>
          </div>
          <RecordingSlider
            recordItem={record}
            isSubmenuVisible={expandedRecording == record && isExpanded}
          />
        </div>
      ))}
    </div>
  );
}
