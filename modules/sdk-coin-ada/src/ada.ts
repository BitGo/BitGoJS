import {
  BaseCoin,
  BitGoBase,
  KeyPair,
  MPCAlgorithm,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';

export class Ada extends BaseCoin {
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Ada(bitgo);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e6;
  }

  public getChain(): string {
    return 'ada';
  }

  public getFamily(): string {
    return 'ada';
  }

  public getFullName(): string {
    return 'Ada';
  }

  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  isWalletAddress(params: VerifyAddressOptions): boolean {
    throw new Error('Method not implemented.');
  }

  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    throw new Error('Method not implemented.');
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    throw new Error('Method not implemented.');
  }

  isValidPub(pub: string): boolean {
    throw new Error('Method not implemented.');
  }

  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Flag indicating if this coin supports TSS wallets.
   * @returns {boolean} True if TSS Wallets can be created for this coin
   */
  supportsTss(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }
}
