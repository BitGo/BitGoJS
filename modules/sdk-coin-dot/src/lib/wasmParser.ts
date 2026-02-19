import { TransactionType } from '@bitgo/sdk-core';
import {
  explainTransaction,
  TransactionType as WasmTransactionType,
  type ExplainedTransaction as WasmExplainedTransaction,
} from '@bitgo/wasm-dot';
import type { TransactionExplanation, Material } from './iface';

/**
 * Input entry for a DOT transaction.
 * For account-model chains, there's typically one input (the sender).
 */
export interface DotInput {
  address: string;
  value: number;
  valueString: string;
}

/**
 * Extended explanation returned by WASM-based parsing.
 * Includes fields needed by wallet-platform that aren't in the base TransactionExplanation.
 */
export interface DotWasmExplanation extends TransactionExplanation {
  sender: string;
  nonce: number;
  isSigned: boolean;
  methodName: string;
  inputs: DotInput[];
}

/** Map WASM TransactionType (string enum) to sdk-core TransactionType (numeric enum) via name lookup */
function mapTransactionType(wasmType: WasmTransactionType): TransactionType {
  return TransactionType[wasmType as keyof typeof TransactionType] ?? TransactionType.Send;
}

/**
 * Options for the WASM-based DOT transaction explanation adapter.
 */
export interface ExplainDotTransactionParams {
  txHex: string;
  material: Material;
  senderAddress?: string;
}

/**
 * Explain a DOT transaction using the WASM parser.
 *
 * Thin adapter over @bitgo/wasm-dot's explainTransaction that maps
 * WASM types to BitGoJS TransactionExplanation format.
 * Analogous to explainSolTransaction for Solana.
 */
export function explainDotTransaction(params: ExplainDotTransactionParams): DotWasmExplanation {
  const explained: WasmExplainedTransaction = explainTransaction(params.txHex, {
    context: { material: params.material, sender: params.senderAddress },
  });

  const sender = explained.sender || params.senderAddress || '';
  const type = mapTransactionType(explained.type);
  const methodName = `${explained.method.pallet}.${explained.method.name}`;

  // Map WASM outputs to BitGoJS format
  const outputs = explained.outputs.map((o) => ({
    address: o.address,
    amount: o.amount === 'ALL' ? '0' : o.amount,
  }));

  // Map WASM inputs to BitGoJS format (with numeric value for legacy compat)
  const inputs: DotInput[] = explained.inputs.map((i) => {
    const value = i.value === 'ALL' ? 0 : parseInt(i.value || '0', 10);
    return { address: i.address, value, valueString: i.value };
  });

  return {
    displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type', 'sequenceId', 'id'],
    id: explained.id || '',
    outputs,
    outputAmount: explained.outputAmount,
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: explained.tip || '0', type: 'tip' },
    type,
    sender,
    nonce: explained.nonce,
    isSigned: explained.isSigned,
    methodName,
    inputs,
  };
}
