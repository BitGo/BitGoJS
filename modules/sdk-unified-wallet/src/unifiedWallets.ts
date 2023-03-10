import { IUnifiedWallets } from './iUnifiedWallets';
import { UnifiedWalletParams, UnifiedWallet, GenerateUnifiedWalletOptions, PaginationOptions } from './types';
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
  Keychains,
} from '@bitgo/sdk-core';
import assert from 'assert';

const isEmpty = (obj) => [Object, Array].includes((obj || {}).constructor) && !Object.entries(obj || {}).length;

export abstract class UnifiedWallets implements IUnifiedWallets {
  protected readonly bitgo: BitGoBase;
  protected readonly coin: IBaseCoin;
  protected coinIdMapping: Record<string, Wallet> = {};
  protected urlPath: string;
  private unifiedWallet: UnifiedWallet;

  protected constructor(bitgo: BitGoBase) {
    this.bitgo = bitgo;
    this.coin = this.bitgo.coin(this.getDefaultCoinName());
    this.urlPath = '/wallet/evm';
  }

  protected abstract getDefaultCoinName(): string;

  /**
   * Get the list of supported coin for a given unified wallet type
   * @protected
   */
  protected abstract getSupportedCoinList(): string[];

  /**
   * Generates a Unified wallet and associated coin specific wallets.
   * @param params
   */
  abstract generateUnifiedWallet(params: GenerateUnifiedWalletOptions): Promise<UnifiedWallet>;

  /**
   * Generates a Unified wallet and associated coin specific wallets.
   * @param keys
   */
  abstract generateUnifiedWalletFromKeys(keys: KeychainsTriplet, params: GenerateWalletOptions): Promise<UnifiedWallet>;

  /**
   * Generate Keychain triplet to be used in creating all EVM coin wallets
   * @param params
   * @param coins
   * @returns KeychainsTriplet
   * @private
   */
  async generateKeychainsTriplet(params: GenerateWalletOptions): Promise<KeychainsTriplet> {
    // Create MPC Keychains
    const keychains = new Keychains(this.bitgo, this.coin);
    const keychainsTriplet = await keychains.createMpc({
      multisigType: 'tss',
      passphrase: params.passphrase,
      enterprise: params.enterprise,
      originalPasscodeEncryptionCode: params.passcodeEncryptionCode,
      backupProvider: params.backupProvider,
    });
    return keychainsTriplet;
  }

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

  /**
   * Get a unified wallet using the unified wallet id
   * @param evmWalletId
   */
  async getUnifiedWalletById(evmWalletId: string): Promise<UnifiedWallet> {
    const result: { result: UnifiedWallet[] } = await this.bitgo
      .get(this.bitgo.url(this.urlPath, 2))
      .query({ evmWalletId })
      .result();
    assert(result.result.length === 1, 'Unexpected EVM wallet return');
    const newWallet = result.result[0];
    return newWallet;
  }

  /**
   * Get a unified wallet using the unified wallet address
   * @param address
   */
  async getUnifiedWalletByAddress(address: string): Promise<UnifiedWallet> {
    const result: { result: UnifiedWallet[] } = await this.bitgo
      .get(this.bitgo.url(this.urlPath, 2))
      .query({ address })
      .result();
    assert(result.result.length === 1, 'Unexpected EVM wallet return');
    const newWallet = result.result[0];
    return newWallet;
  }

  /**
   * Get all unified wallets associated with current BitGo account
   * @param paginationOptions
   */
  async getUnifiedWallets(
    paginationOptions: PaginationOptions = { prevPage: 0, limit: 15, order: 'DESC' }
  ): Promise<UnifiedWallet[]> {
    const { limit, order, prevPage: page } = paginationOptions;
    return await this.bitgo.get(this.bitgo.url(this.urlPath, 2)).query({ limit, order, page }).result();
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

  /** @inheritDoc */
  async getCoinWalletById(id: string, coinName: string): Promise<Wallet> {
    if (!id) {
      throw new Error('Id field cannot be empty');
    }
    const supportedCoins = this.getSupportedCoinList();
    if (!supportedCoins.includes(coinName)) {
      throw new Error(`unsupported coin ${coinName}`);
    }
    if (this.unifiedWallet === undefined) {
      this.unifiedWallet = await this.getUnifiedWalletById(id);
    }
    if (isEmpty(this.coinIdMapping) || !Object.keys(this.coinIdMapping).includes(coinName)) {
      let coinWalletId;
      for (const wallet of this.unifiedWallet.wallets) {
        if (wallet.coin == coinName) {
          coinWalletId = wallet.walletId;
          break;
        }
      }
      const wallet = await this.getWallet({ id: coinWalletId, allTokens: false });
      this.coinIdMapping[coinName] = wallet;
    }
    return this.coinIdMapping[coinName];
  }
}
