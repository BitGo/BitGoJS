import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request body for encrypting data
 *
 * Symmetrically encrypt an arbitrary message with provided password
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
      encrypted: t.string,
    }),
    404: BitgoExpressError,
  },
});
