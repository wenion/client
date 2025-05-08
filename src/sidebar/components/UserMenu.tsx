import {
  CancelIcon,
  HelpIcon,
  ProfileFilledIcon,
  ProfileIcon,
  SettingsIcon,
  ShareIcon,
} from '@hypothesis/frontend-shared';
import { useState } from 'preact/hooks';

import type { Service, SidebarSettings } from '../../types/config';
import type { TabName } from '../../types/sidebar';
import { serviceConfig } from '../config/service-config';
import {
  isThirdPartyUser,
  username as getUsername,
} from '../helpers/account-id';
import { withServices } from '../service-context';
import type { FrameSyncService } from '../services/frame-sync';
import { useSidebarStore } from '../store';
import Menu from './Menu';
import MenuItem from './MenuItem';
import MenuSection from './MenuSection';
import NuggetIcon from '../../images/icons/nugget';
import ChatIcon from '../../images/icons/chat';

export type UserMenuProps = {
  onLogout: () => void;
  frameSync: FrameSyncService;
  settings: SidebarSettings;
};

/**
 * A menu with user and account links.
 *
 * This menu will contain different items depending on service configuration,
 * context and whether the user is first- or third-party.
 */
function UserMenu({ frameSync, onLogout, settings }: UserMenuProps) {
  const store = useSidebarStore();
  const defaultAuthority = store.defaultAuthority();
  const profile = store.profile();
  const allMessageCount = store.allMessageCount();
  const tab = store.selectedTab();

  const isThirdParty = isThirdPartyUser(profile.userid, defaultAuthority);
  const service = serviceConfig(settings);
  const username = getUsername(profile.userid);
  const displayName = profile.user_info?.display_name ?? username;
  const [isOpen, setOpen] = useState(false);
  const [prevTab, setPrevTab] = useState<TabName>('annotation');

  const serviceSupports = (feature: keyof Service) =>
    service && !!service[feature];

  const isSelectableProfile =
    !isThirdParty || serviceSupports('onProfileRequestProvided');

  // Is logging out generally possible for the current user?
  const logoutAvailable =
    !isThirdParty || serviceSupports('onLogoutRequestProvided');

  // Is logging out possible right now?
  const logoutDisabled = store.importsPending() > 0;

  const isProfileEnabled = store.isFeatureEnabled('client_user_profile');

  const onSelectNotebook = () => {
    frameSync.notifyHost('openNotebook', store.focusedGroupId());
  };
  const onSelectProfile = () => frameSync.notifyHost('openProfile');

  const toggleTab = () => {
    if (tab === 'chatui') {
      store.closeChatUi();
      store.selectTab(prevTab);
    } else {
      // switch to chat ui tab
      setPrevTab(tab);
      store.selectTab('chatui');
    }
  };

  const requestHelp = () => {
    const service = serviceConfig(settings);
    if (service && service.onHelpRequestProvided) {
      frameSync.notifyHost('helpRequested');
    } else {
      store.toggleSidebarPanel('help');
    }
  };

  // Access to the Notebook:
  // type the key 'n' when user menu is focused/open
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'n') {
      onSelectNotebook();
      setOpen(false);
    } else if (isProfileEnabled && event.key === 'p') {
      onSelectProfile();
      setOpen(false);
    }
  };

  const onProfileSelected = () =>
    isThirdParty && frameSync.notifyHost('profileRequested');
  const profileHref =
    isSelectableProfile && !isThirdParty
      ? store.getLink('user', { user: username })
      : undefined;

  const menuLabel = (
    <span className="p-1">
      <ProfileIcon />
    </span>
  );
  return (
    // Allow keyboard shortcut 'n' to open Notebook
    /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */
    <div data-testid="user-menu" onKeyDown={onKeyDown}>
      <Menu
        label={menuLabel}
        title={displayName}
        align="right"
        open={isOpen}
        onOpenChanged={setOpen}
      >
        <MenuSection>
          {tab !== "chatui" && (
            <MenuItem
              icon={ ProfileFilledIcon }
              label={displayName}
              isDisabled={!isSelectableProfile}
              href={profileHref}
              onClick={isSelectableProfile ? onProfileSelected : undefined}
            />
          )}
          {/* {!isThirdParty && (
            <MenuItem
              label="Account settings"
              href={store.getLink('account.settings')}
            />
          )} */}
          {isProfileEnabled && (
            <MenuItem label="Your profile" onClick={() => onSelectProfile()} />
          )}
          {tab !== "chatui" && (
            <MenuItem
              icon={ NuggetIcon }
              label="Knowledge Nuggets"
              onClick={() => onSelectNotebook()}
            />
          )}
          <MenuItem
            icon={ tab !== "chatui" ? ChatIcon : CancelIcon }
            label={tab !== "chatui" ? "ChatUI" : 'Exit ChatUI'}
            title={tab !== "chatui" ? "Switch to ChatUI": "Leave ChatUI"}
            onClick={() => toggleTab()}
          />
          {tab !== "chatui" && (
            <MenuItem
              icon={ ShareIcon }
              label="Share"
              title="Share annotations on this page"
              onClick={() => store.toggleSidebarPanel('shareGroupAnnotations')}
            />
          )}
          {tab !== "chatui" && (
            <MenuItem
              icon={ HelpIcon }
              label="Help"
              onClick={requestHelp}
            />
          )}
        </MenuSection>
        {logoutAvailable && (
          <MenuSection>
            <MenuItem
              isDisabled={logoutDisabled}
              label="Log out"
              onClick={onLogout}
            />
          </MenuSection>
        )}
      </Menu>
    </div>
  );
}

export default withServices(UserMenu, ['frameSync', 'settings']);
