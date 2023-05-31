import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { OsmoTransactionBuilder } from './transactionBuilder';
import utils from './utils';
import { SendMessage, CosmosConstants } from '@bitgo/abstract-cosmos';

export class OsmoTransferBuilder extends OsmoTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /** @inheritdoc */
  messages(sendMessages: SendMessage[]): this {
    this._messages = sendMessages.map((sendMessage) => {
      utils.validateSendMessage(sendMessage);
      return {
        typeUrl: CosmosConstants.sendMsgTypeUrl,
        value: sendMessage,
      };
    });
    return this;
  }
}
