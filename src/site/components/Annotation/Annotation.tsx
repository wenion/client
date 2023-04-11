import {
  FlagIcon,
} from '@hypothesis/frontend-shared/lib/next';

import type { QueryResult as IAnnotation } from '../../../types/api';
import type { SidebarSettings } from '../../../types/config';
import { withServices } from '../../../sidebar/service-context';
import { useSidebarStore } from '../../../sidebar/store';
import AnnotationUser from './AnnotationUser';

export type AnnotationProps = {
  annotation: IAnnotation;
  isReply: boolean;
  /** Number of replies to this annotation's thread */
  replyCount: number;
  /** Is the thread to which this annotation belongs currently collapsed? */
  threadIsCollapsed: boolean;
  /**
   * Callback to expand/collapse reply threads. The presence of a function
   * indicates a toggle should be rendered.
   */
  // onToggleReplies?: () => void;

  // injected
  // annotationsService: AnnotationsService;

  // injected
  settings: SidebarSettings;
};

/**
 * A single annotation.
 *
 * @param {AnnotationProps} props
 */
function Annotation({
  annotation,
  isReply,
  // onToggleReplies,
  replyCount,
  threadIsCollapsed,
  // annotationsService,
  settings,
}: AnnotationProps) {
  const store = useSidebarStore();

  // const annotationQuote = quote(annotation);
  const annotationQuote = annotation.title;
  const text = annotation.context;
  const authorName = annotation.author;
  const url = annotation.url;
  // const draft = store.getDraft(annotation);
  const userid = store.profile().userid;
  // const text = draft?.text ?? annotation.text;

  // const isHovered = store.isAnnotationHovered(annotation.$tag);
  // const isSaving = store.isSavingAnnotation(annotation);

  // const isEditing = !!draft && !isSaving;
  const isCollapsedReply = isReply && threadIsCollapsed;

  // const showActions = !isSaving && !isEditing && isSaved(annotation);

  // const defaultAuthority = store.defaultAuthority();
  // const displayNamesEnabled = store.isFeatureEnabled('client_display_names');
  // const userURL = store.getLink('user', { user: annotation.user });

  // const authorName = useMemo(
  //   () =>
  //     annotationDisplayName(annotation, defaultAuthority, displayNamesEnabled),
  //   [annotation, defaultAuthority, displayNamesEnabled]
  // );

  // const authorLink = useMemo(
  //   () => annotationAuthorLink(annotation, settings, defaultAuthority, userURL),
  //   [annotation, settings, defaultAuthority, userURL]
  // );

  // const onReply = () => {
  //   if (isSaved(annotation) && userid) {
  //     annotationsService.reply(annotation, userid);
  //   }
  // };

  // const annotationDescription = isSaved(annotation)
  //   ? annotationRole(annotation)
  //   : `New ${annotationRole(annotation).toLowerCase()}`;

  return (
    <article
      className="space-y-4"
      // aria-label={`${annotationDescription} by ${authorName}`}
    >
      <header>
        <div className="flex items-start">
          <h1 class="font-robo">
            {annotationQuote}
          </h1>

          <div className="flex justify-end grow">
            <FlagIcon />
          </div>
        </div>
      </header>

      {/* {annotationQuote && (
        <AnnotationQuote
          quote={annotationQuote}
          isHovered={isHovered}
          isOrphan={isOrphan(annotation)}
        />
      )} */}

      <p className="text-base font-open">
        {text}
      </p>

      {/* {!isCollapsedReply && !isEditing && (
        <AnnotationBody annotation={annotation} />
      )} */}

      {/* {!isCollapsedReply && ( */}
        <footer className="flex items-center">
          {/* {isPrivate(annotation.permissions) && !isEditing && (
            <LockIcon
              className="w-[10px] h-[10px]"
              title="This annotation is visible only to you"
            />
          )} */}
          <AnnotationUser authorLink={url} displayName={authorName} />
        </footer>
      {/* )} */}
    </article>
  );
}

export default withServices(Annotation, ['settings']);
