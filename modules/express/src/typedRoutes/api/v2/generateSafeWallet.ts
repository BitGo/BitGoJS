import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { WalletResponse, multisigType } from '../../schemas/wallet';

/**
 * Path parameters for minting a child wallet from a Safe.
 */
export const GenerateSafeWalletParams = {
  /** Enterprise public id that owns the safe */
  enterpriseId: t.string,
  /** Safe id to mint the wallet from */
  safeId: t.string,
} as const;

/**
 * Request body for minting a child wallet from a Safe.
 *
 * Safe wallets are hot-only in v1. Child keys are derived locally; do not send `keys`.
 */
export const GenerateSafeWalletBody = {
  /** Coin ticker / chain identifier for the child wallet */
  coin: t.string,
  /** Wallet label */
  label: t.string,
  /** Safe passphrase — decrypts the root user keychain and encrypts derived material */
  passphrase: t.string,
  /** `onchain` (default) mints a secp256k1/ed25519 multisig wallet; `tss` mints an MPC wallet */
  multisigType: optional(multisigType),
} as const;

/**
 * Response body for minting a child wallet from a Safe.
 */
export const GenerateSafeWalletResponse = {
  /** The minted child wallet */
  200: WalletResponse,
  /** Bad request */
  400: BitgoExpressError,
} as const;

/**
 * Generate Safe Wallet
 *
 * Mint a hot child wallet from an existing Wallet Safe. Runs locally on BitGo Express:
 *
 * - `onchain`: decrypt the safe root, hardened-derive the user child, register it, then mint.
 * - `tss`: decrypt the MPC root blob, run the user/BitGo hard-derive ceremony, then mint.
 *
 * ⓘ This endpoint must be called through BitGo Express. `POST /api/v2/enterprise/{enterpriseId}/safes/{safeId}/wallets`
 * (without `/generate`) is the server-side mint that expects pre-built `keys`.
 *
 * ⓘ For later signing through Express, `WALLET_{walletId}_PASSPHRASE` is the **safe** passphrase
 * (it decrypts the root user keychain, not a child envelope).
 *
 * @operationId express.v2.safes.wallet.generate
 * @tag Express
 * @private
 */
export const PostGenerateSafeWallet = httpRoute({
  path: '/api/v2/enterprise/{enterpriseId}/safes/{safeId}/wallets/generate',
  method: 'POST',
  request: httpRequest({
    params: GenerateSafeWalletParams,
    body: GenerateSafeWalletBody,
  }),
  response: GenerateSafeWalletResponse,
});
