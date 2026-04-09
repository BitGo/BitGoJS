import { updateWalletCoinSpecific } from '@bitgo/abstract-lightning';
import { ExpressApiRouteRequest } from '../typedRoutes/api';

export async function handleUpdateLightningWalletCoinSpecific(
  req: ExpressApiRouteRequest<'express.wallet.update', 'put'>
): Promise<unknown> {
  const bitgo = req.bitgo;

  const coin = bitgo.coin(req.decoded.coin);
  const wallet = await coin.wallets().get({ id: req.decoded.id, includeBalance: false });

  return await updateWalletCoinSpecific(wallet, req.decoded);
}
