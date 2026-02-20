import { TransactionType } from '@bitgo/sdk-core';
import {
  explainTransaction,
  TransactionType as WasmTransactionType,
  type ExplainedTransaction as WasmExplainedTransaction,
  type ParsedMethod,
} from '@bitgo/wasm-dot';
import type { BatchCallObject, ProxyType, TransactionExplanation, Material, TxData } from './iface';

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

/** Call WASM explainTransaction, returns the raw WASM result */
function callWasmExplain(params: {
  txHex: string;
  material: Material;
  senderAddress?: string;
  referenceBlock?: string;
  blockNumber?: number;
}): WasmExplainedTransaction {
  return explainTransaction(params.txHex, {
    context: {
      material: params.material,
      sender: params.senderAddress,
      referenceBlock: params.referenceBlock,
      blockNumber: params.blockNumber,
    },
  });
}

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
 */
export function explainDotTransaction(params: ExplainDotTransactionParams): DotWasmExplanation {
  const explained = callWasmExplain(params);

  const sender = explained.sender || params.senderAddress || '';
  const type = mapTransactionType(explained.type);
  const methodName = `${explained.method.pallet}.${explained.method.name}`;

  const outputs = explained.outputs.map((o) => ({
    address: o.address,
    amount: o.amount === 'ALL' ? '0' : o.amount,
  }));

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

// =============================================================================
// toJsonFromWasm — WASM-based replacement for toJson()
// =============================================================================

export interface ToJsonFromWasmParams {
  txHex: string;
  material: Material;
  senderAddress: string;
  coinConfigName: string;
  referenceBlock?: string;
  blockNumber?: number;
}

/**
 * Produce a TxData object using WASM parsing instead of the JS txwrapper.
 *
 * This replaces the legacy `toJson()` path for chains where WASM parsing is enabled.
 * The WASM parser decodes the extrinsic bytes (with metadata-aware signed extension handling),
 * and this function maps the result to the TxData interface that consumers expect.
 */
export function toJsonFromWasm(params: ToJsonFromWasmParams): TxData {
  const explained = callWasmExplain(params);
  const type = mapTransactionType(explained.type);
  const method = explained.method;
  const args = method.args as Record<string, unknown>;

  const result: TxData = {
    id: explained.id || '',
    sender: explained.sender || params.senderAddress,
    referenceBlock: explained.referenceBlock || '',
    blockNumber: explained.blockNumber || 0,
    genesisHash: explained.genesisHash || '',
    nonce: explained.nonce,
    specVersion: explained.specVersion || 0,
    transactionVersion: explained.transactionVersion || 0,
    chainName: explained.chainName || '',
    tip: Number(explained.tip) || 0,
    eraPeriod: explained.era.type === 'mortal' ? (explained.era as { period: number }).period : 0,
  };

  if (type === TransactionType.Send) {
    populateSendFields(result, method, args);
  } else if (type === TransactionType.StakingActivate) {
    populateStakingActivateFields(result, method, args, params.senderAddress);
  } else if (type === TransactionType.StakingUnlock) {
    result.amount = String(args.value ?? '');
  } else if (type === TransactionType.StakingWithdraw) {
    result.numSlashingSpans = String(args.numSlashingSpans ?? '0');
  } else if (type === TransactionType.StakingClaim) {
    result.validatorStash = String(args.validatorStash ?? '');
    result.claimEra = String(args.era ?? '');
  } else if (type === TransactionType.AddressInitialization) {
    populateAddressInitFields(result, method, args);
  } else if (type === TransactionType.Batch) {
    result.batchCalls = mapBatchCalls(args.calls as ParsedMethod[]);
  }

  return result;
}

function populateSendFields(result: TxData, method: ParsedMethod, args: Record<string, unknown>): void {
  const key = `${method.pallet}.${method.name}`;

  if (key === 'proxy.proxy') {
    // Proxy-wrapped transfer
    const innerCall = args.call as ParsedMethod | undefined;
    result.owner = String(args.real ?? '');
    result.forceProxyType = (args.forceProxyType as ProxyType) ?? undefined;
    if (innerCall?.args) {
      const innerArgs = innerCall.args as Record<string, unknown>;
      result.to = String(innerArgs.dest ?? '');
      result.amount = String(innerArgs.value ?? '');
    }
  } else if (key === 'balances.transferAll') {
    result.to = String(args.dest ?? '');
    result.keepAlive = Boolean(args.keepAlive);
  } else {
    // transfer, transferKeepAlive, transferAllowDeath
    result.to = String(args.dest ?? '');
    result.amount = String(args.value ?? '');
  }
}

function populateStakingActivateFields(
  result: TxData,
  method: ParsedMethod,
  args: Record<string, unknown>,
  senderAddress: string
): void {
  if (method.name === 'bondExtra') {
    result.amount = String(args.value ?? '');
  } else {
    // bond
    result.controller = senderAddress;
    result.amount = String(args.value ?? '');
    result.payee = String(args.payee ?? '');
  }
}

function populateAddressInitFields(result: TxData, method: ParsedMethod, args: Record<string, unknown>): void {
  const key = `${method.pallet}.${method.name}`;
  result.method = key;
  result.proxyType = String(args.proxy_type ?? '');
  result.delay = String(args.delay ?? '');

  if (key === 'proxy.createPure') {
    result.index = String(args.index ?? '');
  } else {
    // addProxy, removeProxy
    result.owner = String(args.delegate ?? '');
  }
}

function mapBatchCalls(calls: ParsedMethod[] | undefined): BatchCallObject[] {
  if (!calls) return [];
  return calls.map((call) => ({
    callIndex: `0x${call.palletIndex.toString(16).padStart(2, '0')}${call.methodIndex.toString(16).padStart(2, '0')}`,
    args: transformBatchCallArgs((call.args ?? {}) as Record<string, unknown>),
  }));
}

/** Transform WASM-decoded batch call args to match the Polkadot.js format that consumers expect */
function transformBatchCallArgs(args: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (key === 'delegate' && typeof value === 'string') {
      // MultiAddress Id variant: string → { id: string }
      result[key] = { id: value };
    } else if (key === 'value' && typeof value === 'string') {
      // Compact u128: string → number (matches Polkadot.js behavior)
      result[key] = Number(value);
    } else if (key === 'payee' && typeof value === 'string') {
      // Enum unit variant: "Staked" → { staked: null }
      const variantName = value.charAt(0).toLowerCase() + value.slice(1);
      result[key] = { [variantName]: null };
    } else {
      result[key] = value;
    }
  }
  return result;
}
