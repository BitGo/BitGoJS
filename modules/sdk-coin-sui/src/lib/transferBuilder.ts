import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotImplementedError, TransactionType } from '@bitgo/sdk-core';
import { BitGoSuiTransaction, PayTx, SuiTransactionType } from './iface';
import { Transaction } from './transaction';
import { TransferTransaction } from './transferTransaction';
import utils from './utils';
import assert from 'assert';
import { ProgrammableTransaction, SuiObjectRef } from './mystenlab/types';

export class TransferBuilder extends TransactionBuilder<ProgrammableTransaction> {
  protected _payTx: PayTx;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    // this._transaction = new TransferTransaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  payTx(payTx: PayTx): this {
    this.validateTxPay(payTx);
    this._payTx = payTx;
    return this;
  }

  validateTxPay(payTx: PayTx): void {
    if (!payTx.hasOwnProperty('coins')) {
      throw new BuildTransactionError(`Invalid payTx, missing coins`);
    }
    if (!payTx.hasOwnProperty('recipients')) {
      throw new BuildTransactionError(`Invalid payTx, missing recipients`);
    }
    if (!payTx.hasOwnProperty('amounts')) {
      throw new BuildTransactionError(`Invalid payTx, missing amounts`);
    }

    if (this._type !== SuiTransactionType.PayAllSui && payTx.recipients.length !== payTx.amounts.length) {
      throw new BuildTransactionError(
        `recipients length ${payTx.recipients.length} must equal to amounts length ${payTx.amounts.length}`
      );
    }
    if (!utils.isValidAmounts(payTx.amounts)) {
      throw new BuildTransactionError('Invalid or missing amounts, got: ' + payTx.amounts);
    }

    for (const coin of payTx.coins) {
      this.validateSuiObjectRef(coin, 'payTx.coin');
    }

    for (const recipient of payTx.recipients) {
      utils.validateAddress(recipient, 'payTx.recipient');
    }
  }

  /** @inheritdoc */
  validateTransaction(transaction: TransferTransaction): void {
    if (!transaction.suiTransaction) {
      return;
    }
    this.validateTransactionFields();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction<ProgrammableTransaction> {
    const tx = new TransferTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<ProgrammableTransaction>> {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    this.transaction.transactionType(this.transactionType);

    if (this._signer) {
      this.transaction.sign(this._signer);
    }

    this._signatures.forEach((signature) => {
      this.transaction.addSignature(signature.publicKey, signature.signature);
    });

    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: Transaction<ProgrammableTransaction>): void {
    throw new NotImplementedError('TODO: Not implemented');
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._payTx, new BuildTransactionError('payTx is required before building'));
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));

    if (this._type === SuiTransactionType.Pay) {
      assert(this._gasData.payment, new BuildTransactionError('gasPayment is required for type Pay before building'));

      const coinIds = this._payTx.coins.map((coin) => coin.objectId);
      if (coinIds.includes(this._gasData.payment.objectId)) {
        throw new BuildTransactionError(
          `Invalid gas payment ${this._gasData.payment.objectId}: cannot be one of the inputCoins`
        );
      }
    }
  }

  // Reorder input coins so the first coin is the gas payment
  reorderInputCoins(): SuiObjectRef[] {
    assert(this._gasData.payment);
    const coinIds = this._payTx.coins.map((coin) => coin.objectId);
    const inputCoins: SuiObjectRef[] = [];
    inputCoins.push(...this._payTx.coins);
    if (!coinIds.includes(this._gasData.payment.objectId)) {
      inputCoins.unshift(this._gasData.payment);
    } else {
      const gasPaymentIndex = inputCoins.findIndex((coin) => coin.objectId === this._gasData.payment!.objectId);
      inputCoins[gasPaymentIndex] = inputCoins[0];
      inputCoins[0] = this._gasData.payment;
    }

    return inputCoins;
  }

  protected buildSuiTransaction(): BitGoSuiTransaction<ProgrammableTransaction> {
    this.validateTransactionFields();

    let payTx, gasPayment;
    if (this._type === SuiTransactionType.PaySui || this._type === SuiTransactionType.PayAllSui) {
      if (!this._gasData.payment) {
        gasPayment = this._payTx.coins[0];
      } else {
        const inputCoins = this.reorderInputCoins();
        payTx = { coins: inputCoins, recipients: this._payTx.recipients, amounts: this._payTx.amounts };
      }
    }

    return {
      type: this._type,
      sender: this._sender,
      tx: payTx ?? this._payTx,
      gasData: {
        ...this._gasData,
        payment: gasPayment ?? this._gasData.payment,
      },
    };
  }
}
