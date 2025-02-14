import * as sdkcore from '@bitgo/sdk-core';
import { isLightningCoinName } from '../lightning';
import { ILightningWallet, SelfCustodialLightningWallet } from './lightning';

/**
 * Return a lightwallet instance if the coin supports it
 */

export function getLightningWallet(wallet: sdkcore.IWallet): ILightningWallet {
  if (!isLightningCoinName(wallet.baseCoin.getChain())) {
    throw new Error(`Lightning not supported for ${wallet.coin()}`);
  }
  return new SelfCustodialLightningWallet(wallet);
}
