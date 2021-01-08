import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { DeployUtil, PublicKey } from 'casper-client-sdk';
import { parseInt } from 'lodash';
import { BaseTransactionBuilder } from '../baseCoin';
import { BuildTransactionError, NotImplementedError } from '../baseCoin/errors';
import { BaseAddress, BaseFee, BaseKey } from '../baseCoin/iface';
import { Transaction } from './transaction';
import { KeyPair } from './keyPair';
import { GasFee, CasperModuleBytesTransaction, CasperTransferTransaction, SignatureData, CasperNode } from './ifaces';

export const DEFAULT_M = 3;
export const DEFAULT_N = 2;
export abstract class TransactionBuilder extends BaseTransactionBuilder {
  private _source: BaseAddress;
  protected _fee: GasFee;
  private _transaction: Transaction;
  protected _startTime: Date;
  protected _node: CasperNode;
  protected _chainName: string;
  protected _session: CasperTransferTransaction | CasperModuleBytesTransaction;
  protected _duration: string;
  protected _multiSignerKeyPairs: KeyPair[];
  protected _signatures: SignatureData[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
  }

  // region Base Builder
  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const deployParams = new DeployUtil.DeployParams(PublicKey.fromHex(this._source.address), 'release-test-6');

    const session =
      'amount' in this._session
        ? () => {
            const transferSession = this._session as CasperTransferTransaction;
            return new DeployUtil.Transfer(transferSession.amount, transferSession.target);
          }
        : () => {
            const moduleBytesSession = this._session as CasperModuleBytesTransaction;
            return new DeployUtil.ModuleBytes(moduleBytesSession.moduleBytes, moduleBytesSession.args);
          };

    // @ts-ignore
    const payment = DeployUtil.standardPayment(parseInt(this._fee.gasLimit));

    const cTransaction = this.transaction.casperTx || DeployUtil.makeDeploy(deployParams, session(), payment);
    this.transaction.casperTx = cTransaction;

    for (const kp of this._multiSignerKeyPairs) {
      await this.transaction.sign(kp);
    }
    for (const { signature, keyPair } of this._signatures) {
      this.transaction.addSignature(signature, keyPair);
    }
    return this.transaction;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: Uint8Array | string): Transaction {
    throw new NotImplementedError('fromImplementation not implemented');
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    throw new NotImplementedError('signImplementation not implemented');
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this.transaction = tx;
    this.transaction.loadPreviousSignatures();
    const txData = tx.toJson();
    this.fee({ gasLimit: txData.fee.toString() });
    this.source({ address: txData.from });
    this.startTime(txData.startTime);
    this.node({ nodeUrl: txData.node });
    this.chainName(txData.chainName);
    this.duration(txData.validDuration);
  }

  // endregion

  // region Common builder methods

  /**
   * Set the transaction fees
   *
   * @param {BaseFee} fee The maximum gas to pay
   * @returns {TransactionBuilder} This transaction builder
   */
  fee(fee: GasFee): this {
    this.validateValue(new BigNumber(fee.gasLimit));
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
   * Set the transaction startTime
   *
   * @param {string} startTime The transaction startTime
   * @returns {TransactionBuilder} This transaction builder
   */
  startTime(startTime: string): this {
    this._startTime = new Date(startTime);
    return this;
  }

  /**
   * Set the transaction node
   *
   * @param {CasperNode} node The transaction node
   * @returns {TransactionBuilder} This transaction builder
   */
  node(node: CasperNode): this {
    this._node = node;
    return this;
  }

  /**
   * Set the transaction chainName
   *
   * @param {string} chainName The transaction chainName
   * @returns {TransactionBuilder} This transaction builder
   */
  chainName(chainName: string): this {
    this._chainName = chainName;
    return this;
  }

  /**
   * Set the transaction validDuration
   *
   * @param {string} validDuration The transaction validDuration
   * @returns {TransactionBuilder} This transaction builder
   */
  duration(validDuration: string): this {
    this._duration = validDuration;
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
    throw new NotImplementedError('initializeBuilder not implemented');
  }

  // endregion

  // region Validators
  /** @inheritdoc */
  validateAddress(address: BaseAddress, addressFormat?: string): void {
    throw new NotImplementedError('validateAddress not implemented');
    // if (!isValidAddress(address.address)) {
    //   throw new BuildTransactionError('Invalid address ' + address.address);
    // }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    if (!new KeyPair({ prv: key.key })) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    throw new NotImplementedError('validateRawTransaction not implemented');
    // if (!isValidRawTransactionFormat(rawTransaction)) {
    //   throw new ParseTransactionError('Invalid raw transaction');
    // }
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
    throw new NotImplementedError('validateMandatoryFields not implemented');
  }

  // endregion

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
