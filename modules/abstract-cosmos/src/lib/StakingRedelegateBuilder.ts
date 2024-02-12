import { TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import * as constants from './constants';
import { RedelegateMessage } from './iface';
import { CosmosTransactionBuilder } from './transactionBuilder';
import { CosmosUtils } from './utils';

export class StakingRedelegateBuilder extends CosmosTransactionBuilder {
  protected _utils: CosmosUtils;

  constructor(_coinConfig: Readonly<CoinConfig>, utils: CosmosUtils) {
    super(_coinConfig, utils);
    this._utils = utils;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingRedelegate;
  }

  /** @inheritdoc */
  messages(redelegateMessages: RedelegateMessage[]): this {
    this._messages = redelegateMessages.map((redelegateMessage) => {
      this._utils.validateRedelegateMessage(redelegateMessage);
      return {
        typeUrl: constants.redelegateTypeUrl,
        value: redelegateMessage,
      };
    });
    return this;
  }
}
