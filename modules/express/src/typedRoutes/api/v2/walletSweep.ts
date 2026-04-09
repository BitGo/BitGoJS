import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { SendManyResponse } from './sendmany';

/**
 * Request path parameters for sweeping a wallet
 */
export const WalletSweepParams = {
  /** The coin type */
  coin: t.string,
  /** The wallet ID */
  id: t.string,
} as const;

/**
 * Request body for sweeping all funds from a wallet
 *
 * The sweep operation sends all available funds from the wallet to a specified address.
 * For UTXO coins, it uses the native /sweepWallet endpoint.
 * For account-based coins, it calculates the maximum spendable amount and uses sendMany.
 */
export const WalletSweepBody = {
  /** The destination address to send all funds to - REQUIRED */
  address: t.string,

  /** The wallet passphrase to decrypt the user key */
  walletPassphrase: optional(t.string),

  /** The extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),

  /** One-time password for 2FA */
  otp: optional(t.string),

  /** The desired fee rate for the transaction in satoshis/kB (UTXO coins) */
  feeRate: optional(t.number),

  /** Upper limit for fee rate in satoshis/kB (UTXO coins) */
  maxFeeRate: optional(t.number),

  /** Estimate fees to aim for confirmation within this number of blocks (UTXO coins) */
  feeTxConfirmTarget: optional(t.number),

  /** Allows sweeping 200 unspents when wallet has more than that (UTXO coins) */
  allowPartialSweep: optional(t.boolean),

  /** Transaction format: 'legacy', 'psbt', or 'psbt-lite' (UTXO coins) */
  txFormat: optional(t.union([t.literal('legacy'), t.literal('psbt'), t.literal('psbt-lite')])),
} as const;

/**
 * Sweep all funds from a wallet to a specified address
 *
 * This endpoint sweeps (sends) all available funds from a wallet to a single destination address.
 *
 * **Behavior by coin type:**
 * - **UTXO coins (BTC, LTC, etc.)**: Uses the native /sweepWallet endpoint that:
 *   - Collects all unspents in the wallet
 *   - Builds a transaction sending everything (minus fees) to the destination
 *   - Signs and broadcasts the transaction
 *   - Validates that all funds go to the specified destination address
 *
 * - **Account-based coins (ETH, etc.)**:
 *   - Checks for unconfirmed funds (fails if any exist)
 *   - Queries the maximumSpendable amount
 *   - Creates a sendMany transaction with that amount to the destination
 *
 * **Implementation Note:**
 * Both execution paths (UTXO and account-based) ultimately call the same underlying
 * transaction sending mechanisms as sendMany, resulting in identical response structures.
 *
 * **Authentication:**
 * - Requires either `walletPassphrase` (to decrypt the encrypted user key) or `xprv` (raw private key)
 * - Optional `otp` for 2FA
 *
 * **Fee control (UTXO coins):**
 * - `feeRate`: Desired fee rate in satoshis/kB
 * - `maxFeeRate`: Upper limit for fee rate
 * - `feeTxConfirmTarget`: Target number of blocks for confirmation
 *
 * **Special options:**
 * - `allowPartialSweep`: For UTXO wallets with >200 unspents, allows sweeping just 200
 * - `txFormat`: Choose between 'legacy', 'psbt', or 'psbt-lite' format
 *
 * @tag express
 * @operationId express.v2.wallet.sweep
 */
export const PostWalletSweep = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/sweep',
  method: 'POST',
  request: httpRequest({
    params: WalletSweepParams,
    body: WalletSweepBody,
  }),
  response: {
    /** Successfully swept funds - same structure as sendMany */
    200: SendManyResponse,
    /** Invalid request or sweep operation fails */
    400: BitgoExpressError,
  },
});
