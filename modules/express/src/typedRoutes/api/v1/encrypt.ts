import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const EncryptRequestBody = {
  /** Plaintext message which should be encrypted */
  input: t.string,
  /** Password which should be used to encrypt message */
  password: optional(t.string),
  adata: optional(t.string),
};

/**
 * Encrypt message (v1)
 *
 * Symmetrically encrypt an arbitrary message with provided password
 *
 * @operationId express.v1.encrypt
 * @tag Express
 * @private
 */
export const PostV1Encrypt = httpRoute({
  path: '/api/v1/encrypt',
  method: 'POST',
  request: httpRequest({
    body: EncryptRequestBody,
  }),
  response: {
    200: t.type({
      encrypted: t.string,
    }),
    404: BitgoExpressError,
  },
});
