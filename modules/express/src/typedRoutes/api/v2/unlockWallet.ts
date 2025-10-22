import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for unlocking a lightning wallet
 * @property {string} coin - A lightning coin name (e.g, lnbtc).
 * @property {string} id - The ID of the wallet.
 */
export const UnlockLightningWalletParams = {
  /** A lightning coin name (e.g, lnbtc, tlnbtc). */
  coin: t.string,
  /** The ID of the wallet. */
  id: t.string,
} as const;

/**
 * Request body for unlocking a lightning wallet
 * @property {string} passphrase - Passphrase to unlock the lightning wallet.
 */
export const UnlockLightningWalletBody = {
  /** Passphrase to unlock the lightning wallet. */
  passphrase: t.string,
} as const;

export const UnlockLightningWalletResponse200 = t.type({
  message: t.string,
});

/**
 * Response for unlocking a lightning wallet.
 */
export const UnlockLightningWalletResponse = {
  /** Confirmation message. */
  200: UnlockLightningWalletResponse200,
  /** BitGo Express error payload. */
  400: BitgoExpressError,
} as const;

/**
 * Lightning - Unlock node
 *
 * This is only used for self-custody lightning. Unlock the Lightning Network Daemon (LND) node with the given wallet password.
 *
 * @tag express
 * @operationId express.lightning.unlockWallet
 */
export const PostUnlockLightningWallet = httpRoute({
  method: 'POST',
  path: '/api/v2/{coin}/wallet/{id}/unlockwallet',
  request: httpRequest({
    params: UnlockLightningWalletParams,
    body: UnlockLightningWalletBody,
  }),
  response: UnlockLightningWalletResponse,
});
