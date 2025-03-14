import { CosmosTransaction, CosmosTransactionBuilder, CosmosUtils } from '@bitgo/abstract-cosmos';
import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BabylonTransaction } from './BabylonTransaction';
import * as constants from './constants';
import { CustomTxMessage } from './iface';

export class CustomTransactionBuilder extends CosmosTransactionBuilder<CustomTxMessage> {
  constructor(_coinConfig: Readonly<CoinConfig>, _utils: CosmosUtils<CustomTxMessage>) {
    super(_coinConfig, _utils);
    this._utils = _utils;
    this._transaction = new BabylonTransaction(_coinConfig, _utils);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.CustomTx;
  }

  /** @inheritdoc */
  override messages(customTxMessages: CustomTxMessage[]): this {
    this._messages = customTxMessages.map((customTxMessage) => {
      this._utils.validateCustomMessage(customTxMessage);
      return {
        typeUrl: constants.createBTCDelegationMsgTypeUrl,
        value: customTxMessage,
      };
    });
    return this;
  }

  /** @inheritdoc */
  override newTransaction(): CosmosTransaction<CustomTxMessage> {
    return new BabylonTransaction(this._coinConfig, this._utils);
  }
}
