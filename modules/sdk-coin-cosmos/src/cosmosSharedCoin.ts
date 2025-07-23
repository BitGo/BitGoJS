import assert from 'assert';
import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
import { CosmosCoin, CosmosKeyPair, GasAmountDetails } from '@bitgo/abstract-cosmos';
import { BaseCoin as StaticsBaseCoin, CosmosNetwork } from '@bitgo/statics';
import { KeyPair, Utils, TransactionBuilderFactory } from './lib';

/**
 * Shared Cosmos coin implementation that uses configuration from statics
 * instead of requiring individual coin modules
 */
export class CosmosSharedCoin extends CosmosCoin {
  private readonly _network: CosmosNetwork;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    // Get the network configuration from statics
    const network = staticsCoin.network as CosmosNetwork;
    if (!network || !network.addressPrefix || !network.validatorPrefix) {
      throw new Error('Invalid network configuration: missing required Cosmos network parameters');
    }

    this._network = network;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new CosmosSharedCoin(bitgo, staticsCoin);
  }

  /** @inheritDoc **/
  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /** @inheritDoc **/
  getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(this._staticsCoin);
  }

  /** @inheritDoc **/
  isValidAddress(address: string): boolean {
    const utils = new Utils(this._network);
    return utils.isValidAddress(address) || utils.isValidValidatorAddress(address);
  }

  /** @inheritDoc **/
  getDenomination(): string {
    return this._network.denom;
  }

  /** @inheritDoc **/
  getGasAmountDetails(): GasAmountDetails {
    return {
      gasAmount: this._network.gasAmount,
      gasLimit: this._network.gasLimit,
    };
  }

  /**
   * Get the network configuration for this coin
   * @returns {CosmosNetwork} The network configuration
   */
  getNetwork(): CosmosNetwork {
    return this._network;
  }

  /** @inheritDoc **/
  getKeyPair(publicKey: string): CosmosKeyPair {
    return new KeyPair({ pub: publicKey }, this._staticsCoin);
  }

  /** @inheritDoc **/
  getAddressFromPublicKey(pubKey: string): string {
    const keyPair = new KeyPair({ pub: pubKey }, this._staticsCoin);
    return keyPair.getAddress();
  }

  /** @inheritDoc **/
  protected getPublicNodeUrl(): string {
    const family = this.getFamily();
    const env = this.bitgo.getEnv();
    const cosmosConfig = common.Environments[env]?.cosmos;
    assert(cosmosConfig?.[family]?.nodeUrl, `env config is missing for ${family} in ${env}`);
    return cosmosConfig[family].nodeUrl;
  }
}
