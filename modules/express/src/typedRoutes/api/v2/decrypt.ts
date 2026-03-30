import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const DecryptRequestBody = {
  /** The encrypted ciphertext string to decrypt */
  input: t.string,
  /** The password used as the decryption key (must match the password used to encrypt) */
  password: optional(t.string),
};

/**
 * Decrypt data using AES-256-GCM via the SJCL library
 *
 * Decrypts a ciphertext string that was previously encrypted using the encrypt endpoint.
 * Requires the same password that was used during encryption.
 *
 * @operationId express.v2.decrypt
 * @tag Express
 * @public
 */
export const PostDecryptV2 = httpRoute({
  path: '/api/v2/decrypt',
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
