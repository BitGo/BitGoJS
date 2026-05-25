/**
 * WASM-based DOT transaction explanation.
 *
 * Built on @bitgo/wasm-dot's parseTransaction(). Derives transaction types,
 * extracts outputs/inputs, and maps to BitGoJS TransactionExplanation format.
 * This is BitGo-specific business logic that lives outside the wasm package.
 */

import { TransactionType } from '@bitgo/sdk-core';
import { DotTransaction, parseTransaction, getProxyDepositCost, type ParsedMethod, type Era } from '@bitgo/wasm-dot';
import type { BatchCallObject, ProxyType, TransactionExplanation, Material, TxData } from './iface';

const MAX_NESTING_DEPTH = 10;

/**
 * Display-only sentinel address for staking outputs (bond, bondExtra, unbond).
 *
 * Staking extrinsics don't transfer funds to an external address. The bonded DOT
 * stays in the sender's account as "bonded balance". But the explanation format
 * requires an output address, so we use this null address (SS58 encoding of 32
 * zero bytes, substrate generic prefix 42) as a placeholder meaning "this amount
 * went to staking". Same constant used by the legacy account-lib Transaction class.
 */
const STAKING_DESTINATION = '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM';

/** Sentinel for transferAll: the actual amount is determined on-chain. */
const ALL = 'ALL';

// =============================================================================
// Public types
// =============================================================================

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

export interface ExplainDotTransactionParams {
  txHex: string;
  material: Material;
  senderAddress?: string;
}

export interface ToJsonFromWasmParams {
  txHex: string;
  material: Material;
  senderAddress: string;
  coinConfigName: string;
  referenceBlock?: string;
  blockNumber?: number;
}

// =============================================================================
// Main exports
// =============================================================================

/**
 * Explain a DOT transaction using the WASM parser.
 *
 * Parses the transaction via WASM, derives the transaction type and
 * outputs locally, then maps to BitGoJS TransactionExplanation format.
 */
export function explainDotTransaction(params: ExplainDotTransactionParams): DotWasmExplanation {
  const explained = buildExplanation(params);

  const sender = explained.sender || params.senderAddress || '';
  const methodName = `${explained.method.pallet}.${explained.method.name}`;

  // Convert bigint to string at the serialization boundary
  const outputs = explained.outputs.map((o) => ({
    address: o.address,
    amount: o.amount === ALL ? '0' : String(o.amount),
  }));

  const inputs: DotInput[] = explained.inputs.map((i) => {
    const valueStr = i.value === ALL ? ALL : String(i.value);
    const value = i.value === ALL ? 0 : Number(i.value);
    return { address: i.address, value, valueString: valueStr };
  });

  return {
    displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type', 'sequenceId', 'id'],
    id: explained.id || '',
    outputs,
    outputAmount: String(explained.outputAmount),
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: explained.tip ? String(explained.tip) : '0', type: 'tip' },
    type: explained.type,
    sender,
    nonce: explained.nonce,
    isSigned: explained.isSigned,
    methodName,
    inputs,
  };
}

/**
 * Produce a TxData object using WASM parsing instead of the JS txwrapper.
 *
 * This replaces the legacy `toJson()` path for chains where WASM parsing is enabled.
 * The WASM parser decodes the extrinsic bytes (with metadata-aware signed extension handling),
 * and this function maps the result to the TxData interface that consumers expect.
 */
