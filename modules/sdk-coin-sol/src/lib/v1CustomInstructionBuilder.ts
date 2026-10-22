import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { V1TransactionBuilder } from './v1TransactionBuilder';

/**
 * Transaction builder for Solana v1 (SIMD-0296/0385) custom instructions.
 *
 * Concrete subclass of the abstract {@link V1TransactionBuilder} for locally-built
 * `customTx` transactions: feed each instruction as a web3.js `TransactionInstruction`
 * via {@link V1TransactionBuilder.addInstruction}, set the fee payer via
 * {@link V1TransactionBuilder.sender}, optional durable nonce via
 * {@link V1TransactionBuilder.nonce}, and the v1 config via
 * {@link V1TransactionBuilder.transactionConfig}. The builder owns the
 * `AdvanceNonceAccount` injection, the message compile, and the message-signer-order
 * signature assembly.
 *
 * @remarks NOT reachable through Wallet Platform. Platform-mediated sends reject
 *   client-supplied v1 envelopes fail-closed (`solVersionedTransactionData.version === 1`
 *   → 400 "v1 customTx envelopes are not supported"), and the platform never built a v1
 *   customTx wire: even before that rejection the route validated the envelope and threw
 *   "v1 transaction build/submit not yet supported". For platform sends, put `version: 1`
 *   on a structured payment / confidentialTransfer intent — the platform builds v1
 *   server-side via {@link V1PaymentBuilder} / `ConfidentialTransferBuilder`. This builder
 *   is only for direct-SDK callers that sign and broadcast themselves.
 */
export class V1CustomInstructionBuilder extends V1TransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.CustomTx;
  }
}
