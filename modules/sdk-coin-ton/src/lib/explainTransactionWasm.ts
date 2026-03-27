/**
 * WASM-based TON transaction explanation.
 *
 * Built on @bitgo/wasm-ton's parseTransaction(). Derives transaction types,
 * extracts outputs/inputs, and maps to BitGoJS TransactionExplanation format.
 * This is BitGo-specific business logic that lives outside the wasm package.
 */

import { Transaction as WasmTonTransaction, parseTransaction } from '@bitgo/wasm-ton';
import type { TonTransactionType } from '@bitgo/wasm-ton';
import type { ParsedTransaction as WasmParsedTransaction } from '@bitgo/wasm-ton';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionExplanation } from './iface';

export interface ExplainTonTransactionWasmOptions {
  txBase64: string;
}

// =============================================================================
// Transaction type mapping
// =============================================================================

function mapTransactionType(wasmType: TonTransactionType): TransactionType {
  switch (wasmType) {
    case 'Transfer':
      return TransactionType.Send;
    case 'TokenTransfer':
      return TransactionType.SendToken;
    case 'WhalesDeposit':
      return TransactionType.TonWhalesDeposit;
    case 'WhalesVestingDeposit':
      return TransactionType.TonWhalesVestingDeposit;
    case 'WhalesWithdraw':
      return TransactionType.TonWhalesWithdrawal;
    case 'WhalesVestingWithdraw':
      return TransactionType.TonWhalesVestingWithdrawal;
    case 'SingleNominatorWithdraw':
      return TransactionType.SingleNominatorWithdraw;
    case 'Unknown':
      return TransactionType.Send;
    default:
      return TransactionType.Send;
  }
}

// =============================================================================
// Output/input extraction
// =============================================================================

interface InternalOutput {
  address: string;
  amount: string;
}

interface InternalInput {
  address: string;
  value: string;
}

function extractOutputsAndInputs(parsed: WasmParsedTransaction): {
  outputs: InternalOutput[];
  inputs: InternalInput[];
  outputAmount: string;
  withdrawAmount: string | undefined;
} {
  const outputs: InternalOutput[] = [];
  const inputs: InternalInput[] = [];
  let withdrawAmount: string | undefined;

  if (parsed.recipient && parsed.amount !== undefined) {
    const amountStr = String(parsed.amount);
    outputs.push({ address: parsed.recipient, amount: amountStr });
    inputs.push({ address: parsed.sender, value: amountStr });
  }

  if (parsed.withdrawAmount !== undefined) {
    withdrawAmount = String(parsed.withdrawAmount);
  }

  const outputAmount = outputs.reduce((sum, o) => sum + BigInt(o.amount), 0n);

  return {
    outputs,
    inputs,
    outputAmount: String(outputAmount),
    withdrawAmount,
  };
}

// =============================================================================
// Main explain function
// =============================================================================

/**
 * Standalone WASM-based transaction explanation for TON.
 *
 * Parses the transaction via `parseTransaction(tx)` from @bitgo/wasm-ton,
 * then derives the transaction type, extracts outputs/inputs, and maps
 * to BitGoJS TransactionExplanation format.
 */
export function explainTonTransaction(params: ExplainTonTransactionWasmOptions): TransactionExplanation & {
  type: TransactionType;
  sender: string;
  memo?: string;
  seqno: number;
  expireTime: number;
  isSigned: boolean;
} {
  const tx = WasmTonTransaction.fromBytes(Buffer.from(params.txBase64, 'base64'));
  const parsed: WasmParsedTransaction = parseTransaction(tx);

  const type = mapTransactionType(parsed.type);
  const id = tx.id;
  const { outputs, inputs, outputAmount, withdrawAmount } = extractOutputsAndInputs(parsed);

  // Convert bigint to string at serialization boundary
  const resolvedOutputs = outputs.map((o) => ({
    address: o.address,
    amount: o.amount,
  }));

  return {
    displayOrder: ['id', 'outputs', 'outputAmount', 'changeOutputs', 'changeAmount', 'fee', 'withdrawAmount'],
    id,
    type,
    outputs: resolvedOutputs,
    outputAmount,
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: 'UNKNOWN' },
    withdrawAmount,
    sender: parsed.sender,
    memo: parsed.memo,
    seqno: parsed.seqno,
    expireTime: parsed.expireTime,
    isSigned: parsed.isSigned,
  };
}
