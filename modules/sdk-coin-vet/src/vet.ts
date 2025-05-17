import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  KeyPair,
  MPCAlgorithm,
  MultisigType,
  multisigTypes,
  ParsedTransaction,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import utils from './lib/utils';

/**
 * Full Name: Vechain
 * Docs: https://docs.vechain.org/
 * GitHub : https://github.com/vechain
 */
export class Vet extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Vet(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest sub division
   */
  public getBaseFactor(): number {
    return 1e18;
  }

  public getChain(): string {
    return 'vet';
  }

  public getFamily(): string {
    return 'vet';
  }

  public getFullName(): string {
    return 'VeChain';
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented');
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new Error('Method not implemented');
  }

  async parseTransaction(): Promise<ParsedTransaction> {
    throw new Error('Method not implemented');
  }

  /**
   * Explain a Vechain transaction
   * @param params
   */
  async explainTransaction(params): Promise<undefined> {
    throw new Error('Method not implemented');
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    throw new Error('Method not implemented');
  }

  isValidPub(pub: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  protected getTxBuilderFactory() {
    throw new Error('Method not implemented.');
  }

  protected async rebuildTransaction(txHex: string): Promise<BaseTransaction> {
    throw new Error('Method not implemented');
  }
}
