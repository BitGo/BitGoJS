import { ITokenEnablement } from '@bitgo/sdk-core';
import {
  explainTransaction as wasmExplainTransaction,
  type ExplainedTransaction as WasmExplainedTransaction,
} from '@bitgo/wasm-solana';
import { UNAVAILABLE_TEXT } from './constants';
import { TransactionExplanation as SolLibTransactionExplanation } from './iface';
import { findTokenName } from './instructionParamsFactory';

export interface ExplainTransactionWasmOptions {
  txBase64: string;
  feeInfo?: { fee: string };
  tokenAccountRentExemptAmount?: string;
  coinName: string;
}

/**
 * Standalone WASM-based transaction explanation — no class instance needed.
 * Thin adapter over @bitgo/wasm-solana's explainTransaction that resolves
 * token names via @bitgo/statics and maps to BitGoJS TransactionExplanation.
 */
export function explainSolTransaction(params: ExplainTransactionWasmOptions): SolLibTransactionExplanation {
  const txBytes = Buffer.from(params.txBase64, 'base64');
  const explained: WasmExplainedTransaction = wasmExplainTransaction(txBytes, {
    lamportsPerSignature: BigInt(params.feeInfo?.fee || '0'),
    tokenAccountRentExemptAmount: params.tokenAccountRentExemptAmount
      ? BigInt(params.tokenAccountRentExemptAmount)
      : undefined,
  });

  // Resolve token mint addresses → human-readable names (e.g. "tsol:usdc")
  // Convert bigint amounts to strings at this serialization boundary.
  const outputs = explained.outputs.map((o) => ({
    address: o.address,
    amount: String(o.amount),
    ...(o.tokenName ? { tokenName: findTokenName(o.tokenName, undefined, true) } : {}),
  }));

  // Build tokenEnablements with resolved token names
  const tokenEnablements: ITokenEnablement[] = explained.tokenEnablements.map((te) => ({
    address: te.address,
    tokenName: findTokenName(te.mintAddress, undefined, true),
    tokenAddress: te.mintAddress,
  }));

  return {
    displayOrder: [
      'id',
      'type',
      'blockhash',
      'durableNonce',
      'outputAmount',
      'changeAmount',
      'outputs',
      'changeOutputs',
      'tokenEnablements',
      'fee',
      'memo',
    ],
    id: explained.id ?? UNAVAILABLE_TEXT,
    type: explained.type,
    changeOutputs: [],
    changeAmount: '0',
    outputAmount: String(explained.outputAmount),
    outputs,
    fee: { fee: String(explained.fee), feeRate: Number(params.feeInfo?.fee || '0') },
    memo: explained.memo,
    blockhash: explained.blockhash,
    durableNonce: explained.durableNonce,
    tokenEnablements,
    ataOwnerMap: explained.ataOwnerMap,
  };
}
