import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for initializing a Lightning wallet
 * @property {string} coin - A lightning coin name (e.g, lnbtc).
 * @property {string} walletId - The ID of the wallet.
 */
export const LightningInitWalletParams = {
  coin: t.string,
  walletId: t.string,
};

/**
 * Request body for initializing a Lightning wallet
 * @property passphrase - Passphrase to encrypt the admin macaroon of the signer node.
 */
export const LightningInitWalletBody = {
  passphrase: t.string,
  expressHost: optional(t.string),
};

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
  response: { 200: t.unknown, 400: BitgoExpressError },
});

export type PostLightningInitWallet = typeof PostLightningInitWallet;
