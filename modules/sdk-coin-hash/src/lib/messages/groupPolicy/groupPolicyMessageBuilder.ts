import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilder, IMessage, MessageOptions, MessageStandardType } from '@bitgo/sdk-core';
import { GroupPolicyMessage } from './groupPolicyMessage';

/**
 * Builder for Provenance Group Policy messages.
 *
 * Produces a GroupPolicyMessage whose signable payload is the raw
 * message bytes, suitable for signing with a Provenance (HASH) wallet key.
 */
export class GroupPolicyMessageBuilder extends BaseMessageBuilder {
  public constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig, MessageStandardType.GROUP_POLICY);
  }

  async buildMessage(options: MessageOptions): Promise<IMessage> {
    return new GroupPolicyMessage(options);
  }
}
