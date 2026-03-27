/**
 * WASM-based TON transaction explanation.
 *
 * Built on @bitgo/wasm-ton's parseTransaction(). Maps parsed output to the
 * BitGoJS TransactionExplanation format with all 7 TON transaction types.
 * This is BitGo-specific business logic that lives outside the wasm package.
 */

import {
  Transaction as WasmTonTransaction,
  parseTransaction,
  TonTransactionType,
  type ParsedTransaction,
} from '@bitgo/wasm-ton';
import { TransactionRecipient } from '@bitgo/sdk-core';
import { TransactionExplanation } from './iface';

export interface ExplainTonTransactionWasmOptions {
  txBase64: string;
}

// =============================================================================
// Main explain function
// =============================================================================

/**
 * Explain a TON transaction using the WASM parser.
 *
 * Parses the transaction via WASM parseTransaction(), then maps to the
 * BitGoJS TransactionExplanation format. Supports all 7 TON transaction types:
 * Send, SendToken, SingleNominatorWithdraw, TonWhalesDeposit,
 * TonWhalesWithdrawal, TonWhalesVestingDeposit, TonWhalesVestingWithdrawal.
 */
export function explainTonTransaction(params: ExplainTonTransactionWasmOptions): TransactionExplanation {
  const txBytes = Buffer.from(params.txBase64, 'base64');
  const tx = WasmTonTransaction.fromBytes(txBytes);
  const parsed: ParsedTransaction = parseTransaction(tx);

  // For SendToken, the output is the jetton recipient with the jetton amount.
  // For all other types, outputs come from the parsed outputs array.
  const outputs: TransactionRecipient[] = [];
  let outputAmount: string;

  if (parsed.type === TonTransactionType.SendToken && parsed.jettonDestination && parsed.jettonAmount !== undefined) {
    outputs.push({
      address: parsed.jettonDestination,
      amount: String(parsed.jettonAmount),
    });
    outputAmount = String(parsed.jettonAmount);
  } else {
    for (const out of parsed.outputs) {
      outputs.push({
        address: out.address,
        amount: String(out.amount),
      });
    }
    outputAmount = String(parsed.outputAmount);
  }

  const withdrawAmount =
    parsed.withdrawAmount !== undefined && parsed.withdrawAmount !== 0n ? String(parsed.withdrawAmount) : undefined;

  return {
    displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
    id: '',
    outputs,
    outputAmount,
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: 'UNKNOWN' },
    withdrawAmount,
  };
}
