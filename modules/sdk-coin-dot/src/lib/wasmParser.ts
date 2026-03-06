/**
 * WASM-based DOT transaction explanation.
 *
 * Built on @bitgo/wasm-dot's parseTransaction(). Derives transaction types,
 * extracts outputs/inputs, and maps to BitGoJS TransactionExplanation format.
 * This is BitGo-specific business logic that lives outside the wasm package.
 */

import { TransactionType } from '@bitgo/sdk-core';
import { DotTransaction, parseTransaction, type ParsedMethod, type Era } from '@bitgo/wasm-dot';
import type { BatchCallObject, ProxyType, TransactionExplanation, Material, TxData } from './iface';

const MAX_NESTING_DEPTH = 10;

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
  const type = mapTransactionType(explained.typeName);
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

/**
 * Produce a TxData object using WASM parsing instead of the JS txwrapper.
 *
 * This replaces the legacy `toJson()` path for chains where WASM parsing is enabled.
 * The WASM parser decodes the extrinsic bytes (with metadata-aware signed extension handling),
 * and this function maps the result to the TxData interface that consumers expect.
 */
export function toJsonFromWasm(params: ToJsonFromWasmParams): TxData {
  const explained = buildExplanation(params);
  const type = mapTransactionType(explained.typeName);
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
// Core explain logic (moved from @bitgo/wasm-dot)
// =============================================================================

interface InternalExplained {
  typeName: string;
  id: string | undefined;
  sender: string | undefined;
  outputs: { address: string; amount: string }[];
  inputs: { address: string; value: string }[];
  outputAmount: string;
  tip: string;
  era: Era;
  method: ParsedMethod;
  isSigned: boolean;
  nonce: number;
}

/** Parse and explain a DOT transaction. Replaces the old wasm-dot explainTransaction. */
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

  const typeName = deriveTransactionType(parsed.method, 0);
  const outputs = extractOutputs(parsed.method, 0);
  const sender = parsed.sender ?? params.senderAddress;
  const inputs: { address: string; value: string }[] = sender
    ? outputs.map((o) => ({ address: sender, value: o.amount }))
    : [];

  const outputAmount = outputs.reduce((sum, o) => {
    if (o.amount === 'ALL') return sum;
    return (BigInt(sum) + BigInt(o.amount)).toString();
  }, '0');

  return {
    typeName,
    id: parsed.id ?? undefined,
    sender: parsed.sender ?? undefined,
    outputs,
    inputs,
    outputAmount,
    tip: parsed.tip,
    era: parsed.era,
    method: parsed.method,
    isSigned: parsed.isSigned,
    nonce: parsed.nonce,
  };
}

// =============================================================================
// Transaction type derivation (moved from @bitgo/wasm-dot)
// =============================================================================

function deriveTransactionType(method: ParsedMethod, depth: number): string {
  const key = `${method.pallet}.${method.name}`;
  const args = (method.args ?? {}) as Record<string, unknown>;
  switch (key) {
    case 'balances.transfer':
    case 'balances.transferKeepAlive':
    case 'balances.transferAllowDeath':
    case 'balances.transferAll':
      return 'Send';

    case 'staking.bond':
    case 'staking.bondExtra':
      return 'StakingActivate';

    case 'staking.unbond':
      return 'StakingUnlock';

    case 'staking.withdrawUnbonded':
      return 'StakingWithdraw';

    case 'staking.chill':
      return 'StakingUnvote';

    case 'staking.payoutStakers':
      return 'StakingClaim';

    case 'proxy.addProxy':
    case 'proxy.removeProxy':
    case 'proxy.createPure':
      return 'AddressInitialization';

    case 'utility.batch':
    case 'utility.batchAll':
      return 'Batch';

    case 'proxy.proxy': {
      if (depth >= MAX_NESTING_DEPTH) return 'Unknown';
      const call = args.call as ParsedMethod | undefined;
      if (call?.pallet && call?.name) return deriveTransactionType(call, depth + 1);
      return 'Unknown';
    }

    default:
      return 'Unknown';
  }
}

// =============================================================================
// Output extraction (moved from @bitgo/wasm-dot)
// =============================================================================

function extractOutputs(method: ParsedMethod, depth: number): { address: string; amount: string }[] {
  const args = (method.args ?? {}) as Record<string, unknown>;
  const key = `${method.pallet}.${method.name}`;

  switch (key) {
    case 'balances.transfer':
    case 'balances.transferKeepAlive':
    case 'balances.transferAllowDeath':
      return [{ address: String(args.dest ?? ''), amount: String(args.value ?? '0') }];

    case 'balances.transferAll':
      return [{ address: String(args.dest ?? ''), amount: 'ALL' }];

    case 'staking.bond':
    case 'staking.bondExtra':
    case 'staking.unbond':
      return [{ address: 'STAKING', amount: String(args.value ?? '0') }];

    case 'utility.batch':
    case 'utility.batchAll': {
      if (depth >= MAX_NESTING_DEPTH) return [];
      const calls = (args.calls ?? []) as ParsedMethod[];
      return calls.filter((c) => c?.pallet && c?.name).flatMap((c) => extractOutputs(c, depth + 1));
    }

    case 'proxy.proxy': {
      if (depth >= MAX_NESTING_DEPTH) return [];
      const call = args.call as ParsedMethod | undefined;
      return call?.pallet && call?.name ? extractOutputs(call, depth + 1) : [];
    }

    default:
      return [];
  }
}

// =============================================================================
// Helpers
// =============================================================================

/** Map type name string to sdk-core TransactionType via name lookup */
function mapTransactionType(typeName: string): TransactionType {
  return TransactionType[typeName as keyof typeof TransactionType] ?? TransactionType.Send;
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
