import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { sendMsgTypeUrl } from './constants';
import { SendMessage } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class TransferBuilder extends TransactionBuilder {
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
        typeUrl: sendMsgTypeUrl,
        value: sendMessage,
      };
    });
    return this;
  }
}
