import { ITokenEnablement } from '@bitgo/sdk-core';
import {
  explainTransaction as wasmExplainTransaction,
  type ExplainedTransaction as WasmExplainedTransaction,
  type StakingAuthorizeInfo,
} from '@bitgo/wasm-solana';
import { UNAVAILABLE_TEXT } from './constants';
import { StakingAuthorizeParams, TransactionExplanation as SolLibTransactionExplanation } from './iface';
import { findTokenName } from './instructionParamsFactory';

export interface ExplainTransactionWasmOptions {
  txBase64: string;
  feeInfo?: { fee: string };
  tokenAccountRentExemptAmount?: string;
  coinName: string;
}

/**
 * Map WASM staking authorize info to the legacy BitGoJS shape.
 * Legacy uses different field names for Staker vs Withdrawer authority changes.
 */
function mapStakingAuthorize(info: StakingAuthorizeInfo): StakingAuthorizeParams {
  if (info.authorizeType === 'Withdrawer') {
    return {
      stakingAddress: info.stakingAddress,
      oldWithdrawAddress: info.oldAuthorizeAddress,
      newWithdrawAddress: info.newAuthorizeAddress,
      custodianAddress: info.custodianAddress,
    };
  }
  // Staker authority change
  return {
    stakingAddress: info.stakingAddress,
    oldWithdrawAddress: '',
    newWithdrawAddress: '',
    oldStakingAuthorityAddress: info.oldAuthorizeAddress,
    newStakingAuthorityAddress: info.newAuthorizeAddress,
  };
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

  const inputs = explained.inputs.map((i) => ({
    address: i.address,
    value: String(i.value),
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
    // WASM returns "StakingAuthorize" but when deserializing from bytes, BitGoJS
    // always treats these as "StakingAuthorizeRaw" (the non-raw type only exists during building).
    type: explained.type === 'StakingAuthorize' ? 'StakingAuthorizeRaw' : explained.type,
    changeOutputs: [],
    changeAmount: '0',
    outputAmount: String(explained.outputAmount),
    outputs,
    inputs,
    feePayer: explained.feePayer,
    fee: {
      fee: params.feeInfo ? String(explained.fee) : '0',
      feeRate: params.feeInfo ? Number(params.feeInfo.fee) : undefined,
    },
    memo: explained.memo,
    blockhash: explained.blockhash,
    durableNonce: explained.durableNonce,
    tokenEnablements,
    ataOwnerMap: explained.ataOwnerMap,
    ...(explained.stakingAuthorize ? { stakingAuthorize: mapStakingAuthorize(explained.stakingAuthorize) } : {}),
  };
}
