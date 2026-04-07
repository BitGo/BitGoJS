import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { CalculateMinerFeeInfoRequestBody, CalculateMinerFeeInfoResponse } from '../v1/calculateMinerFeeInfo';

/**
 * Calculate miner fee info
 *
 * Calculates the estimated size and fee for a transaction based on the number and types of inputs and outputs.
 * This is useful for estimating the fee before creating a transaction.
 *
 * The calculation takes into account:
 * 1. The number and types of inputs (P2SH, P2PKH, P2SH-P2WSH)
 * 2. The number of outputs
 * 3. Whether the transaction contains uncompressed public keys
 * 4. The fee rate (in satoshis per kilobyte)
 *
 * @operationId express.calculateminerfeeinfo
 * @tag express
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
