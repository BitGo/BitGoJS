import { Eip191MessageBuilder } from './eip191';
import { Eip712MessageBuilder, Erc20VotesDelegationMessageBuilder } from './eip712';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilderFactory, IMessageBuilder, MessageStandardType } from '@bitgo/sdk-core';

export class MessageBuilderFactory extends BaseMessageBuilderFactory {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  public getMessageBuilder(type: MessageStandardType): IMessageBuilder {
    switch (type) {
      case MessageStandardType.EIP191:
        return new Eip191MessageBuilder(this.coinConfig);
      case MessageStandardType.EIP712:
        return new Eip712MessageBuilder(this.coinConfig);
      default:
        throw new Error(`Invalid message standard ${type}`);
    }
  }

  /**
   * Returns a builder for OpenZeppelin ERC20Votes `delegateBySig` EIP-712 messages.
   *
   * The produced message is `MessageStandardType.EIP712`, so it routes through the same
   * `signTypedStructuredData` wallet-platform intent as any other EIP-712 message; this
   * helper just spares callers from hand-crafting the `Delegation(...)` typed-data JSON.
   */
  public getErc20VotesDelegationBuilder(): Erc20VotesDelegationMessageBuilder {
    return new Erc20VotesDelegationMessageBuilder(this.coinConfig);
  }
}
