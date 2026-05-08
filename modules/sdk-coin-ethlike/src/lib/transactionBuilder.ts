import EthereumCommon from '@ethereumjs/common';
import { TransactionBuilder as AbstractTransactionBuilder, Transaction } from '@bitgo/abstract-eth';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransferBuilder } from './transferBuilder';

export class EthLikeTransactionBuilder extends AbstractTransactionBuilder {
  protected _transfer: TransferBuilder;

  constructor(_coinConfig: Readonly<CoinConfig>, common?: EthereumCommon) {
    super(_coinConfig);
    if (!common) {
      throw new Error('Common must be provided for EthLikeTransactionBuilder');
    }
    this._common = common;
    this.transaction = new Transaction(this._coinConfig, this._common);
  }

  /** @inheritdoc */
  transfer(data?: string): TransferBuilder {
    if (this._type !== TransactionType.Send) {
      throw new BuildTransactionError('Transfers can only be set for send transactions');
    }
    if (!this._transfer) {
      this._transfer = new TransferBuilder(data);
    }
    return this._transfer;
  }
}
