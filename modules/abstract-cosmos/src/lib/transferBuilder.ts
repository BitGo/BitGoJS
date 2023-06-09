import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import * as constants from './constants';
import { SendMessage } from './iface';
import { CosmosTransactionBuilder } from './transactionBuilder';
import { CosmosUtils } from './utils';

export class CosmosTransferBuilder extends CosmosTransactionBuilder {
  protected _utils: CosmosUtils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: CosmosUtils) {
    super(_coinConfig, utils);
    this._utils = utils;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /** @inheritdoc */
  messages(sendMessages: SendMessage[]): this {
    this._messages = sendMessages.map((sendMessage) => {
      this._utils.validateSendMessage(sendMessage);
      return {
        typeUrl: constants.sendMsgTypeUrl,
        value: sendMessage,
      };
    });
    return this;
  }
}
