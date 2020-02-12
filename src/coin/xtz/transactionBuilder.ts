import BigNumber from 'bignumber.js';

import {
  SigningError,
  BuildTransactionError,
} from '../baseCoin/errors';
import { Address } from './address';
import { BaseKey } from '../baseCoin/iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilder, TransactionType } from '../baseCoin';
import { Transaction } from './transaction';
import { KeyPair } from "./keyPair";
import {Fee, Operation} from "./iface";
import {
  genericMultisigOriginationOperation,
  revealOperation
} from "../../../resources/xtz/multisig";
import {
  isValidAddress,
  isValidBlockHash,
  DEFAULT_GAS_LIMIT,
  DEFAULT_STORAGE_LIMIT,
  DEFAULT_FEE
} from "./utils";

/**
 * Tezos transaction builder.
 */
export class TransactionBuilder extends BaseTransactionBuilder {
  private _serializedTransaction: string;
  private _transaction: Transaction;
  private _fee: Fee;
  private _type: TransactionType = TransactionType.Send;
  private _revealSource: boolean = false;
  private _sourceAddress: string;
  private _sourceKeyPair?: KeyPair;
  private _counter: BigNumber = new BigNumber(0);
  private _amount: BigNumber = new BigNumber(0);
  private _blockHeader: string;

  // Initialization transaction parameters
  private _owner: string[] = [];

  /**
   * Public constructor.
   */
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    // Decoding the transaction is an async operation, so save it and leave the decoding for the
    // build step
    this._serializedTransaction = rawTransaction;
    return new Transaction(this._coinConfig);
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    const signer = new KeyPair({ prv: key.key });
    if (!this._sourceAddress || this._sourceAddress != signer.getAddress()) {
      throw new SigningError('Private key does not match the source account');
    }

    this._sourceKeyPair = signer;

    // Signing the transaction is an async operation, so save the source and leave the actual
    // signing for the build step
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    // If the from() method was called, use the serialized transaction as a base
    if (this._serializedTransaction) {
      await this.transaction.initFromSerializedTransaction(this._serializedTransaction);
      // TODO: make changes to the transaction if any extra parameter has been set then sign it
      return this.transaction;
    }

    const contents: Operation[] = [];
    switch (this._type) {
      case TransactionType.AddressInitialization:
        const revealOp = revealOperation(
          this._counter.toString(),
          this._sourceAddress,
          DEFAULT_FEE.REVEAL.toString(),
          DEFAULT_GAS_LIMIT.REVEAL.toString(),
          DEFAULT_STORAGE_LIMIT.REVEAL.toString(),
          this._amount.toString(),
          this._sourceKeyPair!.getKeys().pub);
          contents.push(revealOp);
        this._counter = this._counter.plus(1);
        break;
      case TransactionType.WalletInitialization:
        if (this._revealSource && this._sourceKeyPair) {
          const revealOp = revealOperation(
            this._counter.toString(),
            this._sourceAddress,
            DEFAULT_FEE.REVEAL.toString(),
            DEFAULT_GAS_LIMIT.REVEAL.toString(),
            DEFAULT_STORAGE_LIMIT.REVEAL.toString(),
            '0',
            this._sourceKeyPair!.getKeys().pub);
          contents.push(revealOp);
          this._counter = this._counter.plus(1);
        }
        const originationOp = genericMultisigOriginationOperation(
          this._counter.toString(),
          this._sourceAddress,
          this._fee.fee,
          this._fee.gasLimit || '0',
          this._fee.storageLimit || '0',
          this._amount.toString(),
          this._owner);
        contents.push(originationOp);
        break;
      case TransactionType.Send:
        throw new BuildTransactionError('Send is not supported yet');
      default:
        throw new BuildTransactionError('Unsupported transaction type');
    }
    const parsedTransaction = {
      branch: this._blockHeader,
      contents,
    };

    this.transaction = new Transaction(this._coinConfig);
    await this.transaction.initFromParsedTransaction(parsedTransaction);
    if (this._sourceKeyPair && this._sourceKeyPair.getKeys().prv) {
      await this.transaction.sign(this._sourceKeyPair);
    }

