import * as express from 'express';
import { ApiResponseError } from '../errors';
import { UpdateLightningWalletClientRequest, updateWalletCoinSpecific } from '@bitgo/abstract-lightning';
import { decodeOrElse } from '@bitgo/sdk-core';

export async function handleUpdateLightningWalletCoinSpecific(req: express.Request): Promise<unknown> {
  const bitgo = req.bitgo;

  const params = decodeOrElse(
    'UpdateLightningWalletClientRequest',
    UpdateLightningWalletClientRequest,
    req.body,
    (_) => {
      // DON'T throw errors from decodeOrElse. It could leak sensitive information.
      throw new ApiResponseError('Invalid request body to update lightning wallet coin specific', 400);
    }
  );

  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });

  return await updateWalletCoinSpecific(wallet, params);
}
