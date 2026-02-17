/**
 * @prettier
 */
import Debug from 'debug';
import eol from 'eol';
import _ from 'lodash';
import sanitizeHtml from 'sanitize-html';
import superagent from 'superagent';
import urlLib from 'url';
import querystring from 'querystring';

import { ApiResponseError, BitGoRequest } from '@bitgo/sdk-core';

import { AuthVersion, VerifyResponseOptions } from './types';
import { BitGoAPI } from './bitgoAPI';

const debug = Debug('bitgo:api');

/**
 * Add the bitgo-specific result() function on a superagent request.
 *
 * If the server response is successful, the `result()` function will return either the entire response body,
 * or the field from the response body specified by the `optionalField` parameter if it is provided.
 *
 * If the server response with an error, `result()` will handle HTTP errors appropriately by
 * rethrowing them as an `ApiResponseError` if possible, and otherwise rethrowing the underlying response error.
 *
 * @param req
 */
export function toBitgoRequest<ResponseResultType = any>(
  req: superagent.SuperAgentRequest
): BitGoRequest<ResponseResultType> {
  return Object.assign(req, {
    result(optionalField?: string) {
      return req.then(
        (response) => handleResponseResult<ResponseResultType>(optionalField)(response),
        (error) => handleResponseError(error)
      );
    },
  });
}

/**
 * Return a function which extracts the specified response body property from the response if successful,
 * otherwise throw an `ApiErrorResponse` parsed from the response body.
 * @param optionalField
 */
export function handleResponseResult<ResponseResultType>(
  optionalField?: string
): (res: superagent.Response) => ResponseResultType {
  return function (res: superagent.Response): ResponseResultType {
    if (_.isNumber(res.status) && res.status >= 200 && res.status < 300) {
      return (
        // If there's an optional field and the body is non-nullish with that property, return it;
        // otherwise return the body if available; if not, return the text; and finally fallback to the entire response.
        (optionalField && res.body && res.body[optionalField] !== undefined ? res.body[optionalField] : res.body) ??
        res.text ??
        res
      );
    }
    throw errFromResponse(res);
  };
}

/**
 * Extract relevant information from a successful response (that is, a response with an HTTP status code
 * between 200 and 299), but which resulted in an application specific error and use it to construct and
 * throw an `ApiErrorResponse`.
 *
 * @param res
 */
function errFromResponse<ResponseBodyType>(res: superagent.Response): ApiResponseError {
  const message = createResponseErrorString(res);
  const status = res.status;
  const result = res.body as ResponseBodyType;
  const invalidToken = _.has(res.header, 'x-auth-required') && res.header['x-auth-required'] === 'true';
  const needsOtp = res.body?.needsOTP !== undefined;
  return new ApiResponseError(message, status, result, invalidToken, needsOtp);
}

/**
 * Handle an error or an error containing an HTTP response and use it to throw a well-formed error object.
 *
 * @param e
 */
export function handleResponseError(e: Error & { response?: superagent.Response }): never {
  if (e.response) {
    throw errFromResponse(e.response);
  }
  throw e;
}

/**
 * There are many ways a request can fail, and may ways information on that failure can be
 * communicated to the client. This function tries to handle those cases and create a sane error string
 * @param res Response from an HTTP request
 */
function createResponseErrorString(res: superagent.Response): string {
  let errString = res.status.toString(); // at the very least we'll have the status code
  if (res.body?.error) {
    // this is the case we hope for, where the server gives us a nice error from the JSON body
    errString = res.body.error;
  } else if (res.text) {
    // if the response came back as text, we try to parse it as HTML and remove all tags, leaving us
    // just the bare text, which we then trim of excessive newlines and limit to a certain length
    try {
      let sanitizedText = sanitizeHtml(res.text, { allowedTags: [] });
      sanitizedText = sanitizedText.trim();
      sanitizedText = eol.lf(sanitizedText); // use '\n' for all newlines
      sanitizedText = _.replace(sanitizedText, /\n[ |\t]{1,}\n/g, '\n\n'); // remove the spaces/tabs between newlines
      sanitizedText = _.replace(sanitizedText, /[\n]{3,}/g, '\n\n'); // have at most 2 consecutive newlines
      sanitizedText = sanitizedText.substring(0, 5000); // prevent message from getting too large
      errString = errString + '\n' + sanitizedText; // add it to our existing errString (at this point the more info the better!)
    } catch (e) {
      // do nothing, the response's HTML was too wacky to be parsed cleanly
      debug('got error with message "%s" while creating response error string from response: %s', e.message, res.text);
    }
  }

  return errString;
}

