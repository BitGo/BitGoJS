import {
  BaseCoin,
  BitGoBase,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '@bitgo/sdk-core';

export class Rune extends BaseCoin {
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Rune(bitgo) as unknown as BaseCoin;
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return 1e8;
  }

  public getChain(): string {
    return 'rune';
  }

  public getFamily(): string {
    return 'rune';
  }

  public getFullName(): string {
    return 'Rune';
  }

  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    return Promise.resolve(true);
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
}
