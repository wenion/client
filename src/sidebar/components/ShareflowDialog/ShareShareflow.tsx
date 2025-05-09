import { Select } from '@hypothesis/frontend-shared';
import { useEffect, useId, useMemo, useState } from 'preact/hooks';

import { withServices } from '../../service-context';
import type { ToastMessengerService } from '../../services/toast-messenger';
import { useSidebarStore } from '../../store';
import LoadingSpinner from './LoadingSpinner';
import type { RecordItem } from '../../../types/api';
import ShareWithGroups from './ShareWithGroups';

export type ShareShareflowProps = {
  // injected
  toastMessenger: ToastMessengerService;
};

/**
 * Render UI for sharing annotations (by URL) within the currently-focused group
 */
function ShareShareflow({ toastMessenger }: ShareShareflowProps) {
  const store = useSidebarStore();
  const mainFrame = store.mainFrame();
  const focusedGroup = store.focusedGroup();
  const allGroups = store.allGroups();
  const sharingReady = focusedGroup && mainFrame;

  const focusedRecordItem = store.focusedRecordItemId();
  const [recordItem, setRecordItem] = useState<RecordItem | null>(null);

  // Try to preselect current group
  const [selectedGroupId, setSelectedGroupId] =
    useState(focusedGroup?.id??null);
  
  const userSelectId = useId();

  const selectedGroup = useMemo(
    () => {
      const group = allGroups.find(group => group.id === selectedGroupId);
      return group?? null;
    },
    [allGroups, selectedGroupId],
  );

  useEffect(()=> {
    if (focusedRecordItem) {
      const recordItem = store.getRecordItemById(focusedRecordItem);
      setRecordItem(recordItem);
    }
  }, [focusedRecordItem]);

  if (!sharingReady) {
    return <LoadingSpinner />;
  }

  return (
    <div className="text-color-text-light space-y-3">
      {recordItem ? (
        <>
          <div
            className="text-color-text font-medium"
            data-testid="sharing-intro"
          >
            <p>
              Shareflow Name :<b>{recordItem.taskName}</b>
            </p>
          </div>
          <div className="flex flex-col gap-y-3">
            <label htmlFor={userSelectId} className="font-medium">
              Choose one or more groups to share with:
            </label>
            <Select
              value={selectedGroupId}
              onChange={setSelectedGroupId}
              buttonId={userSelectId}
              buttonContent={
                <div className="flex gap-x-2">
                  {selectedGroup? selectedGroup.name : null}
                </div>
              }
              data-testid="user-select"
            >
              {allGroups.map(groupInfo => (
                <Select.Option key={groupInfo.id} value={groupInfo.id}>
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

export default withServices(ShareShareflow, ['toastMessenger']);
