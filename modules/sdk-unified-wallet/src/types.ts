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

export type PaginationOrder = 'ASC' | 'DESC';

export interface PaginationOptions {
  prevPage?: number;
  limit?: number;
  order: PaginationOrder;
}
