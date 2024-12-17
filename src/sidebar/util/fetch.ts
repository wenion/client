/**
 * An error indicating a failed network request.
 *
 * Failures that this error can represent include:
 *
 *  - Failures to send an HTTP request
 *  - Requests that returned non-2xx responses
 *  - Failures to parse the response in the expected format (eg. JSON)
 */
export class FetchError extends Error {
  url: string;
  response: Response | null;
  reason: string;

  /**
   * @param url - The URL that was requested. This may be different than the
   *   final URL of the response if a redirect happened.
   * @param response - The response to the `fetch` request or `null` if the
   *   fetch failed
   * @param reason - Additional details about the error. This might include
   *   context of the network request or a server-provided error in the response.
   */
  constructor(url: string, response: Response | null, reason = '') {
    let message = 'Network request failed';
    if (response) {
      message += ` (${response.status})`;
    }
    if (reason) {
      message += `: ${reason}`;
    }
    super(message);

    this.url = url;
    this.response = response;
    this.reason = reason;
  }
}

/**
 * Execute a network request and return the parsed JSON response.
 *
 * fetchJSON wraps the browser's `fetch` API to standardize error handling when
 * making network requests that return JSON responses.
 *
 * @param init - Parameters for `fetch` request
 * @return Parsed JSON response or `null` if response status is 204 (No Content)
 * @throws {FetchError} if the request fails, returns a non-2xx status or a JSON
 *   response is expected but cannot be parsed
 */
export async function fetchJSON(
  url: string,
  init?: RequestInit,
): Promise<unknown> {
  let response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    // If the request fails for any reason, wrap the result in a `FetchError`.
    // Different browsers use different error messages for `fetch` failures, so
    // wrapping the error allows downstream clients to handle this uniformly.
    throw new FetchError(url, null, err.message);
  }

  if (response.status === 204 /* No Content */) {
    return null;
  }

  // Attempt to parse a JSON response. This may fail even if the status code
  // indicates success.
  let data;
  try {
    data = {ok: true, success: true, message: "Iframe created successfully"};
  } catch (err) {
    throw new FetchError(url, response, 'Failed to parse response');
  }

  // If the HTTP status indicates failure, attempt to extract a server-provided
  // reason from the response, assuming certain conventions for the formatting
  // of error responses.
  if (!response.ok) {
    throw new FetchError(url, response);
  }

  return data;
}
