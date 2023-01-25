import { IUnifiedWallets } from './iUnifiedWallets';
import { UnifiedWalletParams, UnifiedWallet, GenerateUnifiedWalletOptions } from './types';
import {
  SupplementGenerateWalletOptions,
  BitGoBase,
  GenerateWalletOptions,
  KeychainsTriplet,
  WalletData,
} from '@bitgo/sdk-core';

export abstract class UnifiedWallets implements IUnifiedWallets {
  protected readonly bitgo: BitGoBase;

  protected constructor(bitgo: BitGoBase) {
    this.bitgo = bitgo;
  }

  /**
   * Generate Keychain triplet to be used in creating all EVM coin wallets
   * @param params
   * @returns KeychainsTriplet
   * @private
   */
  abstract generateKeychainsTriplet(params: GenerateWalletOptions): Promise<KeychainsTriplet>;

  /**
   * Calls Bitgo API to create an EVM wallet.
   * @param params
   * @private
   */
  async createUnifiedWallet(params: UnifiedWalletParams): Promise<UnifiedWallet> {
    const urlPath = 'api/v2/wallets/evm';
    return this.bitgo.post(this.bitgo.url(urlPath, 2)).send(params).result();
  }

  /**
   * Generates an EVM wallet and associated evm coin specific wallets.
   * @param params
   */
  abstract generateUnifiedWallet(params: GenerateUnifiedWalletOptions): Promise<UnifiedWallet>;

  /**
   * Generate the walletData for a given EVM coin using the common keychain triplet
   * @param coinName
   * @param walletParams
   * @param keychainTriplet
   * @returns WalletData
   * @private
   */
  async generateCoinWalletData(
    coinName: string,
    walletParams: SupplementGenerateWalletOptions,
    keychainsTriplet: KeychainsTriplet
  ): Promise<WalletData> {
    const coin = this.bitgo.coin(coinName);
    const finalWalletParams = await coin.supplementGenerateWallet(walletParams, keychainsTriplet);
    const newWallet = await this.bitgo.post(coin.url('/wallet')).send(finalWalletParams).result();
    return newWallet;
  }
}
