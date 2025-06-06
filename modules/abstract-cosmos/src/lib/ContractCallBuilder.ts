import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import * as constants from './constants';
import { ExecuteContractMessage } from './iface';
import { CosmosTransactionBuilder } from './transactionBuilder';
import { CosmosUtils } from './utils';

export class ContractCallBuilder<CustomMessage = never> extends CosmosTransactionBuilder<CustomMessage> {
  protected _utils: CosmosUtils<CustomMessage>;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: CosmosUtils<CustomMessage>) {
    super(_coinConfig, utils);
    this._utils = utils;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.ContractCall;
  }

  /** @inheritdoc */
  messages(messages: ExecuteContractMessage[]): this {
    this._messages = messages.map((executeContractMessage) => {
      this._utils.validateExecuteContractMessage(executeContractMessage, this.transactionType);
      return {
        typeUrl: constants.executeContractMsgTypeUrl,
        value: executeContractMessage,
      };
    });
    return this;
  }
}
