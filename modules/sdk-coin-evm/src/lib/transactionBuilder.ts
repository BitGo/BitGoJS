import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { BuildTransactionError, TransactionType } from '@bitgo-beta/sdk-core';
import { TransactionBuilder as AbstractTransactionBuilder, Transaction } from '@bitgo-beta/abstract-eth';
import { getCommon } from './utils';
import { TransferBuilder } from './transferBuilder';

export class TransactionBuilder extends AbstractTransactionBuilder {
  protected _transfer: TransferBuilder;
  private _signatures: any;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig);
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

  addSignature(publicKey, signature) {
    this._signatures = [];
    this._signatures.push({ publicKey, signature });
  }

  protected getContractData(addresses: string[]): string {
    throw new Error('Method not implemented.');
  }
}
