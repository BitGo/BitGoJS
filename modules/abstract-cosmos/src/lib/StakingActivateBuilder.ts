import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';

import * as constants from './constants';
import { DelegateOrUndelegeteMessage } from './iface';
import { CosmosTransactionBuilder } from './transactionBuilder';
import { CosmosUtils } from './utils';

export class StakingActivateBuilder extends CosmosTransactionBuilder {
  protected _utils: CosmosUtils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: CosmosUtils) {
    super(_coinConfig, utils);
    this._utils = utils;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /** @inheritdoc */
  messages(delegateMessages: DelegateOrUndelegeteMessage[]): this {
    this._messages = delegateMessages.map((delegateMessage) => {
      this._utils.validateDelegateOrUndelegateMessage(delegateMessage);
      return {
        typeUrl: constants.delegateMsgTypeUrl,
        value: delegateMessage,
      };
    });
    return this;
  }
}
