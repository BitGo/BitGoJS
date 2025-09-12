import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { WalletState } from '../../../lightning/codecs';

/**
 * Path parameters for getting lightning node state
 * @property {string} coin - A lightning coin name (e.g., lnbtc or tlnbtc)
 * @property {string} walletId - The ID of the lightning self-custody wallet
 */
export const LightningStateParams = {
  coin: t.string,
  walletId: t.string,
};

/**
 * Lightning - Get node state
 *
 * This is only used for self-custody lightning. Get the current state of the lightning node.
 *
 * @operationId express.lightning.getState
 */
export const GetLightningState = httpRoute({
  method: 'GET',
  path: '/api/v2/{coin}/wallet/{walletId}/state',
  request: httpRequest({
    params: LightningStateParams,
  }),
  response: {
    200: t.type({
      state: WalletState,
    }),
    400: BitgoExpressError,
  },
});
