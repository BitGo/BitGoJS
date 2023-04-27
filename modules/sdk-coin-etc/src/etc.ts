/**
 * @prettier
 */
import { AbstractEthLikeCoin } from '@bitgo/abstract-eth';
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import { KeyPair, TransactionBuilder } from './lib';

export class Etc extends AbstractEthLikeCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('ffc472f5-27c6-49f8-ad9a-f57659258fb9');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Etc(bitgo);
  }

  /**
   * Factor between the coin's base unit and its smallest subdivison
   */
  public getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  public getId(): string {
    return this._staticsCoin.id;
  }

  public getChain(): string {
    return this._staticsCoin.name;
  }

  public getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  public getFullName(): string {
    return this._staticsCoin.fullName;
  }

  getBaseChain(): string {
    return this.getChain();
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }
}
