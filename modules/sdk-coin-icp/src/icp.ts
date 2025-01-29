import {
  BaseCoin,
  BitGoBase,
  MPCAlgorithm,
  VerifyTransactionOptions,
  TssVerifyAddressOptions,
  ParseTransactionOptions,
  ParsedTransaction,
  KeyPair,
  SignTransactionOptions,
  SignedTransaction,
  Environments,
} from '@bitgo/sdk-core';
import { KeyPair as IcpKeyPair } from './lib/keyPair';
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
    return 'icp';
  }

  getFullName(): string {
    return 'Internet Computer';
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async isWalletAddress(params: TssVerifyAddressOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Generate a new keypair for this coin.
   * @param seed Seed from which the new keypair should be generated, otherwise a random seed is used
   */
  public generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new IcpKeyPair({ seed }) : new IcpKeyPair();
    const keys = keyPair.getExtendedKeys();
    if (!keys.xprv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.xpub,
      prv: keys.xprv,
    };
  }

  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  signTransaction(_: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  isValidPub(key: string): boolean {
    return utils.isValidPublicKey(key);
  }

  isValidPrv(_: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  private async getAddressFromPublicKey(hexEncodedPublicKey: string) {
    const isKeyValid = this.isValidPub(hexEncodedPublicKey);
    if (!isKeyValid) {
      throw new Error('Public Key is not in a valid Hex Encoded Format');
    }
    const compressedKey = utils.compressPublicKey(hexEncodedPublicKey);
    const KeyPair = new IcpKeyPair({ pub: compressedKey });
    return KeyPair.getAddress();
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].rosettaNodeURL;
  }
}
