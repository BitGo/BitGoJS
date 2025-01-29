import { Wallet, WalletData } from '@bitgo/sdk-core';

import { isUtxoCoinName, UtxoCoinName } from './names';

// parseTransactions' return type makes use of WalletData's type but with customChangeKeySignatures as required.
export interface UtxoWalletData extends WalletData {
  coin: UtxoCoinName;
  customChangeKeySignatures: {
    user: string;
    backup: string;
    bitgo: string;
  };
}

export function isUtxoWalletData(obj: WalletData): obj is UtxoWalletData {
  return isUtxoCoinName(obj.coin);
}

export interface UtxoWallet extends Wallet {
  _wallet: UtxoWalletData;
}
