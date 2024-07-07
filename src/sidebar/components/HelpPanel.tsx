import { Card, Link, Tab, InputGroup, Input, IconButton } from '@hypothesis/frontend-shared';
import { CopyIcon, ExternalIcon } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useCallback, useId, useMemo, useState } from 'preact/hooks';

import { username } from '../helpers/account-id';
import { VersionData } from '../helpers/version-data';
import { withServices } from '../service-context';
import type { ToastMessengerService } from '../services/toast-messenger';
import { copyText } from '../util/copy-to-clipboard';
import type { SessionService } from '../services/session';
import type { RecordingService } from '../services/recording';
import { useSidebarStore } from '../store';
import SidebarPanel from './SidebarPanel';
import Tutorial from './Tutorial';
import VersionInfo from './VersionInfo';
import TabHeader from './tabs/TabHeader';
import TabPanel from './tabs/TabPanel';

type HelpPanelTabProps = {
  /** What the tab's link should say. */
  linkText: string;
  /** Where the tab's link should go. */
  url: string;
};

/**
 * External link "tabs" at the bottom of the help panel.
 */
function HelpPanelTab({ linkText, url }: HelpPanelTabProps) {
  return (
    <div
      // Set this element's flex-basis and also establish
      // a flex container (centered on both axes)
      className="flex-1 flex items-center justify-center border-r last-of-type:border-r-0 text-md font-medium"
    >
      <Link variant="text-light" href={url} target="_blank" underline="none">
        <div className="flex items-center gap-x-2">
          <span>{linkText}</span> <ExternalIcon className="w-3 h-3" />
        </div>
      </Link>
    </div>
  );
}

type HelpPanelProps = {
  session: SessionService;
  recordingService: RecordingService;

  // injected
  toastMessenger: ToastMessengerService;
};

type PanelKey = 'tutorial' | 'versionInfo' | 'baselineInfo';

/**
 * A help sidebar panel with two sub-panels: tutorial and version info.
 */
