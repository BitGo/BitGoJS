import { BaseCoin, BitGoBase, MPCAlgorithm } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
import { AbstractEthLikeCoin } from '@bitgo/abstract-eth';
import { TransactionBuilder as EthTransactionBuilder } from '@bitgo/sdk-coin-eth';
import { TransactionBuilder } from './lib';

export class Bsc extends AbstractEthLikeCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('d0d44124-c7e9-4214-96ae-fbc6856ee3c2');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Bsc(bitgo);
  }

  protected getTransactionBuilder(): EthTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
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
}
