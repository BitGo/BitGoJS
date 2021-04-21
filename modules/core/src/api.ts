/**
 * @prettier
 */
import * as superagent from 'superagent';
import * as urlLib from 'url';
import * as querystring from 'querystring';
import Debug from 'debug';

import { ApiResponseError } from './errors';
import { BitGo, VerifyResponseOptions } from './bitgo';

const debug = Debug('bitgo:api');

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
  bitgo: BitGo,
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
    const error: any = new Error(
      'server response outside response validity time window, possible man-in-the-middle-attack'
    );
    error.result = errorDetails;
    error.status = 511;
    throw error;
  }
  return response;
}
