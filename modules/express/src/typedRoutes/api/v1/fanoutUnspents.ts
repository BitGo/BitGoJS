import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Request parameters for fanning out unspents in a wallet
 */
export const FanoutUnspentsRequestParams = {
  /** The ID of the wallet */
  id: t.string,
};

/**
 * Request body for fanning out unspents in a wallet
 */
export const FanoutUnspentsRequestBody = {
  /** The wallet passphrase to decrypt the user key */
  walletPassphrase: optional(t.string),
  /** The extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),
  /** Whether to validate addresses (defaults to true) */
  validate: optional(t.boolean),
  /** Target number of unspents to create (must be integer, at least 2, at most 300) */
  target: t.number,
  /** Minimum number of confirmations needed for an unspent to be included (defaults to 1) */
  minConfirms: optional(t.number),
  /** Whether to use SegWit change addresses */
  segwitChange: optional(t.boolean),
  /** Message or note for the transaction */
  message: optional(t.string),
  /** One-time password for 2FA verification */
  otp: optional(t.string),
  /** Exact fee amount in satoshis (use either fee, feeRate, or numBlocks, not multiple) */
  fee: optional(t.number),
  /** Fee rate in satoshis per kilobyte (use either fee, feeRate, or numBlocks, not multiple) */
  feeRate: optional(t.number),
  /** Whether this is an instant transaction */
  instant: optional(t.boolean),
  /** Custom sequence ID for the transaction */
  sequenceId: optional(t.string),
  /** Target number of blocks for fee estimation (use either fee, feeRate, or numBlocks, not multiple) */
  numBlocks: optional(t.number),
  /** Whether minConfirms also applies to change outputs */
  enforceMinConfirmsForChange: optional(t.boolean),
  /** Target number of unspents to maintain in the wallet */
  targetWalletUnspents: optional(t.number),
  /** Minimum value of unspents to use (in base units) */
  minValue: optional(t.number),
  /** Maximum value of unspents to use (in base units) */
  maxValue: optional(t.number),
  /** Disable automatic change splitting for unspent management */
  noSplitChange: optional(t.boolean),
  /** Comment for the transaction */
  comment: optional(t.string),
  /** Dynamic fee confirmation target (number of blocks) */
  dynamicFeeConfirmTarget: optional(t.number),
  /** WIF private key for paying fees from a single-key address */
  feeSingleKeyWIF: optional(t.string),
};

/**
 * Response for fanning out unspents in a wallet
 */
export const FanoutUnspentsResponse = t.type({
  /** The status of the transaction: 'accepted' (broadcasted), 'pendingApproval' (needs approval), or 'otp' (needs 2FA) */
  status: t.string,
  /** The transaction hex */
  tx: t.string,
  /** The transaction hash/ID */
  hash: t.string,
  /** Whether the transaction is instant */
  instant: t.boolean,
  /** The instant ID (if applicable) */
  instantId: optional(t.string),
  /** The fee amount in satoshis */
  fee: t.number,
  /** The fee rate in satoshis per kilobyte */
  feeRate: t.number,
  /** Travel rule information */
  travelInfos: t.unknown,
  /** BitGo fee information (if applicable) */
  bitgoFee: optional(t.unknown),
  /** Travel rule result (if applicable) */
  travelResult: optional(t.unknown),
});

/**
 * Fan out unspents in a wallet
 *
 * Creates a transaction that distributes all existing unspents into a larger number of
 * approximately equal-sized unspents. This is the opposite of consolidateUnspents and is
 * useful for increasing the UTXO count to enable parallel transactions.
 *
 * **How It Works:**
 * 1. Fetches all unspents with at least minConfirms confirmations
 * 2. Calculates total value of all unspents
 * 3. Creates target number of new addresses on the change chain
 * 4. Distributes total value almost equally (±1 satoshi) across new addresses
 * 5. Adjusts distribution to account for transaction fees
 * 6. Creates and broadcasts the transaction
 *
 * **Requirements:**
 * - Current unspent count must be less than target (otherwise use consolidateUnspents)
 * - Wallet must have at most 80 unspents (transaction input limit)
 * - Target must be 2-300 (transaction output limit)
 * - Requires walletPassphrase or xprv for signing
 *
 * **Note:** This operation uses ALL wallet unspents and distributes the entire balance
 * (minus fees) across the target number of new outputs. All original addresses will be emptied.
 *
 * @operationId express.v1.wallet.fanoutunspents
 * @tag express
 */
export const PutFanoutUnspents = httpRoute({
  path: '/api/v1/wallet/{id}/fanoutunspents',
  method: 'PUT',
  request: httpRequest({
    params: FanoutUnspentsRequestParams,
    body: FanoutUnspentsRequestBody,
  }),
  response: {
    /** Successfully fanned out unspents */
    200: FanoutUnspentsResponse,
    /** Invalid request or fan out fails */
    400: BitgoExpressError,
  },
});
