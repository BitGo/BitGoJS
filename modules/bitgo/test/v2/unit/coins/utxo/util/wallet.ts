import { AbstractUtxoCoin } from '@bitgo-beta/abstract-utxo';
import { Wallet } from '@bitgo-beta/sdk-core';
import { defaultBitGo } from './utxoCoins';

export function getUtxoWallet(coin: AbstractUtxoCoin, walletData = {}): Wallet {
  return new Wallet(defaultBitGo, coin, walletData);
}
