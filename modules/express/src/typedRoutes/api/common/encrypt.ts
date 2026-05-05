import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Symmetrically encrypt an arbitrary message with provided password
 */
export const EncryptRequestBody = {
  /** Plaintext message which should be encrypted */
  input: t.string,
  /** Password which should be used to encrypt message */
  password: optional(t.string),
  /** Additional authenticated data for AES-GCM encryption (optional) */
  adata: optional(t.string),
};

/**
 * Encrypt messages
 *
 * Symmetrically encrypt an arbitrary message with provided password
 *
 * @operationId express.encrypt
 * @tag Express
 * @public
 */
export const PostEncrypt = httpRoute({
  path: '/api/v2/encrypt',
  method: 'POST',
  request: httpRequest({
    body: EncryptRequestBody,
  }),
  response: {
    200: t.type({
      /** Encrypted ciphertext */
      encrypted: t.string,
    }),
    404: BitgoExpressError,
  },
});
