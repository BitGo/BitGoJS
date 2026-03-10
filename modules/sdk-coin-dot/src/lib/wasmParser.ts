/**
 * WASM-based DOT transaction parsing and explanation.
 *
 * Uses @bitgo/wasm-dot's parseTransaction() to decode extrinsics via Rust/subxt,
 * handling metadata-aware signed extension parsing that the JS txwrapper path
 * cannot handle (e.g. Westend's AuthorizeCall, StorageWeightReclaim extensions).
 *
 * Business logic for type derivation, output extraction, and format mapping
 * lives here — the WASM package only provides raw decoding.
 */

import { TransactionType } from '@bitgo/sdk-core';
import { DotTransaction, parseTransaction, getProxyDepositCost, type ParsedMethod, type Era } from '@bitgo/wasm-dot';
import type { BatchCallObject, ProxyType, TransactionExplanation, Material, TxData } from './iface';

/**
 * Sentinel address for staking outputs — SS58 encoding of 32 zero bytes with
 * the generic Substrate prefix (42). Staking calls don't transfer to an external
 * address; bonded DOT stays locked in the sender's account. This placeholder is
 * used so the explanation format can always include an output address.
 */
const STAKING_DESTINATION = '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM';

const MAX_NESTING_DEPTH = 10;

// =============================================================================
// Public types
// =============================================================================

/**
 * Single input entry for a DOT transaction.
 */
export interface DotInput {
  address: string;
  value: number;
  valueString: string;
}

/**
 * Extended explanation returned by WASM-based parsing. Includes extra fields
 * (sender, nonce, isSigned, methodName, inputs) required by consumers that
 * are not part of the base TransactionExplanation interface.
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
  /** Optional sender address — used as fallback when not recoverable from the extrinsic bytes */
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
// Public API
// =============================================================================

/**
 * Explain a DOT transaction using the WASM parser.
 *
 * Parses the raw extrinsic hex via WASM, derives the transaction type and
 * constructs inputs/outputs with BitGoJS-specific semantics (e.g. proxy
 * deposit cost for batch stake/unstake), then maps to TransactionExplanation.
 */
export function explainDotTransaction(params: ExplainDotTransactionParams): DotWasmExplanation {
  const explained = buildExplanation(params);

  const sender = explained.sender ?? params.senderAddress ?? '';
  const type = mapTransactionType(explained.typeName);
  const methodName = `${explained.method.pallet}.${explained.method.name}`;

  const outputs = explained.outputs.map((o) => ({
    address: o.address,
    amount: o.amount === 'ALL' ? '0' : o.amount,
  }));

  const inputs: DotInput[] = explained.inputs.map((i) => ({
    address: i.address,
    value: i.value === 'ALL' ? 0 : parseInt(i.value || '0', 10),
    valueString: i.value,
  }));

  return {
    displayOrder: ['outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee', 'type', 'sequenceId', 'id'],
    id: explained.id ?? '',
    outputs,
    outputAmount: explained.outputAmount,
    changeOutputs: [],
    changeAmount: '0',
    fee: { fee: explained.tip ?? '0', type: 'tip' },
    type,
    sender,
    nonce: explained.nonce,
    isSigned: explained.isSigned,
    methodName,
    inputs,
  };
}

/**
 * Produce a TxData object from a WASM-parsed extrinsic.
 *
 * Replaces the legacy toJson() path for chains where WASM parsing is active.
 * Maps WASM decode output to the TxData shape that existing consumers expect,
 * preserving field-for-field backwards compatibility.
 */
