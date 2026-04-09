import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const EncryptRequestBody = {
  input: t.string,
  password: optional(t.string),
  adata: optional(t.string),
};

/**
 * Encrypt
 *
 * @operationId express.encrypt
 * @tag express
 */
export const PostEncrypt = httpRoute({
  path: '/api/v[12]/encrypt',
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
