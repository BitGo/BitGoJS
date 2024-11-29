import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { Wallet } from '@bitgo/sdk-core';
import { defaultBitGo } from './utxoCoins';

export function getUtxoWallet(coin: AbstractUtxoCoin, walletData = {}): Wallet {
  return new Wallet(defaultBitGo, coin, walletData);
}
