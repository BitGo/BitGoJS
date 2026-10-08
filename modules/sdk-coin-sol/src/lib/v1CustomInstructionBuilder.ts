import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { V1TransactionBuilder } from './v1TransactionBuilder';

/**
 * Transaction builder for Solana v1 (SIMD-0296/0385) custom instructions.
 *
 * Concrete subclass of the abstract {@link V1TransactionBuilder} for `customTx`
 * intents — the surface Wallet Platform instantiates to assemble v1 transactions
 * from a client-supplied envelope: feed each envelope instruction as a web3.js
 * `TransactionInstruction` via {@link V1TransactionBuilder.addInstruction}, set the
 * fee payer via {@link V1TransactionBuilder.sender}, optional durable nonce via
 * {@link V1TransactionBuilder.nonce}, and the v1 config via
 * {@link V1TransactionBuilder.transactionConfig}. The builder owns the
 * `AdvanceNonceAccount` injection, the message compile, and the message-signer-order
 * signature assembly.
 */
export class V1CustomInstructionBuilder extends V1TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.CustomTx;
  }
}
