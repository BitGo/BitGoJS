import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for fanning out unspents in a wallet (v2)
 */
export const FanoutUnspentsRequestParams = {
  /** The coin identifier (e.g., 'btc', 'tbtc') */
  coin: t.string,
  /** The ID of the wallet */
  id: t.string,
} as const;

/**
 * Request body for fanning out unspents in a wallet (v2)
 *
 * This endpoint supports the full set of parameters available in the BitGo SDK
 * for advanced UTXO management. The fanout operation takes existing unspents and
 * creates a larger number of equally-sized outputs for improved transaction parallelization.
 */
export const FanoutUnspentsRequestBody = {
  /** The wallet passphrase to decrypt the user key */
  walletPassphrase: optional(t.string),
  /** The extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),
  /** The number of new unspents to create */
  numUnspentsToMake: optional(t.number),
  /** Minimum value of unspents to use (in base units) */
  minValue: optional(t.union([t.number, t.string])),
  /** Maximum value of unspents to use (in base units) */
  maxValue: optional(t.union([t.number, t.string])),
  /** Minimum block height of unspents to use */
  minHeight: optional(t.number),
  /** Minimum number of confirmations needed for an unspent to be included (defaults to 1) */
  minConfirms: optional(t.number),
  /** If true, minConfirms also applies to change outputs */
  enforceMinConfirmsForChange: optional(t.boolean),
  /** Maximum number of inputs to use in the transaction */
  maxNumInputsToUse: optional(t.number),
  /** Array of specific unspent IDs to use */
  unspents: optional(t.array(t.string)),
  /** The desired fee rate for the transaction in satoshis/kB */
  feeRate: optional(t.number),
  /** The maximum limit for a fee rate in satoshis/kB */
  maxFeeRate: optional(t.number),
  /** The maximum proportion of value you're willing to lose to fees (as a decimal, e.g., 0.1 for 10%) */
  maxFeePercentage: optional(t.number),
  /** Estimate fees to aim for first confirmation within this number of blocks */
  feeTxConfirmTarget: optional(t.number),
  /** Comment to attach to the transaction */
  comment: optional(t.string),
  /** One-time password for 2FA */
  otp: optional(t.string),
  /** Target address for the fanout outputs */
  targetAddress: optional(t.string),
} as const;

/**
 * Response for fanning out unspents in a wallet (v2)
 *
 * Returns transaction details after the fanout operation is built, signed, and sent.
 */
export const FanoutUnspentsResponse = t.type({
  /** The status of the transaction ('accepted', 'signed', 'pendingApproval', or 'otp') */
  status: t.string,
  /** The transaction hex/serialized transaction */
  tx: t.string,
  /** The transaction hash/ID */
  hash: optional(t.string),
  /** Alternative field for transaction ID (some responses use this instead of hash) */
  txid: optional(t.string),
  /** The fee amount in base units (satoshis for BTC) */
  fee: optional(t.number),
  /** The fee rate in base units per kilobyte (satoshis/kB for BTC) */
  feeRate: optional(t.number),
  /** Whether the transaction is instant */
  instant: optional(t.boolean),
  /** The instant transaction ID (if applicable) */
  instantId: optional(t.string),
  /** Travel rule information */
  travelInfos: optional(t.unknown),
  /** BitGo fee information (if applicable) */
  bitgoFee: optional(t.unknown),
  /** Travel rule result (if applicable) */
  travelResult: optional(t.unknown),
});

/**
 * Fan out unspents in a wallet (v2)
 *
 * This endpoint fans out unspents in a wallet by creating a transaction that spends from
 * one or more inputs to create multiple equal-sized outputs. This is useful for increasing
 * the number of UTXOs in a wallet, which can improve transaction parallelization and allow
 * for concurrent spending operations.
 *
 * The v2 API differs from v1 by:
 * - Requiring a coin parameter in the path
 * - Supporting the full set of SDK parameters for advanced UTXO management
 * - Using numUnspentsToMake instead of target (though both refer to output count)
 * - Supporting additional parameters like maxNumInputsToUse, unspents array, fee controls
 *
 * @operationId express.v2.wallet.fanoutunspents
 * @tag express
 */
export const PostFanoutUnspents = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/fanoutunspents',
  method: 'POST',
  request: httpRequest({
    params: FanoutUnspentsRequestParams,
    body: FanoutUnspentsRequestBody,
  }),
  response: {
    /** Successfully fanned out unspents */
    200: FanoutUnspentsResponse,
    /** Invalid request or fan out operation fails */
    400: BitgoExpressError,
  },
});
