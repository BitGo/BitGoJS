import {
  BaseKey,
  InvalidTransactionError,
  NotImplementedError,
  ParseTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionRecipient,
  TransactionType,
} from '@bitgo/sdk-core';
import { BitGoSuiTransaction, SuiTransactionType, TransactionExplanation, TxData } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { Buffer } from 'buffer';
import { Transaction } from './transaction';
import { ProgrammableTransaction } from './mystenlab/types';

export class StakingTransaction extends Transaction<ProgrammableTransaction> {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): BitGoSuiTransaction<ProgrammableTransaction> {
    return this._suiTransaction;
  }

  setSuiTransaction(tx: BitGoSuiTransaction<ProgrammableTransaction>): void {
    this._suiTransaction = tx;
  }

  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push(signature.toString('hex'));
    this._signature = { publicKey, signature };
    this.serialize();
  }

  get suiSignature(): Signature {
    return this._signature;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  /** @inheritdoc */
  toJson(): TxData {
    if (!this._suiTransaction) {
      throw new ParseTransactionError('Empty transaction');
    }
    throw new NotImplementedError('Not implemented');
  }

  /** @inheritDoc */
  explainTransaction(): TransactionExplanation {
    const result = this.toJson();
    const displayOrder = [
      'id',
      'outputs',
      'outputAmount',
      'changeOutputs',
      'changeAmount',
      'fee',
      'type',
      'module',
      'function',
      'validatorAddress',
    ];
    const outputs: TransactionRecipient[] = [];

    const explanationResult: TransactionExplanation = {
      displayOrder,
      id: this.id,
      outputs,
      outputAmount: '0',
      changeOutputs: [],
      changeAmount: '0',
      fee: { fee: this.suiTransaction.gasData.budget.toString() },
      type: this.type,
    };

    switch (this.type) {
      case TransactionType.AddDelegator:
        return this.explainAddDelegationTransaction(result, explanationResult);
      case TransactionType.StakingWithdraw:
        return this.explainWithdrawDelegationTransaction(result, explanationResult);
      default:
        throw new InvalidTransactionError('Transaction type not supported');
    }
  }

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  transactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Load the input and output data on this transaction.
   */
  loadInputsAndOutputs(): void {
    if (!this.suiTransaction) {
      return;
    }
    switch (this.suiTransaction.type) {
      case SuiTransactionType.AddStake:
        this._inputs = [];
        this._outputs = [];
        break;
      case SuiTransactionType.WithdrawStake:
        this._inputs = [];
        this._outputs = [];
        break;
      default:
        return;
    }
  }

  /**
   * Sets this transaction payload
   *
   * @param {string} rawTransaction
   */
  fromRawTransaction(rawTransaction: string): void {
    try {
      utils.isValidRawTransaction(rawTransaction);
      throw new NotImplementedError('Not implemented');
      // this._suiTransaction = Transaction.deserializeSuiTransaction(rawTransaction) as BitGoSuiTransaction<MoveCallTx>;
      // this._type = utils.getTransactionType(this._suiTransaction.tx.function);
      // this.loadInputsAndOutputs();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Helper function for serialize() to get the correct txData with transaction type
   *
   * @return {TxData}
   */
  getTxData(): TxData {
    throw new NotImplementedError('Not implemented');
  }

  /**
   * Returns a complete explanation for a transfer transaction
   *
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainAddDelegationTransaction(json: TxData, explanationResult: TransactionExplanation): TransactionExplanation {
    throw new NotImplementedError('Not implemented');
  }

  /**
   * Returns a complete explanation for a withdraw delegation transaction
   *
   * @param {TxData} json The transaction data in json format
   * @param {TransactionExplanation} explanationResult The transaction explanation to be completed
   * @returns {TransactionExplanation}
   */
  explainWithdrawDelegationTransaction(
    json: TxData,
    explanationResult: TransactionExplanation
  ): TransactionExplanation {
    throw new NotImplementedError('Not implemented');
  }
}
