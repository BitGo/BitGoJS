import { Wallet } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../../src';

import { defaultBitGo } from './utxoCoins';

export function getUtxoWallet(coin: AbstractUtxoCoin, walletData = {}): Wallet {
  return new Wallet(defaultBitGo, coin, walletData);
}
