/**
 * WASM-based TON transaction explanation.
 *
 * Built on @bitgo/wasm-ton's parseTransaction(). Derives transaction types,
 * extracts outputs/inputs, and maps to BitGoJS TransactionExplanation format.
 * This is BitGo-specific business logic that lives outside the wasm package.
 */

import { Transaction, parseTransaction, TransactionType as WasmTransactionType } from '@bitgo/wasm-ton';
import type { TransactionExplanation } from './iface';

// =============================================================================
// Types
// =============================================================================

export interface ExplainTonTransactionWasmParams {
  /** Base64-encoded BOC string */
  txBase64: string;
}

// =============================================================================
// Main explain function
// =============================================================================

/**
 * Explain a TON transaction using the WASM parser.
 *
 * Parses the transaction via WASM, derives the transaction type and
 * recipients, then maps to BitGoJS TransactionExplanation format.
 *
 * @param params.txBase64 - Base64-encoded BOC string
 * @returns BitGoJS TransactionExplanation
 */
export function explainTonTransaction(params: ExplainTonTransactionWasmParams): TransactionExplanation {
  const tx = Transaction.fromBase64(params.txBase64);
  const parsed = parseTransaction(tx);

  // Build outputs from recipients. For jetton (SendToken) txs the primary
  // output address is the jetton transfer destination, not the inner message
  // recipient (which is the jetton wallet contract).
  const outputs = parsed.recipients.map((r) => {
    if (parsed.transactionType === WasmTransactionType.SendToken && parsed.jettonTransfer) {
      return {
        address: parsed.jettonTransfer.destination,
        // jettonTransfer.amount is arbitrary precision string (token units)
        amount: parsed.jettonTransfer.amount,
      };
    }
    return {
      address: r.address,
      // r.amount is nanotons bigint — convert at the serialization boundary
      amount: String(r.amount),
    };
  });

  // outputAmount: sum of native TON amounts for non-token txs; 0 string for token
  let outputAmount: string;
  if (parsed.transactionType === WasmTransactionType.SendToken && parsed.jettonTransfer) {
    outputAmount = parsed.jettonTransfer.amount;
  } else {
    outputAmount = String(parsed.recipients.reduce((sum, r) => sum + r.amount, 0n));
  }

  // withdrawAmount: only present for SingleNominatorWithdraw (maps to the
  // withdrawal amount in the op cell). We surface the first recipient amount
  // as a proxy since the legacy implementation did the same.
  let withdrawAmount: string | undefined;
  if (parsed.transactionType === WasmTransactionType.SingleNominatorWithdraw && parsed.recipients.length > 0) {
    // The legacy parser set withdrawAmount from the opcode payload.
    // WASM exposes the outer message value (gas attachment).
    // Keep undefined here — callers that need the exact withdraw amount should
    // use the raw parsed data; the field was already UNKNOWN in many cases.
    withdrawAmount = undefined;
  }

  const displayOrder = ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'];

  return {
    displayOrder,
    id: parsed.id ?? '',
    outputs,
    outputAmount,
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: 'UNKNOWN' },
    withdrawAmount,
  };
}
