import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo/abstract-cosmos';
import { AddressFormat, BaseCoin, BitGoBase, Environments } from '@bitgo/sdk-core';
import { BaseUnit, NetworkType, BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';

import { KeyPair, TransactionBuilderFactory } from './lib';
import { HashUtils } from './lib/utils';

export class Hash extends CosmosCoin {
  protected readonly _utils: HashUtils;
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
    this._utils = new HashUtils(NetworkType.MAINNET);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Hash(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    return 1e9;
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return this._utils.isValidAddress(address) || this._utils.isValidValidatorAddress(address);
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].hashNodeUrl;
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.HASH;
  }

  /** @inheritDoc **/
  getGasAmountDetails(): GasAmountDetails {
    return {
      gasAmount: '5000000000',
      gasLimit: 250000,
    };
  }

  /** @inheritDoc **/
  getKeyPair(publicKey: string): CosmosKeyPair {
    return new KeyPair({ pub: publicKey });
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(publicKey: string): string {
    return new KeyPair({ pub: publicKey }).getAddress(AddressFormat.mainnet);
  }
}
