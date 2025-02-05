/**
 * Return the URL of a resource related to the Hypothesis client that has been stored in
 * the page via a `<link type="application/annotator+{type}">` tag.
 *
 * These link tags are generally written to the page by the boot script, which may be executed
 * in a separate JavaScript realm (eg. in the browser extension), and thus can share information
 * with the annotator code via the DOM but not JS globals.
 *
 * @param rel - The `rel` attribute to match
 * @param type - Type of resource that the link refers to
 * @throws {Error} - If there's no link with the `rel` indicated, or the first
 *   matching link has no `href`
 */
export function urlFromLinkTag(
  window_: Window,
  rel: string,
  type: 'javascript' | 'html'
) {
  const link = window_.document.querySelector(
    `link[type="application/annotator+${type}"][rel="${rel}"]`
  ) as HTMLLinkElement | undefined;

  if (!link) {
    throw new Error(
      `No application/annotator+${type} (rel="${rel}") link in the document`
    );
  }

  if (!link.href) {
    throw new Error(
      `application/annotator+${type} (rel="${rel}") link has no href`
    );
  }

  return link.href;
}
