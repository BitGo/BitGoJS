import { UnifiedWallet, GenerateUnifiedWalletOptions, PaginationOptions } from './types';

export interface IUnifiedWallets {
  generateUnifiedWallet(params: GenerateUnifiedWalletOptions): Promise<UnifiedWallet>;
  getUnifiedWalletById(id: string): Promise<UnifiedWallet>;
  getUnifiedWalletByAddress(address: string): Promise<UnifiedWallet>;
  getUnifiedWallets(paginationOptions: PaginationOptions): Promise<UnifiedWallet[]>;
}
