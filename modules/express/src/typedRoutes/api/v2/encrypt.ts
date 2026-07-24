import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { EncryptRequestBody } from '../v1/encrypt';

/**
 * Encrypt message
 *
 * Symmetrically encrypt an arbitrary message with provided password
 *
 * @operationId express.encrypt
 * @tag Express
 * @public
 */
export const PostV2Encrypt = httpRoute({
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
