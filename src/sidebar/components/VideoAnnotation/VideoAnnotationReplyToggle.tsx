import { Button } from '@hypothesis/frontend-shared';
import classnames from 'classnames';

export type AnnotationReplyToggleProps = {
  onToggleReplies: () => void;
  replyCount: number;
  threadIsCollapsed: boolean;
};
/**
 * Render a thread-card control to toggle (expand or collapse) all of this
 * thread's children.
 */
function VideoAnnotationReplyToggle({
  onToggleReplies,
  replyCount,
  threadIsCollapsed,
}: AnnotationReplyToggleProps) {
  const toggleAction = threadIsCollapsed ? 'Show replies' : 'Hide replies';
  const toggleText = `${toggleAction} (${replyCount})`;

  return (
    <Button
      classes={classnames(
        // This button has a non-standard color combination: it uses a lighter
        // text color than other LinkButtons
        'text-grey-7 enabled:hover:text-brand-dark',
        'no-underline enabled:hover:underline'
      )}
      onClick={onToggleReplies}
      title={toggleText}
      variant="custom"
    >
      {toggleText}
    </Button>
  );
}

export default VideoAnnotationReplyToggle;
