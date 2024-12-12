import { Wallet, WalletData } from '@bitgo/sdk-core';

// parseTransactions' return type makes use of WalletData's type but with customChangeKeySignatures as required.
export interface AbstractUtxoCoinWalletData extends WalletData {
  customChangeKeySignatures: {
    user: string;
    backup: string;
    bitgo: string;
  };
}

export interface AbstractUtxoCoinWallet extends Wallet {
  _wallet: AbstractUtxoCoinWalletData;
}
