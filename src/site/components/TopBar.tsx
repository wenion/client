import {
  Input,
  CancelIcon,
  EditIcon,
  FolderIcon,
  HelpIcon,
  IconButton,
  LinkButton,
  NoteFilledIcon,
} from '@hypothesis/frontend-shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { route } from 'preact-router';
import classnames from 'classnames';

import type { SidebarSettings } from '../../types/config';
import { applyTheme } from '../../sidebar/helpers/theme';
import { withServices } from '../../sidebar/service-context';
import type { QueryService } from '../../sidebar/services/query';
import type { RecordingService } from '../../sidebar/services/recording';
import type { SessionService } from '../../sidebar/services/session';
import { useSidebarStore } from '../../sidebar/store';
import ThirdPartyMenu from './ThirdPartyMenu';
import SearchBar from './query/SearchBar';
import UserMenu from './UserMenu';
import LogoIcon from '../static/logo';
import ExtensionIcon from '../static/extension';

export type TopBarProps = {
  /** Flag indicating whether the app is in a sidebar context */
  isSidebar: boolean;

  /** Callback invoked when user clicks "Login" button */
  onLogin: () => void;

  /** Callback invoked when user clicks "Logout" action in account menu */
  onLogout: () => void;

  /** Callback invoked when user clicks "Sign up" button */
  onSignUp: () => void;

  onSave?: (id: string) => void;

  // injected
  queryService: QueryService;
  recordingService: RecordingService;
  settings: SidebarSettings;
  session: SessionService;
};

/**
 * The toolbar which appears at the top of the sidebar providing actions
 * to switch groups, view account information, sort/filter annotations etc.
 */
function TopBar({
  isSidebar,
  onLogin,
  onLogout,
  onSignUp,
  onSave,
  queryService,
  recordingService,
  settings,
  session,
}: TopBarProps) {
  const loginLinkStyle = applyTheme(['accentColor'], settings);

  const store = useSidebarStore();
  const isLoggedIn = store.isLoggedIn();
  const hasFetchedProfile = store.hasFetchedProfile();
  const inputRef = useRef<HTMLDivElement | null>(null);


  const recordItems = store.recordItems();
  const recordSteps = store.recordSteps();
  const [first, shareflow, id] = window.location.pathname.split("/");

  const recordItem = store.getRecordItemById(id);
  const profile = store.profile();

  // Should this panel be auto-opened at app launch? Note that the actual
  // auto-open triggering of this panel is owned by the `HypothesisApp` component.
  // This reference is such that we know whether we should "dismiss" the tutorial
  // (permanently for this user) when it is closed.
  const hasAutoDisplayPreference =
    !!store.profile().preferences.show_sidebar_tutorial;

  const toggleFileTreeView = () => {
    window.location.href = '/files';
  };

  const own = useMemo(()=> {
    return profile.userid === recordItem?.userid;
  }, [profile, recordItem, recordItems])

  const showEdit = useMemo(() => {
    const [first, shareflow, id] = window.location.pathname.split("/");
    const isShareflow = shareflow === "shareflow";
    if (isLoggedIn && isShareflow && id) {
      return true;
    }
    return false;
  }, [isLoggedIn]);

  const displayMode = useMemo(() => {
    if (showEdit && window.location.pathname.endsWith("/edit")) {
      return "Save";
    }
    return "Edit";
  }, [showEdit]);

  const toggleEditMode = () => {
    const pathname = window.location.pathname;
    if (pathname.endsWith('/edit')) {
      route(pathname.slice(0, -5));
    } else {
      route(pathname + "/edit");
    }
  };

  const onActiveChanged = useCallback(
    () => {
      if (!hasAutoDisplayPreference) {
        // If the tutorial is currently being auto-displayed, update the user
        // preference to disable the auto-display from happening on subsequent
        // app launches
        session.dismissSidebarTutorial(true);
      }
    },
    [session, hasAutoDisplayPreference],
  );

  const [editable, setEditable] = useState(false);

  useEffect(()=>{
    if (editable) {
      inputRef.current!.focus();
    }
  }, [editable])

  const onBlur = (taskName: string) => {
    setEditable(false);
    if (recordItem) {
      recordingService.updateRecord(recordItem.id, {name: taskName});
    }
  }

  return (
    <div>
      <header class="nav-bar">
        <div class="nav-bar__content justify-center">
          <a href="/" title="GoldMind Home" class="nav-bar__logo-container mx-12">
            <LogoIcon />
          </a>
          {!showEdit && (
            <SearchBar />
          )}
          {showEdit && recordItem && (
            <div
              ref={inputRef}
              className={classnames(
                "m-auto self-center text-xl",
                {"py-4 px-2 focus-visible" : editable},
              )}
              data-focus-visible-added={editable}
              contenteditable={editable}
              onBlur={() => onBlur(inputRef.current!.innerText)}
              onClick={() => setEditable(true)}
            >
              {recordItem.taskName}
            </div>
          )}
          <nav className="nav-bar-links mx-14">
            {isLoggedIn && !showEdit ? (
              <>
                <ThirdPartyMenu />
                <a class='p-1' href={store.getLink('download')}>
                  <ExtensionIcon />
                </a>
                <span class='p-1'>
                  <IconButton
                    icon={FolderIcon}
                    onClick={toggleFileTreeView}
                    size="xs"
                    title="Browser cloud repository"
                  />
                </span>
                {!hasAutoDisplayPreference && (
                  <span class='p-1'>
                    <IconButton
                      icon={HelpIcon}
                      onClick={onActiveChanged}
                      size="xs"
                      title="How to get started"
                    />
                  </span>
                )}
                <UserMenu onLogout={onLogout} />
              </>
            ) : (
              <div
                className="flex items-center text-md font-medium space-x-1 nav-bar-links__item"
                data-testid="login-links"
              >
                {!isLoggedIn && !hasFetchedProfile && <span>⋯</span>}
                {!isLoggedIn && hasFetchedProfile && (
                  <>
                    <LinkButton
                      classes="inline"
                      onClick={onSignUp}
                      style={loginLinkStyle}
                    >
                      Sign up
                    </LinkButton>
                    <div>/</div>
                    <LinkButton
                      classes="inline"
                      onClick={onLogin}
                      style={loginLinkStyle}
                    >
                      Log in
                    </LinkButton>
                  </>
                )}
              </div>
            )}
          </nav>
          {showEdit && own && (
            <div
              className="flex m-auto"
            >
              {displayMode === "Edit" && (
                <IconButton
                  icon={EditIcon}
                  onClick={toggleEditMode}
                  size="lg"
                  title="Edit Shareflow"
                  classes="border border-black rounded-sm cursor-pointer"
                >
                  Edit
                </IconButton>
              )}
              {displayMode === "Save" && (
                <>
                  <IconButton
                    icon={NoteFilledIcon}
                    onClick={
                      () => {
                        if (onSave) {
                          onSave(id);
                        }
                      }
                    }
                    size="lg"
                    title="Save changes"
                    classes="border border-black rounded-sm cursor-pointer"
                  >
                    Save
                  </IconButton>
                  <div className="w-4"></div>
                  <IconButton
                    icon={CancelIcon}
                    onClick={toggleEditMode}
                    size="lg"
                    title="Exit"
                    classes="border border-black rounded-sm cursor-pointer"
                  >
                    Exit
                  </IconButton>
                </>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default withServices(TopBar, [
  'queryService',
  'recordingService',
  'settings',
  'session',
]);
