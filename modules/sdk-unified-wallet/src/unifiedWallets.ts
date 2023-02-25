import { IUnifiedWallets } from './iUnifiedWallets';
import { UnifiedWalletParams, UnifiedWallet, GenerateUnifiedWalletOptions } from './types';
import {
  SupplementGenerateWalletOptions,
  BitGoBase,
  GenerateWalletOptions,
  KeychainsTriplet,
  WalletData,
  IBaseCoin,
  GetWalletOptions,
  Wallet,
  RequestTracer,
} from '@bitgo/sdk-core';
import assert from 'assert';

export abstract class UnifiedWallets implements IUnifiedWallets {
  protected readonly bitgo: BitGoBase;
  protected readonly coin: IBaseCoin;
  protected urlPath: string;

  protected constructor(bitgo: BitGoBase) {
    this.bitgo = bitgo;
    let coinName;
    switch (this.bitgo.getEnv()) {
      case 'prod':
        coinName = 'eth';
        break;
      default:
        coinName = 'gteth';
    }
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
  protected abstract generateKeychainsTriplet(params: GenerateWalletOptions): Promise<KeychainsTriplet>;

  /**
   * Calls Bitgo API to create an EVM wallet.
   * @param params
   * @private
   */
  protected async createUnifiedWallet(params: UnifiedWalletParams): Promise<UnifiedWallet> {
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

  async getUnifiedWalletById(evmWalletId: string): Promise<UnifiedWallet> {
    const result: { result: UnifiedWallet[] } = await this.bitgo
      .get(this.bitgo.url(this.urlPath, 2))
      .query({ evmWalletId })
      .result();
    assert(result.result.length === 1, 'Unexpected EVM wallet return');
    const newWallet = result.result[0];
    return newWallet;
  }

  async getUnifiedWalletByAddress(address: string): Promise<UnifiedWallet> {
    const result: { result: UnifiedWallet[] } = await this.bitgo
      .get(this.bitgo.url(this.urlPath, 2))
      .query({ address })
      .result();
    assert(result.result.length === 1, 'Unexpected EVM wallet return');
    const newWallet = result.result[0];
    return newWallet;
  }

  async getAllUnifiedWallets(): Promise<UnifiedWallet[]> {
    return await this.bitgo.get(this.bitgo.url(this.urlPath, 2)).result();
  }

  protected async getWallet(params: GetWalletOptions = {}): Promise<Wallet> {
    if (!params.id) {
      throw new Error('id is required');
    }
    const query: GetWalletOptions = {};
    if (params.allTokens) {
      if (typeof params.allTokens !== 'boolean') {
        throw new Error('invalid allTokens argument, expecting boolean');
      }
      query.allTokens = params.allTokens;
    }
    this.bitgo.setRequestTracer(new RequestTracer());
    const walletData = await this.bitgo
      .get(this.coin.url('/wallet/' + params.id))
      .query(query)
      .result();
    return new Wallet(this.bitgo, this.coin, walletData);
  }
}
