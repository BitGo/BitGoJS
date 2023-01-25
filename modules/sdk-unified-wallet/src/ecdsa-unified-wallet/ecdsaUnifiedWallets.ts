import { GenerateWalletOptions, BitGoBase, KeychainsTriplet, SupplementGenerateWalletOptions } from '@bitgo/sdk-core';
import { UnifiedWalletKeychains } from '../unifiedWalletKeychains';
import { UnifiedWalletID, UnifiedWallet, GenerateUnifiedWalletOptions } from '../types';
import { supportedCoins } from './types';
import { UnifiedWallets } from '../unifiedWallets';

export class EcdsaUnifiedWallets extends UnifiedWallets {
  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  /** @inheritDoc */
  async generateUnifiedWallet(params: GenerateUnifiedWalletOptions): Promise<UnifiedWallet> {
    if (typeof params.label !== 'string') {
      throw new Error('missing required string parameter label');
    }
    const isTss = params.multisigType === 'tss';
    if (!isTss) {
      throw new Error('EVM wallet only supports TSS');
    }

    if (params.walletVersion !== 3) {
      throw new Error('EVM wallet is only supported for wallet version 3');
    }

    const keychainsTriplet = await this.generateKeychainsTriplet(params);
    const walletParams: SupplementGenerateWalletOptions = {
      label: params.label,
      m: 2,
      n: 3,
      keys: [keychainsTriplet.userKeychain.id, keychainsTriplet.backupKeychain.id, keychainsTriplet.bitgoKeychain.id],
      isCold: false,
      multisigType: 'tss',
      enterprise: params.enterprise,
      walletVersion: params.walletVersion,
    };
    const walletIDs: UnifiedWalletID[] = [];
    let walletData;

    for (const coin of supportedCoins) {
      walletData = await this.generateCoinWalletData(coin, walletParams, keychainsTriplet);
      const evmID: UnifiedWalletID = {
        coinName: coin,
        walletId: walletData.id,
        address: walletData.receiveAddress.address,
      };
      walletIDs.push(evmID);
    }
    return await this.createUnifiedWallet({ wallets: walletIDs, curve: params.curve });
  }

  /** @inheritDoc */
  async generateKeychainsTriplet(params: GenerateWalletOptions): Promise<KeychainsTriplet> {
    // Create MPC Keychains
    const evmWalletKeychains = new UnifiedWalletKeychains(this.bitgo);
    const keychainsTriplet = await evmWalletKeychains.createMpc({
      multisigType: 'tss',
      passphrase: params.passphrase,
      enterprise: params.enterprise,
      originalPasscodeEncryptionCode: params.passcodeEncryptionCode,
      backupProvider: params.backupProvider,
    });
    return keychainsTriplet;
  }
}
