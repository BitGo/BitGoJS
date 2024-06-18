/**
 * Testnet Abstractlightningcoin
 *
 * @format
 */
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

export abstract class AbstractLightningCoin extends BaseCoin {
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  // static createInstance(bitgo: BitGoBase): BaseCoin {
  //   return new AbstractLightningCoin(bitgo);
  // }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return 'abstractLightningCoin';
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return 'Testnet Abstract lightning coin';
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    return {
      pub: '',
      prv: '',
    };
  }

  getBaseFactor(): number | string {
    return 1e8;
  }

  getFamily(): string {
    return 'lightning';
  }

  isValidAddress(address: string): boolean {
    return false;
  }

  isValidPub(pub: string): boolean {
    return false;
  }

  isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    return Promise.resolve(false);
  }

  parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return Promise.resolve({});
  }

  signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    return Promise.resolve({});
  }

  verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    return Promise.resolve(false);
  }
}
