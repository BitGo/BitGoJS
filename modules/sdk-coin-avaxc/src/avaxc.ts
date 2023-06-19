/**
 * @prettier
 */
import { BigNumber } from 'bignumber.js';
import { bip32 } from '@bitgo/utxo-lib';
import Keccak from 'keccak';
import * as secp256k1 from 'secp256k1';
import * as _ from 'lodash';
import { AvalancheNetwork, BaseCoin as StaticsBaseCoin, CoinFamily, coins, ethGasConfigs } from '@bitgo/statics';
import {
  BaseCoin,
  BaseTransaction,
  BitGoBase,
  common,
  FeeEstimateOptions,
  FullySignedTransaction,
  getIsUnsignedSweep,
  InvalidAddressError,
  IWallet,
  KeyPair,
  ParsedTransaction,
  ParseTransactionOptions,
  Recipient,
  TransactionExplanation,
  Util,
  VerifyAddressOptions,
} from '@bitgo/sdk-core';
import {
  GetSendMethodArgsOptions,
  optionalDeps,
  RecoverOptions,
  RecoveryInfo,
  SendMethodArgs,
  TransactionBuilder as EthTransactionBuilder,
  TransactionPrebuild,
} from '@bitgo/sdk-coin-eth';
import { isValidEthAddress } from './lib/utils';
import { KeyPair as AvaxcKeyPair, TransactionBuilder } from './lib';
import request from 'superagent';
import { pubToAddress } from 'ethereumjs-util';
import { Buffer } from 'buffer';
import {
  AvaxSignTransactionOptions,
  BuildOptions,
  ExplainTransactionOptions,
  FeeEstimate,
  HopParams,
  HopPrebuild,
  HopTransactionBuildOptions,
  OfflineVaultTxInfo,
  PrecreateBitGoOptions,
  PresignTransactionOptions,
  SignedTransaction,
  SignFinalOptions,
  VerifyAvaxcTransactionOptions,
} from './iface';
import { AvaxpLib } from '@bitgo/sdk-coin-avaxp';

