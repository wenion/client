import { replaceURLParams } from '../util/url';

/**
 * @typedef {import('../../types/api').RouteMap} RouteMap
 * @typedef {import('../../types/api').RouteMetadata} RouteMetadata
 */

/**
 * Return a shallow clone of `obj` with all client-only properties removed.
 * Client-only properties are marked by a '$' prefix.
 *
 * @param {Record<string, unknown>} obj
 */
function stripInternalProperties(obj) {
  /** @type {Record<string, unknown>} */
  const result = {};
  for (let [key, value] of Object.entries(obj)) {
    if (!key.startsWith('$')) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * @template {object} Body
 * @typedef APIResponse
 * @prop {Body} data -
 *  The JSON response from the API call, unless this call returned a
 *  "204 No Content" status.
 * @prop {string|null} token - The access token that was used to make the call
 *   or `null` if unauthenticated.
 */

/**
 * Types of value that can be passed as a parameter to API calls.
 *
 * @typedef {string|number|boolean} Param
 */

/**
 * Callbacks invoked at various points during an API call to get an access token etc.
 *
 * @typedef APIMethodCallbacks
 * @prop {() => Promise<string|null>} getAccessToken -
 *   Function which acquires a valid access token for making an API request.
 * @prop {() => string|null} getClientId -
 *   Function that returns a per-session client ID to include with the request
 *   or `null`.
 * @prop {() => void} onRequestStarted - Callback invoked when the API request starts.
 * @prop {() => void} onRequestFinished - Callback invoked when the API request finishes.
 */

/**
 * @param {RouteMap|RouteMetadata} link
 * @return {link is RouteMetadata}
 */
function isRouteMetadata(link) {
  return 'url' in link;
}

/**
 * Lookup metadata for an API route in the result of an `/api/` response.
 *
 * @param {RouteMap} routeMap
 * @param {string} route - Dot-separated path of route in `routeMap`
 */
function findRouteMetadata(routeMap, route) {
  /** @type {RouteMap} */
  let cursor = routeMap;
  const pathSegments = route.split('.');
  for (let [index, segment] of pathSegments.entries()) {
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
  links,
  route,
  { getAccessToken, getClientId, onRequestStarted, onRequestFinished }
) {
  return async (params, data, filename) => {
    onRequestStarted();
    try {
      const [linksMap, token] = await Promise.all([links, getAccessToken()]);
      const descriptor = findRouteMetadata(linksMap, route);
      if (!descriptor) {
        throw new Error(`Missing API route: ${route}`);
      }

      /** @type {Record<string, string>} */
      const headers = {
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
        if (!Array.isArray(value)) {
          value = [value];
        }
        for (let item of value) {
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
