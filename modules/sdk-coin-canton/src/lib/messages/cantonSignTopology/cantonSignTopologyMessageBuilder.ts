import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseMessageBuilder, IMessage, MessageOptions, MessageStandardType } from '@bitgo/sdk-core';
import { CantonSignTopologyMessage } from './cantonSignTopologyMessage';

/**
 * Builder for Canton sign-topology messages.
 *
 * The payload should be the base64-encoded txHash from Canton's signTransaction
 * call when it is requesting a topology transaction to be signed (e.g. party
 * hosting on an external validator).
 *
 * wallet-platform uses the CANTON_SIGN_TOPOLOGY type to apply HSM payload
 * Format 1 (topology framing) rather than Format 2 (prepared-transaction framing).
 */
export class CantonSignTopologyMessageBuilder extends BaseMessageBuilder {
  public constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig, MessageStandardType.CANTON_SIGN_TOPOLOGY);
  }

  public async buildMessage(options: MessageOptions): Promise<IMessage> {
    return new CantonSignTopologyMessage(options);
  }
}
