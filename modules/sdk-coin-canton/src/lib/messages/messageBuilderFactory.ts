import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilderFactory, IMessageBuilder, MessageStandardType } from '@bitgo/sdk-core';
import { CantonSignTransactionMessageBuilder } from './cantonSignTransaction';
import { CantonSignTopologyMessageBuilder } from './cantonSignTopology';

export class MessageBuilderFactory extends BaseMessageBuilderFactory {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  public getMessageBuilder(type: MessageStandardType): IMessageBuilder {
    switch (type) {
      case MessageStandardType.CANTON_SIGN_TRANSACTION:
        return new CantonSignTransactionMessageBuilder(this.coinConfig);
      case MessageStandardType.CANTON_SIGN_TOPOLOGY:
        return new CantonSignTopologyMessageBuilder(this.coinConfig);
      default:
        throw new Error(`Invalid message standard ${type}`);
    }
  }
}
