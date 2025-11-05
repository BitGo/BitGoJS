import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for consolidating unspents in a wallet (v2)
 */
export const ConsolidateUnspentsRequestParams = {
  /** The coin identifier (e.g., 'btc', 'tbtc') */
  coin: t.string,
  /** The ID of the wallet */
  id: t.string,
} as const;

/**
 * Request body for consolidating unspents in a wallet (v2)
 *
 * This endpoint supports the full set of parameters available in the BitGo SDK
 * for advanced UTXO management. The consolidate operation takes multiple unspents and
 * combines them into fewer outputs to reduce the number of UTXOs in a wallet.
 */
export const ConsolidateUnspentsRequestBody = {
  /** The wallet passphrase to decrypt the user key */
  walletPassphrase: optional(t.string),
  /** The extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),
  /** Minimum value of unspents to use (in base units) */
  minValue: optional(t.union([t.number, t.string])),
  /** Maximum value of unspents to use (in base units) */
  maxValue: optional(t.union([t.number, t.string])),
  /** Minimum block height of unspents to use */
  minHeight: optional(t.number),
  /** The number of new unspents to make (not applicable for bulk consolidation) */
  numUnspentsToMake: optional(t.number),
  /** Estimate fees to aim for first confirmation within this number of blocks */
  feeTxConfirmTarget: optional(t.number),
  /** Maximum number of unspents to use in the transaction */
  limit: optional(t.number),
  /** Minimum number of confirmations needed for an unspent to be included (defaults to 1) */
  minConfirms: optional(t.number),
  /** If true, minConfirms also applies to change outputs */
  enforceMinConfirmsForChange: optional(t.boolean),
  /** The desired fee rate for the transaction in satoshis/kB */
  feeRate: optional(t.number),
  /** The maximum limit for a fee rate in satoshis/kB */
  maxFeeRate: optional(t.number),
  /** The maximum proportion of value you're willing to lose to fees (as a decimal, e.g., 0.1 for 10%) */
  maxFeePercentage: optional(t.number),
  /** Comment to attach to the transaction */
  comment: optional(t.string),
  /** One-time password for 2FA */
  otp: optional(t.string),
  /** Target address for the consolidation outputs */
  targetAddress: optional(t.string),
  /** If true, enables consolidation of large number of unspents by creating multiple transactions (200 unspents per tx) */
  bulk: optional(t.boolean),
} as const;

/**
 * Single transaction response object
 */
const ConsolidateUnspentsSingleTxResponse = t.type({
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
 * Response for consolidating unspents in a wallet (v2)
 *
 * Returns transaction details after the consolidation operation is built, signed, and sent.
 * When bulk=true, an array of transaction objects is returned; otherwise, a single transaction object is returned.
 */
export const ConsolidateUnspentsResponse = t.union([
  ConsolidateUnspentsSingleTxResponse,
  t.array(ConsolidateUnspentsSingleTxResponse),
]);

/**
 * Consolidate unspents in a wallet (v2)
 *
 * This endpoint consolidates unspents in a wallet by creating a transaction that spends from
 * multiple inputs to create fewer outputs. This is useful for reducing the number of UTXOs in a wallet,
 * which can improve performance and reduce transaction fees for future transactions.
 *
 * The v2 API differs from v1 by:
 * - Requiring a coin parameter in the path
 * - Supporting the full set of SDK parameters for advanced UTXO management
 * - Using standard parameters like minValue/maxValue instead of minSize/maxSize
 * - Supporting bulk consolidation mode that creates multiple transactions
 * - Supporting additional parameters like limit, targetAddress, fee controls
 *
 * @operationId express.v2.wallet.consolidateunspents
 * @tag express
 */
export const PostConsolidateUnspents = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/consolidateunspents',
  method: 'POST',
  request: httpRequest({
    params: ConsolidateUnspentsRequestParams,
    body: ConsolidateUnspentsRequestBody,
  }),
  response: {
    /** Successfully consolidated unspents */
    200: ConsolidateUnspentsResponse,
    /** Invalid request or consolidation operation fails */
    400: BitgoExpressError,
  },
});
