import {
  GenerateWalletOptions,
  BitGoBase,
  KeychainsTriplet,
  SupplementGenerateWalletOptions,
  WalletData,
} from '@bitgo/sdk-core';
import { EvmWalletKeychains } from './evmWalletKeychains';
import { supportedCoins, EvmWalletID, EvmWallet, EvmWalletParams } from './types';

export class EvmWallets {
  private readonly bitgo: BitGoBase;

  constructor(bitgo: BitGoBase) {
    this.bitgo = bitgo;
  }

  /**
   * Generates an EVM wallet and associated evm coin specific wallets.
   * @param params
   */
  async generateEVMWallet(params: GenerateWalletOptions): Promise<EvmWallet> {
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

    const keychainsTriplet = await this.generateKeyChainsTriplet(params);
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
    const walletIDs: EvmWalletID[] = [];
    let walletData;

    for (const coin of supportedCoins) {
      walletData = await this.generateCoinWalletData(coin, walletParams, keychainsTriplet);
      const evmID: EvmWalletID = {
        coinName: coin,
        walletId: walletData.id,
      };
      walletIDs.push(evmID);
    }
    return await this.createEVMWallet({ address: walletData.receiveAddress.address, wallets: walletIDs });
  }

  /**
   * Generate Keychain triplet to be used in creating all EVM coin wallets
   * @param params
   * @returns KeychainsTriplet
   * @private
   */
  private async generateKeyChainsTriplet(params: GenerateWalletOptions): Promise<KeychainsTriplet> {
    // Create MPC Keychains
    const evmWalletKeychains = new EvmWalletKeychains(this.bitgo);
    const keychainsTriplet = await evmWalletKeychains.createMpc({
      multisigType: 'tss',
      passphrase: params.passphrase,
      enterprise: params.enterprise,
      originalPasscodeEncryptionCode: params.passcodeEncryptionCode,
      backupProvider: params.backupProvider,
    });
    return keychainsTriplet;
  }

  /**
   * Generate the walletData for a given EVM coin using the common keychain triplet
   * @param coinName
   * @param walletParams
   * @param keychainTriplet
   * @returns WalletData
   * @private
   */
  private async generateCoinWalletData(
    coinName: string,
    walletParams: SupplementGenerateWalletOptions,
    keychainTriplet: KeychainsTriplet
  ): Promise<WalletData> {
    const coin = this.bitgo.coin(coinName);
    const finalWalletParams = await coin.supplementGenerateWallet(walletParams, keychainTriplet);
    const newWallet = await this.bitgo.post(coin.url('/wallet')).send(finalWalletParams).result();
    return newWallet;
  }

  /**
   * Calls Bitgo API to create an EVM wallet.
   * @param params
   * @private
   */
  private async createEVMWallet(params: EvmWalletParams): Promise<EvmWallet> {
    const urlPath = 'api/v2/wallets/evm';
    return this.bitgo.post(this.bitgo.url(urlPath, 2)).send(params).result();
  }
}
