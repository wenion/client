import type { AnnotationProps } from './Annotation';
import { withServices } from '../../../sidebar/service-context';

type EmptyAnnotationProps = Omit<
  AnnotationProps,
  'annotation' | 'annotationsService'
>;

/**
 * Render an "annotation" when the annotation itself is missing. This can
 * happen when an annotation is deleted by its author but there are still
 * replies that pertain to it.
 */
function EmptyAnnotation({
  isReply,
  replyCount,
  threadIsCollapsed,
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
      <footer className="flex items-center">
      </footer>
    </article>
  );
}

export default withServices(EmptyAnnotation, ['settings']);
