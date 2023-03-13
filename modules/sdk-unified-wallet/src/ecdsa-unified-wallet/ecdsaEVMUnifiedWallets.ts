import { GenerateWalletOptions, BitGoBase, KeychainsTriplet, SupplementGenerateWalletOptions } from '@bitgo/sdk-core';
import { UnifiedWalletID, UnifiedWallet, GenerateUnifiedWalletOptions } from '../types';
import { supportedCoins, supportedTestCoins } from './types';
import { UnifiedWallets } from '../unifiedWallets';

export class EcdsaEVMUnifiedWallets extends UnifiedWallets {
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
    return await this.generateUnifiedWalletFromKeys(keychainsTriplet, params);
  }

  /** @inheritDoc */
  async generateUnifiedWalletFromKeys(
    keychainsTriplet: KeychainsTriplet,
    params: GenerateWalletOptions
  ): Promise<UnifiedWallet> {
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
    const coins = this.getSupportedCoinList();

    for (const coin of coins) {
      walletData = await this.generateCoinWalletData(coin, walletParams, keychainsTriplet);
      const evmID: UnifiedWalletID = {
        coin,
        walletId: walletData.id,
        address: walletData.receiveAddress.address,
      };
      walletIDs.push(evmID);
    }
    return await this.createUnifiedWallet({
      wallets: walletIDs,
      curve: 'ecdsa',
      keys: [keychainsTriplet.userKeychain.id, keychainsTriplet.bitgoKeychain.id, keychainsTriplet.backupKeychain.id],
    });
  }

  protected getSupportedCoinList(): string[] {
    let coins: string[];
    switch (this.bitgo.getEnv()) {
      case 'prod':
        coins = supportedCoins;
        break;
      default:
        coins = supportedTestCoins;
    }
    return coins;
  }

  protected getDefaultCoinName(): string {
    let coinName;
    switch (this.bitgo.getEnv()) {
      case 'prod':
        coinName = 'eth';
        break;
      default:
        coinName = 'gteth';
    }
    return coinName;
  }
}
