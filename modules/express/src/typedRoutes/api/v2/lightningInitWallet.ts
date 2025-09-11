import * as t from 'io-ts';
import { httpRoute, httpRequest, optional } from '@api-ts/io-ts-http';
import { BitgoExpressError } from '../../schemas/error';

// Params: coin (lightning coin), walletId path parameter
export const LightningInitWalletParams = {
  coin: t.string,
  walletId: t.string,
};

// Body shape (required + optional). We intentionally do NOT reuse the composite
// InitLightningWalletRequest intersection codec here because httpRequest expects
// a plain object mapping of field -> codec, not an io-ts Type instance.
export const LightningInitWalletBody = {
  passphrase: t.string,
  expressHost: optional(t.string),
};

/**
 * Lightning - Initialize node
 * @operationId express.lightning.initWallet
 * POST /api/v2/{coin}/wallet/{walletId}/initwallet
 */
export const PostLightningInitWallet = httpRoute({
  path: '/api/v2/:coin/wallet/:walletId/initwallet',
  method: 'POST',
  request: httpRequest({ params: LightningInitWalletParams, body: LightningInitWalletBody }),
  response: { 200: t.unknown, 400: BitgoExpressError },
});

export type PostLightningInitWallet = typeof PostLightningInitWallet;
