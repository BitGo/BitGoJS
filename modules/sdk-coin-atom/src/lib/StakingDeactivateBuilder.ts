import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { undelegateMsgTypeUrl } from './constants';
import { DelegateOrUndelegeteMessage } from './iface';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';

export class StakingDeactivateBuilder extends TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDeactivate;
  }

  /** @inheritdoc */
  messages(undelegateMessages: DelegateOrUndelegeteMessage[]): this {
    this._messages = undelegateMessages.map((undelegateMessage) => {
      utils.validateDelegateOrUndelegateMessage(undelegateMessage);
      return {
        typeUrl: undelegateMsgTypeUrl,
        value: undelegateMessage,
      };
    });
    return this;
  }
}