export function toJsonFromWasm(params: ToJsonFromWasmParams): TxData {
  const explained = buildExplanation(params);
  const type = explained.type;
  const method = explained.method;
  const args = method.args as Record<string, unknown>;

  const result: TxData = {
    id: explained.id || '',
    sender: explained.sender || params.senderAddress,
    referenceBlock: params.referenceBlock || '',
    blockNumber: params.blockNumber || 0,
    genesisHash: params.material.genesisHash || '',
    nonce: explained.nonce,
    specVersion: params.material.specVersion || 0,
    transactionVersion: params.material.txVersion || 0,
    chainName: params.material.chainName || '',
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
    result.numSlashingSpans = Number(args.numSlashingSpans ?? 0);
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

// =============================================================================
// Core explain logic
// =============================================================================

interface InternalOutput {
  address: string;
  amount: bigint | typeof ALL;
}

interface InternalInput {
  address: string;
  value: bigint | typeof ALL;
}

interface InternalExplained {
  type: TransactionType;
  id: string | undefined;
  sender: string | undefined;
  outputs: InternalOutput[];
  inputs: InternalInput[];
  outputAmount: bigint;
  tip: bigint;
  era: Era;
  method: ParsedMethod;
  isSigned: boolean;
  nonce: number;
}

function buildExplanation(params: {
  txHex: string;
  material: Material;
  senderAddress?: string;
  referenceBlock?: string;
  blockNumber?: number;
}): InternalExplained {
  const tx = DotTransaction.fromHex(params.txHex, params.material);
  const context = {
    material: params.material,
    sender: params.senderAddress,
    referenceBlock: params.referenceBlock,
    blockNumber: params.blockNumber,
  };
  const parsed = parseTransaction(tx, context);
  const sender = parsed.sender ?? params.senderAddress;

  const analysis = analyzeMethod(parsed.method, sender, params.material.metadata);

  // Use explicit inputs from analysis if provided (e.g., unstake batch where
  // the input source is the proxy address, not the sender). Otherwise, mirror
  // outputs with sender as the default input source.
  const inputs: InternalInput[] =
    analysis.inputs ?? (sender ? analysis.outputs.map((o) => ({ address: sender, value: o.amount })) : []);

  const outputAmount = analysis.outputs.reduce((sum, o) => {
    if (o.amount === ALL) return sum;
    return sum + o.amount;
  }, 0n);

  return {
    type: analysis.type,
    id: parsed.id ?? undefined,
    sender: parsed.sender ?? undefined,
    outputs: analysis.outputs,
    inputs,
    outputAmount,
    tip: BigInt(parsed.tip || '0'),
    era: parsed.era,
    method: parsed.method,
    isSigned: parsed.isSigned,
    nonce: parsed.nonce,
  };
}

// =============================================================================
// Combined type + output analysis (single switch, single place to update)
// =============================================================================

interface MethodAnalysis {
  type: TransactionType;
  outputs: InternalOutput[];
  /** Explicit inputs, when they differ from the default (sender mirrors outputs). */
  inputs?: InternalInput[];
}

/**
 * Analyze a parsed method to determine its transaction type and extract outputs.
 *
 * This is a single switch that handles both concerns together, preventing them
 * from getting out of sync. Every case that sets a type also sets the outputs
 * for that type.
 */
function analyzeMethod(method: ParsedMethod, senderAddress?: string, metadataHex?: string): MethodAnalysis {
  return analyzeMethodInner(method, senderAddress, metadataHex, 0);
}

function analyzeMethodInner(
  method: ParsedMethod,
  senderAddress: string | undefined,
  metadataHex: string | undefined,
  depth: number
): MethodAnalysis {
  const key = `${method.pallet}.${method.name}`;
  const args = (method.args ?? {}) as Record<string, unknown>;

  switch (key) {
    // --- Transfers ---
    case 'balances.transfer':
    case 'balances.transferKeepAlive':
    case 'balances.transferAllowDeath':
      return {
        type: TransactionType.Send,
        outputs: [{ address: String(args.dest ?? ''), amount: BigInt((args.value as string) ?? '0') }],
      };

    case 'balances.transferAll':
      return {
        type: TransactionType.Send,
        outputs: [{ address: String(args.dest ?? ''), amount: ALL }],
      };

    // --- Staking ---
    case 'staking.bond':
    case 'staking.bondExtra':
      return {
        type: TransactionType.StakingActivate,
        outputs: [{ address: STAKING_DESTINATION, amount: BigInt((args.value as string) ?? '0') }],
      };

    case 'staking.unbond':
      // Empty outputs: unbond unlocks DOT (no external spend). Matches legacy Transaction class
      // behavior where decodeInputsAndOutputsForUnbond() returns []. Bond/bondExtra keep the
      // sentinel because they represent actual balance locks visible to policy evaluation.
      return { type: TransactionType.StakingUnlock, outputs: [] };

    case 'staking.withdrawUnbonded':
      return { type: TransactionType.StakingWithdraw, outputs: [] };

    case 'staking.chill':
      return { type: TransactionType.StakingUnvote, outputs: [] };

    case 'staking.payoutStakers':
      return { type: TransactionType.StakingClaim, outputs: [] };

    // --- Proxy ---
    case 'proxy.addProxy':
    case 'proxy.removeProxy':
    case 'proxy.createPure':
      return { type: TransactionType.AddressInitialization, outputs: [] };

    // --- Proxy-wrapped call ---
    case 'proxy.proxy': {
      if (depth >= MAX_NESTING_DEPTH) return { type: TransactionType.Send, outputs: [] };
      const call = args.call as ParsedMethod | undefined;
      if (call?.pallet && call?.name) return analyzeMethodInner(call, senderAddress, metadataHex, depth + 1);
      return { type: TransactionType.Send, outputs: [] };
    }

    // --- Batch ---
    case 'utility.batch':
    case 'utility.batchAll':
      return analyzeBatch(args, senderAddress, metadataHex, depth);

    default:
      return { type: TransactionType.Send, outputs: [] };
  }
}

/**
 * Analyze a batch transaction.
 *
 * Detects known proxy batch patterns (stake: bond+addProxy, unstake:
 * removeProxy+chill+unbond) and handles proxy deposit cost. For unrecognized
 * batch patterns, recursively extracts outputs from each inner call.
 */
function analyzeBatch(
  args: Record<string, unknown>,
  senderAddress: string | undefined,
  metadataHex: string | undefined,
  depth: number
): MethodAnalysis {
  const calls = (args.calls ?? []) as ParsedMethod[];
  if (calls.length === 0) return { type: TransactionType.Batch, outputs: [] };

  const callKeys = calls.map((c) => `${c.pallet}.${c.name}`);

  // Staking batch: bond + addProxy (2 calls)
  if (calls.length === 2 && callKeys[0] === 'staking.bond' && callKeys[1] === 'proxy.addProxy') {
    const bondArgs = (calls[0].args ?? {}) as Record<string, unknown>;
    const addProxyArgs = (calls[1].args ?? {}) as Record<string, unknown>;
    const bondAmount = BigInt((bondArgs.value as string) ?? '0');
    const proxyAddress = String(addProxyArgs.delegate ?? '');
    const proxyDepositCost = metadataHex ? getProxyDepositCost(metadataHex) : 0n;

    return {
      type: TransactionType.Batch,
      outputs: [
        { address: STAKING_DESTINATION, amount: bondAmount },
        { address: proxyAddress, amount: proxyDepositCost },
      ],
    };
  }

  // Unstaking batch: removeProxy + chill + unbond (3 calls)
  // Input source is the proxy address (deposit refund), not the sender.
  if (
    calls.length === 3 &&
    callKeys[0] === 'proxy.removeProxy' &&
    callKeys[1] === 'staking.chill' &&
    callKeys[2] === 'staking.unbond'
  ) {
    const removeProxyArgs = (calls[0].args ?? {}) as Record<string, unknown>;
    const proxyAddress = String(removeProxyArgs.delegate ?? '');
    const proxyDepositCost = metadataHex ? getProxyDepositCost(metadataHex) : 0n;

    const outputs = senderAddress ? [{ address: senderAddress, amount: proxyDepositCost }] : [];
    const inputs = [{ address: proxyAddress, value: proxyDepositCost }];

    return { type: TransactionType.Batch, outputs, inputs };
  }

  // Generic batch: recursively extract outputs from each inner call
  if (depth >= MAX_NESTING_DEPTH) return { type: TransactionType.Batch, outputs: [] };
  const outputs = calls
    .filter((c) => c?.pallet && c?.name)
    .flatMap((c) => analyzeMethodInner(c, senderAddress, metadataHex, depth + 1).outputs);
  return { type: TransactionType.Batch, outputs };
}

// =============================================================================
// Helpers
// =============================================================================

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
      // MultiAddress Id variant: string -> { id: string }
      result[key] = { id: value };
    } else if (key === 'value' && typeof value === 'string') {
      // Compact u128: string -> number (matches Polkadot.js behavior)
      result[key] = Number(value);
    } else if (key === 'payee' && typeof value === 'string') {
      // Enum unit variant: "Staked" -> { staked: null }
      const variantName = value.charAt(0).toLowerCase() + value.slice(1);
      result[key] = { [variantName]: null };
    } else {
      result[key] = value;
    }
  }
  return result;
}
