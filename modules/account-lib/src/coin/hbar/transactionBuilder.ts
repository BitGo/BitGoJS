import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { AccountId, TransactionId } from '@hashgraph/sdk';
import { TransactionBuilder as SDKTransactionBuilder } from '@hashgraph/sdk/lib/TransactionBuilder';
import { SignaturePair } from '@hashgraph/sdk/lib/generated/BasicTypes_pb';
import { BaseTransactionBuilder } from '../baseCoin';
import {
  BuildTransactionError,
  InvalidParameterValueError,
  ParseTransactionError,
  SigningError,
} from '../baseCoin/errors';
import { BaseAddress, BaseFee, BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import {
  getCurrentTime,
  isValidAddress,
  isValidRawTransactionFormat,
  isValidTimeString,
  toUint8Array,
  toHex,
  stringifyAccountId,
  stringifyTxTime,
  isValidMemo,
} from './utils';
import { KeyPair } from './keyPair';
import { SignatureData, HederaNode, Timestamp } from './ifaces';

export const DEFAULT_N = 2;
export const DEFAULT_M = 3;
export const DEFAULT_DURATION = 120;
export const DEFAULT_NODE_ID = { nodeId: '0.0.4' };
export const AUTO_RENEW_PERIOD = 7890000; // 3 months
export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _fee: BaseFee;
  private _transaction: Transaction;
  protected _source: BaseAddress;
  protected _startTime: Timestamp;
  protected _memo: string;
  protected _node: HederaNode = DEFAULT_NODE_ID;
  protected _duration = DEFAULT_DURATION;
  protected _multiSignerKeyPairs: KeyPair[];
  protected _signatures: SignatureData[];
  protected _sdkTransactionBuilder: SDKTransactionBuilder;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._multiSignerKeyPairs = [];
    this._signatures = [];
    this.transaction = new Transaction(_coinConfig);
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this._sdkTransactionBuilder
      .setMaxTransactionFee(new BigNumber(this._fee.fee).toNumber())
      .setTransactionId(this.buildTxId())
      .setTransactionMemo(this._memo)
      .setNodeAccountId(new AccountId(this._node.nodeId))
      .setTransactionValidDuration(this._duration);
    const previousSignatures = this.transaction.retrieveSignatures();
    this.transaction.innerTransaction(this._sdkTransactionBuilder.build());
    await this.signSteps(previousSignatures);

    return this.transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    let buffer;
    if (typeof rawTransaction === 'string') {
      buffer = toUint8Array(rawTransaction);
    } else {
      buffer = rawTransaction;
    }
    const tx = new Transaction(this._coinConfig, buffer);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.checkDuplicatedKeys(key);
    const signer = new KeyPair({ prv: key.key });

    // Signing the transaction is an operation that relies on all the data being set,
    // so we set the source here and leave the actual signing for the build step
    this._multiSignerKeyPairs.push(signer);
    return this.transaction;
  }

  /**
   * Signing steps for a Hedera transaction, it involves
   * signing with the previous included signatures,
   * signing with the added keys through the sign function and
   * signing with the precalculated signatures added through the signature function
   *
   * @param {SignaturePair[]} previousSignatures the signatures from a previous decoded transaction
   */
  private async signSteps(previousSignatures: SignaturePair[]) {
    for (const sigPair of previousSignatures) {
      this.transaction.addSignature(
        toHex(sigPair.getEd25519_asU8()),
        new KeyPair({ pub: toHex(sigPair.getPubkeyprefix_asU8()) }),
      );
    }
    for (const kp of this._multiSignerKeyPairs) {
      await this.transaction.sign(kp);
    }
    for (const { signature, keyPair } of this._signatures) {
      this.transaction.addSignature(signature, keyPair);
    }
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this.transaction = tx;
    const txData = tx.toJson();
    this.fee({ fee: txData.body.transactionfee });
    this.source({ address: stringifyAccountId(txData.body.transactionid!.accountid!) });
    this.startTime(stringifyTxTime(txData.body.transactionid!.transactionvalidstart!));
    this.node({ nodeId: stringifyAccountId(txData.body.nodeaccountid!) });
    this.validDuration(txData.body.transactionvalidduration!.seconds);
    if (txData.body.memo) {
      this.memo(txData.body.memo);
    }
  }

  /**
   * Creates an Hedera TransactionID
   *
   * @returns {TransactionId} - created TransactionID
   */
  protected buildTxId(): TransactionId {
    const validStart = this.validStart;
    return new TransactionId({
      validStartNanos: validStart.nanos,
      validStartSeconds: validStart.seconds,
      account: new AccountId(this._source.address),
    });
  }
  // endregion

  // region Common builder methods
  /**
   *  Set the memo
   *
   * @param {string} memo A hedera memo, can be a maximum of 100 bytes
   * @returns {TransactionBuilder} This transaction builder
   */
  memo(memo: string): this {
    if (!isValidMemo(memo)) {
      throw new InvalidParameterValueError('Memo must not be longer than 100 bytes');
    }
    this._memo = memo;
    return this;
  }

  /**
   *  Set the node, it may take the format `'<shard>.<realm>.<account>'` or `'<account>'`
   *
   * @param {HederaNode} node A hedera node address
   * @returns {TransactionBuilder} This transaction builder
   */
  node(node: HederaNode): this {
    if (!isValidAddress(node.nodeId)) {
      throw new InvalidParameterValueError('Invalid Hedera node address');
    }
    this._node = node;
    return this;
  }

  /**
   * Set the transaction valid duration
   *
   * @param {number} validDuration the transaction valid duration in seconds
   * @returns {TransactionBuilder} This transaction builder
   */
  validDuration(validDuration: number): this {
    this.validateValue(new BigNumber(validDuration));
    this._duration = validDuration;
    return this;
  }

  /**
   * Set the transaction fees
   *
   * @param {BaseFee} fee The maximum gas to pay
   * @returns {TransactionBuilder} This transaction builder
   */
  fee(fee: BaseFee): this {
    this.validateValue(new BigNumber(fee.fee));
    this._fee = fee;
    return this;
  }

  /**
   * Set the transaction source
   *
   * @param {BaseAddress} address The source account
   * @returns {TransactionBuilder} This transaction builder
   */
  source(address: BaseAddress): this {
    this.validateAddress(address);
    this._source = address;
    return this;
  }

  /**
   * Set an external transaction signature
   *
   * @param signature Hex encoded signature string
   * @param keyPair The public key keypair that was used to create the signature
   * @returns This transaction builder
   */
  signature(signature: string, keyPair: KeyPair): this {
    // if we already have a signature for this key pair, just update it
    for (const oldSignature of this._signatures) {
      if (oldSignature.keyPair.getKeys().pub === keyPair.getKeys().pub) {
        oldSignature.signature = signature;
        return this;
      }
    }

    // otherwise add the new signature
    this._signatures.push({ signature, keyPair });
    return this;
  }

  /**
   * Set the start time
   *
   * @param {string} time string value of the time to set with format <seconds>.<nanos>
   * @returns {TransactionBuilder} this
   */
  startTime(time: string): this {
    if (!isValidTimeString(time)) {
      throw new InvalidParameterValueError('Invalid value for time parameter');
    }
    const timeParts = time.split('.').map(v => new BigNumber(v).toNumber());
    this._startTime = { seconds: timeParts[0], nanos: timeParts[1] };
    return this;
  }
  // endregion

  // region Getters and Setters
  private get validStart(): Timestamp {
    if (!this._startTime) {
      this.startTime(getCurrentTime());
    }
    return this._startTime;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    if (!new KeyPair({ prv: key.key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    if (!isValidRawTransactionFormat(rawTransaction)) {
      throw new ParseTransactionError('Invalid raw transaction');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction?: Transaction): void {
    this.validateMandatoryFields();
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  validateMandatoryFields(): void {
    if (this._fee === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing fee');
    }
    if (this._source === undefined) {
      throw new BuildTransactionError('Invalid transaction: missing source');
    }
  }

  /**
   * Validates that the given key is not already in this._multiSignerKeyPairs
   *
   * @param {BaseKey} key - The key to check
   */
  private checkDuplicatedKeys(key: BaseKey) {
    this._multiSignerKeyPairs.forEach(_sourceKeyPair => {
      if (_sourceKeyPair.getKeys().prv!.toString() === key.key) {
        throw new SigningError('Repeated sign: ' + key.key);
      }
    });
  }
  // endregion
}
