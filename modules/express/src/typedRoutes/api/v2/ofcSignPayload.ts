import * as t from 'io-ts';
import { Json, NonEmptyString } from 'io-ts-types';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';

/**
 * Sign an arbitrary payload using an OFC trading account key.
 * @operationId express.ofc.signPayload
 * POST /api/v2/ofc/signPayload
 */
export const OfcSignPayloadBody = {
  walletId: NonEmptyString,
  payload: Json,
  walletPassphrase: optional(t.string),
};

/**
 * Request body for signing an arbitrary payload with an OFC wallet key.
 * @property walletId – non-empty string identifying the OFC wallet
 * @property payload  – JSON value to sign
 * @property walletPassphrase – optional passphrase used to decrypt the user key (string)
 */
export const PostOfcSignPayload = httpRoute({
  path: '/api/v2/ofc/signPayload',
  method: 'POST',
  request: httpRequest({ body: OfcSignPayloadBody }),
  response: {
    200: t.type({ payload: t.string, signature: t.string }),
  },
});

export type PostOfcSignPayload = typeof PostOfcSignPayload;
