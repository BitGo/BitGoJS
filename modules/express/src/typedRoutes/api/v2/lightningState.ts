import * as t from 'io-ts';
import { httpRoute, httpRequest } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';
import { WalletState } from '../../../lightning/codecs';

/**
 * Path parameters for getting lightning node state
 */
export const LightningStateParams = {
  /** A lightning coin name (e.g., lnbtc or tlnbtc) */
  coin: t.string,
  /** The ID of the lightning self-custody wallet */
  walletId: t.string,
};

export const LightningStateResponse200 = t.type({
  state: WalletState,
});

/**
 * Response for getting lightning node state
 */
export const LightningStateResponse = {
  /** Current Lightning wallet/node state('NON_EXISTING' | 'LOCKED' | 'UNLOCKED' | 'RPC_ACTIVE' | 'SERVER_ACTIVE' | 'WAITING_TO_START') */
  200: LightningStateResponse200,
  /** BitGo Express error payload when the request is invalid (e.g., invalid coin or wallet not a self-custody lightning wallet). */
  400: BitgoExpressError,
} as const;

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
  response: LightningStateResponse,
});
