/**
 * @prettier
 */
import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, ethGasConfigs } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  OfflineVaultTxInfo,
  optionalDeps,
  RecoverOptions,
  RecoveryInfo,
  TransactionBuilder as EthLikeTransactionBuilder,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import request from 'superagent';
import { BN } from 'ethereumjs-util';
import { Buffer } from 'buffer';

export class EthLikeAvaxc extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new EthLikeAvaxc(bitgo, staticsCoin);
  }

  async recover(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    if (params.isTss === true) {
      return super.recoverTSS(params, params.openSSLBytes);
    }
    debugger;
    return super.recoverEthLike(params);
  }

  protected getTransactionBuilder(): EthLikeTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  setGasLimit(userGasLimit?: number): number {
    if (!userGasLimit) {
      return ethGasConfigs.defaultGasLimit;
    }
    const gasLimitMax = ethGasConfigs.maximumGasLimit;
    const gasLimitMin = ethGasConfigs.minimumGasLimit;
    if (userGasLimit < gasLimitMin || userGasLimit > gasLimitMax) {
      throw new Error(`Gas limit must be between ${gasLimitMin} and ${gasLimitMax}`);
    }
    return userGasLimit;
  }

  setGasPrice(userGasPrice?: number): number {
    if (!userGasPrice) {
      return ethGasConfigs.defaultGasPrice;
    }

    const gasPriceMax = ethGasConfigs.maximumGasPrice;
    const gasPriceMin = ethGasConfigs.minimumGasPrice;
    if (userGasPrice < gasPriceMin || userGasPrice > gasPriceMax) {
      throw new Error(`Gas price must be between ${gasPriceMin} and ${gasPriceMax}`);
    }
    return userGasPrice;
  }

  async recoveryBlockchainExplorerQuery(query: Record<string, any>): Promise<any> {
    const response = await request
      .post(common.Environments[this.bitgo.getEnv()].avaxcNetworkBaseUrl + '/ext/bc/C/rpc')
      .send(query);

    if (!response.ok) {
      throw new Error('could not reach avax.network');
    }

    if (response.body.status === '0' && response.body.message === 'NOTOK') {
      throw new Error('avax.network rate limit reached');
    }
    return response.body;
  }

  async getAddressNonce(address: string): Promise<number> {
    // Get nonce for backup key (should be 0)
    const result = await this.recoveryBlockchainExplorerQuery({
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [address, 'latest'],
      id: 1,
    });
    if (!result || isNaN(result.result)) {
      throw new Error('Unable to find next nonce from avax.network, got: ' + JSON.stringify(result));
    }
    const nonceHex = result.result;
    return new optionalDeps.ethUtil.BN(nonceHex.slice(2), 16).toNumber();
  }

  async queryAddressBalance(address: string): Promise<BN> {
    const result = await this.recoveryBlockchainExplorerQuery({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1,
    });
    // throw if the result does not exist or the result is not a valid number
    if (!result || !result.result || isNaN(result.result)) {
      throw new Error(`Could not obtain address balance for ${address} from avax.network, got: ${result.result}`);
    }
    const nativeBalanceHex = result.result;
    return new optionalDeps.ethUtil.BN(nativeBalanceHex.slice(2), 16);
  }

  async querySequenceId(address: string): Promise<number> {
    // Get sequence ID using contract call
    const sequenceIdMethodSignature = optionalDeps.ethAbi.methodID('getNextSequenceId', []);
    const sequenceIdArgs = optionalDeps.ethAbi.rawEncode([], []);
    const sequenceIdData = Buffer.concat([sequenceIdMethodSignature, sequenceIdArgs]).toString('hex');
    const sequenceIdDataHex = optionalDeps.ethUtil.addHexPrefix(sequenceIdData);
    const result = await this.recoveryBlockchainExplorerQuery({
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [{ to: address, data: sequenceIdDataHex }, 'latest'],
      id: 1,
    });
    if (!result || !result.result) {
      throw new Error('Could not obtain sequence ID from avax.network, got: ' + result.result);
    }
    const sequenceIdHex = result.result;
    return new optionalDeps.ethUtil.BN(sequenceIdHex.slice(2), 16).toNumber();
  }
}
