import { Select } from '@hypothesis/frontend-shared';
import { useCallback, useEffect, useId, useState } from 'preact/hooks';

import { withServices } from '../../service-context';
import type { RecordingService } from '../../services/recording';
import type { ToastMessengerService } from '../../services/toast-messenger';
import { useSidebarStore } from '../../store';
import LoadingSpinner from './LoadingSpinner';
import type { Group, RecordItem } from '../../../types/api';
import ShareWithGroups from './ShareWithGroups';

export type ShareShareflowProps = {
  // injected
  recordingService: RecordingService;
  toastMessenger: ToastMessengerService;
};

/**
 * Render UI for sharing annotations (by URL) within the currently-focused group
 */
function ShareShareflow({ recordingService, toastMessenger }: ShareShareflowProps) {
  const store = useSidebarStore();
  const mainFrame = store.mainFrame();
  const focusedGroup = store.focusedGroup();
  const allRecordItems = store.recordItems();
  const allGroups = store.allGroups();
  const sharingReady = focusedGroup && mainFrame;

  const focusedRecordItem = store.focusedRecordItemId();
  const [recordItem, setRecordItem] = useState<RecordItem | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);

  // Try to preselect current group
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const userSelectId = useId();

  const addToGroups = useCallback(async (group: Group| null) => {
    if (recordItem && group) {
      await recordingService.updateRecord(recordItem.id, {
        group: group.id,
        action: 'add'
      });
    }
  }, [recordItem]);

  useEffect(()=> {
    if (focusedRecordItem) {
      const recordItem = store.getRecordItemById(focusedRecordItem);
      setRecordItem(recordItem);

      if (recordItem && recordItem.groups) {
        const existingGroups = recordItem.groups;
        const groups = allGroups.filter(group => !existingGroups.includes(group.id));
        setAvailableGroups(groups);
        setSelectedGroup(groups.length > 0? groups[0]: null);
      }
    }
  }, [focusedRecordItem, recordItem, allRecordItems]);

  if (!sharingReady) {
    return <LoadingSpinner />;
  }

  return (
    <div className="text-color-text-light space-y-3">
      {recordItem ? (
        <>
          <div className="flex flex-col gap-y-3">
            <label htmlFor={userSelectId} className="font-medium">
              Choose one or more groups to share with:
            </label>
            <Select
              value={selectedGroup}
              onChange={(group: Group | null) => addToGroups(group)}
              buttonId={userSelectId}
              buttonContent={
                <div className="flex gap-x-2">
                  {selectedGroup? selectedGroup.name : null}
                </div>
              }
              data-testid="user-select"
            >
              {availableGroups.map(groupInfo => (
                <Select.Option key={groupInfo.id} value={groupInfo}>
                  <div className="flex gap-x-2">
                    {groupInfo.name}
                  </div>
                </Select.Option>
              ))}
            </Select>
            <ShareWithGroups />
          </div>
        </>
      ) : (
        <p data-testid="no-sharing">
          This shareflow cannot be shared because this document is not
          available on the web.
        </p>
      )}
    </div>
  );
}

export default withServices(ShareShareflow, ['recordingService', 'toastMessenger']);
