import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo/abstract-cosmos';
import { TransactionBuilderFactory } from './lib';

export class Fetch extends CosmosCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Fetch(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** @inheritDoc **/
  getBuilder(): TransactionBuilderFactory {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritDoc **/
  getDenomination(): string {
    throw new Error('Method not implemented');
  }

  /** @inheritDoc **/
  getGasAmountDetails(): GasAmountDetails {
    throw new Error('Method not implemented');
  }

  /** @inheritDoc **/
  getKeyPair(publicKey: string): CosmosKeyPair {
    throw new Error('Method not implemented');
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    throw new Error('Method not implemented');
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(pubKey: string): string {
    throw new Error('Method not implemented');
  }
}