export function toJsonFromWasm(params: ToJsonFromWasmParams): TxData {
  const explained = buildExplanation(params);
  const type = mapTransactionType(explained.typeName);
  const method = explained.method;
  const args = (method.args ?? {}) as Record<string, unknown>;

  const result: TxData = {
    id: explained.id ?? '',
    sender: explained.sender ?? params.senderAddress,
    referenceBlock: params.referenceBlock ?? '',
    blockNumber: params.blockNumber ?? 0,
    genesisHash: params.material.genesisHash,
    nonce: explained.nonce,
    specVersion: params.material.specVersion,
    transactionVersion: params.material.txVersion,
    chainName: params.material.chainName,
    tip: Number(explained.tip) || 0,
    eraPeriod: explained.era.type === 'mortal' ? (explained.era as { type: 'mortal'; period: number }).period : 0,
  };

  switch (type) {
    case TransactionType.Send:
      populateSendFields(result, method, args);
      break;
    case TransactionType.StakingActivate:
      populateStakingActivateFields(result, method, args, params.senderAddress);
      break;
    case TransactionType.StakingUnlock:
      result.amount = String(args.value ?? '');
      break;
    case TransactionType.StakingWithdraw:
      result.numSlashingSpans = Number(args.numSlashingSpans ?? 0);
      break;
    case TransactionType.StakingClaim:
      result.validatorStash = String(args.validatorStash ?? '');
      result.claimEra = String(args.era ?? '');
      break;
    case TransactionType.AddressInitialization:
      populateAddressInitFields(result, method, args);
      break;
    case TransactionType.Batch:
      result.batchCalls = mapBatchCalls(args.calls as ParsedMethod[]);
      break;
  }

  return result;
}

// =============================================================================
// Core internal parse+explain
// =============================================================================

interface InternalExplained {
  typeName: string;
  id: string | null;
  sender: string | null;
  outputs: { address: string; amount: string }[];
  inputs: { address: string; value: string }[];
  outputAmount: string;
  tip: string;
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
  const parsed = parseTransaction(tx, {
    material: params.material,
    sender: params.senderAddress,
    referenceBlock: params.referenceBlock,
    blockNumber: params.blockNumber,
  });

  const typeName = deriveTransactionType(parsed.method, 0);
  const sender = parsed.sender ?? params.senderAddress ?? null;

  // Batch stake/unstake transactions report proxy deposit cost as the value,
  // not the bond/unbond amount — to match existing legacy account-lib behaviour.
  const batchInfo = detectProxyBatch(parsed.method);

  let outputs: { address: string; amount: string }[];
  let inputs: { address: string; value: string }[];

  if (batchInfo && sender) {
    const proxyDepositCost = getProxyDepositCost(params.material.metadata).toString();
    if (batchInfo.type === 'unstake') {
      // Unstaking: removeProxy + chill + unbond.
      // The proxy deposit is refunded to the sender; the unbond amount is excluded.
      outputs = [{ address: sender, amount: proxyDepositCost }];
      inputs = [{ address: batchInfo.proxyAddress, value: proxyDepositCost }];
    } else {
      // Staking: bond + addProxy.
      // Bond amount goes to staking destination; proxy deposit cost to proxy address.
      const bondAmount = extractBondAmount(parsed.method);
      outputs = [
        { address: STAKING_DESTINATION, amount: bondAmount },
        { address: batchInfo.proxyAddress, amount: proxyDepositCost },
      ];
      inputs = outputs.map((o) => ({ address: sender, value: o.amount }));
    }
  } else {
    outputs = extractOutputs(parsed.method, 0);
    inputs = sender ? outputs.map((o) => ({ address: sender, value: o.amount })) : [];
  }

  const outputAmount = outputs.reduce((acc, o) => {
    if (o.amount === 'ALL') return acc;
    return (BigInt(acc) + BigInt(o.amount)).toString();
  }, '0');

  return {
    typeName,
    id: parsed.id,
    sender: parsed.sender,
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
// Transaction type derivation
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
      const inner = args.call as ParsedMethod | undefined;
      if (inner?.pallet && inner?.name) {
        return deriveTransactionType(inner, depth + 1);
      }
      return 'Unknown';
    }

    default:
      return 'Unknown';
  }
}

// =============================================================================
// Output extraction
// =============================================================================

