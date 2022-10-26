/**
 * @prettier
 */

import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import * as base58 from 'bs58';
import { Networks, BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';

import {
  BaseCoin,
  BitGoBase,
  BaseTransaction,
  KeyPair,
  MethodNotImplementedError,
  ParsedTransaction,
  ParseTransactionOptions as BaseParseTransactionOptions,
  SignedTransaction,
  SignTransactionOptions as BaseSignTransactionOptions,
  TransactionExplanation,
  VerifyAddressOptions,
  VerifyTransactionOptions,
  Eddsa,
  PublicKey,
  Environments,
  MPCAlgorithm,
  EDDSAMethods,
  EDDSAMethodTypes,
} from '@bitgo/sdk-core';
import * as nearAPI from 'near-api-js';
import * as request from 'superagent';

import { KeyPair as NearKeyPair, Transaction, TransactionBuilderFactory } from './lib';
import nearUtils from './lib/utils';

export interface SignTransactionOptions extends BaseSignTransactionOptions {
  txPrebuild: TransactionPrebuild;
  prv: string;
}

export interface TransactionPrebuild {
  txHex: string;
  key: string;
  blockHash: string;
  nonce: number;
}

export interface ExplainTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

export interface VerifiedTransactionParameters {
  txHex: string;
  prv: string;
  signer: string;
}

export interface NearParseTransactionOptions extends BaseParseTransactionOptions {
  txPrebuild: TransactionPrebuild;
  publicKey: string;
  feeInfo: {
    fee: string;
  };
}

interface TransactionOutput {
  address: string;
  amount: string;
}

interface RecoveryOptions {
  userKey: string; // Box A
  backupKey: string; // Box B
  bitgoKey: string; // Box C
  recoveryDestination: string;
  krsProvider?: string;
  walletPassphrase: string;
  startingScanIndex?: number;
  scan?: number;
}

interface NearTx {
  serializedTx: string;
  scanIndex: number;
}

interface NearTxBuilderParamsFromNode {
  nonce: number;
  blockHash: string;
}

interface NearFeeConfig {
  sendSir: number;
  sendNotSir: number;
  execution: number;
}

interface ProtocolConfigOutput {
  storageAmountPerByte: number;
  transferCost: NearFeeConfig;
  receiptConfig: NearFeeConfig;
}

type TransactionInput = TransactionOutput;

export interface NearParsedTransaction extends ParsedTransaction {
  // total assets being moved, including fees
  inputs: TransactionInput[];

  // where assets are moved to
  outputs: TransactionOutput[];
}

export type NearTransactionExplanation = TransactionExplanation;

export class Near extends BaseCoin {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo);
    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  protected static initialized = false;
  protected static MPC: Eddsa;
  protected network = this.bitgo.getEnv() === 'prod' ? 'main' : 'test';

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Near(bitgo, staticsCoin);
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  /**
   * Flag indicating if this coin supports TSS wallets.
   * @returns {boolean} True if TSS Wallets can be created for this coin
   */
  supportsTss(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'eddsa';
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getBaseChain(): string {
    return this.getChain();
  }

  getFamily(): CoinFamily {
    return this._staticsCoin.family;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  getBaseFactor(): any {
    return Math.pow(10, this._staticsCoin.decimalPlaces);
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed(): boolean {
    return false;
  }

  /**
   * Generate ed25519 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub, prv
   */
  generateKeyPair(seed?: Buffer): KeyPair {
    const keyPair = seed ? new NearKeyPair({ seed }) : new NearKeyPair();
    const keys = keyPair.getKeys();
    if (!keys.prv) {
      throw new Error('Missing prv in key generation.');
    }
    return {
      pub: keys.pub,
      prv: keys.prv,
    };
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    return nearUtils.isValidPublicKey(pub);
  }

  /**
   * Return boolean indicating whether the supplied private key is a valid near private key
   *
   * @param {String} prv the prv to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPrv(prv: string): boolean {
    return nearUtils.isValidPrivateKey(prv);
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin
   *
   * @param {String} address the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidAddress(address: string): boolean {
    return nearUtils.isValidAddress(address);
  }

  /** @inheritDoc */
  async signMessage(key: KeyPair, message: string | Buffer): Promise<Buffer> {
    const nearKeypair = new NearKeyPair({ prv: key.prv });
    if (Buffer.isBuffer(message)) {
      message = base58.encode(message);
    }

    return Buffer.from(nearKeypair.signMessage(message));
  }

  /**
   * Explain/parse transaction
   * @param params
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<NearTransactionExplanation> {
    const factory = this.getBuilder();
    let rebuiltTransaction: BaseTransaction;
    const txRaw = params.txPrebuild.txHex;

    try {
      const transactionBuilder = factory.from(txRaw);
      rebuiltTransaction = await transactionBuilder.build();
    } catch {
      throw new Error('Invalid transaction');
    }

    return rebuiltTransaction.explainTransaction();
  }

  verifySignTransactionParams(params: SignTransactionOptions): VerifiedTransactionParameters {
    const prv = params.prv;

    const txHex = params.txPrebuild.txHex;

    if (_.isUndefined(txHex)) {
      throw new Error('missing txPrebuild parameter');
    }

    if (!_.isString(txHex)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txHex}`);
    }

    if (_.isUndefined(prv)) {
      throw new Error('missing prv parameter to sign transaction');
    }

    if (!_.isString(prv)) {
      throw new Error(`prv must be a string, got type ${typeof prv}`);
    }

    if (!_.has(params.txPrebuild, 'key')) {
      throw new Error('missing public key parameter to sign transaction');
    }

    // if we are receiving addresses do not try to convert them
    const signer = !nearUtils.isValidAddress(params.txPrebuild.key)
      ? new NearKeyPair({ pub: params.txPrebuild.key }).getAddress()
      : params.txPrebuild.key;
    return { txHex, prv, signer };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   *
   * @param params
   * @param params.txPrebuild {TransactionPrebuild} prebuild object returned by platform
   * @param params.prv {String} user prv
   * @param callback
   * @returns {Bluebird<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    const factory = this.getBuilder();
    const txBuilder = factory.from(params.txPrebuild.txHex);
    txBuilder.sign({ key: params.prv });
    const transaction: BaseTransaction = await txBuilder.build();

    if (!transaction) {
      throw new Error('Invalid transaction');
    }

    const serializedTx = (transaction as BaseTransaction).toBroadcastFormat();

    return {
      txHex: serializedTx,
    } as any;
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: RecoveryOptions): Promise<NearTx> {
    if (!params.bitgoKey) {
      throw new Error('missing bitgoKey');
    }
    if (!params.recoveryDestination || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }
    let startIdx = params.startingScanIndex;
    if (startIdx === undefined) {
      startIdx = 0;
    } else if (!Number.isInteger(startIdx) || startIdx < 0) {
      throw new Error('Invalid starting index to scan for addresses');
    }
    let numIteration = params.scan;
    if (numIteration === undefined) {
      numIteration = 20;
    } else if (!Number.isInteger(numIteration) || numIteration <= 0) {
      throw new Error('Invalid scanning factor');
    }
    const bitgoKey = params.bitgoKey.replace(/\s/g, '');
    const isUnsignedSweep = !params.userKey && !params.backupKey && !params.walletPassphrase;
    const MPC = await EDDSAMethods.getInitializedMpcInstance();
    const { storageAmountPerByte, transferCost, receiptConfig } = await this.getProtocolConfig();

    for (let i = startIdx; i < numIteration + startIdx; i++) {
      const currPath = `m/${i}`;
      const accountId = MPC.deriveUnhardened(bitgoKey, currPath).slice(0, 64);
      let availableBalance = new BigNumber(0);
      try {
        availableBalance = new BigNumber(await this.getAccountBalance(accountId, storageAmountPerByte));
      } catch (e) {
        // UNKNOWN_ACCOUNT error indicates that the address has not partake in any transaction so far, so we will
        // treat it as a zero balance address
        if (e.message !== 'UNKNOWN_ACCOUNT') {
          throw e;
        }
      }
      if (availableBalance.toNumber() <= 0) {
        continue;
      }

      // first build the unsigned txn
      const bs58EncodedPublicKey = nearAPI.utils.serialize.base_encode(new Uint8Array(Buffer.from(accountId, 'hex')));
      const { nonce, blockHash } = await this.getAccessKey({ accountId, bs58EncodedPublicKey });
      const gasPrice = await this.getGasPrice(blockHash);
      const gasPriceFirstBlock = new BigNumber(gasPrice);
      const gasPriceSecondBlock = gasPriceFirstBlock.multipliedBy(1.05);
      const totalGasRequired = new BigNumber(transferCost.sendSir)
        .plus(receiptConfig.sendSir)
        .multipliedBy(gasPriceFirstBlock)
        .plus(new BigNumber(transferCost.execution).plus(receiptConfig.execution).multipliedBy(gasPriceSecondBlock));
      // adding some padding to make sure the gas doesn't go below required gas by network
      const totalGasWithPadding = totalGasRequired.multipliedBy(1.5);
      const feeReserve = BigNumber(Networks[this.network].near.feeReserve);
      const storageReserve = BigNumber(Networks[this.network].near.storageReserve);
      const netAmount = availableBalance.minus(totalGasWithPadding).minus(feeReserve).minus(storageReserve);
      if (netAmount.toNumber() <= 0) {
        throw new Error(
          `Found address ${i} with non-zero fund but fund is insufficient to support a recover ` +
            `transaction. Please start the next scan at address index ${i + 1}.`
        );
      }
      const factory = new TransactionBuilderFactory(coins.get(this.getChain()));
      const txBuilder = factory
        .getTransferBuilder()
        .sender(accountId, accountId)
        .nonce(nonce)
        .receiverId(params.recoveryDestination)
        .recentBlockHash(blockHash)
        .amount(netAmount.toFixed());

      if (!isUnsignedSweep) {
        const unsignedTransaction = (await txBuilder.build()) as Transaction;
        // Sign the txn
        /* ***************** START **************************************/
        // TODO(BG-51092): This looks like a common part which can be extracted out too
        if (!params.userKey) {
          throw new Error('missing userKey');
        }
        if (!params.backupKey) {
          throw new Error('missing backupKey');
        }
        if (!params.walletPassphrase) {
          throw new Error('missing wallet passphrase');
        }

        // Clean up whitespace from entered values
        const userKey = params.userKey.replace(/\s/g, '');
        const backupKey = params.backupKey.replace(/\s/g, '');

        // Decrypt private keys from KeyCard values
        let userPrv;
        try {
          userPrv = this.bitgo.decrypt({
            input: userKey,
            password: params.walletPassphrase,
          });
        } catch (e) {
          throw new Error(`Error decrypting user keychain: ${e.message}`);
        }
        /** TODO BG-52419 Implement Codec for parsing */
        const userSigningMaterial = JSON.parse(userPrv) as EDDSAMethodTypes.UserSigningMaterial;

        let backupPrv;
        try {
          backupPrv = this.bitgo.decrypt({
            input: backupKey,
            password: params.walletPassphrase,
          });
        } catch (e) {
          throw new Error(`Error decrypting backup keychain: ${e.message}`);
        }
        const backupSigningMaterial = JSON.parse(backupPrv) as EDDSAMethodTypes.BackupSigningMaterial;
        /* ********************** END ***********************************/

        // add signature
        const signatureHex = await EDDSAMethods.getTSSSignature(
          userSigningMaterial,
          backupSigningMaterial,
          currPath,
          unsignedTransaction
        );
        const publicKeyObj = { pub: accountId };
        txBuilder.addSignature(publicKeyObj as PublicKey, signatureHex);
      }

      const completedTransaction = await txBuilder.build();
      const serializedTx = completedTransaction.toBroadcastFormat();
      return { serializedTx: serializedTx, scanIndex: i };
    }
    throw new Error('Did not find an address with funds to recover');
  }

  /**
   * Make a request to one of the public EOS nodes available
   * @param params.payload
   */
  protected async getDataFromNode(params: { payload?: Record<string, unknown> }): Promise<request.Response> {
    const nodeUrls = this.getPublicNodeUrls();
    for (const nodeUrl of nodeUrls) {
      try {
        return await request.post(nodeUrl).send(params.payload);
      } catch (e) {
        console.debug(e);
      }
    }
    throw new Error(`Unable to call endpoint: '/' from nodes: ${_.join(nodeUrls, ', ')}`);
  }

  protected async getAccessKey({
    accountId,
    bs58EncodedPublicKey,
  }: {
    accountId: string;
    bs58EncodedPublicKey: string;
  }): Promise<NearTxBuilderParamsFromNode> {
    const response = await this.getDataFromNode({
      payload: {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'view_access_key',
          finality: 'final',
          account_id: accountId,
          public_key: bs58EncodedPublicKey,
        },
      },
    });
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    const accessKey = response.body.result;
    return { nonce: accessKey.nonce + 1, blockHash: accessKey.block_hash };
  }

  protected async getAccountBalance(accountId: string, storageAmountPerByte: number): Promise<string> {
    const response = await this.getDataFromNode({
      payload: {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'view_account',
          finality: 'final',
          account_id: accountId,
        },
      },
    });
    if (response.status !== 200) {
      throw new Error('Failed to query account information');
    }
    const errorCause = response.body.error?.cause.name;
    if (errorCause !== undefined) {
      throw new Error(errorCause);
    }

    const account = response.body.result;
    const costPerByte = new BigNumber(storageAmountPerByte);
    const stateStaked = new BigNumber(account.storage_usage).multipliedBy(costPerByte);
    const staked = new BigNumber(account.locked);
    const totalBalance = new BigNumber(account.amount).plus(staked);
    const availableBalance = totalBalance.minus(BigNumber.max(staked, stateStaked));
    return availableBalance.toString();
  }

  protected async getProtocolConfig(): Promise<ProtocolConfigOutput> {
    const response = await this.getDataFromNode({
      payload: {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'EXPERIMENTAL_protocol_config',
        params: {
          finality: 'final',
        },
      },
    });
    if (response.status !== 200) {
      throw new Error('Account not found');
    }

    const config = response.body.result;
    const storageAmountPerByte = config.runtime_config.storage_amount_per_byte;
    const transferCostFromNetwork = config.runtime_config.transaction_costs.action_creation_config.transfer_cost;
    const transferCost: NearFeeConfig = {
      sendSir: transferCostFromNetwork.send_sir,
      sendNotSir: transferCostFromNetwork.send_not_sir,
      execution: transferCostFromNetwork.execution,
    };

    const receiptConfigFromNetwork = config.runtime_config.transaction_costs.action_receipt_creation_config;
    const receiptConfig: NearFeeConfig = {
      sendSir: receiptConfigFromNetwork.send_sir,
      sendNotSir: receiptConfigFromNetwork.send_not_sir,
      execution: receiptConfigFromNetwork.execution,
    };
    return { storageAmountPerByte, transferCost, receiptConfig };
  }

  protected async getGasPrice(blockHash: string): Promise<string> {
    const response = await this.getDataFromNode({
      payload: {
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'gas_price',
        params: [blockHash],
      },
    });
    if (response.status !== 200) {
      throw new Error('Account not found');
    }
    return response.body.result.gas_price;
  }

  protected getPublicNodeUrls(): string[] {
    return Environments[this.bitgo.getEnv()].nearNodeUrls;
  }

  async parseTransaction(params: NearParseTransactionOptions): Promise<NearParsedTransaction> {
    const transactionExplanation = await this.explainTransaction({
      txPrebuild: params.txPrebuild,
      publicKey: params.publicKey,
      feeInfo: params.feeInfo,
    });

    if (!transactionExplanation) {
      throw new Error('Invalid transaction');
    }

    const nearTransaction = transactionExplanation as NearTransactionExplanation;
    if (nearTransaction.outputs.length <= 0) {
      return {
        inputs: [],
        outputs: [],
      };
    }

    const senderAddress = nearTransaction.outputs[0].address;
    const feeAmount = new BigNumber(nearTransaction.fee.fee === '' ? '0' : nearTransaction.fee.fee);

    // assume 1 sender, who is also the fee payer
    const inputs = [
      {
        address: senderAddress,
        amount: new BigNumber(nearTransaction.outputAmount).plus(feeAmount).toFixed(),
      },
    ];

    const outputs: TransactionOutput[] = nearTransaction.outputs.map((output) => {
      return {
        address: output.address,
        amount: new BigNumber(output.amount).toFixed(),
      };
    });

    return {
      inputs,
      outputs,
    };
  }

  async isWalletAddress(params: VerifyAddressOptions): Promise<boolean> {
    throw new MethodNotImplementedError();
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    let totalAmount = new BigNumber(0);
    const coinConfig = coins.get(this.getChain());
    const { txPrebuild: txPrebuild, txParams: txParams } = params;
    const transaction = new Transaction(coinConfig);
    const rawTx = txPrebuild.txHex;
    if (!rawTx) {
      throw new Error('missing required tx prebuild property txHex');
    }

    transaction.fromRawTransaction(rawTx);
    const explainedTx = transaction.explainTransaction();

    // users do not input recipients for consolidation requests as they are generated by the server
    if (txParams.recipients !== undefined) {
      const filteredRecipients = txParams.recipients?.map((recipient) => _.pick(recipient, ['address', 'amount']));
      const filteredOutputs = explainedTx.outputs.map((output) => _.pick(output, ['address', 'amount']));

      if (!_.isEqual(filteredOutputs, filteredRecipients)) {
        throw new Error('Tx outputs does not match with expected txParams recipients');
      }
      for (const recipients of txParams.recipients) {
        totalAmount = totalAmount.plus(recipients.amount);
      }
      if (!totalAmount.isEqualTo(explainedTx.outputAmount)) {
        throw new Error('Tx total amount does not match with expected total amount field');
      }
    }
    return true;
  }

  private getBuilder(): TransactionBuilderFactory {
    return new TransactionBuilderFactory(coins.get(this.getBaseChain()));
  }
}
