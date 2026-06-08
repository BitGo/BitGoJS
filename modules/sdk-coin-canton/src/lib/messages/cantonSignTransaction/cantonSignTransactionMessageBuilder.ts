import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilder, IMessage, MessageOptions, MessageStandardType } from '@bitgo/sdk-core';
import { CantonSignTransactionMessage } from './cantonSignTransactionMessage';

/**
 * Builder for Canton sign-transaction messages.
 *
 * The payload should be the base64-encoded txHash from Canton's
 * signTransaction RPC call. The builder produces a CantonSignTransactionMessage
 * whose signable payload is the decoded raw bytes of that hash.
 */
export class CantonSignTransactionMessageBuilder extends BaseMessageBuilder {
  public constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig, MessageStandardType.CANTON_SIGN_TRANSACTION);
  }

  public async buildMessage(options: MessageOptions): Promise<IMessage> {
    return new CantonSignTransactionMessage(options);
  }
}
