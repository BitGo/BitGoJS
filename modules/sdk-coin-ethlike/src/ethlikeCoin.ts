import EthereumCommon from '@ethereumjs/common';
import { AbstractEthLikeNewCoins, recoveryBlockchainExplorerQuery } from '@bitgo/abstract-eth';
import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { EthLikeTransactionBuilder } from './lib';

interface CommonConfig {
  chain?: number;
  chainId?: number;
  hardfork?: string;
}

export class EthLikeCoin extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new EthLikeCoin(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(common?: EthereumCommon | CommonConfig): EthLikeTransactionBuilder {
    let ethereumCommon: EthereumCommon | undefined;

    // If common is an EthereumCommon instance, use it directly
    if (common instanceof EthereumCommon) {
      ethereumCommon = common;
    }
    // If common is provided as a plain object, convert it to EthereumCommon instance
    else if (common && typeof common === 'object') {
      try {
        const chainId = common.chain || common.chainId;
        const hardfork = common.hardfork || 'london';

        if (chainId) {
          ethereumCommon = EthereumCommon.custom({
            name: this.getFullName(),
            chainId: chainId,
            defaultHardfork: hardfork,
          });
        }
      } catch (error) {
        ethereumCommon = undefined;
      }
    }
    return new EthLikeTransactionBuilder(coins.get(this.getBaseChain()), ethereumCommon);
  }

  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<Record<string, unknown>> {
    const apiToken = common.Environments[this.bitgo.getEnv()][this.getFamily().toLowerCase() + 'ApiToken'];
    const explorerUrl = common.Environments[this.bitgo.getEnv()][this.getFamily().toLowerCase() + 'ExplorerUrl'];
    return await recoveryBlockchainExplorerQuery(query, explorerUrl as string, apiToken);
  }
}
