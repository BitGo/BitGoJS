import {
  AuditDecryptedKeyParams,
  BaseCoin,
  BitGoBase,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  TransactionExplanation,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { KeyPair as TempoKeyPair } from './lib/keyPair';
import utils from './lib/utils';

export class Tempo extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tempo(bitgo, staticsCoin);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivision
   */
  public getBaseFactor(): number {
    return 1e18;
  }

  public getChain(): string {
    return 'tempo';
  }

  public getFamily(): string {
    return 'tempo';
  }

  public getFullName(): string {
    return 'Tempo';
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Checks if this is a valid base58 or hex address
   * @param address
   */
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address);
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new TempoKeyPair({ seed }) : new TempoKeyPair();
    const keys = keyPair.getKeys();

    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }

    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return utils.isValidPublicKey(pub);
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   * @param params
   * @param params.txPrebuild
   * @param params.txParams
   * @returns {boolean}
   */
  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    // TODO: Implement transaction verification
    return false;
  }

  /**
   * Check if address is a wallet address
   * @param params
   */
  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    // TODO: Implement address verification
    return false;
  }

  /**
   * Audit a decrypted private key for security purposes
   * @param params
   */
  async auditDecryptedKey(params: AuditDecryptedKeyParams): Promise<void> {
    // TODO: Implement key auditing logic if needed
    // This method is typically used for security compliance
    return Promise.resolve();
  }

  /**
   * Parse a transaction from the raw transaction hex
   * @param params
   */
  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    // TODO: Implement transaction parsing
    return {} as ParsedTransaction;
  }

  /**
   * Explain a transaction
   * @param params
   */
  async explainTransaction(params: Record<string, unknown>): Promise<TransactionExplanation> {
    // TODO: Implement transaction explanation
    return {} as TransactionExplanation;
  }

  /**
   * Sign a transaction
   * @param params
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    // TODO: Implement transaction signing
    return {} as SignedTransaction;
  }
}
