import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilderFactory, IMessageBuilder, MessageStandardType } from '@bitgo/sdk-core';
import { GroupPolicyMessageBuilder } from './groupPolicy';

/**
 * Message builder factory for the Provenance (HASH) blockchain.
 *
 * Supports the GROUP_POLICY message standard used by Go Accounts
 * when signing Provenance Group Policy votes.
 */
export class MessageBuilderFactory extends BaseMessageBuilderFactory {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  public getMessageBuilder(type: MessageStandardType): IMessageBuilder {
    switch (type) {
      case MessageStandardType.GROUP_POLICY:
        return new GroupPolicyMessageBuilder(this.coinConfig);
      default:
        throw new Error(`Message standard '${type}' is not supported for HASH (Provenance)`);
    }
  }
}
