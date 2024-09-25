/**
 * @prettier
 */
import { BaseCoin, BitGoBase, common, HalfSignedTransaction, Recipient } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, ethGasConfigs } from '@bitgo/statics';
import {
  AbstractEthLikeNewCoins,
  FeesUsed,
  KeyPair as KeyPairLib,
  OfflineVaultTxInfo,
  optionalDeps,
  RecoverOptions,
  RecoveryInfo,
  TransactionBuilder as EthLikeTransactionBuilder,
  TransferBuilder,
} from '@bitgo/abstract-eth';
import { TransactionBuilder } from './lib';
import request from 'superagent';
import BN from 'bn.js';
import { Buffer } from 'buffer';
import { BigNumber } from 'bignumber.js';
import _ from 'lodash';

export class EthLikeAvaxc extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new EthLikeAvaxc(bitgo, staticsCoin);
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
    const env = this.bitgo.getEnv();
    const response = await request.post(common.Environments[env].avaxcNetworkBaseUrl + '/ext/bc/C/rpc').send(query);
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

  protected async recoverEthLikeforEvmBasedRecovery(
    params: RecoverOptions
  ): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    this.validateEvmBasedRecoveryParams(params);

    // Clean up whitespace from entered values
    const userKey = params.userKey.replace(/\s/g, '');
    const bitgoFeeAddress = params.bitgoFeeAddress?.replace(/\s/g, '').toLowerCase() as string;
    const bitgoDestinationAddress = params.bitgoDestinationAddress?.replace(/\s/g, '').toLowerCase() as string;
    const recoveryDestination = params.recoveryDestination?.replace(/\s/g, '').toLowerCase() as string;
    const walletContractAddress = params.walletContractAddress?.replace(/\s/g, '').toLowerCase() as string;
    const tokenContractAddress = params.tokenContractAddress?.replace(/\s/g, '').toLowerCase() as string;

    let userSigningKey;
    let userKeyPrv;
    if (params.walletPassphrase) {
      if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
        try {
          userKeyPrv = this.bitgo.decrypt({
            input: userKey,
            password: params.walletPassphrase,
          });
        } catch (e) {
          throw new Error(`Error decrypting user keychain: ${e.message}`);
        }
      }

      const keyPair = new KeyPairLib({ prv: userKeyPrv });
      userSigningKey = keyPair.getKeys().prv;
      if (!userSigningKey) {
        throw new Error('no private key');
      }
    }

    // Use default gasLimit for cold and custody wallets
    let gasLimit =
      params.gasLimit || userKey.startsWith('xpub') || !userKey
        ? new optionalDeps.ethUtil.BN(this.setGasLimit(params.gasLimit))
        : new optionalDeps.ethUtil.BN(0);

    const gasPrice = await this.getGasPriceFromExternalAPI();
    const bitgoFeeAddressNonce = await this.getAddressNonce(bitgoFeeAddress);

    if (tokenContractAddress) {
      return this.recoverEthLikeTokenforEvmBasedRecovery(
        params,
        bitgoFeeAddressNonce,
        gasLimit,
        gasPrice,
        userKey,
        userSigningKey
      );
    }

    // get balance of wallet
    const txAmount = await this.queryAddressBalance(walletContractAddress);

    const bitgoFeePercentage = 0; // TODO: BG-71912 can change the fee% here.
    const bitgoFeeAmount = txAmount.toNumber() * (bitgoFeePercentage / 100);

    // build recipients object
    const recipients: Recipient[] = [
      {
        address: recoveryDestination,
        amount: new BigNumber(txAmount.toNumber()).minus(bitgoFeeAmount).toFixed(),
      },
    ];

    if (bitgoFeePercentage > 0) {
      if (_.isUndefined(bitgoDestinationAddress) || !this.isValidAddress(bitgoDestinationAddress)) {
        throw new Error('invalid bitgoDestinationAddress');
      }

      recipients.push({
        address: bitgoDestinationAddress,
        amount: bitgoFeeAmount.toString(10),
      });
    }

    // calculate batch data
    const BATCH_METHOD_NAME = 'batch';
    const BATCH_METHOD_TYPES = ['address[]', 'uint256[]'];
    const batchExecutionInfo = this.getBatchExecutionInfo(recipients);
    const batchData = optionalDeps.ethUtil.addHexPrefix(
      this.getMethodCallData(BATCH_METHOD_NAME, BATCH_METHOD_TYPES, batchExecutionInfo.values).toString('hex')
    );

    // Get sequence ID using contract call
    // we need to wait between making two explorer api calls to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sequenceId = await this.querySequenceId(walletContractAddress);

    const network = this.getNetwork();
    const batcherContractAddress = network?.batcherContractAddress as string;

    const txBuilder = this.getTransactionBuilder() as TransactionBuilder;
    txBuilder.counter(bitgoFeeAddressNonce);
    txBuilder.contract(walletContractAddress);
    let txFee;
    if (params.eip1559) {
      txFee = {
        eip1559: {
          maxPriorityFeePerGas: params.eip1559.maxPriorityFeePerGas,
          maxFeePerGas: params.eip1559.maxFeePerGas,
        },
      };
    } else {
      txFee = { fee: gasPrice.toString() };
    }
    txBuilder.fee({
      ...txFee,
      gasLimit: gasLimit.toString(),
    });

    const transferBuilder = txBuilder.transfer() as TransferBuilder;
    if (!batcherContractAddress) {
      transferBuilder
        .coin(this.staticsCoin?.name as string)
        .amount(batchExecutionInfo.totalAmount)
        .contractSequenceId(sequenceId)
        .expirationTime(this.getDefaultExpireTime())
        .to(recoveryDestination);
    } else {
      transferBuilder
        .coin(this.staticsCoin?.name as string)
        .amount(batchExecutionInfo.totalAmount)
        .contractSequenceId(sequenceId)
        .expirationTime(this.getDefaultExpireTime())
        .to(batcherContractAddress)
        .data(batchData);
    }

    if (params.walletPassphrase) {
      transferBuilder.key(userSigningKey);
    }

    // If the intended chain is arbitrum or optimism, we need to use wallet version 4
    // since these contracts construct operationHash differently
    if (params.intendedChain && ['arbeth', 'opeth'].includes(coins.get(params.intendedChain).family)) {
      txBuilder.walletVersion(4);
    }

    // If gasLimit was not passed as a param, then fetch the gasLimit from Explorer
    if (!params.gasLimit && !userKey.startsWith('xpub')) {
      // TODO Neeraj : Fix This
      const sendData = txBuilder.getSendData();
      gasLimit = await this.getGasLimitFromExternalAPI(
        params.bitgoFeeAddress as string,
        params.walletContractAddress,
        sendData
      );
      txBuilder.fee({
        ...txFee,
        gasLimit: gasLimit.toString(),
      });
    }

    // Get the balance of bitgoFeeAddress to ensure funds are available to pay fees
    await this.ensureSufficientBalance(bitgoFeeAddress, gasPrice, gasLimit);

    const tx = await txBuilder.build();

    const txInfo = {
      recipients: recipients,
      expireTime: this.getDefaultExpireTime(),
      contractSequenceId: sequenceId,
      gasLimit: gasLimit.toString(10),
      isEvmBasedCrossChainRecovery: true,
    };

    const response: OfflineVaultTxInfo = {
      txHex: tx.toBroadcastFormat(),
      userKey,
      coin: this.getChain(),
      gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
      gasLimit,
      recipients: txInfo.recipients,
      walletContractAddress: tx.toJson().to,
      amount: batchExecutionInfo.totalAmount,
      backupKeyNonce: bitgoFeeAddressNonce,
      eip1559: params.eip1559,
    };
    _.extend(response, txInfo);
    response.nextContractSequenceId = response.contractSequenceId;

    if (params.walletPassphrase) {
      const halfSignedTxn: HalfSignedTransaction = {
        halfSigned: {
          txHex: tx.toBroadcastFormat(),
          recipients: txInfo.recipients,
          expireTime: txInfo.expireTime,
        },
      };
      _.extend(response, halfSignedTxn);

      const feesUsed: FeesUsed = {
        gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
        gasLimit: optionalDeps.ethUtil.bufferToInt(gasLimit).toFixed(),
      };
      response['feesUsed'] = feesUsed;
    }

    return response;
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
