import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { DelegateOrUndelegeteMessage, CosmosConstants } from '@bitgo/abstract-cosmos';
import utils from './utils';
import { OsmoTransactionBuilder } from './transactionBuilder';

export class StakingActivateBuilder extends OsmoTransactionBuilder {
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
        typeUrl: CosmosConstants.delegateMsgTypeUrl,
        value: delegateMessage,
      };
    });
    return this;
  }
}
