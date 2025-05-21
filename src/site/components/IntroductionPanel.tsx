import { Button, CancelIcon } from '@hypothesis/frontend-shared';
import { useCallback } from 'preact/hooks';

import { withServices } from '../../sidebar/service-context';
import type { SessionService } from '../../sidebar/services/session';
import { useSidebarStore } from '../../sidebar/store';

export type IntroductionPanelProps = {
  // injected
  session: SessionService;
};
/**
 * The main content of the "notebook" route (chrome-extension://extension_id/query.html)
 *
 * @param {NotebookViewProps} props
 */
function IntroductionPanel({ session }: IntroductionPanelProps) {
  const store = useSidebarStore();
  const isLoggedIn = !!store.profile().userid;
  const intro = {
    title: "How to get started",
    content: [
      {
        id: 1,
        link: "/download",
        text: "Install our Chrome extension",
        highlight: null,
      },
      {
        id: 2,
        link: "/welcome",
        text: "Enable the extension and start using GoldMind seamlessly",
        highlight: "start using GoldMind seamlessly",
      },
      {
        id: 3,
        link: "/account/profile",
        text: "Get personalised task recommendations by setting up your profile",
        highlight: "setting up your profile",
      },
      {
        id: 4,
        link: "/get-started",
        text: "Read more about how to collaborate effortlessly with your team using annotations and ShareFlows",
        highlight: "how to collaborate effortlessly with your team using annotations and ShareFlows",
      },
    ]
  }

  // Should this panel be auto-opened at app launch? Note that the actual
  // auto-open triggering of this panel is owned by the `HypothesisApp` component.
  // This reference is such that we know whether we should "dismiss" the tutorial
  // (permanently for this user) when it is closed.
  const hasAutoDisplayPreference =
    !!store.profile().preferences.show_sidebar_tutorial;

  const display = hasAutoDisplayPreference || !isLoggedIn;

  const onActiveChanged = useCallback(
    () => {
      if (hasAutoDisplayPreference) {
        // If the tutorial is currently being auto-displayed, update the user
        // preference to disable the auto-display from happening on subsequent
        // app launches
        session.dismissSidebarTutorial();
      }
    },
    [session, hasAutoDisplayPreference],
  );

  return (
    <>
      {display && (
        <div className="search-result-container flex">
          <div className="search-result-zero">
            <h2 class="search-result-zero__title">
              {intro.title}
            </h2>
            <ol class="search-result-zero__list">
              {intro.content.map((item) => {
                if (item.highlight && item.text.includes(item.highlight)) {
                  const parts = item.text.split(item.highlight);
                  return (
                    <li key={item.id} className="search-result-zero__list-item">
                      {parts[0]}
                      <a
                        className="link"
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.highlight}
                      </a>
                      {parts[1]}
                    </li>
                  );
                } else {
                  return (
                    <li key={item.id} className="search-result-zero__list-item">
                      <a className="link" href={item.link}>{item.text}</a>
                    </li>
                  );
                }
              })}
            </ol>
          </div>
          {isLoggedIn && (
            <Button
              classes="h-10"
              data-testid="control-toggle-button"
              onClick={onActiveChanged}
            >
              <CancelIcon />
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export default withServices(IntroductionPanel, ['session',]);
