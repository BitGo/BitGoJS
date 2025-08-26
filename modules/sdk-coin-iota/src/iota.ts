import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  KeyPair as KeyPairInterface,
  ParseTransactionOptions,
  ParsedTransaction,
  SignTransactionOptions,
  SignedTransaction,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily } from '@bitgo/statics';
import utils from './lib/utils';

export class Iota extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Iota(bitgo, staticsCoin);
  }

  getBaseFactor(): string | number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  getChain() {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName() {
    return this._staticsCoin.fullName;
  }

  /**
   * Check if an address is valid
   * @param address the address to be validated
   * @returns true if the address is valid
   */
  isValidAddress(address: string): boolean {
    // IOTA addresses are 64-character hex strings
    return utils.isValidAddress(address);
  }

  /**
   * Verifies that a transaction prebuild complies with the original intention
   * @param params
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    // TODO: Add IOTA-specific transaction verification logic
    return true;
  }

  /**
   * Check if an address belongs to a wallet
   * @param params
   */
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    return this.isValidAddress(params.address);
  }

  /**
   * Parse a transaction
   * @param params
   */
  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    // TODO: Add IOTA-specific transaction parsing logic
    return {};
  }

  /**
   * Generate a key pair
   * @param seed Optional seed to generate key pair from
   */
  generateKeyPair(seed?: Uint8Array): KeyPairInterface {
    // For now we're just returning an empty implementation as the KeyPair class needs to be implemented
    // In a real implementation, we would use the KeyPair class properly
    return {
      pub: '',
      prv: '',
    };
  }

  /**
   * Check if a public key is valid
   * @param pub Public key to check
   */
  isValidPub(pub: string): boolean {
    // TODO: Implement proper IOTA public key validation
    return pub.length > 0;
  }

  /**
   * Sign a transaction
   * @param params
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    // TODO: Add IOTA-specific transaction signing logic
    return {
      halfSigned: {
        txHex: '',
      },
    };
  }

  /**
   * Audit a decrypted private key to ensure it's valid
   * @param params
   */
  auditDecryptedKey(params: AuditDecryptedKeyParams): void {
    // TODO: Implement IOTA-specific key validation logic
  }
}
