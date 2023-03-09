import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import XrpUtils from './utils';
import { AccountSet } from 'xrpl';

export class AccountSetBuilder extends TransactionBuilder {
  protected _setFlag: number;
  protected _messageKey: string;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.AccountUpdate;
  }

  protected get xrpTransactionType(): 'AccountSet' {
    return 'AccountSet';
  }

  setFlag(setFlag: number): TransactionBuilder {
    XrpUtils.validateAccountSetFlag(setFlag);
    this._setFlag = setFlag;
    return this;
  }

  messageKey(messageKey: string): TransactionBuilder {
    if (!XrpUtils.isValidMessageKey(messageKey)) {
      throw new BuildTransactionError('Invalid message key');
    }
    this._messageKey = messageKey;
    return this;
  }

  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    const { setFlag, messageKey } = tx.toJson();
    if (setFlag) {
      this.setFlag(setFlag);
    }

    if (messageKey) {
      this.messageKey(messageKey);
    }
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    if (!this._sender) {
      throw new BuildTransactionError('Sender must be set before building the transaction');
    }

    const accountSetFields: AccountSet = {
      TransactionType: this.xrpTransactionType,
      Account: this._sender,
    };
    if (this._setFlag) {
      accountSetFields.SetFlag = this._setFlag;
    }

    if (this._messageKey) {
      accountSetFields.MessageKey = this._messageKey;
    }

    this._specificFields = accountSetFields;

    return await super.buildImplementation();
  }
}
