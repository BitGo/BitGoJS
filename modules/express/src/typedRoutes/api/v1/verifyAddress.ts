import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const VerifyAddressBody = {
  /** Address which should be verified for correct format */
  address: t.string,
};

/**
 * Verify Address (v1)
 *
 * Verify that a given address string is valid for any supported coin.
 *
 * @operationId express.v1.verifyaddress
 * @tag Express
 * @private
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
