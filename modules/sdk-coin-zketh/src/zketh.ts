/**
 * @prettier
 */
import { BaseCoin, BitGoBase, common, MultisigType, multisigTypes } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  TransactionBuilder as EthLikeTransactionBuilder,
  recoveryBlockchainExplorerQuery,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';

export class Zketh extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Zketh(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): EthLikeTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Make a query to Zksync explorer for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from Zksync explorer
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const explorerUrl = common.Environments[this.bitgo.getEnv()].zksyncExplorerBaseUrl;
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string);
  }

  /** {@inheritDoc } **/
  supportsMultisig(): boolean {
    return true;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.onchain;
  }
}