/**
 * Serialize request data based on the request content type.
 * If data is already a string, returns it as-is to preserve exact bytes for HMAC.
 * If data is a Buffer, converts to UTF-8 string.
 * If data is an object, serializes it based on Content-Type.
 * @param req
 */
export function serializeRequestData(req: superagent.Request): string | undefined {
  const data: string | Buffer | Record<string, unknown> | undefined = (req as any)._data;

  if (typeof data === 'string') {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    // Convert Buffer to UTF-8 string and mutate _data to ensure consistency.
    // This is critical: if _data stays as a Buffer, superagent will serialize it
    // as JSON ({"type":"Buffer","data":[...]}), which won't match the HMAC.
    // By mutating to string, superagent sends the exact bytes we hash.
    // This is safe for retries: calling again with a string will hit the early return above.
    const stringData = data.toString('utf8');
    (req as any)._data = stringData;
    return stringData;
  }

  if (data === undefined || data === null) {
    return undefined;
  }

  // Serialize object data based on Content-Type
  let contentType = req.get('Content-Type');
  // Parse out just the content type from the header (ignore the charset)
  if (contentType) {
    contentType = contentType.split(';')[0].trim();
  }
  let serialize: ((body: unknown) => string) | undefined;
  const serializers = superagent.serialize as Record<string, unknown>;
  if (contentType) {
    if (Object.prototype.hasOwnProperty.call(serializers, contentType)) {
      const candidate = serializers[contentType];
      if (typeof candidate === 'function') {
        serialize = candidate as (body: unknown) => string;
      }
    } else if (/[\/+]json\b/.test(contentType)) {
      // Fall back to the built-in JSON serializer for JSON-like content types
      if (Object.prototype.hasOwnProperty.call(serializers, 'application/json')) {
        const jsonSerializer = serializers['application/json'];
        if (typeof jsonSerializer === 'function') {
          serialize = jsonSerializer as (body: unknown) => string;
        }
      }
    }
  }

  if (serialize) {
    const serialized = serialize(data);
    (req as any)._data = serialized;
    return serialized;
  }

  return undefined;
}

/**
 * Set the superagent query string correctly for browsers or node.
 * @param req
 */
export function setRequestQueryString(req: superagent.SuperAgentRequest): void {
  const urlDetails = urlLib.parse(req.url);

  let queryString: string | undefined;
  const query: string[] = (req as any)._query;
  const qs: { [key: string]: string } = (req as any).qs;
  if (query && query.length > 0) {
    // browser version
    queryString = query.join('&');
    (req as any)._query = [];
  } else if (qs) {
    // node version
    queryString = querystring.stringify(qs);
    (req as any).qs = null;
  }

  if (queryString) {
    if (urlDetails.search) {
      urlDetails.search += '&' + queryString;
    } else {
      urlDetails.search = '?' + queryString;
    }
    req.url = urlLib.format(urlDetails);
  }
}

/** Result from version-specific response verification. */
interface ResponseVerificationResult {
  verificationResult: {
    isValid: boolean;
    expectedHmac: string;
    isInResponseValidityWindow: boolean;
    verificationTime: number;
  };
  hmacErrorDetails: Record<string, unknown>;
  responseTimestamp: string | number;
}

/**
 * Verify a v4 server response HMAC.
 *
 * Returns undefined if the server didn't sign the response (e.g. error before
 * auth middleware ran), signalling the caller to pass the response through
 * without verification.
 *
 * @param authToken - The raw access token (HMAC key). Guaranteed non-undefined by the caller.
 */
