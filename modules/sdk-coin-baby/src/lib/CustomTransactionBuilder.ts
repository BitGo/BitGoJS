import { CosmosTransaction, CosmosTransactionBuilder } from '@bitgo/abstract-cosmos';
import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BabylonTransaction } from './BabylonTransaction';
import { BabylonSpecificMessages } from './iface';
import utils, { Utils } from './utils';

export class CustomTransactionBuilder extends CosmosTransactionBuilder<BabylonSpecificMessages> {
  constructor(_coinConfig: Readonly<CoinConfig>, _utils: Utils) {
    super(_coinConfig, _utils);
    this._utils = _utils;
    this._transaction = new BabylonTransaction(_coinConfig, _utils);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.CustomTx;
  }

  /** @inheritdoc */
  override messages(babylonSpecificMessages: BabylonSpecificMessages[]): this {
    this._messages = babylonSpecificMessages.map((message) => {
      this._utils.validateCustomMessage(message);
      return {
        typeUrl: utils.babylonMessageKindToTypeUrl[message._kind],
        value: message,
      };
    });
    return this;
  }

  /** @inheritdoc */
  override newTransaction(): CosmosTransaction<BabylonSpecificMessages> {
    return new BabylonTransaction(this._coinConfig, this._utils);
  }
}
