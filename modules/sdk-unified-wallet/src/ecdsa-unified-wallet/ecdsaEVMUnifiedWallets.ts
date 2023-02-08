import {
  GenerateWalletOptions,
  BitGoBase,
  KeychainsTriplet,
  SupplementGenerateWalletOptions,
  Keychains,
  Wallet,
} from '@bitgo/sdk-core';
import { UnifiedWalletID, UnifiedWallet, GenerateUnifiedWalletOptions } from '../types';
import { supportedCoins, supportedTestCoins } from './types';
import { UnifiedWallets } from '../unifiedWallets';

const isEmpty = (obj) => [Object, Array].includes((obj || {}).constructor) && !Object.entries(obj || {}).length;

export class EcdsaEVMUnifiedWallets extends UnifiedWallets {
  private coinIdMapping: Record<string, Wallet> = {};
  private unifiedWallet: UnifiedWallet;
  constructor(bitgo: BitGoBase) {
    super(bitgo);
    this.urlPath = '/wallet/evm';
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
    let coins: string[];
    switch (this.bitgo.getEnv()) {
      case 'prod':
        coins = supportedCoins;
        break;
      default:
        coins = supportedTestCoins;
    }

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

  /** @inheritDoc */
  async generateKeychainsTriplet(params: GenerateWalletOptions): Promise<KeychainsTriplet> {
    // Create MPC Keychains
    const evmWalletKeychains = new Keychains(this.bitgo, this.coin);
    const keychainsTriplet = await evmWalletKeychains.createMpc({
      multisigType: 'tss',
      passphrase: params.passphrase,
      enterprise: params.enterprise,
      originalPasscodeEncryptionCode: params.passcodeEncryptionCode,
      backupProvider: params.backupProvider,
    });
    return keychainsTriplet;
  }

  async getCoinWalletById(id: string, coinName: string): Promise<Wallet> {
    if (!id) {
      throw new Error('Id field cannot be empty');
    }
    if (!supportedCoins.includes(coinName)) {
      throw new Error(`unsupported coin ${coinName}`);
    }
    if (this.unifiedWallet === undefined) {
      this.unifiedWallet = await this.getUnifiedWalletById(id);
    }
    if (isEmpty(this.coinIdMapping) || !Object.keys(this.coinIdMapping).includes(coinName)) {
      let coinWalletId;
      for (const id of this.unifiedWallet.wallets) {
        if (id.coin == coinName) {
          coinWalletId = id.walletId;
          break;
        }
      }
      const wallet = await this.getWallet({ id: coinWalletId, allTokens: false });
      this.coinIdMapping[coinName] = wallet;
    }
    return this.coinIdMapping[coinName];
  }
}
