import * as express from 'express';
import { BackupResponse, getLightningWallet } from '@bitgo/abstract-lightning';

/**
 * Handle getting channel backup for a Lightning wallet
 * @param req Express request object
 * @returns Promise resolving to BackupResponse
 */
export async function handleGetChannelBackup(req: express.Request): Promise<BackupResponse> {
  const bitgo = req.bitgo;
  const coin = bitgo.coin(req.params.coin);
  const wallet = await coin.wallets().get({ id: req.params.id });
  const lightningWallet = getLightningWallet(wallet);

  return await lightningWallet.getChannelBackup();
}
