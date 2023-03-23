import { TransactionBuilder } from './transactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, Recipient, TransactionType } from '@bitgo/sdk-core';
import { TransferTx, SuiTransaction, SuiTransactionType, TransferProgrammableTransaction } from './iface';
import { Transaction } from './transaction';
import { TransferTransaction } from './transferTransaction';
import assert from 'assert';
import { normalizeSuiAddress } from './mystenlab/types';
import { builder, Commands, Transaction as ProgrammingTransactionBuilder } from './mystenlab/builder';
import { BCS } from '@mysten/bcs';
import { Buffer } from 'buffer';

export class TransferBuilder extends TransactionBuilder<TransferProgrammableTransaction> {
  protected _payTx: TransferTx;
  protected _recipients: Recipient[];

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new TransferTransaction(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  send(recipients: Recipient[]): this {
    // TODO validate
    this._recipients = recipients;
    return this;
  }

  // input(coins: SuiObjectRef[]): this {
  //   // TODO validate
  //   if (this._gasData === undefined) {
  //     this._gasData = {};
  //   }
  //   this._gasData.payment = coins;
  //   return this;
  // }

  /** @inheritdoc */
  validateTransaction(transaction: TransferTransaction): void {
    if (!transaction.suiTransaction) {
      return;
    }
    // FIXME
    // this.validateTransactionFields();
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction<TransferProgrammableTransaction> {
    const tx = new TransferTransaction(this._coinConfig);
    this.validateRawTransaction(rawTransaction);
    tx.fromRawTransaction(rawTransaction);
    this.initBuilder(tx);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction<TransferProgrammableTransaction>> {
    this.transaction.setSuiTransaction(this.buildSuiTransaction());
    this.transaction.transactionType(this.transactionType);

    if (this._signer) {
      this.transaction.sign(this._signer);
    }

    this._signatures.forEach((signature) => {
      this.transaction.addSignature(signature.publicKey, signature.signature);
    });

    // this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  /**
   * Initialize the transaction builder fields using the decoded transaction data
   *
   * @param {Transaction} tx the transaction data
   */
  initBuilder(tx: TransferTransaction): void {
    this._transaction = tx;

    if (tx.signature && tx.signature.length > 0) {
      this._signatures = [tx.suiSignature];
    }

    const txData = tx.toJson();
    this.type(SuiTransactionType.Transfer);
    this.sender(txData.sender);
    this.gasData(txData.gasData);
    const amounts: string[] = [];
    const addresses: string[] = [];

    txData.kind.ProgrammableTransaction.inputs.forEach((input, index) => {
      if (index % 2 === 0) {
        amounts.push(builder.de(BCS.U64, Buffer.from(input.Pure).toString('base64'), 'base64'));
      } else {
        addresses.push(
          normalizeSuiAddress(builder.de(BCS.ADDRESS, Buffer.from(input.Pure).toString('base64'), 'base64'))
        );
      }
    });
    const recipients = addresses.map((address, index) => {
      return {
        address: address,
        amount: Number(amounts[index]).toString(),
      } as Recipient;
    });
    this.send(recipients);
  }

  /**
   * Validates all fields are defined
   */
  private validateTransactionFields(): void {
    assert(this._type, new BuildTransactionError('type is required before building'));
    assert(this._sender, new BuildTransactionError('sender is required before building'));
    assert(this._payTx, new BuildTransactionError('payTx is required before building'));
    assert(this._gasData, new BuildTransactionError('gasData is required before building'));
  }

  protected buildSuiTransaction(): SuiTransaction<TransferProgrammableTransaction> {
    const txBuilder = new ProgrammingTransactionBuilder();
    // FIXME
    // this.validateTransactionFields();
    this._recipients.forEach((recipient) => {
      const coin = txBuilder.add(Commands.SplitCoins(txBuilder.gas, [txBuilder.pure(Number(recipient.amount))]));
      txBuilder.add(Commands.TransferObjects([coin], txBuilder.object(recipient.address)));
    });
    const txData = txBuilder.transactionData;
    return {
      type: this._type,
      sender: this._sender,
      tx: {
        inputs: [...txData.inputs],
        commands: [...txData.commands],
      },
      gasData: {
        ...this._gasData,
      },
    };
  }
}
