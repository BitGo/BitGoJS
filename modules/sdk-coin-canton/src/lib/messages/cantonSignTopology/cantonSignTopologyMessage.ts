import { MessageOptions, MessageStandardType } from '@bitgo/sdk-core';
import { CantonBaseMessage } from '../cantonBaseMessage';

/**
 * Canton sign-topology message (topology transaction — e.g. party hosting).
 *
 * Used when the Canton Gateway requests signing of a topology transaction,
 * for example when a party is being hosted on an external validator.
 * The CANTON_SIGN_TOPOLOGY type tells wallet-platform to apply HSM payload
 * Format 1: [txnType=0] || itemCount || [len || topoTxBytes]... || signableHex
 */
export class CantonSignTopologyMessage extends CantonBaseMessage {
  constructor(options: MessageOptions) {
    super({
      ...options,
      type: MessageStandardType.CANTON_SIGN_TOPOLOGY,
    });
  }
}
