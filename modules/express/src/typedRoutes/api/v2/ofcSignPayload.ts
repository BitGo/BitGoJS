import * as t from 'io-ts';
import { Json, NonEmptyString, JsonFromString } from 'io-ts-types';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Sign an arbitrary payload using an OFC trading account key.
 */
export const OfcSignPayloadBody = {
  /** The ID of the OFC wallet to sign the payload with. */
  walletId: NonEmptyString,
  /** The payload to sign. */
  payload: t.union([Json, t.string.pipe(JsonFromString)]),
  /** The passphrase to decrypt the user key. */
  walletPassphrase: optional(t.string),
};

export const OfcSignPayloadResponse200 = t.type({
  payload: t.string,
  signature: t.string,
});

/**
 * Response for signing an arbitrary payload with an OFC wallet key.
 */
export const OfcSignPayloadResponse = {
  /** Signed payload and signature */
  200: OfcSignPayloadResponse200,
  /** BitGo Express error payload. */
  400: BitgoExpressError,
} as const;

/**
 * Request body for signing an arbitrary payload with an OFC wallet key.
 *
 * @operationId express.ofc.signPayload
 */
export const PostOfcSignPayload = httpRoute({
  path: '/api/v2/ofc/signPayload',
  method: 'POST',
  request: httpRequest({ body: OfcSignPayloadBody }),
  response: OfcSignPayloadResponse,
});