function extractOutputs(method: ParsedMethod, depth: number): { address: string; amount: string }[] {
  const key = `${method.pallet}.${method.name}`;
  const args = (method.args ?? {}) as Record<string, unknown>;

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
      return [{ address: STAKING_DESTINATION, amount: String(args.value ?? '0') }];

    case 'utility.batch':
    case 'utility.batchAll': {
      if (depth >= MAX_NESTING_DEPTH) return [];
      const calls = (args.calls ?? []) as ParsedMethod[];
      return calls.filter((c) => c?.pallet && c?.name).flatMap((c) => extractOutputs(c, depth + 1));
    }

    case 'proxy.proxy': {
      if (depth >= MAX_NESTING_DEPTH) return [];
      const inner = args.call as ParsedMethod | undefined;
      return inner?.pallet && inner?.name ? extractOutputs(inner, depth + 1) : [];
    }

    default:
      return [];
  }
}

// =============================================================================
// Batch proxy detection
// =============================================================================

interface ProxyBatchInfo {
  type: 'stake' | 'unstake';
  proxyAddress: string;
}

/**
 * Detect whether a batch extrinsic is a stake or unstake batch that involves
 * proxy operations. These batches use proxy deposit cost for inputs/outputs
 * rather than the bond/unbond amount, matching legacy account-lib behaviour.
 *
 * Staking batch:   bond + addProxy (2 calls)
 * Unstaking batch: removeProxy + chill + unbond (3 calls)
 */
function detectProxyBatch(method: ParsedMethod): ProxyBatchInfo | undefined {
  const key = `${method.pallet}.${method.name}`;
  if (key !== 'utility.batch' && key !== 'utility.batchAll') return undefined;

  const calls = ((method.args ?? {}) as Record<string, unknown>).calls as ParsedMethod[] | undefined;
  if (!calls || calls.length === 0) return undefined;

  const callKeys = calls.map((c) => `${c.pallet}.${c.name}`);

  if (
    calls.length === 3 &&
    callKeys[0] === 'proxy.removeProxy' &&
    callKeys[1] === 'staking.chill' &&
    callKeys[2] === 'staking.unbond'
  ) {
    const removeProxyArgs = (calls[0].args ?? {}) as Record<string, unknown>;
    return { type: 'unstake', proxyAddress: String(removeProxyArgs.delegate ?? '') };
  }

  if (calls.length === 2 && callKeys[0] === 'staking.bond' && callKeys[1] === 'proxy.addProxy') {
    const addProxyArgs = (calls[1].args ?? {}) as Record<string, unknown>;
    return { type: 'stake', proxyAddress: String(addProxyArgs.delegate ?? '') };
  }

  return undefined;
}

function extractBondAmount(method: ParsedMethod): string {
  const calls = ((method.args ?? {}) as Record<string, unknown>).calls as ParsedMethod[] | undefined;
  const bondCall = calls?.find((c) => `${c.pallet}.${c.name}` === 'staking.bond');
  if (!bondCall) return '0';
  return String(((bondCall.args ?? {}) as Record<string, unknown>).value ?? '0');
}

// =============================================================================
// TxData field populators
// =============================================================================

function mapTransactionType(typeName: string): TransactionType {
  return TransactionType[typeName as keyof typeof TransactionType] ?? TransactionType.Send;
}

function populateSendFields(result: TxData, method: ParsedMethod, args: Record<string, unknown>): void {
  const key = `${method.pallet}.${method.name}`;
  if (key === 'proxy.proxy') {
    const innerCall = args.call as ParsedMethod | undefined;
    result.owner = String(args.real ?? '');
    result.forceProxyType = (args.forceProxyType as ProxyType) ?? undefined;
    if (innerCall?.args) {
      const innerArgs = (innerCall.args ?? {}) as Record<string, unknown>;
      result.to = String(innerArgs.dest ?? '');
      result.amount = String(innerArgs.value ?? '');
    }
  } else if (key === 'balances.transferAll') {
    result.to = String(args.dest ?? '');
    result.keepAlive = Boolean(args.keepAlive);
  } else {
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

/**
 * Transform WASM-decoded call args to match the Polkadot.js format that
 * legacy consumers expect for batch call objects.
 */
function transformBatchCallArgs(args: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (key === 'delegate' && typeof value === 'string') {
      // MultiAddress Id variant: string → { id: string }
      result[key] = { id: value };
    } else if (key === 'value' && typeof value === 'string') {
      // Compact u128: string → number (matches Polkadot.js behaviour)
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