    return Promise.resolve(this.transaction);
  }

  /**
   * The type of transaction being built.
   *
   * @param {TransactionType} type
   */
  type(type: TransactionType): void {
    if (type === TransactionType.Send && this._owner.length > 0) {
      throw new BuildTransactionError('Transaction cannot be labeled as Send when owners have already been set');
    }
    this._type = type;
  }

  /**
   * Set the transaction fees. Low fees may get a transaction rejected or never picked up by bakers.
   *
   * @param {Fee} fee Baker fees. May also include the maximum gas and storage fees to pay
   */
  fee(fee: Fee): void {
    // TODO: check fees are not negative
    this._fee = fee;
  }

  /**
   * Set the transaction initiator. This account will pay for the transaction fees, but it will not
   * be added as an owner of a wallet in a init transaction, unless manually set as one of the
   * owners.
   *
   * @param {string | KeyPair} source A Tezos address or KeyPair. The latter is required if it is a reveal
   *      operation
   */
  source(source: string | KeyPair): void {
    if (typeof source === 'string') {
      if (this._type == TransactionType.AddressInitialization) {
        throw new BuildTransactionError('Reveal transaction requires the source KeyPair');
      }
      this.validateAddress({ address: source });
      this._sourceAddress = source;
    } else {
      this._sourceKeyPair = source;
      this._sourceAddress = source.getAddress();
    }
  }

  /**
   * Set the amount to be transferred to the destination or to set up as initial balance for a new
   * wallet.
   *
   * @param {BigNumber} amount Amount in mutez (1/1000000 Tezies)
   */
  amount(amount: string): void {
    const convertedAmount = new BigNumber(amount);
    this.validateValue(convertedAmount);
    this._amount = convertedAmount;
  }

  /**
   * Set the transaction counter to prevent submitting repeated transactions.
   *
   * @param {BigNumber} counter The counter to use
   */
  counter(counter: BigNumber): void {
    this._counter = new BigNumber(counter);
  }

  /**
   * Set one of the owners of the multisig wallet.
   *
   * @param {string} publicKey A Tezos public key
   */
  owner(publicKey: string): void {
    if (this._type !== TransactionType.WalletInitialization) {
      throw new BuildTransactionError('Multisig wallet owner can only be set for initialization transactions');
    }
    this._owner.push(publicKey);
  }

  /**
   * Reveal the source account in this transaction. This is a no-op if the transaction type is
   * AddressInitialization. In the rest of the cases, it will add an extra reveal operation before
   * any other to reveal the source account.
   */
  reveal(): void {
    this._revealSource = true;
  }

  /**
   * Set the transaction branch id.
   *
   * @param {string} blockId A block hash to use as branch reference
   */
  branch(blockId: string): void {
    if (!isValidBlockHash(blockId)) {
      throw new BuildTransactionError('Invalid block hash ' + blockId);
    }
    this._blockHeader = blockId;
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new BuildTransactionError('Value cannot be below less than zero');
    }
    // TODO: validate the amount is not bigger than the max amount in Tezos
  }

  /** @inheritdoc */
  validateAddress(address: Address): void {
    if (!isValidAddress(address.address)) {
      throw new BuildTransactionError('Invalid address ' + address.address);
    }
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    const keyPair = new KeyPair({ prv: key.key});
    if (!keyPair.getKeys().prv) {
      throw new BuildTransactionError('Invalid key');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: any): void {
    // TODO: validate the transaction is either a JSON or a hex
  }

  /** @inheritdoc */
  validateTransaction(transaction: Transaction): void {
    // TODO: validate all required fields are present in the builder before buildImplementation
    switch (this._type) {
      case TransactionType.AddressInitialization:
        break;
      case TransactionType.WalletInitialization:
        break;
      case TransactionType.Send:
        break;
      default:
        throw new BuildTransactionError('Transaction type not supported');
    }
  }

  /** @inheritdoc */
  displayName(): string {
    return this._coinConfig.fullName;
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(transaction: Transaction) {
    this._transaction = transaction;
  }
}
