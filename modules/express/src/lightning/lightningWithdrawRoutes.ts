import * as express from 'express';
import { decodeOrElse } from '@bitgo/sdk-core';
import { getLightningWallet, LightningOnchainWithdrawParams } from '@bitgo/abstract-lightning';
import { ApiResponseError } from '../errors';

export async function handleLightningWithdraw(req: express.Request): Promise<any> {
  const bitgo = req.bitgo;
  const params = decodeOrElse(
    LightningOnchainWithdrawParams.name,
    LightningOnchainWithdrawParams,
    req.body,
    (error) => {
      throw new ApiResponseError(`Invalid request body for withdrawing on chain lightning balance`, 400);
    }
  );

  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  const lightningWallet = getLightningWallet(wallet);

  return await lightningWallet.withdrawOnchain(params);
}
