/**
 * @prettier
 */
import { BaseCoin, BitGoBase, common } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  optionalDeps,
  TransactionBuilder as EthLikeTransactionBuilder,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import request from 'superagent';
import BN from 'bn.js';
import { Buffer } from 'buffer';

export class AvaxcRecovery extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new AvaxcRecovery(bitgo, staticsCoin);
  }

  protected getTransactionBuilder(): EthLikeTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  async recoveryBlockchainExplorerQuery(query: Record<string, any>): Promise<any> {
    console.log('Inside : recoveryBlockchainExplorerQuery \n');
    const env = this.bitgo.getEnv();
    const response = await request.post(common.Environments[env].avaxcNetworkBaseUrl + '/ext/bc/C/rpc').send(query);
    console.log('Inside : recoveryBlockchainExplorerQuery : Got Response \n');

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

  async getGasPriceFromExternalAPI(): Promise<BN> {
    try {
      // COIN -1708 : hardcoded for half signing
      const gasPrice = new BN(250000);
      console.log(` Got hardcoded gas price: ${gasPrice}`);
      return gasPrice;
    } catch (e) {
      throw new Error('Failed to get gas price');
    }
  }

  async getGasLimitFromExternalAPI(from: string, to: string, data: string): Promise<BN> {
    try {
      // COIN -1708 : hardcoded for half signing
      const gasLimit = new BN(250000);
      console.log(`Got hardcoded gas limit: ${gasLimit}`);
      return gasLimit;
    } catch (e) {
      throw new Error('Failed to get gas limit: ');
    }
  }
}
