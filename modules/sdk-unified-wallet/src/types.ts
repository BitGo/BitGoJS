import { GenerateWalletOptions } from '@bitgo/sdk-core';

export interface UnifiedWalletID {
  coin: string;
  walletId: string;
  address: string;
}

export interface UnifiedWalletParams {
  wallets: UnifiedWalletID[];
  curve: string;
  keys: string[];
}

export interface UnifiedWallet extends UnifiedWalletParams {
  id: string;
}

export type CurveType = 'Ecdsa' | 'Eddsa';

export interface GenerateUnifiedWalletOptions extends GenerateWalletOptions {
  curve: CurveType;
}
