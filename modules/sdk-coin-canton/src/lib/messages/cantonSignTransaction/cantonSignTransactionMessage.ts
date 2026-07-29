import { MessageOptions, MessageStandardType } from '@bitgo/sdk-core';
import { CantonBaseMessage } from '../cantonBaseMessage';

/**
 * Canton sign-transaction message (Daml prepared transaction).
 *
 * Used when the Canton Gateway requests signing of a Daml ledger transaction.
 * The CANTON_SIGN_TRANSACTION type tells wallet-platform to apply HSM payload
 * Format 2: itemCount=2 || len || preparedTxBinary || signableHex
 */
export class CantonSignTransactionMessage extends CantonBaseMessage {
  constructor(options: MessageOptions) {
    super({
      ...options,
      type: MessageStandardType.CANTON_SIGN_TRANSACTION,
    });
  }
}
