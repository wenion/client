import classnames from 'classnames';

import type { SidebarSettings } from '../../../types/config';
import { applyTheme } from '../../helpers/theme';
import { withServices } from '../../service-context';
import Excerpt from '../Excerpt';
import StyledText from '../StyledText';

type AnnotationQuoteProps = {
  quote: number[];
  isHovered?: boolean;
  isOrphan?: boolean;
  settings: SidebarSettings;
};

function secondsToTime(seconds: number) : string{
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${remainingSeconds.toFixed(3).toString().padStart(2, '0')}`;

  return timeString;
}

/**
 * Display the selected text from the document associated with an annotation.
 */
function VideoAnnotationQuote({
  quote,
  isHovered,
  isOrphan,
  settings,
}: AnnotationQuoteProps) {
  return (
    <Excerpt collapsedHeight={35} inlineControls={true} overflowThreshold={20}>
      <StyledText classes={classnames({ 'p-redacted-text': isOrphan })}>
        <blockquote
          className={classnames('hover:border-l-blue-quote', {
            'border-l-blue-quote': isHovered,
          })}
          style={applyTheme(['selectionFontFamily'], settings)}
        >
          {secondsToTime(quote[0])} / {secondsToTime(quote[1])} Timestamp / Duration
        </blockquote>
      </StyledText>
    </Excerpt>
  );
}

export default withServices(VideoAnnotationQuote, ['settings']);
