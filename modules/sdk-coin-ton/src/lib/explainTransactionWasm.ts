/**
 * WASM-based TON transaction explanation.
 *
 * Built on @bitgo/wasm-ton's parseTransaction(). Decodes the BOC, extracts
 * outputs, and maps to BitGoJS TransactionExplanation format.
 */

import { Transaction as WasmTonTransaction, parseTransaction, type ParsedTonTransaction } from '@bitgo/wasm-ton';
import { TransactionExplanation } from './iface';

export interface ExplainTonTransactionOptions {
  txBase64: string;
}

/**
 * Explain a TON transaction using the WASM parser.
 *
 * Parses the transaction via WASM, extracts outputs/inputs, and maps
 * to the BitGoJS TransactionExplanation format.
 */
export function explainTonTransaction(params: ExplainTonTransactionOptions): TransactionExplanation {
  const tx = WasmTonTransaction.fromBase64(params.txBase64);
  const parsed: ParsedTonTransaction = parseTransaction(tx);

  // Transaction ID: undefined for unsigned transactions
  const id = parsed.id ?? '';

  // Outputs: destination + amount
  const outputs = parsed.destination ? [{ address: parsed.destination, amount: String(parsed.amount) }] : [];

  const outputAmount = parsed.destination ? String(parsed.amount) : '0';

  // Withdraw amount for staking operations
  const withdrawAmount =
    parsed.withdrawAmount !== undefined && parsed.withdrawAmount !== 0n ? String(parsed.withdrawAmount) : undefined;

  return {
    displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
    id,
    outputs,
    outputAmount,
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: 'UNKNOWN' },
    withdrawAmount,
  };
}
