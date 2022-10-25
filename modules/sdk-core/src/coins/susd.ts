/**
 * @prettier
 */
import {
  BaseCoin,
  BitGoBase,
  KeyPair,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions,
  VerifyAddressOptions,
  VerifyTransactionOptions,
} from '../';

export class Susd extends BaseCoin {
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Susd(bitgo);
  }

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor(): number {
    return 1e2;
  }

  getChain(): string {
    return 'susd';
  }

  getFamily(): string {
    return 'susd';
  }

  getFullName(): string {
    return 'Silvergate USD';
  }

  /**
   * Return whether the given m of n wallet signers/ key amounts are valid for the coin
   */
  isValidMofNSetup({ m, n }: { m: number; n: number }): boolean {
    return m === 0 && n === 0;
  }

  isValidAddress(address: string): boolean {
    throw new MethodNotImplementedError();
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    throw new MethodNotImplementedError();
  }

  isValidPub(pub: string): boolean {
    throw new MethodNotImplementedError();
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return true;
  }

  async signTransaction(params: SignTransactionOptions = {}): Promise<SignedTransaction> {
    throw new MethodNotImplementedError();
  }
}
