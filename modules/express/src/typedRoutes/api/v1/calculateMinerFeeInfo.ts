import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

export const CalculateMinerFeeInfoRequestBody = {
  /** Custom minimum fee rate in a coin's base unit per kilobyte (or virtual kilobyte)--for example, satoshis per kvByte or microAlgos per kByte. If the applied `feeRate` does not meet a coin's required minimum transaction fee amount, the minimum is still applied (for example, 1000 sat/kvByte or a flat 1000 microAlgos) */
  feeRate: optional(t.number),
  /** Number of P2SH (multi-signature) inputs */
  nP2shInputs: t.number,
  /** Number of P2PKH (single-signature) inputs */
  nP2pkhInputs: t.number,
  /** Number of P2SH_P2WSH (wrapped segwit multi-signature) inputs */
  nP2shP2wshInputs: t.number,
  /** Number of outputs */
  nOutputs: t.number,
  /** whether the transaction contains uncompressed public keys (affects size calculation) */
  containsUncompressedPublicKeys: optional(t.boolean),
};

export const CalculateMinerFeeInfoResponse = t.type({
  /** Estimated size of the transaction in bytes */
  size: t.number,
  /** Estimated fee in base units for the transaction */
  fee: t.number,
  /** The fee rate in base units per kB used to estimate the fee for the transaction */
  feeRate: t.number,
});

/**
 * Calculate the fee and estimated size in bytes for a Bitcoin transaction
 *
 * @operationId express.v1.calculateminerfeeinfo
 * @tag Express
 * @private
 */
export const PostV1CalculateMinerFeeInfo = httpRoute({
  path: '/api/v1/calculateminerfeeinfo',
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
