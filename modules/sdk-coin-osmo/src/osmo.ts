import { BaseCoin, BitGoBase, Environments } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, BaseUnit, coins } from '@bitgo/statics';
import { KeyPair } from './lib/keyPair';
import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo/abstract-cosmos';
import { TransactionBuilderFactory } from './lib';
import utils from './lib/utils';

export class Osmo extends CosmosCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Osmo(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    return 1e6;
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return (
      utils.isValidAddress(address) || utils.isValidValidatorAddress(address) || utils.isValidContractAddress(address)
    );
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].osmoNodeUrl;
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.OSMO;
  }

  /** @inheritDoc **/
  getGasAmountDetails(): GasAmountDetails {
    return {
      gasAmount: '7000',
      gasLimit: 250000,
    };
  }

  /** @inheritDoc **/
  getKeyPair(publicKey: string): CosmosKeyPair {
    return new KeyPair({ pub: publicKey });
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(publicKey: string): string {
    return new KeyPair({ pub: publicKey }).getAddress();
  }

  /** @inheritDoc **/
  valuelessTransferAllowed(): boolean {
    return true;
  }
}
