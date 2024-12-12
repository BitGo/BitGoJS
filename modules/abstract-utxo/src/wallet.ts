import { Wallet, WalletData } from '@bitgo/sdk-core';

// parseTransactions' return type makes use of WalletData's type but with customChangeKeySignatures as required.
export interface UtxoWalletData extends WalletData {
  customChangeKeySignatures: {
    user: string;
    backup: string;
    bitgo: string;
  };
}

export interface UtxoWallet extends Wallet {
  _wallet: UtxoWalletData;
}
