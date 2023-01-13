/**
 * @prettier
 */
import Debug from 'debug';
import * as eol from 'eol';
import * as _ from 'lodash';
import * as sanitizeHtml from 'sanitize-html';
import * as superagent from 'superagent';
import * as urlLib from 'url';
import * as querystring from 'querystring';

import { ApiResponseError, BitGoRequest } from '@bitgo/sdk-core';

import { VerifyResponseOptions } from './types';
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
      return optionalField ? res.body[optionalField] : res.body;
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
 * Serialize request data based on the request content type
 * Note: Not sure this is still needed or even useful. Consider removing.
 * @param req
 */
export function serializeRequestData(req: superagent.Request): string | undefined {
  let data: string | Record<string, unknown> = (req as any)._data;
  if (typeof data !== 'string') {
    let contentType = req.get('Content-Type');
    // Parse out just the content type from the header (ignore the charset)
    if (contentType) {
      contentType = contentType.split(';')[0];
    }
    let serialize = superagent.serialize[contentType];
    if (!serialize && /[\/+]json\b/.test(contentType)) {
      serialize = superagent.serialize['application/json'];
    }
    if (serialize) {
      data = serialize(data);
      (req as any)._data = data;
      return data;
    }
  }
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

/**
 * Verify that the response received from the server is signed correctly.
 * Right now, it is very permissive with the timestamp variance.
 */
export function verifyResponse(
  bitgo: BitGoAPI,
  token: string | undefined,
  method: VerifyResponseOptions['method'],
  req: superagent.SuperAgentRequest,
  response: superagent.Response
): superagent.Response {
  // we can't verify the response if we're not authenticated
  if (!req.isV2Authenticated || !req.authenticationToken) {
    return response;
  }

  const verificationResponse = bitgo.verifyResponse({
    url: req.url,
    hmac: response.header.hmac,
    statusCode: response.status,
    text: response.text,
    timestamp: response.header.timestamp,
    token: req.authenticationToken,
    method,
  });

  if (!verificationResponse.isValid) {
    // calculate the HMAC
    const receivedHmac = response.header.hmac;
    const expectedHmac = verificationResponse.expectedHmac;
    const signatureSubject = verificationResponse.signatureSubject;
    // Log only the first 10 characters of the token to ensure the full token isn't logged.
    const partialBitgoToken = token ? token.substring(0, 10) : '';
    const errorDetails = {
      expectedHmac,
      receivedHmac,
      hmacInput: signatureSubject,
      requestToken: req.authenticationToken,
      bitgoToken: partialBitgoToken,
    };
    debug('Invalid response HMAC: %O', errorDetails);
    throw new ApiResponseError('invalid response HMAC, possible man-in-the-middle-attack', 511, errorDetails);
  }

  if (bitgo.getAuthVersion() === 3 && !verificationResponse.isInResponseValidityWindow) {
    const errorDetails = {
      timestamp: response.header.timestamp,
      verificationTime: verificationResponse.verificationTime,
    };
    debug('Server response outside response validity time window: %O', errorDetails);
    throw new ApiResponseError(
      'server response outside response validity time window, possible man-in-the-middle-attack',
      511,
      errorDetails
    );
  }
  return response;
}
