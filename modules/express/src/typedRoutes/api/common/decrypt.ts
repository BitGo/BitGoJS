import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const DecryptRequestBody = {
  input: t.string,
  password: optional(t.string),
};

/**
 * Decrypt
 *
 * @operationId express.decrypt
 * @tag express
 */
export const PostDecrypt = httpRoute({
  path: '/api/v[12]/decrypt',
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
