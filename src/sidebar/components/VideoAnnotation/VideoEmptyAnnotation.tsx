
import { withServices } from '../../service-context';
import type { VideoAnnotationProps } from './VideoAnnotation';
import VideoAnnotationReplyToggle from './VideoAnnotationReplyToggle';

type EmptyAnnotationProps = Omit<
  VideoAnnotationProps,
  'annotation' | 'videoAnnotationsService' | 'frameSync'
>;

/**
 * Render an "annotation" when the annotation itself is missing. This can
 * happen when an annotation is deleted by its author but there are still
 * replies that pertain to it.
 */
function VideoEmptyAnnotation({
  isReply,
  replyCount,
  threadIsCollapsed,
  onToggleReplies,
}: EmptyAnnotationProps) {
  return (
    <article
      className="space-y-4"
      aria-label={`${
        isReply ? 'Reply' : 'Annotation'
      } with unavailable content`}
    >
      <div>
        <em>Message not available.</em>
      </div>
      {onToggleReplies && (
        <footer className="flex items-center">
          <VideoAnnotationReplyToggle
            onToggleReplies={onToggleReplies}
            replyCount={replyCount}
            threadIsCollapsed={threadIsCollapsed}
          />
        </footer>
      )}
    </article>
  );
}

export default withServices(VideoEmptyAnnotation, ['frameSync']);