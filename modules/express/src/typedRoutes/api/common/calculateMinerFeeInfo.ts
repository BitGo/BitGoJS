import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const CalculateMinerFeeInfoRequestBody = {
  /** fee rate in satoshis per kilobyte, if not provided a fallback fee rate will be used */
  feeRate: optional(t.number),
  /** number of P2SH (multisig) inputs in the transaction */
  nP2shInputs: t.number,
  /** number of P2PKH (single sig) inputs in the transaction */
  nP2pkhInputs: t.number,
  /** number of P2SH-P2WSH (segwit) inputs in the transaction */
  nP2shP2wshInputs: t.number,
  /** number of outputs in the transaction */
  nOutputs: t.number,
  /** whether the transaction contains uncompressed public keys (affects size calculation) */
  containsUncompressedPublicKeys: optional(t.boolean),
};

export const CalculateMinerFeeInfoResponse = t.type({
  /** estimated size of the transaction in bytes */
  size: t.number,
  /** estimated fee in satoshis for the transaction */
  fee: t.number,
  /** fee rate that was used to estimate the fee (in satoshis per kilobyte) */
  feeRate: t.number,
});

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
 */
export const PostCalculateMinerFeeInfo = httpRoute({
  path: '/api/v[12]/calculateminerfeeinfo',
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
