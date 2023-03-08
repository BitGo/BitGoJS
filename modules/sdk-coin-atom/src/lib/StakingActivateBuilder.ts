import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { delegateMsgTypeUrl } from './constants';
import { DelegateOrUndelegeteMessage } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class StakingActivateBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /** @inheritdoc */
  messages(delegateMessages: DelegateOrUndelegeteMessage[]): this {
    this._messages = delegateMessages.map((delegateMessage) => {
      utils.validateDelegateOrUndelegateMessage(delegateMessage);
      return {
        typeUrl: delegateMsgTypeUrl,
        value: delegateMessage,
      };
    });
    return this;
  }
}
