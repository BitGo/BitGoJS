import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import { AbstractEthLikeCoin } from '@bitgo/abstract-eth';
import { KeyPair, TransactionBuilder } from './lib';

export class Rbtc extends AbstractEthLikeCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('f465c617-752d-4f6a-b9e7-528bf38f62c3');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Rbtc(bitgo);
  }

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
