import { BaseCoin, BitGoBase, Environments } from '@bitgo/sdk-core';
import { BaseUnit, BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo/abstract-cosmos';
import { KeyPair, TransactionBuilderFactory } from './lib';
import { GAS_AMOUNT, GAS_LIMIT } from './lib/constants';
import utils from './lib/utils';

/**
 *
 * Full Name: Fetch
 * Website: https://innovationlab.fetch.ai/
 * Docs: https://website.prod.fetch-ai.com/docs/
 * GitHub : https://github.com/fetchai
 */
export class FetchAi extends CosmosCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new FetchAi(bitgo, staticsCoin);
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
    return BaseUnit.FETCHAI;
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
    return Environments[this.bitgo.getEnv()].fetchAiNodeUrl;
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(pubKey: string): string {
    return new KeyPair({ pub: pubKey }).getAddress();
  }
}
