import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo-beta/abstract-cosmos';
import { BaseCoin, BitGoBase, Environments } from '@bitgo-beta/sdk-core';
import { BaseUnit, BaseCoin as StaticsBaseCoin, coins } from '@bitgo-beta/statics';
import { KeyPair, TransactionBuilderFactory } from './lib';
import { GAS_AMOUNT, GAS_LIMIT } from './lib/constants';
import utils from './lib/utils';

/**
 *
 * Full Name: Mantra
 * Website: https://www.mantrachain.io/
 * Docs: https://docs.mantrachain.io/
 * GitHub : https://github.com/MANTRA-Chain/
 */
export class Mantra extends CosmosCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Mantra(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    return 1e6;
  }

  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address) || utils.isValidValidatorAddress(address);
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.MANTRA;
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

  /**
   * Get the public node url from the Environments constant we have defined
   */
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].mantraNodeUrl;
  }

  getAddressFromPublicKey(pubKey: string): string {
    return new KeyPair({ pub: pubKey }).getAddress();
  }
}
