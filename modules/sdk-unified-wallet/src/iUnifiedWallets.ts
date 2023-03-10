import { UnifiedWallet, GenerateUnifiedWalletOptions, PaginationOptions } from './types';
import { KeychainsTriplet, GenerateWalletOptions, Wallet } from '@bitgo/sdk-core';

export interface IUnifiedWallets {
  generateUnifiedWallet(params: GenerateUnifiedWalletOptions): Promise<UnifiedWallet>;
  generateUnifiedWalletFromKeys(keys: KeychainsTriplet, params: GenerateWalletOptions): Promise<UnifiedWallet>;
  getUnifiedWalletById(id: string): Promise<UnifiedWallet>;
  getUnifiedWalletByAddress(address: string): Promise<UnifiedWallet>;
  getUnifiedWallets(paginationOptions: PaginationOptions): Promise<UnifiedWallet[]>;
  getCoinWalletById(id: string, coinName: string): Promise<Wallet>;
}
