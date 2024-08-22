/**
 * @prettier
 */
import {
  AbstractEthLikeCoin,
  BuildTransactionParams,
  EIP1559,
  getDefaultExpireTime,
  GetSendMethodArgsOptions,
  OfflineVaultTxInfo,
  optionalDeps,
  RecoverOptions,
  RecoveryInfo,
  ReplayProtectionOptions,
  SendMethodArgs,
} from '@bitgo/abstract-eth';
import { BaseCoin, BitGoBase, common, getIsUnsignedSweep, Util, Recipient } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins, EthereumNetwork as EthLikeNetwork, ethGasConfigs } from '@bitgo/statics';
import { TransactionBuilder, TransferBuilder, KeyPair as KeyPairLib } from './lib';
import * as _ from 'lodash';
import { BigNumber } from 'bignumber.js';
import { Buffer } from 'buffer';
import request from 'superagent';
import { BN } from 'ethereumjs-util';
import { bip32 } from '@bitgo/utxo-lib';
import type * as EthTxLib from '@ethereumjs/tx';

interface UnformattedTxInfo {
  recipient: Recipient;
}

export class Etc extends AbstractEthLikeCoin {
  readonly staticsCoin?: Readonly<StaticsBaseCoin>;
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this.staticsCoin = staticsCoin;
    this.sendMethodName = 'sendMultiSig';
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Etc(bitgo, staticsCoin);
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new KeyPairLib({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   * @param {string} params.userKey - [encrypted] xprv
   * @param {string} params.backupKey - [encrypted] xprv or xpub if the xprv is held by a KRS provider
   * @param {string} params.walletPassphrase - used to decrypt userKey and backupKey
   * @param {string} params.walletContractAddress - the ETH address of the wallet contract
   * @param {string} params.krsProvider - necessary if backup key is held by KRS
   * @param {string} params.recoveryDestination - target address to send recovered funds to
   * @param {string} params.bitgoFeeAddress - wrong chain wallet fee address for evm based cross chain recovery txn
   * @param {string} params.bitgoDestinationAddress - target bitgo address where fee will be sent for evm based cross chain recovery txn
   */
  async recover(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    this.validateRecoveryParams(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    // Clean up whitespace from entered values
    let userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');
    const gasLimit = new optionalDeps.ethUtil.BN(this.setGasLimit(params.gasLimit));
    const gasPrice = params.eip1559
      ? new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas)
      : new optionalDeps.ethUtil.BN(this.setGasPrice(params.gasPrice));

    if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
      try {
        userKey = this.bitgo.decrypt({
          input: userKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting user keychain: ${e.message}`);
      }
    }
    let backupKeyAddress;
    let backupSigningKey;
    if (isUnsignedSweep) {
      const backupHDNode = bip32.fromBase58(backupKey);
      backupSigningKey = backupHDNode.publicKey;
      backupKeyAddress = `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`;
    } else {
      // Decrypt backup private key and get address
      let backupPrv;

      try {
        backupPrv = this.bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting backup keychain: ${e.message}`);
      }

      const keyPair = new KeyPairLib({ prv: backupPrv });
      backupSigningKey = keyPair.getKeys().prv;
      if (!backupSigningKey) {
        throw new Error('no private key');
      }
      backupKeyAddress = keyPair.getAddress();
    }

    const backupKeyNonce = await this.getAddressNonce(backupKeyAddress);
    // get balance of backupKey to ensure funds are available to pay fees
    const backupKeyBalance = await this.queryAddressBalance(backupKeyAddress);
    let totalGasNeeded = gasPrice.mul(gasLimit);

    // On optimism chain, L1 fees is to be paid as well apart from L2 fees
    // So we are adding the amount that can be used up as l1 fees
    if (this.staticsCoin?.family === 'opeth') {
      totalGasNeeded = totalGasNeeded.add(new optionalDeps.ethUtil.BN(ethGasConfigs.opethGasL1Fees));
    }

    const weiToGwei = 10 ** 9;
    if (backupKeyBalance.lt(totalGasNeeded)) {
      throw new Error(
        `Backup key address ${backupKeyAddress} has balance ${backupKeyBalance
          .div(new BN(weiToGwei))
          .toString()} Gwei.` +
          `This address must have a balance of at least ${(totalGasNeeded / weiToGwei).toString()}` +
          ` Gwei to perform recoveries. Try sending some funds to this address then retry.`
      );
    }

    // get balance of wallet
    const txAmount = await this.queryAddressBalance(params.walletContractAddress);
    if (txAmount.lt(new BN(0))) {
      throw new Error('Wallet does not have enough funds to recover');
    }

    // build recipients object
    const recipients = [
      {
        address: params.recoveryDestination,
        amount: txAmount.toString(10),
      },
    ];

    // Get sequence ID using contract call
    // we need to wait between making two explorer api calls to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sequenceId = await this.querySequenceId(params.walletContractAddress);

    let operationHash, signature;
    // Get operation hash and sign it
    if (!isUnsignedSweep) {
      operationHash = this.getOperationSha3ForExecuteAndConfirm(recipients, getDefaultExpireTime(), sequenceId);
      signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userKey));

      try {
        Util.ecRecoverEthAddress(operationHash, signature);
      } catch (e) {
        throw new Error('Invalid signature');
      }
    }

    // Build unsigned transaction
    const txInfo = {
      recipient: recipients[0],
      expireTime: getDefaultExpireTime(),
      contractSequenceId: sequenceId,
      operationHash: operationHash,
      signature: signature,
      gasLimit: gasLimit.toString(10),
    };

    const txBuilder = this.getTransactionBuilder() as TransactionBuilder;
    txBuilder.counter(backupKeyNonce);
    txBuilder.contract(params.walletContractAddress);
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
    transferBuilder
      .coin(this.staticsCoin?.name as string)
      .amount(recipients[0].amount)
      .contractSequenceId(sequenceId)
      .expirationTime(getDefaultExpireTime())
      .to(params.recoveryDestination);

    // let tx = await txBuilder.build();
    if (isUnsignedSweep) {
      // calculate send data
      const sendMethodArgs = this.getSendMethodArgs(txInfo);
      const methodSignature = optionalDeps.ethAbi.methodID(this.sendMethodName, _.map(sendMethodArgs, 'type'));
      const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
      const sendData = Buffer.concat([methodSignature, encodedArgs]);

      const txParams = {
        to: params.walletContractAddress,
        nonce: backupKeyNonce,
        value: 0,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        data: sendData,
        eip1559: params.eip1559,
        replayProtectionOptions: params.replayProtectionOptions,
      };

      // Build contract call and sign it
      const tx = Etc.buildTransaction(txParams);
      return this.formatForOfflineVault(
        txInfo,
        tx,
        userKey,
        backupKey,
        gasPrice,
        gasLimit,
        params.eip1559,
        params.replayProtectionOptions
      );
    }

    // sign the transaction
    txBuilder
      .transfer()
      .coin(this.staticsCoin?.name as string)
      .key(new KeyPairLib({ prv: userKey }).getKeys().prv as string);
    txBuilder.sign({ key: backupSigningKey });

    const signedTx = await txBuilder.build();

    return {
      id: signedTx.toJson().id,
      tx: signedTx.toBroadcastFormat(),
    };
  }

  getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  static buildTransaction(params: BuildTransactionParams): EthTxLib.FeeMarketEIP1559Transaction | EthTxLib.Transaction {
    // if eip1559 params are specified, default to london hardfork, otherwise,
    // default to tangerine whistle to avoid replay protection issues
    const ethCommon = Etc.getEthCommon(params.eip1559, params.replayProtectionOptions);

    const baseParams = {
      to: params.to,
      nonce: params.nonce,
      value: params.value,
      data: params.data,
      gasLimit: new optionalDeps.ethUtil.BN(params.gasLimit),
    };

    const unsignedEthTx = !!params.eip1559
      ? optionalDeps.EthTx.FeeMarketEIP1559Transaction.fromTxData(
          {
            ...baseParams,
            maxFeePerGas: new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas),
            maxPriorityFeePerGas: new optionalDeps.ethUtil.BN(params.eip1559.maxPriorityFeePerGas),
          },
          { common: ethCommon }
        )
      : optionalDeps.EthTx.Transaction.fromTxData(
          {
            ...baseParams,
            gasPrice: new optionalDeps.ethUtil.BN(params.gasPrice),
          },
          { common: ethCommon }
        );

    return unsignedEthTx;
  }

  /**
   * Gets correct Eth Common object based on params from either recovery or tx building
   * @param eip1559 {EIP1559} configs that specify whether we should construct an eip1559 tx
   * @param replayProtectionOptions {ReplayProtectionOptions} check if chain id supports replay protection
   */
  private static getEthCommon(eip1559?: EIP1559, replayProtectionOptions?: ReplayProtectionOptions) {
    // if eip1559 params are specified, default to london hardfork, otherwise,
    // default to tangerine whistle to avoid replay protection issues
    const defaultHardfork = !!eip1559 ? 'london' : optionalDeps.EthCommon.Hardfork.TangerineWhistle;
    const defaultCommon = new optionalDeps.EthCommon.default({
      chain: optionalDeps.EthCommon.Chain.Mainnet,
      hardfork: defaultHardfork,
    });

    // if replay protection options are set, override the default common setting
    const ethCommon = replayProtectionOptions
      ? optionalDeps.EthCommon.default.isSupportedChainId(new optionalDeps.ethUtil.BN(replayProtectionOptions.chain))
        ? new optionalDeps.EthCommon.default({
            chain: replayProtectionOptions.chain,
            hardfork: replayProtectionOptions.hardfork,
          })
        : optionalDeps.EthCommon.default.custom({
            chainId: new optionalDeps.ethUtil.BN(replayProtectionOptions.chain),
            defaultHardfork: replayProtectionOptions.hardfork,
          })
      : defaultCommon;
    return ethCommon;
  }

  /**
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    // Normally the SDK provides the first signature for an EthLike tx, but occasionally it provides the second and final one.
    if (params.isLastSignature) {
      // In this case when we're doing the second (final) signature, the logic is different.
      return await this.signFinalEthLike(params);
    }
    const txBuilder = this.getTransactionBuilder(params.common);
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder
      .transfer()
      .coin(this.staticsCoin?.name as string)
      .key(new KeyPairLib({ prv: params.prv }).getKeys().prv!);
    const transaction = await txBuilder.build();

    const recipients = transaction.outputs.map((output) => ({ address: output.address, amount: output.value }));

    const txParams = {
      eip1559: params.txPrebuild.eip1559,
      txHex: transaction.toBroadcastFormat(),
      recipients: recipients,
      expiration: params.txPrebuild.expireTime,
      hopTransaction: params.txPrebuild.hopTransaction,
      custodianTransactionId: params.custodianTransactionId,
      expireTime: params.expireTime,
      contractSequenceId: params.txPrebuild.nextContractSequenceId as number,
      sequenceId: params.sequenceId,
    };

    return { halfSigned: txParams };
  }``

  /**
   * Helper function for signTransaction for the rare case that SDK is doing the second signature
   * Note: we are expecting this to be called from the offline vault
   * @param {SignFinalOptions.txPrebuild} params.txPrebuild
   * @param {string} params.prv
   * @returns {{txHex: string}}
   */
  /*
  async signFinalEthLike(params: SignFinalOptions): Promise<FullySignedTransaction> {
    const signingKey = new KeyPairLib({ prv: params.prv }).getKeys().prv;
    if (_.isUndefined(signingKey)) {
      throw new Error('missing private key');
    }
    const txBuilder = this.getTransactionBuilder(params.common);
    try {
      txBuilder.from(params.txPrebuild.halfSigned?.txHex);
    } catch (e) {
      throw new Error('invalid half-signed transaction');
    }
    txBuilder.sign({ key: signingKey });
    const tx = await txBuilder.build();
    return {
      txHex: tx.toBroadcastFormat(),
    };
  }
  */
  /**
   * Make a query to etc.network for information such as balance, token balance, solidity calls
   * @param {Object} query — key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from etc.network
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, any>): Promise<any> {
    const response = await request
      .post(common.Environments[this.bitgo.getEnv()].etcNodeUrl + '/api/eth-rpc')
      .send(query);

    if (!response.ok) {
      throw new Error('could not reach etc.network');
    }

    if (response.body.status === '0' && response.body.message === 'NOTOK') {
      throw new Error('etc.network rate limit reached');
    }
    return response.body;
  }
  /**
   * Method to validate recovery params
   * @param {RecoverOptions} params
   * @returns {void}
   */
  validateRecoveryParams(params: RecoverOptions): void {
    if (_.isUndefined(params.userKey)) {
      throw new Error('missing userKey');
    }

    if (_.isUndefined(params.backupKey)) {
      throw new Error('missing backupKey');
    }

    if (_.isUndefined(params.walletPassphrase) && !params.userKey.startsWith('xpub') && !params.isTss) {
      throw new Error('missing wallet passphrase');
    }

    if (_.isUndefined(params.walletContractAddress) || !this.isValidAddress(params.walletContractAddress)) {
      throw new Error('invalid walletContractAddress');
    }

    if (_.isUndefined(params.recoveryDestination) || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }
  }

  /**
   * Queries public block explorer to get the next ETHLike coin's nonce that should be used for the given ETH address
   * @param {string} address
   * @returns {Promise<number>}
   */
  async getAddressNonce(address: string): Promise<number> {
    // Get nonce for backup key (should be 0)
    const result = await this.recoveryBlockchainExplorerQuery({
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [address, 'latest'],
      id: 1,
    });
    if (!result || isNaN(result.result)) {
      throw new Error('Unable to find next nonce from etc.network, got: ' + JSON.stringify(result));
    }
    const nonceHex = result.result;
    return new optionalDeps.ethUtil.BN(nonceHex.slice(2), 16).toNumber();
  }

  /**
   * Queries etc.network for the balance of an address
   * @param {string} address - the ETC address
   * @returns {Promise<BigNumber>} address balance
   */
  async queryAddressBalance(address: string): Promise<BN> {
    const result = await this.recoveryBlockchainExplorerQuery({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1,
    });
    // throw if the result does not exist or the result is not a valid number
    if (!result || !result.result || isNaN(result.result)) {
      throw new Error(`Could not obtain address balance for ${address} from etc.network, got: ${result.result}`);
    }
    const nativeBalanceHex = result.result;
    return new optionalDeps.ethUtil.BN(nativeBalanceHex.slice(2), 16);
  }
  /**
   * Queries the contract (via explorer API) for the next sequence ID
   * @param {String} address - address of the contract
   * @returns {Promise<Number>} sequence ID
   */
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
      throw new Error('Could not obtain sequence ID from etc.network, got: ' + result.result);
    }
    const sequenceIdHex = result.result;
    return new optionalDeps.ethUtil.BN(sequenceIdHex.slice(2), 16).toNumber();
  }

  /**
   * Check whether the gas price passed in by user are within our max and min bounds
   * If they are not set, set them to the defaults
   * @param {number} userGasPrice - user defined gas price
   * @returns {number} the gas price to use for this transaction
   */
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
  /**
   * Check whether gas limit passed in by user are within our max and min bounds
   * If they are not set, set them to the defaults
   * @param {number} userGasLimit user defined gas limit
   * @returns {number} the gas limit to use for this transaction
   */
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

  /**
   * @param {Recipient[]} recipients - the recipients of the transaction
   * @param {number} expireTime - the expire time of the transaction
   * @param {number} contractSequenceId - the contract sequence id of the transaction
   * @returns {string}
   */
  getOperationSha3ForExecuteAndConfirm(
    recipients: Recipient[],
    expireTime: number,
    contractSequenceId: number
  ): string {
    if (!recipients || !Array.isArray(recipients)) {
      throw new Error('expecting array of recipients');
    }

    // Right now we only support 1 recipient
    if (recipients.length !== 1) {
      throw new Error('must send to exactly 1 recipient');
    }

    if (!_.isNumber(expireTime)) {
      throw new Error('expireTime must be number of seconds since epoch');
    }

    if (!_.isNumber(contractSequenceId)) {
      throw new Error('contractSequenceId must be number');
    }

    // Check inputs
    recipients.forEach(function (recipient) {
      if (
        !_.isString(recipient.address) ||
        !optionalDeps.ethUtil.isValidAddress(optionalDeps.ethUtil.addHexPrefix(recipient.address))
      ) {
        throw new Error('Invalid address: ' + recipient.address);
      }

      let amount: BigNumber;
      try {
        amount = new BigNumber(recipient.amount);
      } catch (e) {
        throw new Error('Invalid amount for: ' + recipient.address + ' - should be numeric');
      }

      recipient.amount = amount.toFixed(0);

      if (recipient.data && !_.isString(recipient.data)) {
        throw new Error('Data for recipient ' + recipient.address + ' - should be of type hex string');
      }
    });

    const recipient = recipients[0];
    return optionalDeps.ethUtil.bufferToHex(
      optionalDeps.ethAbi.soliditySHA3(...this.getOperation(recipient, expireTime, contractSequenceId))
    );
  }

  /**
   * Get transfer operation for coin
   * @param {Recipient} recipient - recipient info
   * @param {number} expireTime - expiry time
   * @param {number} contractSequenceId - sequence id
   * @returns {Array} operation array
   */
  getOperation(recipient: Recipient, expireTime: number, contractSequenceId: number): (string | Buffer)[][] {
    const network = this.getNetwork() as EthLikeNetwork;
    return [
      ['string', 'address', 'uint', 'bytes', 'uint', 'uint'],
      [
        network.nativeCoinOperationHashPrefix,
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
        recipient.amount,
        Buffer.from(optionalDeps.ethUtil.stripHexPrefix(optionalDeps.ethUtil.padToEven(recipient.data || '')), 'hex'),
        expireTime,
        contractSequenceId,
      ],
    ];
  }

  /**
   * Method to return the coin's network object
   * @returns {EthLikeNetwork | undefined}
   */
  getNetwork(): EthLikeNetwork | undefined {
    return this.staticsCoin?.network as EthLikeNetwork;
  }

  /**
   * Helper function for recover()
   * This transforms the unsigned transaction information into a format the BitGo offline vault expects
   * @param {UnformattedTxInfo} txInfo - tx info
   * @param {EthLikeTxLib.Transaction | EthLikeTxLib.FeeMarketEIP1559Transaction} ethTx - the ethereumjs tx object
   * @param {string} userKey - the user's key
   * @param {string} backupKey - the backup key
   * @param {Buffer} gasPrice - gas price for the tx
   * @param {number} gasLimit - gas limit for the tx
   * @param {EIP1559} eip1559 - eip1559 params
   * @param {ReplayProtectionOptions} replayProtectionOptions - replay protection options
   * @returns {Promise<OfflineVaultTxInfo>}
   */
  async formatForOfflineVault(
    txInfo: UnformattedTxInfo,
    ethTx: EthTxLib.Transaction | EthTxLib.FeeMarketEIP1559Transaction,
    userKey: string,
    backupKey: string,
    gasPrice: Buffer,
    gasLimit: number,
    eip1559?: EIP1559,
    replayProtectionOptions?: ReplayProtectionOptions
  ): Promise<OfflineVaultTxInfo> {
    if (!ethTx.to) {
      throw new Error('Eth tx must have a `to` address');
    }
    const backupHDNode = bip32.fromBase58(backupKey);
    const backupSigningKey = backupHDNode.publicKey;
    const response: OfflineVaultTxInfo = {
      tx: ethTx.serialize().toString('hex'),
      userKey,
      backupKey,
      coin: this.getChain(),
      gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
      gasLimit,
      recipients: [txInfo.recipient],
      walletContractAddress: ethTx.to.toString(),
      amount: txInfo.recipient.amount as string,
      backupKeyNonce: await this.getAddressNonce(
        `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`
      ),
      eip1559,
      replayProtectionOptions,
    };
    _.extend(response, txInfo);
    response.nextContractSequenceId = response.contractSequenceId;
    return response;
  }

  /**
   * Build arguments to call the send method on the wallet contract
   * @param txInfo
   */
  getSendMethodArgs(txInfo: GetSendMethodArgsOptions): SendMethodArgs[] {
    // Method signature is
    // sendMultiSig(address toAddress, uint value, bytes data, uint expireTime, uint sequenceId, bytes signature)
    return [
      {
        name: 'toAddress',
        type: 'address',
        value: txInfo.recipient.address,
      },
      {
        name: 'value',
        type: 'uint',
        value: txInfo.recipient.amount,
      },
      {
        name: 'data',
        type: 'bytes',
        value: optionalDeps.ethUtil.toBuffer(optionalDeps.ethUtil.addHexPrefix(txInfo.recipient.data || '')),
      },
      {
        name: 'expireTime',
        type: 'uint',
        value: txInfo.expireTime,
      },
      {
        name: 'sequenceId',
        type: 'uint',
        value: txInfo.contractSequenceId,
      },
      {
        name: 'signature',
        type: 'bytes',
        value: optionalDeps.ethUtil.toBuffer(optionalDeps.ethUtil.addHexPrefix(txInfo.signature)),
      },
    ];
  }
}
