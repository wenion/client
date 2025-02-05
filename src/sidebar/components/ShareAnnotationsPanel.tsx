import {
  CopyIcon,
  IconButton,
  Input,
  InputGroup,
  LockIcon,
  Spinner,
} from '@hypothesis/frontend-shared';

import { pageSharingLink } from '../helpers/annotation-sharing';
import { withServices } from '../service-context';
import type { ToastMessengerService } from '../services/toast-messenger';
import { useSidebarStore } from '../store';
import { copyText } from '../util/copy-to-clipboard';
import ShareLinks from './ShareLinks';
import SidebarPanel from './SidebarPanel';

export type ShareAnnotationPanelProps = {
  // injected
  toastMessenger: ToastMessengerService;
};

/**
 * A panel for sharing the current group's annotations on the current document.
 *
 * Links within this component allow a user to share the set of annotations that
 * are on the current page (as defined by the main frame's URI) and contained
 * within the app's currently-focused group.
 */
function ShareAnnotationsPanel({ toastMessenger }: ShareAnnotationPanelProps) {
  const store = useSidebarStore();
  const mainFrame = store.mainFrame();
  const focusedGroup = store.focusedGroup();
  const groupName = (focusedGroup && focusedGroup.name) || '...';
  const panelTitle = `Share Annotations in ${groupName}`;

  // To be able to concoct a sharing link, a focused group and frame need to
  // be available
  const sharingReady = focusedGroup && mainFrame;

  const shareURI =
    sharingReady && pageSharingLink(mainFrame.uri, focusedGroup.id);

  const copyShareLink = () => {
    try {
      if (shareURI) {
        copyText(shareURI);
        toastMessenger.success('Copied share link to clipboard');
      }
    } catch (err) {
      toastMessenger.error('Unable to copy link');
    }
  };

  return (
    <SidebarPanel title={panelTitle} panelName="shareGroupAnnotations">
      {!sharingReady && (
        <div className="flex flex-row items-center justify-center">
          <Spinner size="md" />
        </div>
      )}
      {sharingReady && (
        <div className="text-color-text-light space-y-3">
          {shareURI ? (
            <>
              <div
                className="text-color-text font-medium"
                data-testid="sharing-intro"
              >
                {focusedGroup!.type === 'private' ? (
                  <p>
                    Use this link to share these annotations with other group
                    members:
                  </p>
                ) : (
                  <p>Use this link to share these annotations with anyone:</p>
                )}
              </div>
              <div>
                <InputGroup>
                  <Input
                    aria-label="Use this URL to share these annotations"
                    type="text"
                    value={shareURI}
                    readOnly
                  />
                  <IconButton
                    icon={CopyIcon}
                    onClick={copyShareLink}
                    title="Copy share link"
                    variant="dark"
                  />
                </InputGroup>
              </div>
              <p data-testid="sharing-details">
                {focusedGroup!.type === 'private' ? (
                  <span>
                    Annotations in the private group{' '}
                    <em>{focusedGroup.name}</em> are only visible to group
                    members.
                  </span>
                ) : (
                  <span>
                    Anyone using this link may view the annotations in the group{' '}
                    <em>{focusedGroup.name}</em>.
                  </span>
                )}{' '}
                <span>
                  Private (
                  <LockIcon className="inline w-em h-em ml-0.5 -mt-0.5" />{' '}
                  <em>Only Me</em>) annotations are only visible to you.
                </span>
              </p>
              <div className="text-[24px]">
                <ShareLinks shareURI={shareURI} />
              </div>
            </>
          ) : (
            <p data-testid="no-sharing">
              These annotations cannot be shared because this document is not
              available on the web.
            </p>
          )}
        </div>
      )}
    </SidebarPanel>
  );
}

export default withServices(ShareAnnotationsPanel, ['toastMessenger']);
