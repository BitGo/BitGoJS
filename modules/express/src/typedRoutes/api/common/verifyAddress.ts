import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const VerifyAddressBody = {
  address: t.string,
};

/**
 * Verify Address
 *
 * Basic address format validation. Returns whether the provided address is valid.
 * This endpoint does not require authentication.
 *
 * @operationId express.verifyaddress
 * @tag express
 */
export const PostVerifyAddress = httpRoute({
  path: '/api/v[12]/verifyaddress',
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
