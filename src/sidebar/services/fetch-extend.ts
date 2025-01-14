import type {
  RouteMap,
  RouteMetadata,
} from '../../types/api';
import { replaceURLParams } from '../util/url';

/**
 * Types of value that can be passed as a parameter to API calls.
 */
type Param = string | number | boolean;

type XHRCallback = {
  /**
   * Callback triggered during the progress of the file upload/download.
   * It provides the loaded bytes and total bytes to track progress.
   *
   * @param loaded - The number of bytes that have been loaded so far.
   * @param total - The total number of bytes that need to be loaded.
   */
  onProgress: (loaded: number, total: number) => void;

  /**
   * Callback triggered when the XHR request is successfully completed.
   * This is usually fired once the request finishes loading.
   */
  onFinished: () => void;

  /**
   * Callback to set the abort function for the XHR request.
   * This function allows external code to abort the request.
   *
   * @param abort - The function to abort the XHR request.
   */
  onAbortReference: (abort: () => void) => void;
};

/**
 * Function which makes an API request.
 * @param params - A map of URL and query string parameters to include with the request.
 * @param data - The body of the request.
 * @param xhrCallback - These functions are triggered by the XHR's progress, load, and abort events.
 */
export type APIBlobCall<
  Params = Record<string, Param | Param[]>,
  Body = void,
  Result = void,
> = (
  params: Params,
  data: Body,
  { onProgress, onFinished, onAbortReference }: XHRCallback,
) => Promise<Result>;

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

type APIMethodXHRCallbacks = {
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

export function createAPIBlobXHRCall(
  links: Promise<RouteMap>,
  route: string,
  {
    getAccessToken,
    getClientId,
    onRequestStarted,
    onRequestFinished,
  }: APIMethodXHRCallbacks,
): APIBlobCall<
  Record<string, any>,
  Blob,
  unknown
> {
  return async (params, data, {onProgress, onFinished, onAbortReference}) => {
    const [linksMap, token] = await Promise.all([links, getAccessToken()]);
    return new Promise((resolve, reject) => {
      onRequestStarted();
      try {
        const descriptor = findRouteMetadata(linksMap, route);
        if (!descriptor) {
          throw new Error(`Missing API route: ${route}`);
        }

        const { url, unusedParams: extraParams } = replaceURLParams(
          descriptor.url,
          params,
        );
        const apiURL = new URL(url);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", apiURL.toString());
        // xhr.setRequestHeader('Content-Type', 'multipart/form-data');
        xhr.setRequestHeader('Hypothesis-Client-Version', '__VERSION__');

        if (token) {
          xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        }

        const clientId = getClientId();
        if (clientId) {
          xhr.setRequestHeader('X-Client-Id', clientId);
        }
        // Set response type to json so that XHR automatically parses the response
        // xhr.responseType = "json";

        const formData = new FormData();
        formData.append('file', data);
        for (const [key, value] of Object.entries(extraParams)) {
          const values = Array.isArray(value) ? value : [value];
          for (const item of values) {
            // eslint-disable-next-line eqeqeq
            if (item == null) {
              // Skip all parameters with nullish values.
              continue;
            }
            // apiURL.searchParams.append(key, item.toString());
            formData.append(key, item.toString());
          }
        }

        xhr.onload = function () {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data); // Resolve the Promise with the response text
            } catch (err) {
              throw new Error(`Failed to parse response: ${url}`);
            }
          } else {
              reject(`Error: ${xhr.status} ${xhr.statusText}`); // Reject with error message
          }
        };

        xhr.onerror = function () {
          reject("Request failed");
        };

        xhr.onloadend = function () {
          onFinished();
        };

        xhr.onabort = function () {
          reject("Request abort");
        };

        onAbortReference(() => {
          xhr.abort();
          console.log("inside, abort")
        });

        xhr.upload.onprogress = function (e) {
          onProgress(e.loaded, e.total);
        };

        xhr.send(formData);

      } finally {
        onRequestFinished();
      }
    });
  };
}
