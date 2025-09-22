import { TransactionType } from '@bitgo-beta/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { CosmosTransferBuilder, CosmosUtils, SendMessage } from '@bitgo-beta/abstract-cosmos';

export class RuneTransferBuilder extends CosmosTransferBuilder {
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
        typeUrl: '/types.MsgSend',
        value: sendMessage,
      };
    });
    return this;
  }
}
