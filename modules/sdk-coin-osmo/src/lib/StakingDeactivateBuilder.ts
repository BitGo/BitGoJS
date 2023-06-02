import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import { DelegateOrUndelegeteMessage, CosmosConstants } from '@bitgo/abstract-cosmos';
import utils from './utils';
import { OsmoTransactionBuilder } from './transactionBuilder';

export class StakingDeactivateBuilder extends OsmoTransactionBuilder {
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
        typeUrl: CosmosConstants.undelegateMsgTypeUrl,
        value: undelegateMessage,
      };
    });
    return this;
  }
}
