import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder as AbstractTransactionBuilder, Transaction } from '@bitgo/abstract-eth';
import { getCommon } from './utils';
import { TransferBuilder } from './transferBuilder';

export class TransactionBuilder extends AbstractTransactionBuilder {
  protected _transfer: TransferBuilder;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig.network.type);
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

  protected getContractData(addresses: string[]): string {
    throw new Error('Method not implemented.');
  }
}
