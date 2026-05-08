import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { VerifyAddressBody } from '../v1/verifyAddress';

/**
 * Verify Address
 *
 * Verify that a given address string is valid for any supported coin.
 *
 * @operationId express.verifyaddress
 * @tag Express
 * @public
 */
export const PostV2VerifyAddress = httpRoute({
  path: '/api/v2/verifyaddress',
  method: 'POST',
  request: httpRequest({
    body: VerifyAddressBody,
  }),
  response: {
    200: t.type({
      verified: t.boolean,
    }),
    404: BitgoExpressError,
  },
});