function verifyV4ResponseHeaders(
  bitgo: BitGoAPI,
  method: VerifyResponseOptions['method'],
  req: superagent.SuperAgentRequest,
  response: superagent.Response,
  authToken: string
): ResponseVerificationResult | undefined {
  const hmac = response.header['x-signature'];
  const timestamp = response.header['x-request-timestamp'];
  const authRequestId = response.header['x-auth-request-id'];

  if (!hmac || !timestamp) {
    // Server didn't sign the response. This can happen legitimately when the
    // request fails before reaching the auth middleware (e.g. 401/404).
    debug(
      'v4 response verification skipped: server response (status %d) missing HMAC headers (x-signature: %s, x-request-timestamp: %s)',
      response.status,
      hmac ? 'present' : 'missing',
      timestamp ? 'present' : 'missing'
    );
    return undefined;
  }

  // Hash the raw response body bytes.
  // Convert response.text to a Buffer (UTF-8) so we're hashing the actual bytes,
  // not relying on Node's implicit string encoding in crypto.update().
  const rawResponseBuffer = Buffer.from(response.text || '');
  const bodyHashHex = bitgo.calculateBodyHash(rawResponseBuffer);

  // req.v4PathWithQuery is always set by requestPatch; fallback parses req.url as a safety net.
  let pathWithQuery = req.v4PathWithQuery;
  if (!pathWithQuery) {
    const parsedUrl = new URL(req.url);
    pathWithQuery = parsedUrl.pathname + parsedUrl.search;
  }

  const result = bitgo.verifyResponse({
    hmac,
    timestampSec: Number(timestamp),
    method: req.v4Method || method,
    pathWithQuery,
    bodyHashHex,
    authRequestId: authRequestId || req.v4AuthRequestId || '',
    statusCode: response.status,
    rawToken: authToken,
  });

  return {
    verificationResult: result,
    responseTimestamp: timestamp,
    hmacErrorDetails: { expectedHmac: result.expectedHmac, receivedHmac: hmac, preimage: result.preimage },
  };
}

/**
 * Verify a v2/v3 server response HMAC.
 *
 * @param authToken - The raw access token (HMAC key). Guaranteed non-undefined by the caller.
 */
function verifyV2V3ResponseHeaders(
  bitgo: BitGoAPI,
  token: string | undefined,
  method: VerifyResponseOptions['method'],
  req: superagent.SuperAgentRequest,
  response: superagent.Response,
  authVersion: AuthVersion,
  authToken: string
): ResponseVerificationResult {
  const result = bitgo.verifyResponse({
    url: req.url,
    hmac: response.header.hmac,
    statusCode: response.status,
    text: response.text,
    timestamp: response.header.timestamp,
    token: authToken,
    method,
    authVersion,
  });

  const partialBitgoToken = token ? token.substring(0, 10) : '';
  return {
    verificationResult: result,
    responseTimestamp: response.header.timestamp,
    hmacErrorDetails: {
      expectedHmac: result.expectedHmac,
      receivedHmac: response.header.hmac,
      hmacInput: result.signatureSubject,
      requestToken: authToken,
      bitgoToken: partialBitgoToken,
    },
  };
}

/**
 * Verify that the response received from the server is signed correctly.
 * Right now, it is very permissive with the timestamp variance.
 */
export function verifyResponse(
  bitgo: BitGoAPI,
  token: string | undefined,
  method: VerifyResponseOptions['method'],
  req: superagent.SuperAgentRequest,
  response: superagent.Response,
  authVersion: AuthVersion
): superagent.Response {
  // we can't verify the response if we're not authenticated
  if (!req.isV2Authenticated || !req.authenticationToken) {
    return response;
  }

  // --- Build version-specific params, call bitgo.verifyResponse(), collect error context ---
  // req.authenticationToken is guaranteed non-undefined here (checked above).
  const authToken = req.authenticationToken as string;
  let result: ResponseVerificationResult;

  if (authVersion === 4) {
    const v4Result = verifyV4ResponseHeaders(bitgo, method, req, response, authToken);
    if (!v4Result) {
      // Server didn't sign the response — pass through without verification
      return response;
    }
    result = v4Result;
  } else {
    result = verifyV2V3ResponseHeaders(bitgo, token, method, req, response, authVersion, authToken);
  }

  // --- Common validation for all auth versions ---
  const { verificationResult, hmacErrorDetails, responseTimestamp } = result;

  if (!verificationResult.isValid) {
    debug('Invalid response HMAC: %O', hmacErrorDetails);
    throw new ApiResponseError('invalid response HMAC, possible man-in-the-middle-attack', 511, hmacErrorDetails);
  }

  // v3 and v4 enforce the response validity window; v2 does not
  if (authVersion >= 3 && !verificationResult.isInResponseValidityWindow) {
    const errorDetails = { timestamp: responseTimestamp, verificationTime: verificationResult.verificationTime };
    debug('Server response outside response validity time window: %O', errorDetails);
    throw new ApiResponseError(
      'server response outside response validity time window, possible man-in-the-middle-attack',
      511,
      errorDetails
    );
  }

  return response;
}
