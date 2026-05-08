import { TransactionType, Recipient } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { TokenTransaction } from './tokenTransaction';
import { Transaction } from './transaction';

export class TokenTransferBuilder extends TransactionBuilder {
  protected _transaction: TokenTransaction;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._transaction = new TokenTransaction(coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.SendToken;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    this.transaction.transactionType = TransactionType.SendToken;
    this.transaction.fromRawTransaction(rawTransaction);
    return this.transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.transaction.transactionType = TransactionType.SendToken;
    await this.transaction.build();
    this.transaction.loadInputsAndOutputs();
    return this.transaction;
  }

  setForwardTonAmount(amount: string): TokenTransferBuilder {
    (this.transaction as TokenTransaction).forwardTonAmount = amount;
    return this;
  }

  setSenderJettonWalletAddress(address: string): TokenTransferBuilder {
    (this.transaction as TokenTransaction).senderJettonWalletAddress = address;
    return this;
  }

  setTonAmount(amount: string): TokenTransferBuilder {
    (this.transaction as TokenTransaction).tonAmount = amount;
    return this;
  }

  // recipient method to handle both TON and token amounts
  recipient(
    address: string,
    senderJettonWalletAddress: string,
    tonAmount: string,
    jettonAmount: string,
    forwardTonAmount: string
  ): TokenTransferBuilder {
    this._transaction.recipient = {
      address: address,
      amount: jettonAmount, // Jetton amount to be transferred
    };
    (this._transaction as TokenTransaction).senderJettonWalletAddress = senderJettonWalletAddress; // The sender's Jetton wallet address
    (this._transaction as TokenTransaction).tonAmount = tonAmount; // TON amount sent to the sender's Jetton wallet
    (this._transaction as TokenTransaction).forwardTonAmount = forwardTonAmount; // TON amount to cover forward fees in case of notify transfer
    return this;
  }

  send(recipient: Recipient): TokenTransferBuilder {
    this.transaction.recipient = recipient;
    return this;
  }
}
