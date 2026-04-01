import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request body for encrypting data
 *
 * Accepts a plaintext string and optional password to encrypt using AES-256-GCM.
 */
export const EncryptRequestBody = {
  /** The plaintext string to encrypt */
  input: t.string,
  /** The password used as the encryption key */
  password: optional(t.string),
  /** Additional authenticated data included in encryption but not encrypted itself */
  adata: optional(t.string),
};

/**
 * Encrypt data using AES-256-GCM via the SJCL library
 *
 * Encrypts a plaintext string using the provided password. Returns the encrypted
 * ciphertext that can later be decrypted using the decrypt endpoint with the same password.
 *
 * @operationId express.v2.encrypt
 * @tag Express
 * @public
 */
export const PostEncryptV2 = httpRoute({
  path: '/api/v2/encrypt',
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
