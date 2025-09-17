import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for initializing a Lightning wallet
 * @property {string} coin - A lightning coin name (e.g, lnbtc, tlnbtc).
 * @property {string} walletId - The ID of the wallet.
 */
export const LightningInitWalletParams = {
  coin: t.string,
  walletId: t.string,
} as const;

/**
 * Request body for initializing a Lightning wallet
 * @property passphrase - Passphrase to encrypt the admin macaroon of the signer node.
 */
export const LightningInitWalletBody = {
  passphrase: t.string,
  expressHost: optional(t.string),
} as const;

/**
 * Response
 * - 200: Returns the updated wallet. On success, the wallet's `coinSpecific` will include the encrypted admin macaroon for the Lightning signer node.
 * - 400: BitGo Express error payload when initialization cannot proceed (for example: invalid coin, unsupported environment, wallet not in an initializable state).
 */
export const LightningInitWalletResponse = {
  200: t.unknown,
  400: BitgoExpressError,
} as const;

/**
 * Lightning - This is only used for self-custody lightning. Initialize a newly created Lightning Network Daemon (LND) for the first time.
 * Returns the updated wallet with the encrypted admin macaroon in the `coinSpecific` response field.
 *
 * @operationId express.lightning.initWallet
 *
 * POST /api/v2/{coin}/wallet/{walletId}/initwallet
 */
export const PostLightningInitWallet = httpRoute({
  path: '/api/v2/:coin/wallet/:walletId/initwallet',
  method: 'POST',
  request: httpRequest({ params: LightningInitWalletParams, body: LightningInitWalletBody }),
  response: LightningInitWalletResponse,
});

export type PostLightningInitWallet = typeof PostLightningInitWallet;
