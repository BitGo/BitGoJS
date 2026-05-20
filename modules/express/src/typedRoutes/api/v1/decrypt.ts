import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const DecryptRequestBody = {
  /** Ciphertext to decrypt */
  input: t.string,
  /** Key which is used for decryption */
  password: optional(t.string),
};

/**
 * Decrypt message (v1)
 *
 * Decrypts an encrypted string using the provided password.
 *
 * @operationId express.v1.decrypt
 * @tag Express
 * @private
 */
export const PostV1Decrypt = httpRoute({
  path: '/api/v1/decrypt',
  method: 'POST',
  request: httpRequest({
    body: DecryptRequestBody,
  }),
  response: {
    200: t.type({
      decrypted: t.string,
    }),
    404: BitgoExpressError,
  },
});
