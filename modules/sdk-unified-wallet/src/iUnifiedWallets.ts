import { UnifiedWallet, GenerateUnifiedWalletOptions } from './types';

export interface IUnifiedWallets {
  generateUnifiedWallet(params: GenerateUnifiedWalletOptions): Promise<UnifiedWallet>;
}
