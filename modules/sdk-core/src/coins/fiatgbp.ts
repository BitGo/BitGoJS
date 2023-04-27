/**
 * @prettier
 */
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
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

export class FiatGBP extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('4718054b-894c-431c-9339-43aa1620acdd');
  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new FiatGBP(bitgo);
  }

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  getId(): string {
    return this._staticsCoin.id;
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
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