function HelpPanel({ session, recordingService, toastMessenger }: HelpPanelProps) {
  const store = useSidebarStore();
  const frames = store.frames();
  const mainFrame = store.mainFrame();
  const profile = store.profile();
  const displayName =
    profile.user_info?.display_name ?? username(profile.userid);
  const tutorialTabId = useId();
  const tutorialPanelId = useId();
  const versionTabId = useId();
  const versionPanelId = useId();
  const baselineTabId = useId();
  const baselinePanelId = useId();

  const subjectId = username(store.profile().userid);
  const taskId = recordingService.getExtensionStatus().recordingTaskName;
  const model = store.getDefault('model');
  const token = store.getDefault('token');
  const role = store.profile().role ?? null;

  const hint = useMemo(() => {
    if (role) {
      return `The user is a Monash University ${role.teaching_role} in the Faculty of ${role.faculty}, \
located at the ${role.campus} campus. The user is teaching ${role.teaching_unit} and \
has been working for the university since ${role.joined_year}, \
with ${role.years_of_experience} ${role.years_of_experience > 1 ? 'years' : 'year'} of teaching experience.`;
    }
    return null;
  }, [role])

  const link = useMemo(()=> {
    if (hint) {
      const link = `https://chat.kmass.io/?hint=${hint}&model=${model}&task_id=${taskId}&subject_id=${subjectId}&token=${token}`
      return encodeURI(link);
    }
    return '';
  }, [subjectId, taskId, model, token, role])

  const copyLinkData = () => {
    try {
      copyText(link);
      toastMessenger.success('Copied link to clipboard');
    } catch (err) {
      toastMessenger.error('Unable to copy the link');
    }
  };

  // Should this panel be auto-opened at app launch? Note that the actual
  // auto-open triggering of this panel is owned by the `HypothesisApp` component.
  // This reference is such that we know whether we should "dismiss" the tutorial
  // (permanently for this user) when it is closed.
  const hasAutoDisplayPreference =
    !!store.profile().preferences.show_sidebar_tutorial;

  // The "Tutorial" (getting started) subpanel is the default panel shown
  const [activeSubPanel, setActiveSubPanel] = useState<PanelKey>('tutorial');

  // Build version details about this session/app
  const versionData = useMemo(() => {
    // Sort frames so the main frame is listed first. Other frames will retain
    // their original order, assuming a stable sort.
    const documentFrames = [...frames].sort((a, b) => {
      if (a === mainFrame) {
        return -1;
      } else if (b === mainFrame) {
        return 1;
      } else {
        return 0;
      }
    });

    return new VersionData(
      { userid: profile.userid, displayName },
      documentFrames,
    );
  }, [profile, displayName, frames, mainFrame]);

  // The support ticket URL encodes some version info in it to pre-fill in the
  // create-new-ticket form
  const supportTicketURL = `https://colam.kmass.cloud.edu.au/help/?sys_info=${versionData.asEncodedURLString()}`;

  const onActiveChanged = useCallback(
    (active: boolean) => {
      if (!active && hasAutoDisplayPreference) {
        // If the tutorial is currently being auto-displayed, update the user
        // preference to disable the auto-display from happening on subsequent
        // app launches
        session.dismissSidebarTutorial();
      }
    },
    [session, hasAutoDisplayPreference],
  );

  return (
    <SidebarPanel
      title="Help"
      panelName="help"
      onActiveChanged={onActiveChanged}
      variant="custom"
    >
      <TabHeader>
        <Tab
          id={tutorialTabId}
          aria-controls={tutorialPanelId}
          variant="tab"
          textContent="Help"
          selected={activeSubPanel === 'tutorial'}
          onClick={() => setActiveSubPanel('tutorial')}
          data-testid="tutorial-tab"
        >
          Help
        </Tab>
        <Tab
          id={versionTabId}
          aria-controls={versionPanelId}
          variant="tab"
          textContent="Version"
          selected={activeSubPanel === 'versionInfo'}
          onClick={() => setActiveSubPanel('versionInfo')}
          data-testid="version-info-tab"
        >
          Version
        </Tab>
        <Tab
          id={baselineTabId}
          aria-controls={baselinePanelId}
          variant="tab"
          textContent="Version"
          selected={activeSubPanel === 'baselineInfo'}
          onClick={() => setActiveSubPanel('baselineInfo')}
          data-testid="baseline-info-tab"
        >
          Baseline
        </Tab>
      </TabHeader>
      <Card
        classes={classnames({
          'rounded-tl-none': activeSubPanel === 'tutorial',
        })}
      >
        <div className="border-b">
          <TabPanel
            id={tutorialPanelId}
            aria-labelledby={tutorialTabId}
            active={activeSubPanel === 'tutorial'}
            title="Getting started"
          >
            <Tutorial />
          </TabPanel>
          <TabPanel
            id={versionPanelId}
            aria-labelledby={versionTabId}
            active={activeSubPanel === 'versionInfo'}
            title="Version details"
          >
            <VersionInfo versionData={versionData} />
          </TabPanel>
          <TabPanel
            id={baselinePanelId}
            aria-labelledby={baselineTabId}
            active={activeSubPanel === 'baselineInfo'}
            title="Baseline details"
          >
            <div className="space-y-4">
              <dl className="grid grid-cols-1 sm:grid-cols-4 sm:gap-x-2">
                <dt className="col-span-1 sm:text-right font-medium">Model</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text-light break-words',
                  )}
                >
                  {model}
                </dd>
                <dt className="col-span-1 sm:text-right font-medium">Task ID</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text-light break-words',
                  )}
                >
                  {taskId === ''? 'None': taskId}
                </dd>
                <dt className="col-span-1 sm:text-right font-medium">Subject ID</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text-light break-words',
                  )}
                >
                  {subjectId}
                </dd>
                <dt className="col-span-1 sm:text-right font-medium">Token</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text-light break-words',
                  )}
                >
                  {token}
                </dd>
              </dl>
              <hr />
              <dl className="grid grid-cols-1 sm:grid-cols-4 sm:gap-x-2">
                <dt className="col-span-1 sm:text-right font-medium bg-orange-200">Staff type</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text break-words bg-orange-200',
                  )}
                >
                  {role ? role.teaching_role : 'None'}
                </dd>
                <dt className="col-span-1 sm:text-right font-medium bg-orange-50">Faculty</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text break-words bg-orange-50',
                  )}
                >
                  {role ? role.faculty : 'None'}
                </dd>
                <dt className="col-span-1 sm:text-right font-medium bg-orange-200">Campus</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text break-words bg-orange-200',
                  )}
                >
                  {role ? role.campus : 'None'}
                </dd>
                <dt className="col-span-1 sm:text-right font-medium bg-orange-50">Teaching unit</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text break-words bg-orange-50',
                  )}
                >
                  {role ? role.teaching_unit : 'None'}
                </dd>
                <dt className="col-span-1 sm:text-right font-medium bg-orange-200">Years joined Monash</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text break-words bg-orange-200',
                  )}
                >
                  {role ? role.joined_year : 'None'}
                </dd>
                <dt className="col-span-1 sm:text-right font-medium bg-orange-50">The years of teaching experience</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text break-words bg-orange-50',
                  )}
                >
                  {role ? role.years_of_experience : 'None'}
                </dd>
              </dl>
              <hr />
              <dl className="grid grid-cols-1 sm:grid-cols-4 sm:gap-x-2">
                <dt className="col-span-1 sm:text-right font-medium">Hint</dt>
                <dd
                  className={classnames(
                    'col-span-1 sm:col-span-3 text-color-text-light break-words',
                  )}
                >
                  {hint}
                </dd>
              </dl>

              <InputGroup>
                <Input name="link" value={link} />
                <IconButton icon={CopyIcon} title="copy" variant="dark" onClick={copyLinkData} />
              </InputGroup>
            </div>
          </TabPanel>
        </div>
        <div className="flex items-center p-3">
          <HelpPanelTab
            linkText="Help topics"
            url="https://colam.kmass.cloud.edu.au/help/"
          />
          <HelpPanelTab linkText="New support ticket" url={supportTicketURL} />
        </div>
      </Card>
    </SidebarPanel>
  );
}

export default withServices(HelpPanel, ['session', 'recordingService', 'toastMessenger']);
