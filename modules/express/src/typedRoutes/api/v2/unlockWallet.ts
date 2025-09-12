import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

/**
 * Path parameters for unlocking a lightning wallet
 * @property {string} coin - A lightning coin name (e.g, lnbtc).
 * @property {string} id - The ID of the wallet.
 */
export const UnlockLightningWalletParams = {
  coin: t.string,
  id: t.string,
};

/**
 * Request body for unlocking a lightning wallet
 * @property {string} passphrase - Passphrase to unlock the lightning wallet.
 */
export const UnlockLightningWalletBody = {
  passphrase: t.string,
};

/**
 * Lightning - Unlock node
 *
 * This is only used for self-custody lightning. Unlock the Lightning Network Daemon (LND) node with the given wallet password.
 *
 * @operationId express.lightning.unlockWallet
 */
export const PostUnlockLightningWallet = httpRoute({
  method: 'POST',
  path: '/api/v2/{coin}/wallet/{id}/unlockwallet',
  request: httpRequest({
    params: UnlockLightningWalletParams,
    body: UnlockLightningWalletBody,
  }),
  response: {
    200: t.type({
      message: t.string, // currently returns { message: 'ok' }
    }),
    400: BitgoExpressError,
  },
});
