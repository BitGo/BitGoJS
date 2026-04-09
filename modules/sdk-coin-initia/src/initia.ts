import { BaseCoin, BitGoBase, Environments } from '@bitgo/sdk-core';
import { BaseUnit, BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo/abstract-cosmos';
import { KeyPair, TransactionBuilderFactory } from './lib';
import { GAS_AMOUNT, GAS_LIMIT } from './lib/constants';
import utils from './lib/utils';

/**
 *
 * Full Name: Initia
 * Website: https://initia.xyz/
 * Docs: https://docs.initia.xyz/
 * GitHub : https://github.com/initia-labs
 */
export class Initia extends CosmosCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Initia(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** @inheritDoc **/
  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address) || utils.isValidValidatorAddress(address);
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.INITIA;
  }

  /** @inheritDoc **/
  getGasAmountDetails(): GasAmountDetails {
    return {
      gasAmount: GAS_AMOUNT,
      gasLimit: GAS_LIMIT,
    };
  }

  /** @inheritDoc **/
  getKeyPair(publicKey: string): CosmosKeyPair {
    return new KeyPair({ pub: publicKey });
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].initiaNodeUrl;
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(pubKey: string): string {
    return new KeyPair({ pub: pubKey }).getAddress();
  }
}
