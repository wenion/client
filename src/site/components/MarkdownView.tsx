import { useEffect, useMemo, useRef } from 'preact/hooks';

import { renderMathAndMarkdown } from '../render-markdown';
import StyledText from './StyledText';

export type MarkdownViewProps = {
  /** The string of markdown to display as HTML. */
  markdown: string;
  classes?: string;
  style?: Record<string, string>;
};

/**
 * A component which renders markdown as HTML and replaces recognized links
 * with embedded video/audio.
 */
export default function MarkdownView({
  markdown,
  classes,
  style,
}: MarkdownViewProps) {
  const html = useMemo(
    () => (markdown ? renderMathAndMarkdown(markdown) : ''),
    [markdown]
  );
  const content = useRef<HTMLDivElement | null>(null);


  // NB: The following could be implemented by setting attribute props directly
  // on `StyledText` (which renders a `div` itself), versus introducing a child
  // `div` as is done here. However, in initial testing, this interfered with
  // some overflow calculations in the `Excerpt` element. This could be worth
  // a review in the future.
  return (
    <div className="w-full break-words cursor-text">
      <StyledText>
        <div
          className={classes}
          data-testid="markdown-text"
          ref={content}
          dangerouslySetInnerHTML={{ __html: html }}
          style={style}
        />
      </StyledText>
    </div>
  );
}
