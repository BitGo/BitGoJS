import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const VerifyAddressBody = {
  address: t.string,
};

/**
 * Verify Address (v1)
 *
 * @operationId express.v1.verifyaddress
 * @tag express
 */
export const PostV1VerifyAddress = httpRoute({
  path: '/api/v1/verifyaddress',
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
