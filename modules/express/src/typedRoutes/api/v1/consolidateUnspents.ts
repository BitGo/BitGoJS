import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for consolidating unspents in a wallet
 */
export const ConsolidateUnspentsRequestParams = {
  /** The ID of the wallet */
  id: t.string,
};

/**
 * Request body for consolidating unspents in a wallet
 */
export const ConsolidateUnspentsRequestBody = {
  /** Wallet passphrase to decrypt the user key for signing (required unless xprv is provided) */
  walletPassphrase: optional(t.string),
  /** Extended private key as alternative to walletPassphrase (provide only one) */
  xprv: optional(t.string),
  /** Whether to validate addresses before creating transactions (defaults to true) */
  validate: optional(t.boolean),
  /** Target number of unspents to maintain in the wallet (defaults to 1, must be positive integer) */
  target: optional(t.number),
  /** Minimum size of unspents to consolidate in satoshis (defaults to 0 or auto-calculated from feeRate) */
  minSize: optional(t.union([t.number, t.string])),
  /** Maximum size of unspents to consolidate in satoshis */
  maxSize: optional(t.union([t.number, t.string])),
  /** Maximum inputs per consolidation transaction (defaults to 200, must be 2-200) */
  maxInputCountPerConsolidation: optional(t.number),
  /** Maximum consolidation iterations (defaults to -1 for unlimited, or positive integer) */
  maxIterationCount: optional(t.number),
  /** Minimum confirmations needed for an unspent to be included (defaults to 1) */
  minConfirms: optional(t.number),
  /** Custom fee rate in satoshis per kilobyte */
  feeRate: optional(t.number),
  /** One-time password for 2FA authentication */
  otp: optional(t.string),
  /** Optional message to attach to the transaction */
  message: optional(t.string),
  /** Whether to use instant transaction (BitGo Instant) */
  instant: optional(t.boolean),
  /** Sequence ID for transaction ordering */
  sequenceId: optional(t.string),
  /** Target number of blocks for fee estimation */
  numBlocks: optional(t.number),
  /** Whether minConfirms also applies to change outputs */
  enforceMinConfirmsForChange: optional(t.boolean),
  /** Target number of unspents for the wallet */
  targetWalletUnspents: optional(t.number),
  /** Minimum value of unspents to include in satoshis */
  minValue: optional(t.union([t.number, t.string])),
  /** Maximum value of unspents to include in satoshis */
  maxValue: optional(t.union([t.number, t.string])),
  /** Comment to attach to the transaction */
  comment: optional(t.string),
};

/**
 * Response for consolidating unspents in a wallet
 *
 * Two possible response types:
 * 1. Array of transaction objects - when consolidation occurs (one per iteration)
 * 2. Empty object {} - when target is already reached (no consolidation needed)
 */
export const ConsolidateUnspentsResponse = t.union([
  t.array(
    t.type({
      /** Transaction status: 'accepted' (broadcasted), 'pendingApproval' (needs approval), or 'otp' (needs 2FA) */
      status: t.union([t.literal('accepted'), t.literal('pendingApproval'), t.literal('otp')]),
      /** Signed transaction in hex format */
      tx: t.string,
      /** Transaction hash/ID */
      hash: t.string,
      /** Whether this is an instant transaction (BitGo Instant) */
      instant: t.boolean,
      /** Instant transaction ID (only present for instant transactions) */
      instantId: optional(t.string),
      /** Total fee paid in satoshis */
      fee: t.number,
      /** Fee rate in satoshis per kilobyte */
      feeRate: t.number,
      /** Travel rule compliance information */
      travelInfos: t.unknown,
      /** BitGo service fee information (if applicable) */
      bitgoFee: optional(t.unknown),
      /** Travel rule submission result (if applicable) */
      travelResult: optional(t.unknown),
    })
  ),
  t.type({}), // Empty object when target already reached (no consolidation needed)
]);

/**
 * Consolidate unspents in a wallet
 *
 * Consolidates unspent transaction outputs (UTXOs) by creating transactions that combine
 * multiple small inputs into fewer larger outputs. This reduces the UTXO count to improve
 * wallet performance and lower future transaction fees.
 *
 * ## How It Works
 * The consolidation process is iterative:
 * 1. Fetches unspents matching the filter criteria (minSize, maxSize, minConfirms)
 * 2. If unspents ≤ target: consolidation complete (returns empty object)
 * 3. Creates a new wallet address to receive consolidated funds
 * 4. Builds a transaction with up to maxInputCountPerConsolidation inputs
 * 5. Sends all inputs to the new address (minus fees)
 * 6. Repeats until target is reached or maxIterationCount is hit
 *
 * ## Parameters
 * - **target**: Desired final unspent count (default: 1)
 * - **maxInputCountPerConsolidation**: Max inputs per transaction (default: 200)
 * - **maxIterationCount**: Max iterations (default: -1 for unlimited)
 * - **minSize**: Auto-calculated from feeRate to avoid consolidating unspents smaller than their fee cost
 *
 * ## Response
 * - **Array of transactions**: When consolidation occurs, returns one transaction per iteration
 * - **Empty object {}**: When target is already reached (no consolidation needed)
 *
 * ## Performance Notes
 * - Large consolidations may take time due to multiple iterations
 * - Each iteration waits 1 second before the next to allow transaction confirmation
 * - Use maxIterationCount to limit execution time for very large wallets
 *
 * @operationId express.v1.wallet.consolidateunspents
 * @tag express
 */
export const PutConsolidateUnspents = httpRoute({
  path: '/api/v1/wallet/{id}/consolidateunspents',
  method: 'PUT',
  request: httpRequest({
    params: ConsolidateUnspentsRequestParams,
    body: ConsolidateUnspentsRequestBody,
  }),
  response: {
    /** Successfully consolidated unspents */
    200: ConsolidateUnspentsResponse,
    /** Invalid request or consolidation fails */
    400: BitgoExpressError,
  },
});
