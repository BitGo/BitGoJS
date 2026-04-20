import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { CalculateMinerFeeInfoRequestBody, CalculateMinerFeeInfoResponse } from '../v1/calculateMinerFeeInfo';

/**
 * Calculate the fee and estimated size in bytes for a Bitcoin transaction
 *
 * @operationId express.calculateminerfeeinfo
 * @tag Express
 */
export const PostV2CalculateMinerFeeInfo = httpRoute({
  path: '/api/v2/calculateminerfeeinfo',
  method: 'POST',
  request: httpRequest({
    body: CalculateMinerFeeInfoRequestBody,
  }),
  response: {
    200: CalculateMinerFeeInfoResponse,
    400: BitgoExpressError,
    404: BitgoExpressError,
  },
});
