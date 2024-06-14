import { IconButton } from '@hypothesis/frontend-shared';
import { useSidebarStore } from '../store';
import DisconnectedIcon from '../../images/icons/disconnected';


export default function ReconnectStreamButton() {
  const store = useSidebarStore();
  const isConnected = store.isConnected();

  if (isConnected) {
    return null;
  }

  return (
    <IconButton
      size="xs"
      variant="primary"
      title={
        "Network disconnected."
      }
    >
      <DisconnectedIcon/>
    </IconButton>
  );
}
