import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo/abstract-cosmos';
import { BaseCoin, BitGoBase, Environments } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, BaseUnit, coins } from '@bitgo/statics';
import { KeyPair, TransactionBuilderFactory } from './lib';
import { GAS_AMOUNT, GAS_LIMIT } from './lib/constants';
import utils from './lib/utils';
import { Hash } from 'crypto';

export class Islm extends CosmosCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Islm(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getChain()));
  }

  /** @inheritDoc **/
  getBaseFactor(): string | number {
    return 1e18;
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    return utils.isValidAddress(address) || utils.isValidValidatorAddress(address);
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].islmNodeUrl;
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return BaseUnit.ISLM;
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
  getAddressFromPublicKey(publicKey: string): string {
    return new KeyPair({ pub: publicKey }).getAddress();
  }

  /** @inheritDoc **/
  getHashFunction(): Hash {
    return utils.getHashFunction();
  }

  /** @inheritDoc **/
  protected async getAccountDetails(senderAddress: string): Promise<string[]> {
    const response = await this.getAccountFromNode(senderAddress);
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return [response.body.account.base_account.account_number, response.body.account.base_account.sequence];
  }
}
