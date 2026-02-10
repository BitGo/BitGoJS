import { TransactionType } from '@bitgo/sdk-core';
import { DotParser, type Material, type ParseContext, type ParsedTransaction } from '@bitgo/wasm-dot';
import type { TransactionExplanation } from './iface';

/**
 * Extended explanation returned by WASM-based parsing.
 * Includes fields needed by wallet-platform that aren't in the base TransactionExplanation.
 */
export interface DotWasmExplanation extends TransactionExplanation {
  sender: string;
  nonce: number;
  isSigned: boolean;
  methodName: string;
  isTransferAll: boolean;
}

/**
 * Explain a DOT transaction from raw hex using the WASM parser.
 *
 * This is the single source of truth for parsing DOT transactions from bytes.
 * Both wallet-platform (server) and sdk-coin-dot (client) should use this function.
 *
 * @param txHex - Hex-encoded extrinsic bytes
 * @param material - Chain metadata needed for decoding
 * @param senderAddress - Optional sender address fallback (for unsigned txs that don't embed sender)
 * @returns Parsed and explained transaction
 */
export function explainTransactionFromHex(
  txHex: string,
  material: Material,
  senderAddress?: string
): DotWasmExplanation {
  const context: ParseContext = { material, sender: senderAddress };
  const parsed: ParsedTransaction = DotParser.parseTransactionHex(txHex, context);

  const sender = parsed.sender || senderAddress || '';
  const methodName = (parsed.method?.name ?? '').toLowerCase();
  const isTransferAll = methodName === 'transferall';
  const type = isTransferAll ? TransactionType.FlushCoins : TransactionType.Send;

  const outputs = (parsed.outputs || []).map((o) => ({
    address: o.address,
    amount: o.amount === 'ALL' ? '0' : o.amount,
  }));
  const outputAmount = outputs.reduce((sum, o) => sum + parseInt(o.amount || '0', 10), 0);

  return {
    displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type', 'sequenceId', 'id'],
    id: parsed.id || '',
    outputs,
    outputAmount,
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: parsed.tip?.toString() || '0', type: 'tip' },
    type,
    sender,
    nonce: parsed.nonce ?? 0,
    isSigned: parsed.isSigned ?? false,
    methodName,
    isTransferAll,
  };
}
