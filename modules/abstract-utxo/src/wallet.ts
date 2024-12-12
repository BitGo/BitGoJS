import { BitGoBase, IBaseCoin, Wallet, WalletData } from '@bitgo/sdk-core';

// parseTransactions' return type makes use of WalletData's type but with customChangeKeySignatures as required.
export interface AbstractUtxoCoinWalletData extends WalletData {
  customChangeKeySignatures: {
    user: string;
    backup: string;
    bitgo: string;
  };
}

export class AbstractUtxoCoinWallet extends Wallet {
  public _wallet: AbstractUtxoCoinWalletData;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, walletData: any) {
    super(bitgo, baseCoin, walletData);
  }
}
