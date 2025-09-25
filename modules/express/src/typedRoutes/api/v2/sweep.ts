import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for wallet sweep operation.
 * @property coin - Ticker or identifier of the coin (e.g. 'btc', 'eth').
 * @property id - Wallet ID
 */
export const SweepRequestParams = {
  /** Coin ticker / chain identifier */
  coin: t.string,
  /** Wallet ID */
  id: t.string,
};

/**
 * Request body for wallet sweep operation.
 *
 * Note: The 'index' string parameter is intentionally not included in this type definition
 * as sweep operations consolidate all unspent outputs from the entire wallet, not from
 * a specific address index. Sweeps are wallet-level operations that gather funds from
 * all addresses, making an index parameter unnecessary.
 *
 * @property address - The address to sweep funds to
 * @property walletPassphrase - Wallet passphrase for signing
 * @property xprv - Extended private key (alternative to walletPassphrase)
 * @property otp - One-time password for 2FA
 * @property feeRate - Fee rate in satoshis per kilobyte
 * @property maxFeeRate - Maximum fee rate in satoshis per kilobyte
 * @property feeTxConfirmTarget - Number of blocks to target for confirmation
 * @property allowPartialSweep - Whether to allow partial sweep if full sweep fails
 */
export const SweepRequestBody = {
  /** Address to sweep funds to */
  address: optional(t.string),
  /** Wallet passphrase for signing the transaction */
  walletPassphrase: optional(t.string),
  /** Extended private key (alternative to walletPassphrase) */
  xprv: optional(t.string),
  /** One-time password for 2FA */
  otp: optional(t.string),
  /** Fee rate in satoshis per kilobyte */
  feeRate: optional(t.number),
  /** Maximum fee rate in satoshis per kilobyte */
  maxFeeRate: optional(t.number),
  /** Number of blocks to target for confirmation */
  feeTxConfirmTarget: optional(t.number),
  /** Whether to allow partial sweep if full sweep fails */
  allowPartialSweep: optional(t.boolean),
};

/**
 * Sweep wallet
 *
 * Sweep all funds from a wallet to a specified address.
 * This operation consolidates all unspent outputs in the wallet and sends them to the target address.
 *
 * @operationId express.v2.wallet.sweep
 */
export const PostSweep = httpRoute({
  path: '/api/v2/{coin}/wallet/{id}/sweep',
  method: 'POST',
  request: httpRequest({
    params: SweepRequestParams,
    body: SweepRequestBody,
  }),
  response: {
    /** Successful sweep transaction */
    200: t.unknown, // The actual response varies by coin type
    /** Invalid request parameters */
    400: BitgoExpressError,
    /** Wallet not found */
    404: BitgoExpressError,
  },
});
