import { useEffect, useMemo } from 'preact/hooks';
import { route } from 'preact-router';

/**
 * The root component for the Hypothesis client.
 *
 * This handles login/logout actions and renders the top navigation bar
 * and content appropriate for the current route.
 */
export default function HomeView({path,}: {path:string}) {
  useEffect(() => {
    // Perform the redirect after a delay (e.g., 1 second)
    const redirectTimeout = setTimeout(() => {
      route('/query', true); // Set the second argument to true to replace the current history entry
    }, 0);

    // Clean up the timeout on component unmount
    return () => {
      clearTimeout(redirectTimeout);
    };
  }, []);

  return (
    <>
      <div className="container">
        Redirecting to <strong>/query</strong>...
      </div>
    </>
  );
}
