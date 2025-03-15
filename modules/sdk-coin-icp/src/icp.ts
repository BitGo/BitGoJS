import {
  BaseCoin,
  BitGoBase,
  MPCAlgorithm,
  MethodNotImplementedError,
  VerifyTransactionOptions,
  TssVerifyAddressOptions,
  ParseTransactionOptions,
  ParsedTransaction,
  KeyPair,
  SignTransactionOptions,
  SignedTransaction,
  Environments,
  MultisigType,
  multisigTypes,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import utils from './lib/utils';

/**
 * Class representing the Internet Computer (ICP) coin.
 * Extends the BaseCoin class and provides specific implementations for ICP.
 *
 * @see {@link https://internetcomputer.org/}
 * @see {@link https://internetcomputer.org/docs/current/developer-docs/defi/rosetta/icp_rosetta/data_api/}
 */
export class Icp extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Icp(bitgo, staticsCoin);
  }

  getChain(): string {
    return 'icp';
  }

  getBaseChain(): string {
    return 'icp';
  }

  getFamily(): string {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return 'Internet Computer';
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new MethodNotImplementedError();
  }

  /**
   * Generate a new keypair for this coin.
   * @param seed Seed from which the new keypair should be generated, otherwise a random seed is used
   */
  public generateKeyPair(seed?: Buffer): KeyPair {
    return utils.generateKeyPair(seed);
  }

  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  signTransaction(_: SignTransactionOptions): Promise<SignedTransaction> {
    throw new MethodNotImplementedError();
  }

  isValidPub(key: string): boolean {
    return utils.isValidPublicKey(key);
  }

  isValidPrv(key: string): boolean {
    return utils.isValidPrivateKey(key);
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.tss;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  private async getAddressFromPublicKey(hexEncodedPublicKey: string) {
    return utils.getAddressFromPublicKey(hexEncodedPublicKey);
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].rosettaNodeURL;
  }
}
