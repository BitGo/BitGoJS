import { decodeOrElse } from '@bitgo/sdk-core';
import { getLightningWallet, LightningOnchainWithdrawParams } from '@bitgo/abstract-lightning';
import { ApiResponseError } from '../errors';
import { ExpressApiRouteRequest } from '../typedRoutes/api';

export async function handleLightningWithdraw(
  req: ExpressApiRouteRequest<'express.v2.wallet.lightningWithdraw', 'post'>
): Promise<any> {
  const bitgo = req.bitgo;
  const params = decodeOrElse(
    LightningOnchainWithdrawParams.name,
    LightningOnchainWithdrawParams,
    req.body,
    (error) => {
      throw new ApiResponseError(`Invalid request body for withdrawing on chain lightning balance`, 400);
    }
  );

  const coin = bitgo.coin(req.decoded.coin);
  const wallet = await coin.wallets().get({ id: req.decoded.id });
  const lightningWallet = getLightningWallet(wallet);

  return await lightningWallet.withdrawOnchain(params);
}
