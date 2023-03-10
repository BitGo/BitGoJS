import { UnifiedWallets } from '../unifiedWallets';
import { BitGoBase, GenerateWalletOptions, KeychainsTriplet } from '@bitgo/sdk-core';
import { GenerateUnifiedWalletOptions, UnifiedWallet } from '../types';

export class EddsaUnifiedWallets extends UnifiedWallets {
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  generateKeychainsTriplet(params: GenerateWalletOptions): Promise<KeychainsTriplet> {
    throw new Error('Method not yet implemented');
  }

  generateUnifiedWallet(params: GenerateUnifiedWalletOptions): Promise<UnifiedWallet> {
    throw new Error('Method not yet implemented');
  }

  generateUnifiedWalletFromKeys(keys: KeychainsTriplet, params: GenerateWalletOptions): Promise<UnifiedWallet> {
    throw new Error('Method not yet implemented');
  }
}
