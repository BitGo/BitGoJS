import { GenerateWalletOptions, KeychainsTriplet, SupplementGenerateWalletOptions, WalletData } from '@bitgo/sdk-core';
import { UnifiedWallet, UnifiedWalletParams, GenerateUnifiedWalletOptions } from './types';

export interface IUnifiedWallets {
  generateUnifiedWallet(params: GenerateUnifiedWalletOptions): Promise<UnifiedWallet>;

  generateKeychainsTriplet(params: GenerateWalletOptions): Promise<KeychainsTriplet>;

  generateCoinWalletData(
    coinName: string,
    walletParams: SupplementGenerateWalletOptions,
    keychainsTriplet: KeychainsTriplet
  ): Promise<WalletData>;

  createUnifiedWallet(params: UnifiedWalletParams): Promise<UnifiedWallet>;
}
