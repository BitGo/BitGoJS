import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request body for signing OFC payloads
 */
export const OFCSignPayloadRequestBody = {
  /** The wallet ID */
  walletId: t.string,
  /** The payload to sign (can be a string or a JSON value) */
  payload: t.string,
  /** The wallet passphrase (optional) */
  walletPassphrase: optional(t.string),
} as const;

/**
 * Response for signing OFC payloads
 */
export const OFCSignPayloadResponse = t.type({
  /** The stringified payload that was signed */
  payload: t.string,
  /** The signature in hex format */
  signature: t.string,
});

/**
 * Sign a payload with an OFC wallet's private key
 *
 * This endpoint signs arbitrary payloads with the trading account key.
 * The behavior changes based on the configuration:
 * - In normal mode, it uses the wallet's trading account to sign
 * - In external signing mode, it uses a private key from the file system
 * - If externalSignerUrl is configured, it forwards the request to that URL
 *
 * @operationId express.v2.ofc.signpayload
 */
export const PostOFCSignPayload = httpRoute({
  path: '/api/v2/ofc/signPayload',
  method: 'POST',
  request: httpRequest({
    body: OFCSignPayloadRequestBody,
  }),
  response: {
    /** Successfully signed payload */
    200: OFCSignPayloadResponse,
    /** Invalid request or signing fails */
    400: BitgoExpressError,
    /** Wallet not found */
    404: BitgoExpressError,
    /** Server configuration error */
    500: BitgoExpressError,
  },
});

/**
 * Export the type for use in other files
 */
export type PostOFCSignPayload = typeof PostOFCSignPayload;
