import { IUnifiedWallets } from './iUnifiedWallets';
import { UnifiedWalletParams, UnifiedWallet, GenerateUnifiedWalletOptions } from './types';
import {
  SupplementGenerateWalletOptions,
  BitGoBase,
  GenerateWalletOptions,
  KeychainsTriplet,
  WalletData,
  IBaseCoin,
} from '@bitgo/sdk-core';
import { CoinFamily } from '@bitgo/statics';
import assert from 'assert';

export abstract class UnifiedWallets implements IUnifiedWallets {
  protected readonly bitgo: BitGoBase;
  protected readonly coin: IBaseCoin;
  protected urlPath: string;

  protected constructor(bitgo: BitGoBase, coinName: string) {
    this.bitgo = bitgo;
    this.coin = this.bitgo.coin(coinName);
  }

  /**
   * Generates an EVM wallet and associated evm coin specific wallets.
   * @param params
   */
  abstract generateUnifiedWallet(params: GenerateUnifiedWalletOptions): Promise<UnifiedWallet>;

  /**
   * Generate Keychain triplet to be used in creating all EVM coin wallets
   * @param params
   * @param coins
   * @returns KeychainsTriplet
   * @private
   */
  protected abstract generateKeychainsTriplet(
    params: GenerateWalletOptions,
    coins?: CoinFamily[]
  ): Promise<KeychainsTriplet>;

  /**
   * Calls Bitgo API to create an EVM wallet.
   * @param params
   * @private
   */
  protected async createSingleCoinWallet(params: UnifiedWalletParams): Promise<UnifiedWallet> {
    assert(this.urlPath, 'urlPath must be initialized');
    return this.bitgo.post(this.bitgo.url(this.urlPath, 2)).send(params).result();
  }

  /**
   * Generate the walletData for a given EVM coin using the common keychain triplet
   * @param coinName
   * @param walletParams
   * @param keychainTriplet
   * @returns WalletData
   * @private
   */
  protected async generateCoinWalletData(
    coinName: string,
    walletParams: SupplementGenerateWalletOptions,
    keychainsTriplet: KeychainsTriplet
  ): Promise<WalletData> {
    const coin = this.bitgo.coin(coinName);
    const finalWalletParams = await coin.supplementGenerateWallet(walletParams, keychainsTriplet);
    const newWallet = await this.bitgo.post(coin.url('/wallet')).send(finalWalletParams).result();
    return newWallet;
  }

  async getUnifiedWalletById(id: string): Promise<UnifiedWallet> {
    const newWallet = await this.bitgo.get(this.bitgo.url(this.urlPath, 2)).query({ id }).result();
    return newWallet;
  }

  async getUnifiedWalletByAddress(address: string): Promise<UnifiedWallet> {
    return await this.bitgo.get(this.bitgo.url(this.urlPath, 2)).query({ address }).result();
  }

  async getAllUnifiedWallets(): Promise<UnifiedWallet[]> {
    return await this.bitgo.get(this.bitgo.url(this.urlPath, 2)).result();
  }
}
