import * as express from 'express';
import { ApiResponseError } from '../errors';
import { CreateInvoiceBody, getLightningWallet, Invoice, SubmitPaymentParams } from '@bitgo/abstract-lightning';
import { decodeOrElse } from '@bitgo/sdk-core';

export async function handleCreateLightningInvoice(req: express.Request): Promise<any> {
  const bitgo = req.bitgo;

  const params = decodeOrElse(CreateInvoiceBody.name, CreateInvoiceBody, req.body, (error) => {
    throw new ApiResponseError(`Invalid request body to create lightning invoice: ${error}`, 400);
  });

  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  const lightningWallet = getLightningWallet(wallet);

  return Invoice.encode(await lightningWallet.createInvoice(params));
}

export async function handlePayLightningInvoice(req: express.Request): Promise<any> {
  const bitgo = req.bitgo;
  const params = decodeOrElse(SubmitPaymentParams.name, SubmitPaymentParams, req.body, (error) => {
    throw new ApiResponseError(`Invalid request body to pay lightning invoice`, 400);
  });

  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  const lightningWallet = getLightningWallet(wallet);

  return await lightningWallet.payInvoice(params);
}
