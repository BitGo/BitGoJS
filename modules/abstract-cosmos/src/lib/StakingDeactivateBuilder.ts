import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import * as constants from './constants';
import { DelegateOrUndelegeteMessage } from './iface';
import { CosmosTransactionBuilder } from './transactionBuilder';
import { CosmosUtils } from './utils';

export class StakingDeactivateBuilder extends CosmosTransactionBuilder {
  protected _utils: CosmosUtils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: CosmosUtils) {
    super(_coinConfig, utils);
    this._utils = utils;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDeactivate;
  }

  /** @inheritdoc */
  messages(undelegateMessages: DelegateOrUndelegeteMessage[]): this {
    this._messages = undelegateMessages.map((undelegateMessage) => {
      this._utils.validateDelegateOrUndelegateMessage(undelegateMessage);
      return {
        typeUrl: constants.undelegateMsgTypeUrl,
        value: undelegateMessage,
      };
    });
    return this;
  }
}
