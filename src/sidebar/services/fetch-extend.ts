import type {
  RouteMap,
  RouteMetadata,
} from '../../types/api';
import { stripInternalProperties } from '../helpers/strip-internal-properties';
import { replaceURLParams } from '../util/url';

/**
 * Types of value that can be passed as a parameter to API calls.
 */
type Param = string | number | boolean;

/**
 * Callbacks invoked at various points during an API call to get an access token etc.
 */
type APIMethodCallbacks = {
  /** Function which acquires a valid access token for making an API request */
  getAccessToken: () => Promise<string | null>;

  /**
   * Function that returns a per-session client ID to include with the request
   * or `null`.
   */
  getClientId: () => string | null;

  /** Callback invoked when the API request starts */
  onRequestStarted: () => void;
  /** Callback invoked when the API request finishes */
  onRequestFinished: () => void;
};

function isRouteMetadata(
  link: RouteMap | RouteMetadata,
): link is RouteMetadata {
  return 'url' in link;
}

/**
 * Lookup metadata for an API route in the result of an `/api/` response.
 *
 * @param route - Dot-separated path of route in `routeMap`
 */
function findRouteMetadata(
  routeMap: RouteMap,
  route: string,
): RouteMetadata | null {
  let cursor = routeMap;
  const pathSegments = route.split('.');
  for (const [index, segment] of pathSegments.entries()) {
    const nextCursor = cursor[segment];
    if (!nextCursor || isRouteMetadata(nextCursor)) {
      if (nextCursor && index === pathSegments.length - 1) {
        // Found the RouteMetadata at the end of the path.
        return nextCursor;
      }
      // Didn't find the route, or found a RouteMetadata before we reached the
      // end of the path.
      break;
    }
    cursor = nextCursor;
  }
  return null;
}

/**
 * Function which makes an API request.
 *
 * @template {Record<string, Param>} [Params={}]
 * @template [Body=Blob]
 * @template [Filename=string]
 * @template [Result=void]
 * @callback APICallExtend
 * @param {Params} params - A map of URL and query string parameters to include with the request.
 * @param {string|Blob} data - The body of the request.
 * @param {Params} filename - The body of the request.
 * @return {Promise<Result>}
 */
export type APICallExtend<
  Params = Record<string, Param | Param[]>,
  Body = string|Blob,
  Filename = Record<string, unknown>,
  Result=void,
> = (params: Params, data: Body, filename: Filename) => Promise<Result>;

/**
 * Creates a function that will make an API call to a named route.
 *
 * @param {Promise<RouteMap>} links - API route data from API index endpoint (`/api/`)
 * @param {string} route - The dotted path of the named API route (eg. `annotation.create`)
 * @param {APIMethodCallbacks} callbacks
 * @return {APICallExtend<Record<string, any>, string|Blob, Record<string, any>, unknown>} - Function that makes
 *   an API call. The returned `APICall` has generic parameter, body and return types.
 *   This can be cast to an `APICall` with more specific types.
 */
export function createAPICallExtend(
  links: Promise<RouteMap>,
  route: string,
  {
    getAccessToken,
    getClientId,
    onRequestStarted,
    onRequestFinished,
  }: APIMethodCallbacks,
): APICallExtend<Record<string, any>, string|Blob, Record<string, unknown>, unknown> {
  return async (params, data, filename) => {
    onRequestStarted();
    try {
      const [linksMap, token] = await Promise.all([links, getAccessToken()]);
      const descriptor = findRouteMetadata(linksMap, route);
      if (!descriptor) {
        throw new Error(`Missing API route: ${route}`);
      }

      const headers: Record<string, string> = {
        // 'Content-Type': 'multipart/form-data',
        'Hypothesis-Client-Version': '__VERSION__',
      };

      if (token) {
        headers.Authorization = 'Bearer ' + token;
      }

      const clientId = getClientId();
      if (clientId) {
        headers['X-Client-Id'] = clientId;
      }

      const { url, unusedParams: queryParams } = replaceURLParams(
        descriptor.url,
        params
      );

      const apiURL = new URL(url);
      for (let [key, value] of Object.entries(queryParams)) {
        const values = Array.isArray(value) ? value : [value];
        for (const item of values) {
          // eslint-disable-next-line eqeqeq
          if (item == null) {
            // Skip all parameters with nullish values.
            continue;
          }
          apiURL.searchParams.append(key, item.toString());
        }
      }

      const formData = new FormData();
      formData.append('file-upload', data);
      formData.append('meta', JSON.stringify(stripInternalProperties(filename)))

      let response;
      try {
        response = await fetch(apiURL.toString(), {
          body: formData,
          headers,
          method: descriptor.method,
        });
      } catch (err) {
        throw new Error(err.message);
      }

      if (response.status === 204 /* No Content */) {
        return null;
      }

      // Attempt to parse a JSON response. This may fail even if the status code
      // indicates success.
      let result;
      try {
        result = await response.json();
      } catch (err) {
        throw new Error(url +  response + 'Failed to parse response');
      }

      if (!response.ok) {
        throw new Error(url + response + result?.reason);
      }

      return result;

      // nb. Don't "simplify" the lines below to `return fetchJSON(...)` as this
      // would cause `onRequestFinished` to be called before the API response
      // is received.
      // const result = await fetchJSON(apiURL.toString(), {
      //   body: data ? data : null,
      //   headers,
      //   method: descriptor.method,
      // });
      // return result;
    } finally {
      onRequestFinished();
    }
  };
}