export class AvaxC extends BaseCoin {
  static hopTransactionSalt = 'bitgoHopAddressRequestSalt';

  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new AvaxC(bitgo, staticsCoin);
  }

  getBaseFactor(): number {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  /**
   * Get the base chain that the coin exists on.
   */
  getBaseChain(): string {
    return this.getChain();
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  valuelessTransferAllowed(): boolean {
    return true;
  }

  isValidAddress(address: string): boolean {
    // also validate p-chain address for cross-chain txs
    return !!address && (isValidEthAddress(address) || AvaxpLib.Utils.isValidAddress(address));
  }

  isToken(): boolean {
    return false;
  }

  generateKeyPair(seed?: Buffer): KeyPair {
    const avaxKeyPair = seed ? new AvaxcKeyPair({ seed }) : new AvaxcKeyPair();
    const extendedKeys = avaxKeyPair.getExtendedKeys();
    return {
      pub: extendedKeys.xpub,
      prv: extendedKeys.xprv!,
    };
  }

  async parseTransaction(params: ParseTransactionOptions): Promise<ParsedTransaction> {
    return {};
  }

  async verifyAddress({ address }: VerifyAddressOptions): Promise<boolean> {
    if (!this.isValidAddress(address)) {
      throw new InvalidAddressError(`invalid address: ${address}`);
    }
    return true;
  }

  /**
   * Verify that a transaction prebuild complies with the original intention
   *
   * @param params
   * @param params.txParams params object passed to send
   * @param params.txPrebuild prebuild object returned by server
   * @param params.wallet Wallet object to obtain keys to verify against
   * @returns {boolean}
   */
  async verifyTransaction(params: VerifyAvaxcTransactionOptions): Promise<boolean> {
    const { txParams, txPrebuild, wallet } = params;
    if (!txParams?.recipients || !txPrebuild?.recipients || !wallet) {
      throw new Error(`missing params`);
    }
    if (txParams.hop && txParams.recipients.length > 1) {
      throw new Error(`tx cannot be both a batch and hop transaction`);
    }
    if (txPrebuild.recipients.length !== 1) {
      throw new Error(`txPrebuild should only have 1 recipient but ${txPrebuild.recipients.length} found`);
    }
    if (txParams.hop && txPrebuild.hopTransaction) {
      // Check recipient amount for hop transaction
      if (txParams.recipients.length !== 1) {
        throw new Error(`hop transaction only supports 1 recipient but ${txParams.recipients.length} found`);
      }
      // Check tx sends to hop address
      let expectedHopAddress;
      if (txPrebuild.hopTransaction.type === 'Export') {
        const decodedHopTx = await this.explainAtomicTransaction(txPrebuild.hopTransaction.tx);
        expectedHopAddress = optionalDeps.ethUtil.stripHexPrefix(decodedHopTx.inputs[0].address);
      } else {
        const decodedHopTx = optionalDeps.EthTx.TransactionFactory.fromSerializedData(
          optionalDeps.ethUtil.toBuffer(txPrebuild.hopTransaction.tx)
        );
        expectedHopAddress = optionalDeps.ethUtil.stripHexPrefix(decodedHopTx.getSenderAddress().toString());
      }
      const actualHopAddress = optionalDeps.ethUtil.stripHexPrefix(txPrebuild.recipients[0].address);
      if (expectedHopAddress.toLowerCase() !== actualHopAddress.toLowerCase()) {
        throw new Error('recipient address of txPrebuild does not match hop address');
      }

      // Convert TransactionRecipient array to Recipient array
      const recipients: Recipient[] = txParams.recipients.map((r) => {
        return {
          address: r.address,
          amount: typeof r.amount === 'number' ? r.amount.toString() : r.amount,
        };
      });

      // Check destination address and amount
      await this.validateHopPrebuild(wallet, txPrebuild.hopTransaction, { recipients });
    } else if (txParams.recipients.length > 1) {
      // Check total amount for batch transaction
      let expectedTotalAmount = new BigNumber(0);
      for (let i = 0; i < txParams.recipients.length; i++) {
        expectedTotalAmount = expectedTotalAmount.plus(txParams.recipients[i].amount);
      }
      if (!expectedTotalAmount.isEqualTo(txPrebuild.recipients[0].amount)) {
        throw new Error(
          'batch transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
      }
    } else {
      // Check recipient address and amount for normal transaction
      if (txParams.recipients.length !== 1) {
        throw new Error(`normal transaction only supports 1 recipient but ${txParams.recipients.length} found`);
      }
      const expectedAmount = new BigNumber(txParams.recipients[0].amount);
      if (!expectedAmount.isEqualTo(txPrebuild.recipients[0].amount)) {
        throw new Error(
          'normal transaction amount in txPrebuild received from BitGo servers does not match txParams supplied by client'
        );
      }
      if (
        AvaxC.isAVAXCAddress(txParams.recipients[0].address) &&
        txParams.recipients[0].address !== txPrebuild.recipients[0].address
      ) {
        throw new Error('destination address in normal txPrebuild does not match that in txParams supplied by client');
      }
    }
    // Check coin is correct for all transaction types
    if (!this.verifyCoin(txPrebuild)) {
      throw new Error(`coin in txPrebuild did not match that in txParams supplied by client`);
    }
    return true;
  }

  private static isAVAXCAddress(address: string): boolean {
    return !!address.match(/0x[a-fA-F0-9]{40}/);
  }

  verifyCoin(txPrebuild: TransactionPrebuild): boolean {
    return txPrebuild.coin === this.getChain();
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new AvaxcKeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  /**
   * Check whether gas limit passed in by user are within our max and min bounds
   * If they are not set, set them to the defaults
   * @param {number} userGasLimit - user defined gas limit
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
   * Check whether the gas price passed in by user are within our max and min bounds
   * If they are not set, set them to the defaults
   * @param {number} userGasPrice - user defined gas price
   * @returns the gas price to use for this transaction
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
   * Make a query to Snowtrace for information such as balance, token balance, solidity calls
   * @param {Object} query — key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from Snowtrace
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<any> {
    const token = common.Environments[this.bitgo.getEnv()].snowtraceApiToken;
    if (token) {
      query.apikey = token;
    }
    const response = await request.get(common.Environments[this.bitgo.getEnv()].snowtraceBaseUrl + '/api').query(query);

    if (!response.ok) {
      throw new Error('could not reach Snowtrace');
    }

    if (response.body.status === '0' && response.body.message === 'NOTOK') {
      throw new Error('Snowtrace rate limit reached');
    }
    return response.body;
  }

  /**
   * Queries public block explorer to get the next nonce that should be used for
   * the given AVAXC address
   * @param {string} address — address to fetch for
   * @returns {number} address nonce
   */
  async getAddressNonce(address: string): Promise<number> {
    // Get nonce for backup key (should be 0)
    let nonce = 0;

    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'txlist',
      address,
    });
    if (!result || !Array.isArray(result.result)) {
      throw new Error('Unable to find next nonce from Snowtrace, got: ' + JSON.stringify(result));
    }
    const backupKeyTxList = result.result;
    if (backupKeyTxList.length > 0) {
      // Calculate last nonce used
      const outgoingTxs = backupKeyTxList.filter((tx) => tx.from === address);
      nonce = outgoingTxs.length;
    }
    return nonce;
  }

  /**
   * Queries Snowtrace for the balance of an address
   * @param {string} address - the AVAXC address
   * @returns {Promise<BigNumber>} address balance
   */
  async queryAddressBalance(address: string): Promise<any> {
    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'balance',
      address: address,
    });
    // throw if the result does not exist or the result is not a valid number
    if (!result || !result.result || isNaN(result.result)) {
      throw new Error(`Could not obtain address balance for ${address} from Snowtrace, got: ${result.result}`);
    }
    return new optionalDeps.ethUtil.BN(result.result, 10);
  }

  /**
   * Queries the contract (via Snowtrace) for the next sequence ID
   * @param {string} address - address of the contract
   * @returns {Promise<number>} sequence ID
   */
  async querySequenceId(address: string): Promise<number> {
    // Get sequence ID using contract call
    const sequenceIdMethodSignature = optionalDeps.ethAbi.methodID('getNextSequenceId', []);
    const sequenceIdArgs = optionalDeps.ethAbi.rawEncode([], []);
    const sequenceIdData = Buffer.concat([sequenceIdMethodSignature, sequenceIdArgs]).toString('hex');
    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'proxy',
      action: 'eth_call',
      to: address,
      data: sequenceIdData,
      tag: 'latest',
    });
    if (!result || !result.result) {
      throw new Error('Could not obtain sequence ID from Snowtrace, got: ' + result.result);
    }
    const sequenceIdHex = result.result;
    return new optionalDeps.ethUtil.BN(sequenceIdHex.slice(2), 16).toNumber();
  }

  /**
   * @param {Object} recipient - recipient info
   * @param {number} expireTime - expiry time
   * @param {number} contractSequenceId - sequence id
   * @returns {(string|Array)} operation array
   */
  getOperation(recipient: Recipient, expireTime: number, contractSequenceId: number): (string | Buffer)[][] {
    return [
      ['string', 'address', 'uint', 'bytes', 'uint', 'uint'],
      [
        'ETHER',
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
        recipient.amount,
        Buffer.from(optionalDeps.ethUtil.stripHexPrefix(optionalDeps.ethUtil.padToEven(recipient.data || '')), 'hex'),
        expireTime,
        contractSequenceId,
      ],
    ];
  }

  /**
   * Calculate the operation hash in the same way solidity would
   * @param {Recipient[]} recipients - tx recipients
   * @param {number} expireTime - expiration time
   * @param {number} contractSequenceId - contract sequence id
   * @returns {string} operation hash
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

      let amount;
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
   * Default expire time for a contract call (1 week)
   * @returns {number} Time in seconds
   */
  getDefaultExpireTime(): number {
    return Math.floor(new Date().getTime() / 1000) + 60 * 60 * 24 * 7;
  }

  /**
   * Build arguments to call the send method on the wallet contract
   * @param {Object} txInfo - data for send method args
   * @returns {SendMethodArgs[]}
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

  /**
   * Builds a funds recovery transaction without BitGo
   * Steps:
   * 1) Node query - how much money is in the account
   * 2) Build transaction - build our transaction for the amount
   * 3) Send signed build - send our signed build to a public node
   * @param {Object} params The options with which to recover
   * @param {string} params.userKey - [encrypted] xprv
   * @param {string} params.backupKey - [encrypted] xprv or xpub if the xprv is held by a KRS provider
   * @param {string} params.walletPassphrase - used to decrypt userKey and backupKey
   * @param {string} params.walletContractAddress - the AVAXC address of the wallet contract
   * @param {string} params.recoveryDestination - target address to send recovered funds to
   * @returns {Promise<RecoveryInfo>} - recovery tx info
   */
  async recover(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    if (_.isUndefined(params.userKey)) {
      throw new Error('missing userKey');
    }

    if (_.isUndefined(params.backupKey)) {
      throw new Error('missing backupKey');
    }

    if (_.isUndefined(params.walletPassphrase) && !params.userKey.startsWith('xpub')) {
      throw new Error('missing wallet passphrase');
    }

    if (_.isUndefined(params.walletContractAddress) || !this.isValidAddress(params.walletContractAddress)) {
      throw new Error('invalid walletContractAddress');
    }

    if (_.isUndefined(params.recoveryDestination) || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    // TODO (BG-56531): add support for krs
    const isUnsignedSweep = getIsUnsignedSweep(params);

    // Clean up whitespace from entered values
    let userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    // Set new tx fees (using default config values from platform)
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
      const backupKeyPair = new AvaxcKeyPair({ pub: backupKey });
      backupKeyAddress = backupKeyPair.getAddress();
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

      const keyPair = new AvaxcKeyPair({ prv: backupPrv });
      backupSigningKey = keyPair.getKeys().prv;
      if (!backupSigningKey) {
        throw new Error('no private key');
      }
      backupKeyAddress = keyPair.getAddress();
    }
    const backupKeyNonce = await this.getAddressNonce(backupKeyAddress);

    // get balance of backupKey to ensure funds are available to pay fees
    const backupKeyBalance = await this.queryAddressBalance(backupKeyAddress);

    const totalGasNeeded = gasPrice.mul(gasLimit);
    const weiToGwei = 10 ** 9;
    if (backupKeyBalance.lt(totalGasNeeded)) {
      throw new Error(
        `Backup key address ${backupKeyAddress} has balance ${(backupKeyBalance / weiToGwei).toString()} Gwei.` +
          `This address must have a balance of at least ${(totalGasNeeded / weiToGwei).toString()}` +
          ` Gwei to perform recoveries. Try sending some AVAX to this address then retry.`
      );
    }

    // get balance of wallet and deduct fees to get transaction amount
    const txAmount = await this.queryAddressBalance(params.walletContractAddress);

    // build recipients object
    const recipients = [
      {
        address: params.recoveryDestination,
        amount: txAmount.toString(10),
      },
    ];

    // Get sequence ID using contract call
    // we need to wait between making two snowtrace calls to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sequenceId = await this.querySequenceId(params.walletContractAddress);

    let operationHash, signature;
    // Get operation hash and sign it
    if (!isUnsignedSweep) {
      operationHash = this.getOperationSha3ForExecuteAndConfirm(recipients, this.getDefaultExpireTime(), sequenceId);
      signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userKey));

      try {
        Util.ecRecoverEthAddress(operationHash, signature);
      } catch (e) {
        throw new Error('Invalid signature');
      }
    }

    const txInfo = {
      recipient: recipients[0],
      expireTime: this.getDefaultExpireTime(),
      contractSequenceId: sequenceId,
      operationHash,
      signature,
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
    txBuilder
      .transfer()
      .amount(recipients[0].amount)
      .contractSequenceId(sequenceId)
      .expirationTime(this.getDefaultExpireTime())
      .to(params.recoveryDestination);

    if (isUnsignedSweep) {
      const tx = await txBuilder.build();
      const response: OfflineVaultTxInfo = {
        txHex: tx.toBroadcastFormat(),
        userKey,
        backupKey,
        coin: this.getChain(),
        gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
        gasLimit,
        recipients: [txInfo.recipient],
        walletContractAddress: tx.toJson().to,
        amount: txInfo.recipient.amount,
        backupKeyNonce,
        eip1559: params.eip1559,
      };
      _.extend(response, txInfo);
      response.nextContractSequenceId = response.contractSequenceId;
      return response;
    }

    const userKeyPair = new AvaxcKeyPair({ prv: userKey });
    txBuilder.transfer().key(userKeyPair.getKeys().prv!);
    txBuilder.sign({ key: backupSigningKey });
    const signedTx = await txBuilder.build();

    return {
      id: signedTx.toJson().id,
      tx: signedTx.toBroadcastFormat(),
    };
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  protected getTransactionBuilder(): EthTransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  protected getAtomicBuilder(): AvaxpLib.TransactionBuilderFactory {
    return new AvaxpLib.TransactionBuilderFactory(coins.get(this.getAvaxP()));
  }

  /**
   * Explain a transaction from txHex, overriding BaseCoins
   * transaction can be either atomic or eth txn.
   * @param params The options with which to explain the transaction
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex) {
      throw new Error('missing txHex in explain tx parameters');
    }
    if (params.crossChainType) {
      return this.explainAtomicTransaction(txHex);
    }
    if (!params.feeInfo) {
      throw new Error('missing feeInfo in explain tx parameters');
    }
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txHex);
    const tx = await txBuilder.build();
    return Object.assign(this.explainEVMTransaction(tx), { fee: params.feeInfo });
  }

  /**
   * Explains an atomic transaction using atomic builder.
   * @param txHex
   * @private
   */
  private async explainAtomicTransaction(txHex: string) {
    const txBuilder = this.getAtomicBuilder().from(txHex);
    const tx = await txBuilder.build();
    return tx.explainTransaction();
  }

  /**
   * Verify signature for an atomic transaction using atomic builder.
   * @param txHex
   * @return true if signature is from the input address
   * @private
   */
  private async verifySignatureForAtomicTransaction(txHex: string): Promise<boolean> {
    const txBuilder = this.getAtomicBuilder().from(txHex);
    const tx = await txBuilder.build();
    const payload = tx.signablePayload;
    const signatures = tx.signature.map((s) => Buffer.from(s, 'hex'));
    const network = _.get(tx, '_network');
    const recoverPubky = signatures.map((s) =>
      AvaxpLib.Utils.recoverySignature(network as unknown as AvalancheNetwork, payload, s)
    );
    const expectedSenders = recoverPubky.map((r) => pubToAddress(r, true));
    const senders = tx.inputs.map((i) => AvaxpLib.Utils.parseAddress(i.address));
    return expectedSenders.every((e) => senders.some((sender) => e.equals(sender)));
  }

  /**
   * Explains an EVM transaction using regular eth txn builder
   * @param tx
   * @private
   */
  private explainEVMTransaction(tx: BaseTransaction) {
    const outputs = tx.outputs.map((output) => {
      return {
        address: output.address,
        amount: output.value,
      };
    });
    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'];
    return {
      displayOrder,
      id: tx.id,
      outputs: outputs,
      outputAmount: outputs
        .reduce((accumulator, output) => accumulator.plus(output.amount), new BigNumber('0'))
        .toFixed(0),
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
    };
  }

  /**
   * Above is standard BaseCoins functions
   * ================================================================================================================
   * ================================================================================================================
   * Below is transaction functions
   */

  /**
   * Coin-specific things done before signing a transaction, i.e. verification
   * @param params
   */
  async presignTransaction(params: PresignTransactionOptions): Promise<PresignTransactionOptions> {
    if (!_.isUndefined(params.hopTransaction) && !_.isUndefined(params.wallet) && !_.isUndefined(params.buildParams)) {
      await this.validateHopPrebuild(params.wallet, params.hopTransaction);
    }
    return params;
  }

  /**
   * Modify prebuild after receiving it from the server. Add things like nlocktime
   */
  async postProcessPrebuild(params: TransactionPrebuild): Promise<TransactionPrebuild> {
    if (!_.isUndefined(params.hopTransaction) && !_.isUndefined(params.wallet) && !_.isUndefined(params.buildParams)) {
      await this.validateHopPrebuild(params.wallet, params.hopTransaction, params.buildParams);
    }
    return params;
  }

  /**
   * Validates that the hop prebuild from the HSM is valid and correct
   * @param wallet The wallet that the prebuild is for
   * @param hopPrebuild The prebuild to validate
   * @param originalParams The original parameters passed to prebuildTransaction
   * @returns void
   * @throws Error if The prebuild is invalid
   */
  async validateHopPrebuild(
    wallet: IWallet,
    hopPrebuild: HopPrebuild,
    originalParams?: { recipients: Recipient[] }
  ): Promise<void> {
    const { tx, id, signature } = hopPrebuild;

    // first, validate the HSM signature
    const serverXpub = common.Environments[this.bitgo.getEnv()].hsmXpub;
    const serverPubkeyBuffer: Buffer = bip32.fromBase58(serverXpub).publicKey;
    const signatureBuffer: Buffer = Buffer.from(optionalDeps.ethUtil.stripHexPrefix(signature), 'hex');
    const messageBuffer: Buffer =
      hopPrebuild.type === 'Export' ? AvaxC.getTxHash(tx) : Buffer.from(optionalDeps.ethUtil.stripHexPrefix(id), 'hex');

    const sig = new Uint8Array(signatureBuffer.length === 64 ? signatureBuffer : signatureBuffer.slice(1));
    const isValidSignature: boolean = secp256k1.ecdsaVerify(sig, messageBuffer, serverPubkeyBuffer);
    if (!isValidSignature) {
      throw new Error(`Hop txid signature invalid`);
    }

    if (hopPrebuild.type === 'Export') {
      const explainHopExportTx = await this.explainAtomicTransaction(tx);
      // If original params are given, we can check them against the transaction prebuild params
      if (!_.isNil(originalParams)) {
        const { recipients } = originalParams;

        // Then validate that the tx params actually equal the requested params to nano avax plus import tx fee.
        const originalAmount = new BigNumber(recipients[0].amount).div(1e9).plus(1e6).toFixed(0);
        const originalDestination: string | undefined = recipients[0].address;
        const hopAmount = explainHopExportTx.outputAmount;
        const hopDestination = explainHopExportTx.outputs[0].address;
        if (originalAmount !== hopAmount) {
          throw new Error(`Hop amount: ${hopAmount} does not equal original amount: ${originalAmount}`);
        }
        if (originalDestination && hopDestination.toLowerCase() !== originalDestination.toLowerCase()) {
          throw new Error(
            `Hop destination: ${hopDestination} does not equal original recipient: ${originalDestination}`
          );
        }
      }
      if (!(await this.verifySignatureForAtomicTransaction(tx))) {
        throw new Error(`Invalid hop transaction signature, txid: ${id}`);
      }
    } else {
      const builtHopTx = optionalDeps.EthTx.TransactionFactory.fromSerializedData(optionalDeps.ethUtil.toBuffer(tx));
      // If original params are given, we can check them against the transaction prebuild params
      if (!_.isNil(originalParams)) {
        const { recipients } = originalParams;

        // Then validate that the tx params actually equal the requested params
        const originalAmount = new BigNumber(recipients[0].amount);
        const originalDestination: string = recipients[0].address;

        const hopAmount = new BigNumber(optionalDeps.ethUtil.bufferToHex(builtHopTx.value as unknown as Buffer));
        if (!builtHopTx.to) {
          throw new Error(`Transaction does not have a destination address`);
        }
        const hopDestination = builtHopTx.to.toString();
        if (!hopAmount.eq(originalAmount)) {
          throw new Error(`Hop amount: ${hopAmount} does not equal original amount: ${originalAmount}`);
        }
        if (hopDestination.toLowerCase() !== originalDestination.toLowerCase()) {
          throw new Error(`Hop destination: ${hopDestination} does not equal original recipient: ${hopDestination}`);
        }
      }

      if (!builtHopTx.verifySignature()) {
        // We dont want to continue at all in this case, at risk of AVAX being stuck on the hop address
        throw new Error(`Invalid hop transaction signature, txid: ${id}`);
      }
      if (optionalDeps.ethUtil.addHexPrefix(builtHopTx.hash().toString('hex')) !== id) {
        throw new Error(`Signed hop txid does not equal actual txid`);
      }
    }
  }

  /**
   * Helper function for signTransaction for the rare case that SDK is doing the second signature
   * Note: we are expecting this to be called from the offline vault
   * @param params.txPrebuild
   * @param params.prv
   * @returns {{txHex: string}}
   */
  async signFinal(params: SignFinalOptions): Promise<FullySignedTransaction> {
    const keyPair = new AvaxcKeyPair({ prv: params.prv });
    const signingKey = keyPair.getKeys().prv;
    if (_.isUndefined(signingKey)) {
      throw new Error('missing private key');
    }

    const txBuilder = this.getTransactionBuilder() as TransactionBuilder;
    try {
      txBuilder.from(params.txPrebuild!.halfSigned!.txHex);
    } catch (e) {
      throw new Error('invalid half-signed transaction');
    }

    txBuilder.sign({ key: signingKey });
    const tx = await txBuilder.build();
    return {
      txHex: tx.toBroadcastFormat(),
    };
  }

  /**
   * Assemble half-sign prebuilt transaction
   * @param params
   */
  async signTransaction(params: AvaxSignTransactionOptions): Promise<SignedTransaction> {
    // Normally the SDK provides the first signature for an AVAXC tx,
    // but for unsigned sweep recoveries it can provide the second and final one.
    if (params.isLastSignature) {
      // In this case when we're doing the second (final) signature, the logic is different.
      return await this.signFinal(params as unknown as SignFinalOptions);
    }

    const txBuilder = this.getTransactionBuilder() as TransactionBuilder;
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder.transfer().key(new AvaxcKeyPair({ prv: params.prv }).getKeys().prv!);
    const transaction = await txBuilder.build();

    const recipients = transaction.outputs.map((output) => ({ address: output.address, amount: output.value }));

    const txParams = {
      eip1559: params.txPrebuild.eip1559,
      txHex: transaction.toBroadcastFormat(),
      recipients: recipients,
      expireTime: params.txPrebuild.expireTime,
      hopTransaction: params.txPrebuild.hopTransaction,
      custodianTransactionId: params.custodianTransactionId,
    };

    return { halfSigned: txParams };
  }

  /**
   * Modify prebuild before sending it to the server. Add things like hop transaction params
   * @param buildParams The whitelisted parameters for this prebuild
   * @param buildParams.hop True if this should prebuild a hop tx, else false
   * @param buildParams.recipients The recipients array of this transaction
   * @param buildParams.wallet The wallet sending this tx
   * @param buildParams.walletPassphrase the passphrase for this wallet
   */
  async getExtraPrebuildParams(buildParams: BuildOptions): Promise<BuildOptions> {
    if (
      !_.isUndefined(buildParams.hop) &&
      buildParams.hop &&
      !_.isUndefined(buildParams.wallet) &&
      !_.isUndefined(buildParams.recipients)
    ) {
      if (this.isToken()) {
        throw new Error(
          `Hop transactions are not enabled for AVAXC tokens, nor are they necessary. Please remove the 'hop' parameter and try again.`
        );
      }
      return (await this.createHopTransactionParams({
        recipients: buildParams.recipients,
        type: buildParams.type,
      })) as any;
    }
    return {};
  }

  /**
   * Creates the extra parameters needed to build a hop transaction
   * @param {HopTransactionBuildOptions} The original build parameters
   * @returns extra parameters object to merge with the original build parameters object and send to the platform
   */
  async createHopTransactionParams({ recipients, type }: HopTransactionBuildOptions): Promise<HopParams> {
    if (!recipients || !Array.isArray(recipients)) {
      throw new Error('expecting array of recipients');
    }

    // Right now we only support 1 recipient
    if (recipients.length !== 1) {
      throw new Error('must send to exactly 1 recipient');
    }
    const recipientAddress = recipients[0].address;
    const recipientAmount = recipients[0].amount;
    const feeEstimateParams = {
      recipient: recipientAddress,
      amount: recipientAmount,
      hop: true,
      type,
    };
    const feeEstimate: FeeEstimate = await this.feeEstimate(feeEstimateParams);

    const gasLimit = feeEstimate.gasLimitEstimate;
    const gasPrice = Math.round(feeEstimate.feeEstimate / gasLimit);
    const gasPriceMax = gasPrice * 5;
    // Payment id a random number so its different for every tx
    const paymentId = Math.floor(Math.random() * 10000000000).toString();

    // TODO(BG-62671): after completed [Wallet-platform] Remove use of userReqSig for avaxc hop transaction
    const userReqSig = '0x';

    return {
      hopParams: {
        userReqSig,
        gasPriceMax,
        paymentId,
      },
      gasLimit,
    };
  }

  /**
   * Fetch fee estimate information from the server
   * @param {Object} params The params passed into the function
   * @param {Boolean} [params.hop] True if we should estimate fee for a hop transaction
   * @param {String} [params.recipient] The recipient of the transaction to estimate a send to
   * @param {String} [params.data] The ETH tx data to estimate a send for
   * @returns {Object} The fee info returned from the server
   */
  async feeEstimate(params: FeeEstimateOptions): Promise<FeeEstimate> {
    const query: FeeEstimateOptions = {};
    if (params && params.hop) {
      query.hop = params.hop;
    }
    if (params && params.recipient) {
      query.recipient = params.recipient;
    }
    if (params && params.data) {
      query.data = params.data;
    }
    if (params && params.amount) {
      query.amount = params.amount;
    }
    if (params && params.type) {
      query.type = params.type;
    }

    return await this.bitgo.get(this.url('/tx/fee')).query(query).result();
  }

  /**
   * Gets the hop digest for the user to sign. This is validated in the HSM to prove that the user requested this tx
   * @param paramsArr The parameters to hash together for the digest
   */
  static getHopDigest(paramsArr: string[]): Buffer {
    const hash = Keccak('keccak256');
    hash.update([AvaxC.hopTransactionSalt, ...paramsArr].join('$'));
    return hash.digest();
  }

  /**
   * Calculate tx hash like evm from tx hex.
   * @param {string} tx
   * @returns {Buffer} tx hash
   */
  static getTxHash(tx: string): Buffer {
    const hash = Keccak('keccak256');
    hash.update(optionalDeps.ethUtil.stripHexPrefix(tx), 'hex');
    return hash.digest();
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    // TODO: Fix this later
    return true;
  }

  /**
   * Ensure either enterprise or newFeeAddress is passed, to know whether to create new key or use enterprise key
   * @param params
   * @param params.enterprise {String} the enterprise id to associate with this key
   * @param params.newFeeAddress {Boolean} create a new fee address (enterprise not needed in this case)
   */
  preCreateBitGo(params: PrecreateBitGoOptions): void {
    // We always need params object, since either enterprise or newFeeAddress is required
    if (!_.isObject(params)) {
      throw new Error(`preCreateBitGo must be passed a params object. Got ${params} (type ${typeof params})`);
    }

    if (_.isUndefined(params.enterprise) && _.isUndefined(params.newFeeAddress)) {
      throw new Error(
        'expecting enterprise when adding BitGo key. If you want to create a new AVAX bitgo key, set the newFeeAddress parameter to true.'
      );
    }

    // Check whether key should be an enterprise key or a BitGo key for a new fee address
    if (!_.isUndefined(params.enterprise) && !_.isUndefined(params.newFeeAddress)) {
      throw new Error(`Incompatible arguments - cannot pass both enterprise and newFeeAddress parameter.`);
    }

    if (!_.isUndefined(params.enterprise) && !_.isString(params.enterprise)) {
      throw new Error(`enterprise should be a string - got ${params.enterprise} (type ${typeof params.enterprise})`);
    }

    if (!_.isUndefined(params.newFeeAddress) && !_.isBoolean(params.newFeeAddress)) {
      throw new Error(
        `newFeeAddress should be a boolean - got ${params.newFeeAddress} (type ${typeof params.newFeeAddress})`
      );
    }
  }

  getAvaxP(): string {
    return this.getChain().toString() === 'avaxc' ? 'avaxp' : 'tavaxp';
  }
}
