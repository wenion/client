import { Link, LinkButton, LogoIcon } from '@hypothesis/frontend-shared';

import { useSidebarStore } from '../store';

export type LoggedOutMessageProps = {
  onLogin: () => void;
};

/**
 * Render a call-to-action to log in or sign up. This message is intended to be
 * displayed to non-auth'd users when viewing a single annotation in a
 * direct-linked context (i.e. URL with syntax `/#annotations:<annotation_id>`)
 */
function LoggedOutMessage({ onLogin }: LoggedOutMessageProps) {
  const store = useSidebarStore();

  return (
    <div className="flex flex-col items-center m-6 space-y-6">
      <span className="text-center">
        This is a public annotation created with GoldMind. <br />
        To reply or make your own annotations on this document,{' '}
        <Link
          variant="text"
          href={store.getLink('signup')}
          target="_blank"
          rel="noopener noreferrer"
          underline="always"
        >
          create a free account
        </Link>{' '}
        or{' '}
        <LinkButton inline variant="text" onClick={onLogin} underline="always">
          log in
        </LinkButton>
        .
      </span>
      <div>
        <Link
          href="https://colam.kmass.cloud.edu.au"
          aria-label="GoldMind homepage"
          target="_blank"
          rel="noopener noreferrer"
          title="GoldMind homepage"
          underline="none"
          variant="custom"
        >
          <LogoIcon className="w-16 h-16 text-grey-7" />
        </Link>
      </div>
    </div>
  );
}

export default LoggedOutMessage;
