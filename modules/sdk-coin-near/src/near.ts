/**
 * @prettier
 */

import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import * as base58 from 'bs58';
import { BaseCoin as StaticsBaseCoin, CoinFamily, coins } from '@bitgo/statics';
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
  Ed25519BIP32,
  Eddsa,
  PublicKey,
  Environments,
  EDDSA,
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
}

interface NearTx {
  serializedTx: string;
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

interface UserSigningMaterial {
  uShare: EDDSA.UShare;
  bitgoYShare: EDDSA.YShare;
  backupYShare: EDDSA.YShare;
  userYShare?: EDDSA.YShare;
}

interface BackupSigningMaterial {
  uShare: EDDSA.UShare;
  bitgoYShare: EDDSA.YShare;
  userYShare: EDDSA.YShare;
  backupYShare?: EDDSA.YShare;
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

  supportsStaking(): boolean {
    return true;
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
  // TODO(BG-51092): Needs to be moved to a common place to re-use it for other coins
  static async getInitializedMpcInstance(): Promise<Eddsa> {
    if (this.initialized) {
      return this.MPC;
    }
    const hdTree = await Ed25519BIP32.initialize();
    this.MPC = await Eddsa.initialize(hdTree);
    this.initialized = true;
    return this.MPC;
  }

  // TODO(BG-51092): Needs to be moved to a common place to re-use it for other coins
  async getTSSSignature(
    userSigningMaterial: UserSigningMaterial,
    backupSigningMaterial: BackupSigningMaterial,
    path = 'm/0',
    transaction: Transaction
  ): Promise<Buffer> {
    const MPC = await Near.getInitializedMpcInstance();

    const userCombine = MPC.keyCombine(userSigningMaterial.uShare, [
      userSigningMaterial.bitgoYShare,
      userSigningMaterial.backupYShare,
    ]);
    const backupCombine = MPC.keyCombine(backupSigningMaterial.uShare, [
      backupSigningMaterial.bitgoYShare,
      backupSigningMaterial.userYShare,
    ]);

    const userSubkey = MPC.keyDerive(
      userSigningMaterial.uShare,
      [userSigningMaterial.bitgoYShare, userSigningMaterial.backupYShare],
      path
    );

    const backupSubkey = MPC.keyCombine(backupSigningMaterial.uShare, [
      userSubkey.yShares[2],
      backupSigningMaterial.bitgoYShare,
    ]);

    const messageBuffer = transaction.signablePayload;
    const userSignShare = MPC.signShare(messageBuffer, userSubkey.pShare, [userCombine.jShares[2]]);
    const backupSignShare = MPC.signShare(messageBuffer, backupSubkey.pShare, [backupCombine.jShares[1]]);
    const userSign = MPC.sign(
      messageBuffer,
      userSignShare.xShare,
      [backupSignShare.rShares[1]],
      [userSigningMaterial.bitgoYShare]
    );
    const backupSign = MPC.sign(
      messageBuffer,
      backupSignShare.xShare,
      [userSignShare.rShares[2]],
      [backupSigningMaterial.bitgoYShare]
    );
    const signature = MPC.signCombine([userSign, backupSign]);
    const result = MPC.verify(messageBuffer, signature);
    result.should.equal(true);
    const rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
    return rawSignature;
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params
   */
  async recover(params: RecoveryOptions): Promise<NearTx> {
    // TODO(BG-51092): This looks like a common part which can be extracted out too
    /* ***************** START **************************************/
    if (_.isUndefined(params.userKey)) {
      throw new Error('missing userKey');
    }

    if (_.isUndefined(params.backupKey)) {
      throw new Error('missing backupKey');
    }

    if (_.isUndefined(params.bitgoKey)) {
      throw new Error('missing backupKey');
    }

    if (_.isUndefined(params.walletPassphrase) && !params.userKey.startsWith('xpub')) {
      throw new Error('missing wallet passphrase');
    }

    if (_.isUndefined(params.recoveryDestination) || !this.isValidAddress(params.recoveryDestination)) {
      throw new Error('invalid recoveryDestination');
    }

    // Clean up whitespace from entered values
    const userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');
    const bitgoKey = params.bitgoKey.replace(/\s/g, '');

    // Decrypt private keys from KeyCard values
    let userPrv;
    if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
      try {
        userPrv = this.bitgo.decrypt({
          input: userKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting user keychain: ${e.message}`);
      }
    }
    /** TODO BG-52419 Implement Codec for parsing */
    const userSigningMaterial = JSON.parse(userPrv) as UserSigningMaterial;

    let backupPrv;
    try {
      backupPrv = this.bitgo.decrypt({
        input: backupKey,
        password: params.walletPassphrase,
      });
    } catch (e) {
      throw new Error(`Error decrypting backup keychain: ${e.message}`);
    }
    const backupSigningMaterial = JSON.parse(backupPrv) as BackupSigningMaterial;
    /* ********************** END ***********************************/

    const MPC = await Near.getInitializedMpcInstance();
    const accountId = MPC.deriveUnhardened(bitgoKey, `m/0`).slice(0, 64);
    const bs58EncodedPublicKey = nearAPI.utils.serialize.base_encode(new Uint8Array(Buffer.from(accountId, 'hex')));
    const { storageAmountPerByte, transferCost, receiptConfig } = await this.getProtocolConfig();
    const availableBalance = new BigNumber(await this.getAccountBalance(accountId, storageAmountPerByte));
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
    const netAmount = availableBalance.minus(totalGasWithPadding).toFixed();
    const factory = new TransactionBuilderFactory(coins.get(this.getChain()));
    const txBuilder = factory
      .getTransferBuilder()
      .sender(accountId, accountId)
      .nonce(nonce)
      .receiverId(params.recoveryDestination)
      .recentBlockHash(blockHash)
      .amount(netAmount);
    const unsignedTransaction = (await txBuilder.build()) as Transaction;

    // add signature
    const signatureHex = await this.getTSSSignature(
      userSigningMaterial,
      backupSigningMaterial,
      'm/0',
      unsignedTransaction
    );
    const publicKeyObj = { pub: accountId };
    txBuilder.addSignature(publicKeyObj as PublicKey, signatureHex);
    const signedTransaction = await txBuilder.build();
    const serializedTx = signedTransaction.toBroadcastFormat();
    return { serializedTx: serializedTx };
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
    return { nonce: ++accessKey.nonce, blockHash: accessKey.block_hash };
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
      throw new Error('Account not found');
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

  isWalletAddress(params: VerifyAddressOptions): boolean {
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
