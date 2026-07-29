/**
 * WASM-based TON transaction explanation.
 *
 * Built on @bitgo/wasm-ton's parseTransaction(). Derives transaction types,
 * extracts outputs/inputs, and maps to BitGoJS TransactionExplanation format.
 * This is BitGo-specific business logic that lives outside the wasm package.
 */

import {
  Transaction as WasmTonTransaction,
  parseTransaction,
  type ParsedTransaction as WasmParsedTransaction,
} from '@bitgo/wasm-ton';
import { TransactionExplanation } from './iface';

export interface ExplainTonTransactionWasmOptions {
  txBase64: string;
  /** When false, use the original bounce-flag-respecting address format. Defaults to true (bounceable EQ...). */
  toAddressBounceable?: boolean;
}

function extractOutputs(
  parsed: WasmParsedTransaction,
  toAddressBounceable: boolean
): {
  outputs: { address: string; amount: string }[];
  outputAmount: string;
  withdrawAmount: string | undefined;
} {
  const outputs: { address: string; amount: string }[] = [];
  let withdrawAmount: string | undefined;

  for (const action of parsed.sendActions) {
    if (action.jettonTransfer) {
      outputs.push({
        address: action.jettonTransfer.destination,
        amount: String(action.jettonTransfer.amount),
      });
    } else {
      // destinationBounceable is always EQ... (bounceable)
      // destination respects the original bounce flag (UQ... when bounce=false)
      outputs.push({
        address: toAddressBounceable ? action.destinationBounceable : action.destination,
        amount: String(action.amount),
      });
    }

    // withdrawAmount comes from the body payload parsed by WASM (not the message TON value)
    if (action.withdrawAmount !== undefined) {
      withdrawAmount = String(action.withdrawAmount);
    }
  }

  const outputAmount = outputs.reduce((sum, o) => sum + BigInt(o.amount), 0n);

  return { outputs, outputAmount: String(outputAmount), withdrawAmount };
}

/**
 * Standalone WASM-based transaction explanation for TON.
 *
 * Parses the transaction via `parseTransaction(tx)` from @bitgo/wasm-ton,
 * then derives the transaction type, extracts outputs/inputs, and maps
 * to BitGoJS TransactionExplanation format.
 */
export function explainTonTransaction(params: ExplainTonTransactionWasmOptions): TransactionExplanation {
  const toAddressBounceable = params.toAddressBounceable !== false;
  const tx = WasmTonTransaction.fromBytes(Buffer.from(params.txBase64, 'base64'));
  const parsed: WasmParsedTransaction = parseTransaction(tx);

  const { outputs, outputAmount, withdrawAmount } = extractOutputs(parsed, toAddressBounceable);

  return {
    displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
    id: tx.id,
    outputs,
    outputAmount,
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: 'UNKNOWN' },
    withdrawAmount,
  };
}
