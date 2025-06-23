import {
  Card,
  CardContent,
  Button,
  FileGenericIcon,
  MinusIcon,
  PlusIcon,
} from '@hypothesis/frontend-shared';
import { useCallback, useEffect, useState} from 'preact/hooks';
import classnames from 'classnames';
import { Fragment } from 'preact';
import type { ComponentChildren } from 'preact';

import { withServices } from '../../service-context';
import type { RecordingService } from '../../services/recording';
import { useSidebarStore } from '../../store';
import type { Group, RecordItem } from '../../../types/api';

type IconComponent = typeof FileGenericIcon;

type FilterToggleProps = {
  /** A short description of what the filter matches (eg. "Pages 10-20") */
  label: string;

  /**
   * Icon representation of the filter controlled by this toggle, displayed
   * alongside the label.
   */
  icon?: IconComponent;

  /**
   * A longer description of what the filter matches (eg. "Show annotations
   * on pages 10-20").
   */
  description: string;

  /** Is the filter currently active? */
  active: boolean;

  /** Toggle whether the filter is active. */
  setActive: (active: boolean) => void;

  testId?: string;

  disabled?: boolean;
  classes?: string;
};

/**
 * A switch for toggling whether a filter is active or not.
 */
function FilterToggle({
  label,
  icon: IconComponent,
  description,
  active,
  disabled = false,
  setActive,
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
        'text-grey-7 bg-grey-2': !active,
        'text-grey-1 bg-grey-7': active,
        'opacity-50': disabled,
      }, classes)}
      disabled={disabled}
      onClick={() => setActive(!active)}
      pressed={active}
      variant="custom"
      title={description}
    >
      {IconComponent && <IconComponent className="w-em h-em" />}
      <span className="max-w-36 truncate">{label}</span>
      <div
        // Vertical divider line between label and active/inactive state.
        // This should fill the button vertically.
        className={classnames({
          'h-[2em] w-[1.5px] -mt-1 -mb-1': true,
          'bg-grey-3': !active,
          'bg-grey-5': active,
        })}
      />
      {active ? (
        <MinusIcon className="w-em h-em" />
      ) : (
        <PlusIcon className="w-em h-em" />
      )}
    </Button>
  );
}

/**
 * Container for the filter controls when it is rendered standalone, outside
 * the search panel.
 */
function CardContainer({ children }: { children: ComponentChildren }) {
  return (
    <div className="mb-3">
      <Card>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

export type shareWithGroupsProps = {
  /**
   * Whether to render the controls in a card container.
   *
   * The container is rendered by `FilterControls` rather than the parent,
   * because `FilterControls` can conditionally render nothing if no filter is
   * configured.
   */
  recordingService: RecordingService;
  withCardContainer?: boolean;
};

/**
 * Displays the state of various filters and allows the user to toggle them.
 *
 * This includes:
 *
 *  - Focus filters which show anotations from particular user, page range
 *    etc.
 *  - Selection state
 *
 * This doesn't include the state of other layers of filters which have their
 * own UI controls such as search or the annotation type tabs.
 */
function shareWithGroups({
  recordingService,
  withCardContainer = false,
}: shareWithGroupsProps) {
  const store = useSidebarStore();
  const allGroups = store.allGroups();
  const allRecordItems = store.recordItems();

  const focusedRecordItem = store.focusedRecordItemId();
  const [recordItem, setRecordItem] = useState<RecordItem | null>(null);

  const [shareWithGroups, setShareWithGroups] = useState<(Group | string)[]>([]);

  useEffect(()=> {
    if (focusedRecordItem) {
      const recordItem = store.getRecordItemById(focusedRecordItem);
      setRecordItem(recordItem);

      if (recordItem && recordItem.groups) {
        const groups = recordItem.groups.map(groupId => {
          const found = allGroups.find(g => g.id === groupId);
          return found?? groupId;
        });

        setShareWithGroups(groups);
      }
    }
  }, [focusedRecordItem, recordItem, allRecordItems]);

  const removeFromGroups = useCallback(async (group: Group, value: boolean) => {
    if (recordItem) {
      await recordingService.updateRecord(recordItem.id, {
        group: group.id,
        action: value ? 'add' : 'remove'
      });
    }
  }, [recordItem]);

  const removeFromGroupId = useCallback(async (groupId: string, value: boolean) => {
    if (recordItem) {
      await recordingService.updateRecord(recordItem.id, {
        group: groupId,
        action: value ? 'add' : 'remove'
      });
    }
  }, [recordItem]);

  const Container = withCardContainer ? CardContainer : Fragment;

  return (
    <Container>
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
                active={true}
                setActive={(value) => {removeFromGroups(groupInfo, value)}}
                testId="selection-toggle"
              />
            )
          }
          else {
            return (
              <FilterToggle
                label={groupInfo}
                description={"Warning: You're sharing with an unknown group. Please remove it to protect your data."}
                active={true}
                setActive={(value) => {removeFromGroupId(groupInfo, value)}}
                testId="selection-toggle"
                classes='bg-red-700'
              />
            )
          }
        })}
      </div>
    </Container>
  );
}

export default withServices(shareWithGroups, [
  'recordingService',
  'toastMessenger',
]);
