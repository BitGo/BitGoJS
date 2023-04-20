import {
  BaseAddress,
  BaseKey,
  BaseTransactionBuilder,
  BuildTransactionError,
  InvalidTransactionError,
  PublicKey as BasePublicKey,
  SigningError,
  TransactionType,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { makeSignBytes } from '@cosmjs/proto-signing';
import BigNumber from 'bignumber.js';

import {
  DelegateOrUndelegeteMessage,
  FeeData,
  MessageData,
  SendMessage,
  WithdrawDelegatorRewardsMessage,
} from './iface';
import { KeyPair } from './keyPair';
import { Transaction } from './transaction';
import utils from './utils';

export abstract class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _sequence: number;
  protected _messages: MessageData[];
  protected _gasBudget: FeeData;
  private _accountNumber?: number;
  private _signature: Buffer;
  private _chainId?: string;
  private _publicKey?: string;
  private _signer: KeyPair;
  private _memo?: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new Transaction(_coinConfig);
  }

  /**
   * The transaction type.
   */
  protected abstract get transactionType(): TransactionType;

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }

  /** @inheritDoc */
  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signature = signature;
    this._publicKey = publicKey.pub;
  }

  /**
   * Sets gas budget of this transaction
   * Gas budget consist of fee amount and gas limit. Division feeAmount/gasLimit represents
   * the gas-fee and it should be more than minimum required gas-fee to process the transaction
   * @param {FeeData} gasBudget
   * @returns {TransactionBuilder} this transaction builder
   */
  gasBudget(gasBudget: FeeData): this {
    utils.validateGasBudget(gasBudget);
    this._gasBudget = gasBudget;
    return this;
  }

  /**
   * Sets sequence of this transaction.
   * @param {number} sequence - sequence data for tx signer
   * @returns {TransactionBuilder} This transaction builder
   */
  sequence(sequence: number): this {
    utils.validateSequence(sequence);
    this._sequence = sequence;
    return this;
  }

  /**
   * Sets messages to the transaction body. Message type will be different based on the transaction type
   * - For @see TransactionType.StakingActivate required type is @see DelegateOrUndelegeteMessage
   * - For @see TransactionType.StakingDeactivate required type is @see DelegateOrUndelegeteMessage
   * - For @see TransactionType.Send required type is @see SendMessage
   * - For @see TransactionType.StakingWithdraw required type is @see WithdrawDelegatorRewardsMessage
   * @param {(SendMessage | DelegateOrUndelegeteMessage | WithdrawDelegatorRewardsMessage)[]} messages
   * @returns {TransactionBuilder} This transaction builder
   */
  abstract messages(messages: (SendMessage | DelegateOrUndelegeteMessage | WithdrawDelegatorRewardsMessage)[]): this;

  publicKey(publicKey: string | undefined): this {
    this._publicKey = publicKey;
    return this;
  }

  accountNumber(accountNumber: number | undefined): this {
    this._accountNumber = accountNumber;
    return this;
  }

  chainId(chainId: string | undefined): this {
    this._chainId = chainId;
    return this;
  }

  memo(memo: string | undefined): this {
    this._memo = memo;
    return this;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction): void {
    this._transaction = tx;
    const txData = tx.toJson();
    this.gasBudget(txData.gasBudget);
    this.messages(
      txData.sendMessages.map((message) => {
        return message.value;
      })
    );
    this.sequence(txData.sequence);
    this.publicKey(txData.publicKey);
    this.accountNumber(txData.accountNumber);
    this.chainId(txData.chainId);
    this.memo(txData.memo);
    if (tx.signature && tx.signature.length > 0) {
      this.addSignature({ pub: txData.publicKey } as any, Buffer.from(tx.signature[0], 'hex'));
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new Transaction(this._coinConfig);
    tx.enrichTransactionDetailsFromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.transactionType = this.transactionType;
    if (this._accountNumber) {
      this.transaction.accountNumber = this._accountNumber;
    }
    if (this._chainId) {
      this.transaction.chainId = this._chainId;
    }
    this.transaction.atomTransaction = utils.createAtomTransaction(
      this._sequence,
      this._messages,
      this._gasBudget,
      this._publicKey,
      this._memo
    );

    const privateKey = this._signer?.getPrivateKey();
    if (privateKey !== undefined && this.transaction.atomTransaction.publicKey !== undefined) {
      const signDoc = utils.createSignDoc(this.transaction.atomTransaction, this._accountNumber, this._chainId);
      const txnHash = sha256(makeSignBytes(signDoc));
      const signature = await Secp256k1.createSignature(txnHash, privateKey);
      const compressedSig = Buffer.concat([signature.r(), signature.s()]);
      this.addSignature({ pub: this.transaction.atomTransaction.publicKey }, compressedSig);
    }

    if (this._signature !== undefined) {
      this.transaction.addSignature(this._signature.toString('hex'));
      this.transaction.atomTransaction = utils.createAtomTransactionWithHash(
        this._sequence,
        this._messages,
        this._gasBudget,
        this._publicKey,
        this._signature,
        this._memo
      );
    }
    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.validateKey(key);
    if (this._accountNumber === undefined) {
      throw new SigningError('accountNumber is required before signing');
    }
    if (this._chainId === undefined) {
      throw new SigningError('chainId is required before signing');
    }
    this._signer = new KeyPair({ prv: key.key });
    this._publicKey = this._signer.getKeys().pub;
    return this.transaction;
  }

  validateAddress(address: BaseAddress, addressFormat?: string): void {
    if (!(utils.isValidAddress(address.address) || utils.isValidValidatorAddress(address.address))) {
      throw new BuildTransactionError('transactionBuilder: address isValidAddress check failed: ' + address.address);
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be less than zero');
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    try {
      new KeyPair({ prv: key.key });
    } catch {
      throw new BuildTransactionError(`Key validation failed`);
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction) {
      throw new InvalidTransactionError('Invalid raw transaction: Undefined rawTransaction');
    }
    try {
    } catch (e) {
      throw new InvalidTransactionError('Invalid raw transaction: ' + e.message);
    }
    const atomTransaction = utils.deserializeAtomTransaction(rawTransaction);
    utils.validateAtomTransaction(atomTransaction);
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    utils.validateAtomTransaction({
      sequence: this._sequence,
      sendMessages: this._messages,
      gasBudget: this._gasBudget,
      publicKey: this._publicKey,
    });
  }
}
