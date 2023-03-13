import { UnifiedWallets } from '../unifiedWallets';
import {
  BitGoBase,
  GenerateWalletOptions,
  KeychainsTriplet,
  SupplementGenerateWalletOptions,
  Wallet,
} from '@bitgo/sdk-core';
import { GenerateUnifiedWalletOptions, UnifiedWallet, UnifiedWalletID } from '../types';
import { supportedEDDSACoins, supportedEDDSATestCoins } from './types';

export class EddsaUnifiedWallets extends UnifiedWallets {
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
      const unifiedWalletId: UnifiedWalletID = {
        coin,
        walletId: walletData.id,
        address: walletData.receiveAddress.address,
      };
      walletIDs.push(unifiedWalletId);
    }

    // TODO(BG-70175): Replace with UnifiedWallet from WP once BG-70174 has been implemented.
    const placeHolderUnifiedWallet: UnifiedWallet = {
      id: '',
      wallets: walletIDs,
      curve: 'eddsa',
      keys: [keychainsTriplet.userKeychain.id, keychainsTriplet.bitgoKeychain.id, keychainsTriplet.backupKeychain.id],
    };

    return placeHolderUnifiedWallet;
  }

  /** @inheritDoc */
  protected getSupportedCoinList(): string[] {
    let coins: string[];
    switch (this.bitgo.getEnv()) {
      case 'prod':
        coins = supportedEDDSACoins;
        break;
      default:
        coins = supportedEDDSATestCoins;
    }
    return coins;
  }

  protected getDefaultCoinName(): string {
    let coinName;
    switch (this.bitgo.getEnv()) {
      case 'prod':
        coinName = 'sol';
        break;
      default:
        coinName = 'tsol';
    }
    return coinName;
  }

  // TODO(BG-70175): remove once BG-70174 has been implemented
  async getCoinWalletById(id: string, coinName: string): Promise<Wallet> {
    throw new Error('Not yet implemented');
  }

  // TODO(BG-70175): remove once BG-70174 has been implemented
  async getUnifiedWalletById(evmWalletId: string): Promise<UnifiedWallet> {
    throw new Error('Not yet implemented');
  }

  // TODO(BG-70175): remove once BG-70174 has been implemented
  async getUnifiedWalletByAddress(address: string): Promise<UnifiedWallet> {
    throw new Error('Not yet implemented');
  }
}
