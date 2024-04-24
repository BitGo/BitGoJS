import { TransactionBuilder as EthLikeTransactionBuilder } from '@bitgo/abstract-eth';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { getCommon } from './utils';
import { walletSimpleByteCode } from './walletUtil';
import { Transaction, TransferBuilder } from './';

export class TransactionBuilder extends EthLikeTransactionBuilder {
  protected _transfer: TransferBuilder;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._common = getCommon(this._coinConfig.network.type);
    this.transaction = new Transaction(this._coinConfig, this._common);
    this._walletSimpleByteCode = walletSimpleByteCode;
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

  /** @inheritdoc */
  public coinUsesNonPackedEncodingForTxData(): boolean {
    // This is because the contracts which have been deployed for
    // polygon amoy testnet use non-packed encoding for tx data
    return this._common.chainIdBN().toString() === '80002';
  }
}
