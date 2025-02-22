import * as express from 'express';
import { ApiResponseError } from '../errors';

export async function handleCreateLightningInvoice(req: express.Request, res: express.Response): Promise<any> {
  const bitgo = req.bitgo;
  const { amount, memo, expirySeconds } = req.body;

  try {
    const coin = bitgo.coin(req.params.coin);
    const wallet = await coin.wallets().get({ id: req.params.id });
    const lightningWallet = wallet.lightning();

    const params = {
      value: parseInt(amount, 10),
      memo: memo || undefined,
      expirySeconds: expirySeconds ? parseInt(expirySeconds, 10) : undefined,
    };

    return await lightningWallet.createInvoice(params);
  } catch (err) {
    throw new ApiResponseError(err.message, 400);
  }
}

export async function handlePayLightningInvoice(req: express.Request, res: express.Response): Promise<any> {
  const bitgo = req.bitgo;
  const { paymentRequest, amount, maxFeeRate } = req.body;

  try {
    const coin = bitgo.coin(req.params.coin);
    const wallet = await coin.wallets().get({ id: req.params.id });
    const lightningWallet = wallet.lightning();

    const params = {
      invoice: paymentRequest,
      amount: amount ? parseInt(amount, 10) : undefined,
      maxFeeRate: maxFeeRate ? parseInt(maxFeeRate, 10) : undefined,
    };

    return await lightningWallet.payInvoice(params);
  } catch (err) {
    throw new ApiResponseError(err.message, 400);
  }
}
