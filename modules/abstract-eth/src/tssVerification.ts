/**
 * Fail-closed EVM TSS intent verification.
 *
 * `verifyTssTransaction` must not let a user key share sign EVM bytes unless the decoded
 * `to` / `value` / `data` match the user intent (TOB-BITGOEDMPC-2 / INFOSEC-671). The intent
 * type picks the handler; each handler accepts a closed set of decoded transaction shapes
 * and anything unmatched is a violation. Types are never derived from calldata: selectors
 * are shared across intents and `payment + data` carries arbitrary calldata.
 *
 * Violations are returned to the caller, which reports them through `console.warn` plus an
 * optional `onVerificationWarning` callback. Clients that opt into `strictTssVerification`
 * get the same violations as hard failures. Checks that already threw before this module
 * existed keep throwing in `AbstractEthLikeNewCoins.verifyTssTransaction`.
 */
import {
  DefiIntentParams,
  ITransactionRecipient,
  PopulatedIntent,
  TssVerificationMismatch,
  TssVerificationWarning,
} from '@bitgo/sdk-core';
import { coins, ContractAddressDefinedToken } from '@bitgo/statics';
import { Buffer } from 'buffer';
import { addHexPrefix, bufferToHex } from 'ethereumjs-util';
import {
  approveMethodId,
  batchMethodId,
  batchTransferFromMethodId,
  BatchTransferData,
  BatchTransferFromData,
  confidentialTransferNoProofMethodId,
  confidentialTransferNoProofTypes,
  confidentialTransferWithProofMethodId,
  confidentialTransferWithProofTypes,
  decodeBatchTransferData,
  decodeBatchTransferFromData,
  getBufferedByteCode,
  getRawDecoded,
} from './lib';

/** ERC-20 `transfer(address,uint256)` selector. */
export const erc20TransferMethodId = '0xa9059cbb';
/** Maximum ERC-20 allowance: uint256 max. */
export const MAX_UINT256 = ((1n << 256n) - 1n).toString();

/**
 * Canonical verifier intent types with a fail-closed handler. Anything outside this set
 * (staking, `*WithCallData`, `acceleration`, wrap / unwrap-native, `enableToken`,
 * `bridgeFunds`, `defiRedeem`, …) has no handler and is flagged instead of silently passing.
 */
export type EvmTssIntentType =
  | 'transfer'
  | 'transferToken'
  | 'tokenApproval'
  | 'fillNonce'
  | 'consolidate'
  | 'defiApprove'
  | 'defiDeposit'
  | 'defiWithdraw'
  | 'wrapApprove'
  | 'contractCall'
  | 'customTx';

/**
 * Stored intent types that cannot be created on EVM and must never reach signing there.
 * `contractCall` / `customTx` carry arbitrary calldata with no intent shape to verify.
 */
const UNSUPPORTED_EVM_INTENT_TYPES = new Set<EvmTssIntentType>(['contractCall', 'customTx']);

/** Stored (kebab-case) intent spellings mapped to canonical verifier types. */
const INTENT_TYPE_ALIASES: Record<string, string> = {
  payment: 'transfer',
  'transfer-token': 'transferToken',
  // `Wallet.prebuildTransactionTxRequests` switches on the lowercase spelling for token sends.
  transfertoken: 'transferToken',
  'token-approval': 'tokenApproval',
  'fill-nonce': 'fillNonce',
  'bridge-funds': 'bridgeFunds',
  'enable-token': 'enableToken',
  'custom-tx': 'customTx',
  'contract-call': 'contractCall',
  'defi-approve': 'defiApprove',
  'defi-deposit': 'defiDeposit',
  'defi-withdraw': 'defiWithdraw',
  'defi-redeem': 'defiRedeem',
  'wrap-approve': 'wrapApprove',
  'wrap-native': 'wrapNative',
  'unwrap-native': 'unwrapNative',
  'finalize-unwrap': 'finalizeUnwrap',
  'stake-with-call-data': 'stakeWithCallData',
  'unstake-with-call-data': 'unstakeWithCallData',
};

/** Transaction fields decoded from the bytes about to be signed. */
export interface DecodedEvmTx {
  to: string;
  value: string;
  data: string;
}

/** One recipient of the user intent, flattened from txParams or the stored tx request intent. */
export interface EvmTssExpectedRecipient {
  address: string;
  amount: string;
  /** Raw calldata the intent declares for this recipient (WalletConnect / dApp flows). */
  data?: string;
  tokenName?: string;
  tokenContractAddress?: string;
}

export interface EvmTssIntentContext {
  /** Canonical verifier intent type (after {@link canonicalizeEvmTssIntentType}). */
  intentType: string;
  recipients: EvmTssExpectedRecipient[];
  /** Token name declared by the caller (or, on the pending-approval path, the stored intent). */
  tokenName?: string;
  /**
   * Contract of the token the coin instance itself represents (e.g. `bitgo.coin('eth:usdc')`),
   * undefined for base coins. Locally selected: it is the asset of any payment that declares no
   * token of its own.
   */
  coinTokenContractAddress?: string;
  /** Wallet base address (`wallet.coinSpecific().baseAddress`). */
  baseAddress?: string;
  /** Network batcher contract from statics (`network.batcherContractAddress`). */
  batcherAddress?: string;
}

function kebabToCamel(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Map a declared transaction type onto the canonical verifier type. Caller-supplied
 * `txParams.type` and stored `intent.intentType` both flow through here, so kebab-case
 * stored spellings (`payment`, `defi-approve`, …) land on their canonical handlers.
 */
export function canonicalizeEvmTssIntentType(rawType?: string): string {
  if (!rawType) {
    return '';
  }
  const trimmed = rawType.trim();
  return INTENT_TYPE_ALIASES[trimmed.toLowerCase()] ?? INTENT_TYPE_ALIASES[trimmed] ?? kebabToCamel(trimmed);
}

/** True when the canonical type must never be signed on EVM chains. */
export function isUnsupportedEvmTssIntentType(canonicalType: string): boolean {
  return UNSUPPORTED_EVM_INTENT_TYPES.has(canonicalType as EvmTssIntentType);
}

function normalizeAddress(address?: string): string {
  return (address ?? '').toLowerCase();
}

function toAddressString(value: unknown): string {
  const raw = Buffer.isBuffer(value) ? bufferToHex(value as Buffer) : String(value);
  return addHexPrefix(raw).toLowerCase();
}

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return BigInt(bufferToHex(value as Buffer));
  }
  return BigInt(String(value));
}

function isEmptyCalldata(data?: string): boolean {
  return !data || data.toLowerCase() === '0x';
}

function normalizeCalldata(data?: string): string {
  return (data ?? '0x').toLowerCase();
}

function valuesEqual(a: unknown, b: unknown): boolean {
  try {
    return toBigInt(a) === toBigInt(b);
  } catch {
    return String(a) === String(b);
  }
}

function violation(
  ctx: EvmTssIntentContext,
  reason: string,
  expected: TssVerificationMismatch,
  decoded: TssVerificationMismatch
): TssVerificationWarning {
  return { intentType: ctx.intentType, reason, expected, decoded };
}

/**
 * Resolve the on-chain contract of `tokenName` from statics. Returns undefined for unknown
 * names and for coins without a contract address (native coins, known statics gaps).
 */
export function resolveTokenContractAddress(tokenName?: string): string | undefined {
  if (!tokenName) {
    return undefined;
  }
  try {
    const coin = coins.get(tokenName);
    return coin instanceof ContractAddressDefinedToken ? coin.contractAddress.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Contract of the token that `chain` itself represents (`bitgo.coin('eth:usdc')` is the USDC
 * contract). Undefined for base coins and for native coins that merely expose an ERC-20
 * interface (`isToken: false`). The coin instance is chosen locally, so it is a trusted source
 * of asset identity for payments that name no token of their own.
 */
export function resolveCoinTokenContractAddress(chain?: string): string | undefined {
  if (!chain) {
    return undefined;
  }
  try {
    const coin = coins.get(chain);
    return coin instanceof ContractAddressDefinedToken && coin.isToken ? coin.contractAddress.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** The asset a payment moves, resolved only from locally declared identity. */
type PaymentAsset = { kind: 'native' } | { kind: 'token'; contract: string } | { kind: 'unresolved'; reason: string };

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/**
 * Resolve the asset a payment is declared to move. Identity comes from the recipient's own
 * `tokenAddress` / `tokenName`, the top-level `tokenName`, and the coin instance, and nothing
 * else: the context never carries server-supplied token metadata when the caller declared its
 * own intent. No declared identity at all means native. Identity that cannot be resolved to a
 * contract, or that names two different contracts, is `unresolved`: the intended asset is
 * unknown, so no calldata shape can be accepted for it.
 */
function resolveAsset(
  ctx: EvmTssIntentContext,
  declared: { tokenName?: string; tokenContractAddress?: string }
): PaymentAsset {
  const sources: { label: string; contract: string | undefined; native?: boolean }[] = [];
  if (declared.tokenContractAddress !== undefined) {
    sources.push({
      label: `tokenAddress '${declared.tokenContractAddress}'`,
      contract: EVM_ADDRESS.test(declared.tokenContractAddress) ? declared.tokenContractAddress : undefined,
    });
  }
  for (const name of [declared.tokenName, ctx.tokenName]) {
    if (!name) {
      continue;
    }
    let staticsCoin;
    try {
      staticsCoin = coins.get(name);
    } catch {
      staticsCoin = undefined;
    }
    if (staticsCoin && !(staticsCoin instanceof ContractAddressDefinedToken && staticsCoin.isToken)) {
      // The name of a native coin (`hteth`, or a native coin that merely exposes an ERC-20
      // interface such as `celo`): the same identity as declaring no token at all.
      sources.push({ label: `coin '${name}'`, contract: undefined, native: true });
    } else {
      sources.push({ label: `token '${name}'`, contract: resolveTokenContractAddress(name) });
    }
  }
  if (ctx.coinTokenContractAddress) {
    sources.push({ label: 'the coin token', contract: ctx.coinTokenContractAddress });
  }
  const tokenSources = sources.filter((source) => !source.native);
  if (tokenSources.length === 0) {
    return { kind: 'native' };
  }
  const missing = tokenSources.find((source) => source.contract === undefined);
  if (missing) {
    return {
      kind: 'unresolved',
      reason: `${missing.label} cannot be resolved to a token contract: the intended asset cannot be verified`,
    };
  }
  const nativeSource = sources.find((source) => source.native);
  if (nativeSource) {
    return {
      kind: 'unresolved',
      reason: `${nativeSource.label} and ${tokenSources[0].label} name different assets: the intended asset is ambiguous`,
    };
  }
  const [first, ...rest] = tokenSources as { label: string; contract: string }[];
  const conflict = rest.find((source) => normalizeAddress(source.contract) !== normalizeAddress(first.contract));
  if (conflict) {
    return {
      kind: 'unresolved',
      reason: `${first.label} and ${conflict.label} name different token contracts: the intended asset is ambiguous`,
    };
  }
  return { kind: 'token', contract: first.contract };
}

type CallerDeclarableParams = { type?: string; tokenName?: string; recipients?: ITransactionRecipient[] };

/** True when the caller named a transaction type or recipients, i.e. declared its own intent. */
export function callerDeclaresIntent(callerParams?: CallerDeclarableParams): boolean {
  return !!(callerParams?.type || callerParams?.recipients?.length);
}

/**
 * Decide which source speaks for the user intent. Exactly one does:
 *
 * - The caller declared a type or recipients: the caller's own params. The stored intent is
 *   dropped entirely: it must not select the handler, add calldata, name the asset, or supply
 *   consolidation / DeFi fields.
 * - The caller declared nothing (signing a stored tx request, e.g. pending approval): the stored
 *   intent, which `resolveEffectiveTxParams` has already folded into `txParams`.
 *
 * `txParams` alone cannot answer this: with a stored `intent` present, `type` and `recipients`
 * have already been back-filled into it from server data. `callerTxParams` is the untouched
 * caller input (`undefined` when the caller supplied none). Without a stored intent `txParams`
 * is the caller input.
 */
export function selectDeclaredIntent<T extends CallerDeclarableParams>(params: {
  txParams: T;
  callerTxParams?: T;
  intent?: PopulatedIntent;
}): { callerParams?: T; storedIntent?: PopulatedIntent } {
  // `callerTxParams` is authoritative whenever the signing path supplies it. Without it, a
  // stored `intent` means the caller supplied nothing (pending approval), and without an intent
  // `txParams` is the caller input (direct `verifyTransaction` callers).
  const callerParams = params.callerTxParams ?? (params.intent ? undefined : params.txParams);
  const storedIntent = params.intent && !callerDeclaresIntent(callerParams) ? params.intent : undefined;
  return { callerParams, storedIntent };
}

/**
 * Build the handler context from the source chosen by {@link selectDeclaredIntent}: the stored
 * intent (via the effective `txParams`) when `storedIntent` is set, otherwise the caller's own
 * params. Absent local `data` stays absent and local token identity is never replaced.
 */
export function buildEvmTssIntentContext(params: {
  intentType: string;
  /** Effective params: back-filled from the stored intent when `storedIntent` is set. */
  txParams: CallerDeclarableParams;
  /** The caller's own declared params. */
  callerParams?: CallerDeclarableParams;
  /** Set only when the caller declared nothing and the stored intent speaks for the user. */
  storedIntent?: PopulatedIntent;
  coinTokenContractAddress?: string;
  baseAddress?: string;
  batcherAddress?: string;
}): EvmTssIntentContext {
  const { storedIntent } = params;
  const source = storedIntent ? params.txParams : params.callerParams;

  const recipients: EvmTssExpectedRecipient[] = (source?.recipients ?? []).map((recipient, i) => {
    const tokenContractAddress =
      recipient.tokenAddress ?? storedIntent?.recipients?.[i]?.tokenData?.tokenContractAddress;
    return {
      address: recipient.address,
      amount: String(recipient.amount),
      ...(recipient.data !== undefined && { data: recipient.data }),
      ...(recipient.tokenName !== undefined && { tokenName: recipient.tokenName }),
      ...(tokenContractAddress !== undefined && { tokenContractAddress }),
    };
  });

  return {
    intentType: params.intentType,
    recipients,
    tokenName: source?.tokenName ?? storedIntent?.tokenName,
    coinTokenContractAddress: params.coinTokenContractAddress,
    baseAddress: params.baseAddress,
    batcherAddress: params.batcherAddress,
  };
}

/**
 * Map stored DeFi intent fields onto the `defiParams` consumed by the DeFi calldata checks.
 * `shareTokenAmount` is the withdraw (share) amount; `amount` covers approve / deposit.
 */
export function mapDefiParamsFromIntent(intent: PopulatedIntent): DefiIntentParams | undefined {
  const canonicalType = canonicalizeEvmTssIntentType(intent.intentType);
  const rawAmount =
    canonicalType === 'defiWithdraw'
      ? intent.shareTokenAmount ?? intent.amount
      : intent.amount ?? intent.shareTokenAmount;
  const amount = typeof rawAmount === 'object' ? rawAmount?.value : rawAmount;
  if (amount === undefined || amount === null) {
    return undefined;
  }
  return {
    vaultId: intent.vaultId ?? '',
    amount: String(amount),
    ...(intent.operationId !== undefined && { operationId: intent.operationId }),
  };
}

/**
 * R1 — one recipient that declares raw calldata (WalletConnect / dApp): `to`, `value` and
 * `data` must each be exactly equal to the intent.
 */
function verifyExactCall(
  ctx: EvmTssIntentContext,
  tx: DecodedEvmTx,
  recipient: EvmTssExpectedRecipient
): TssVerificationWarning[] {
  const warnings: TssVerificationWarning[] = [];
  const expected = { to: recipient.address, value: recipient.amount, data: recipient.data };
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  if (normalizeAddress(tx.to) !== normalizeAddress(recipient.address)) {
    warnings.push(
      violation(ctx, 'transaction to does not match the recipient address given by the client', expected, decoded)
    );
  }
  if (!valuesEqual(tx.value, recipient.amount)) {
    warnings.push(violation(ctx, 'transaction value does not match the amount given by the client', expected, decoded));
  }
  if (normalizeCalldata(tx.data) !== normalizeCalldata(recipient.data)) {
    warnings.push(
      violation(ctx, 'transaction calldata does not match the calldata given by the client', expected, decoded)
    );
  }
  return warnings;
}

/**
 * R2 — one native recipient without calldata: `data` must be empty and `to` / `value` must
 * match the intent.
 */
function verifyNativeSend(
  ctx: EvmTssIntentContext,
  tx: DecodedEvmTx,
  recipient: EvmTssExpectedRecipient
): TssVerificationWarning[] {
  const warnings: TssVerificationWarning[] = [];
  const expected = { to: recipient.address, value: recipient.amount, data: '0x' };
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  if (normalizeAddress(tx.to) !== normalizeAddress(recipient.address)) {
    warnings.push(violation(ctx, 'destination address does not match with the recipient address', expected, decoded));
  }
  if (!valuesEqual(tx.value, recipient.amount)) {
    warnings.push(
      violation(ctx, 'the transaction amount in txPrebuild does not match the value given by client', expected, decoded)
    );
  }
  return warnings;
}

/**
 * R3 — one ERC-20 recipient: `to` must be the token contract, `value` must be zero and the
 * decoded `transfer(address,uint256)` recipient and amount must match the intent.
 * ERC-7984 `confidentialTransfer` (`0x5bebed7e` / `0x2fb74e62`) is checked on the recipient
 * only, since the amount is encrypted.
 */
function verifyTokenTransfer(
  ctx: EvmTssIntentContext,
  tx: DecodedEvmTx,
  recipient: EvmTssExpectedRecipient,
  tokenContract: string
): TssVerificationWarning[] {
  const warnings: TssVerificationWarning[] = [];
  const data = normalizeCalldata(tx.data);
  const selector = data.slice(0, 10);
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  const expected = { to: tokenContract, value: '0', data: recipient.data };

  if (!valuesEqual(tx.value, '0')) {
    warnings.push(violation(ctx, 'token transfer must not carry native value', expected, decoded));
  }

  if (normalizeAddress(tx.to) !== normalizeAddress(tokenContract)) {
    warnings.push(violation(ctx, 'transaction to is not the intent token contract', expected, decoded));
  }

  if (selector === erc20TransferMethodId) {
    let decodedRecipient: string;
    let decodedAmount: bigint;
    try {
      const [innerRecipient, innerAmount] = getRawDecoded(
        ['address', 'uint256'],
        getBufferedByteCode(erc20TransferMethodId, tx.data)
      );
      decodedRecipient = toAddressString(innerRecipient);
      decodedAmount = toBigInt(innerAmount);
    } catch (e) {
      warnings.push(
        violation(ctx, `ERC-20 transfer calldata could not be decoded: ${(e as Error).message}`, expected, decoded)
      );
      return warnings;
    }
    if (decodedRecipient !== normalizeAddress(recipient.address)) {
      warnings.push(
        violation(
          ctx,
          'destination address does not match with the recipient address',
          { ...expected, to: recipient.address, value: recipient.amount },
          { ...decoded, to: addHexPrefix(decodedRecipient), value: decodedAmount.toString() }
        )
      );
    }
    if (!valuesEqual(decodedAmount, recipient.amount)) {
      warnings.push(
        violation(
          ctx,
          'the transaction amount in txPrebuild does not match the value given by client',
          { ...expected, to: recipient.address, value: recipient.amount },
          { ...decoded, to: addHexPrefix(decodedRecipient), value: decodedAmount.toString() }
        )
      );
    }
    return warnings;
  }

  if (selector === confidentialTransferNoProofMethodId || selector === confidentialTransferWithProofMethodId) {
    const types =
      selector === confidentialTransferNoProofMethodId
        ? confidentialTransferNoProofTypes
        : confidentialTransferWithProofTypes;
    let decodedRecipient: string;
    try {
      const [innerRecipient] = getRawDecoded(types, getBufferedByteCode(selector, tx.data));
      decodedRecipient = toAddressString(innerRecipient);
    } catch (e) {
      warnings.push(
        violation(ctx, `confidentialTransfer calldata could not be decoded: ${(e as Error).message}`, expected, decoded)
      );
      return warnings;
    }
    if (decodedRecipient !== normalizeAddress(recipient.address)) {
      warnings.push(
        violation(
          ctx,
          'confidentialTransfer recipient does not match the recipient address given by the client',
          { ...expected, to: recipient.address },
          { ...decoded, to: addHexPrefix(decodedRecipient) }
        )
      );
    }
    return warnings;
  }

  warnings.push(
    violation(
      ctx,
      'token transfer must use ERC-20 transfer(address,uint256) or ERC-7984 confidentialTransfer calldata',
      expected,
      decoded
    )
  );
  return warnings;
}

/**
 * R4 — more than one recipient: `to` must be the network batcher contract and the decoded
 * batch arrays must match the intent 1:1. Native `batch(address[],uint256[])` carries
 * `value` = the sum of amounts; token `batchTransferFrom(address,address[],uint256[])`
 * names the intent token contract and carries `value` = 0.
 */
function verifyBatch(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssVerificationWarning[] {
  const warnings: TssVerificationWarning[] = [];
  const data = normalizeCalldata(tx.data);
  const selector = data.slice(0, 10);
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  const expectedTotal = ctx.recipients.reduce((sum, r) => sum + toBigInt(r.amount), 0n).toString();
  const expected = { to: ctx.batcherAddress, value: expectedTotal, data: undefined };

  if (!ctx.batcherAddress) {
    warnings.push(
      violation(
        ctx,
        'no batcher contract address is configured for this network; batch payment cannot be verified',
        expected,
        decoded
      )
    );
    return warnings;
  }
  if (normalizeAddress(tx.to) !== normalizeAddress(ctx.batcherAddress)) {
    warnings.push(
      violation(ctx, 'batch transaction to does not match the network batcher contract', expected, decoded)
    );
  }
  const assets = ctx.recipients.map((recipient) => resolveAsset(ctx, recipient));
  const unresolvedAsset = assets.find((asset) => asset.kind === 'unresolved');
  if (unresolvedAsset?.kind === 'unresolved') {
    warnings.push(violation(ctx, `batch payment: ${unresolvedAsset.reason}`, expected, decoded));
    return warnings;
  }
  const batchAsset = assets[0];
  const mixedAssets = assets.some(
    (asset) =>
      asset.kind !== batchAsset.kind ||
      (asset.kind === 'token' &&
        batchAsset.kind === 'token' &&
        normalizeAddress(asset.contract) !== normalizeAddress(batchAsset.contract))
  );
  if (mixedAssets) {
    warnings.push(
      violation(
        ctx,
        'batch payment recipients declare more than one asset: cannot verify one batch call',
        expected,
        decoded
      )
    );
    return warnings;
  }

  const compareRecipients = (
    recipients: { address: string; amount: string }[],
    valueExpected: string,
    valueReason: string
  ): void => {
    if (recipients.length !== ctx.recipients.length) {
      warnings.push(
        violation(
          ctx,
          `batch calldata recipient count (${recipients.length}) does not match intent recipients (${ctx.recipients.length})`,
          expected,
          decoded
        )
      );
      return;
    }
    for (let i = 0; i < recipients.length; i++) {
      const want = ctx.recipients[i];
      const got = recipients[i];
      if (normalizeAddress(got.address) !== normalizeAddress(want.address) || !valuesEqual(got.amount, want.amount)) {
        warnings.push(
          violation(
            ctx,
            `batch calldata entry ${i} does not match intent recipient`,
            { ...expected, to: want.address, value: want.amount },
            { ...decoded, to: got.address, value: got.amount }
          )
        );
      }
    }
    if (!valuesEqual(tx.value, valueExpected)) {
      warnings.push(violation(ctx, valueReason, { ...expected, value: valueExpected }, decoded));
    }
  };

  if (selector === batchMethodId) {
    if (batchAsset.kind !== 'native') {
      warnings.push(
        violation(
          ctx,
          'token batch payment must use batchTransferFrom(address,address[],uint256[]), not native batch(address[],uint256[])',
          expected,
          decoded
        )
      );
      return warnings;
    }
    let batch: BatchTransferData;
    try {
      batch = decodeBatchTransferData(tx.data);
    } catch (e) {
      warnings.push(violation(ctx, `batch calldata could not be decoded: ${(e as Error).message}`, expected, decoded));
      return warnings;
    }
    compareRecipients(
      batch.recipients,
      expectedTotal,
      'batch transaction value does not match the sum of intent amounts'
    );
    return warnings;
  }

  if (selector === batchTransferFromMethodId) {
    if (batchAsset.kind !== 'token') {
      warnings.push(
        violation(
          ctx,
          'native batch payment must use batch(address[],uint256[]), not batchTransferFrom(address,address[],uint256[])',
          expected,
          decoded
        )
      );
      return warnings;
    }
    let batch: BatchTransferFromData;
    try {
      batch = decodeBatchTransferFromData(tx.data);
    } catch (e) {
      warnings.push(
        violation(ctx, `batchTransferFrom calldata could not be decoded: ${(e as Error).message}`, expected, decoded)
      );
      return warnings;
    }
    if (normalizeAddress(batch.tokenContractAddress) !== normalizeAddress(batchAsset.contract)) {
      warnings.push(
        violation(
          ctx,
          'batchTransferFrom token contract does not match the intent token contract',
          { ...expected, to: batchAsset.contract },
          { ...decoded, to: batch.tokenContractAddress }
        )
      );
    }
    compareRecipients(batch.recipients, '0', 'token batch transaction must not carry native value');
    return warnings;
  }

  warnings.push(
    violation(
      ctx,
      'batch payment must use batch(address[],uint256[]) or batchTransferFrom(address,address[],uint256[]) calldata',
      expected,
      decoded
    )
  );
  return warnings;
}

/** Payment handler (`transfer` / `payment`) — rules R1–R5. */
function verifyPayment(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssVerificationWarning[] {
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  if (ctx.recipients.length === 0) {
    return [
      violation(
        ctx,
        'payment intent has no recipients: the transaction bytes cannot be verified against intent',
        {},
        decoded
      ),
    ];
  }
  if (ctx.recipients.length > 1) {
    return verifyBatch(ctx, tx);
  }
  const recipient = ctx.recipients[0];
  if (recipient.data !== undefined) {
    return verifyExactCall(ctx, tx, recipient);
  }
  const asset = resolveAsset(ctx, recipient);
  if (asset.kind === 'unresolved') {
    return [violation(ctx, `payment ${asset.reason}`, { to: recipient.address, value: recipient.amount }, decoded)];
  }
  const selector = normalizeCalldata(tx.data).slice(0, 10);
  const isTokenShape =
    selector === erc20TransferMethodId ||
    selector === confidentialTransferNoProofMethodId ||
    selector === confidentialTransferWithProofMethodId;
  const isBatchShape = selector === batchMethodId || selector === batchTransferFromMethodId;
  if (asset.kind === 'native') {
    if (isEmptyCalldata(tx.data)) {
      return verifyNativeSend(ctx, tx, recipient);
    }
    if (isTokenShape || isBatchShape) {
      return [
        violation(
          ctx,
          'payment intent declares a native asset but the transaction carries token or batch calldata',
          { to: recipient.address, value: recipient.amount, data: '0x' },
          decoded
        ),
      ];
    }
  } else {
    if (isEmptyCalldata(tx.data)) {
      return [
        violation(
          ctx,
          'token payment intent but the transaction is a native send: expected ERC-20 transfer calldata',
          { to: asset.contract, value: '0', data: undefined },
          decoded
        ),
      ];
    }
    if (isTokenShape) {
      return verifyTokenTransfer(ctx, tx, recipient, asset.contract);
    }
    if (isBatchShape) {
      return [
        violation(
          ctx,
          'batch calldata cannot be verified against a single declared recipient',
          { to: recipient.address, value: recipient.amount },
          decoded
        ),
      ];
    }
  }
  // R5 — anything else (e.g. `approve(attacker, MAX)` disguised as a payment) is a violation.
  return [
    violation(
      ctx,
      'payment intent calldata is not a recognized payment shape (native send, ERC-20 transfer, ' +
        'ERC-7984 confidentialTransfer, or batch): refusing to treat it as a payment',
      { to: recipient.address, value: recipient.amount, data: '0x' },
      decoded
    ),
  ];
}

/** `transferToken` handler — same shape set as R3, exactly one recipient, which must move a token. */
function verifyTransferToken(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssVerificationWarning[] {
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  if (ctx.recipients.length !== 1) {
    return [
      violation(
        ctx,
        `transferToken intent must declare exactly one token recipient (found ${ctx.recipients.length})`,
        {},
        decoded
      ),
    ];
  }
  const recipient = ctx.recipients[0];
  const asset = resolveAsset(ctx, recipient);
  if (asset.kind === 'unresolved') {
    return [
      violation(ctx, `transferToken ${asset.reason}`, { to: recipient.address, value: recipient.amount }, decoded),
    ];
  }
  if (asset.kind === 'native') {
    return [
      violation(
        ctx,
        'transferToken intent names no token: the intended asset cannot be verified',
        { to: recipient.address, value: recipient.amount },
        decoded
      ),
    ];
  }
  if (isEmptyCalldata(tx.data)) {
    return [
      violation(
        ctx,
        'transferToken transaction must use ERC-20 transfer(address,uint256) calldata; expected token calldata, got an empty data payload',
        { to: asset.contract, value: '0' },
        decoded
      ),
    ];
  }
  return verifyTokenTransfer(ctx, tx, recipient, asset.contract);
}

/**
 * `tokenApproval` handler — `to` must be the token contract and the calldata must be
 * `approve(spender = batcher, MAX)`, with `value` = 0. Guards against a substituted
 * `approve(attacker, MAX_UINT256)`.
 */
function verifyTokenApproval(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssVerificationWarning[] {
  const warnings: TssVerificationWarning[] = [];
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  const asset = resolveAsset(ctx, {});
  const tokenContract = asset.kind === 'token' ? asset.contract : undefined;
  const expected = { to: tokenContract, value: '0', data: undefined };

  if (!valuesEqual(tx.value, '0')) {
    warnings.push(violation(ctx, 'tokenApproval transaction must not carry native value', expected, decoded));
  }
  if (!tokenContract) {
    warnings.push(
      violation(
        ctx,
        asset.kind === 'unresolved'
          ? `tokenApproval ${asset.reason}`
          : `tokenApproval intent names no token contract that can be resolved from statics ('${
              ctx.tokenName ?? ''
            }'); transaction to cannot be verified`,
        expected,
        decoded
      )
    );
  } else if (normalizeAddress(tx.to) !== normalizeAddress(tokenContract)) {
    warnings.push(violation(ctx, 'tokenApproval transaction to is not the intent token contract', expected, decoded));
  }

  let spender: string;
  let amount: string;
  try {
    const decodedApprove = decodeApproveCalldataStrict(tx.data);
    spender = decodedApprove.spender;
    amount = decodedApprove.amount;
  } catch (e) {
    warnings.push(
      violation(
        ctx,
        `tokenApproval transaction must use ERC-20 approve(address,uint256) calldata: ${(e as Error).message}`,
        expected,
        decoded
      )
    );
    return warnings;
  }

  if (!ctx.batcherAddress) {
    warnings.push(
      violation(
        ctx,
        'no batcher contract address is configured for this network; tokenApproval spender cannot be verified',
        expected,
        { ...decoded, to: spender, value: amount }
      )
    );
  } else if (normalizeAddress(spender) !== normalizeAddress(ctx.batcherAddress)) {
    warnings.push(
      violation(
        ctx,
        'tokenApproval spender is not the network batcher contract',
        { ...expected, to: ctx.batcherAddress },
        { ...decoded, to: spender, value: amount }
      )
    );
  }
  if (!valuesEqual(amount, MAX_UINT256)) {
    warnings.push(
      violation(
        ctx,
        'tokenApproval amount is not the maximum ERC-20 allowance',
        { ...expected, value: MAX_UINT256 },
        { ...decoded, to: spender, value: amount }
      )
    );
  }
  return warnings;
}

/** `fillNonce` handler — a 1-wei self-send to the wallet base address. */
function verifyFillNonce(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssVerificationWarning[] {
  const warnings: TssVerificationWarning[] = [];
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  const expected = { to: ctx.baseAddress, value: '1', data: '0x' };
  if (!ctx.baseAddress) {
    warnings.push(violation(ctx, 'fillNonce intent has no wallet base address to verify against', expected, decoded));
    return warnings;
  }
  if (normalizeAddress(tx.to) !== normalizeAddress(ctx.baseAddress)) {
    warnings.push(violation(ctx, 'fillNonce transaction must send to the wallet base address', expected, decoded));
  }
  if (!valuesEqual(tx.value, '1')) {
    warnings.push(violation(ctx, 'fillNonce transaction must send exactly 1 wei', expected, decoded));
  }
  if (!isEmptyCalldata(tx.data)) {
    warnings.push(violation(ctx, 'fillNonce transaction must not carry calldata', expected, decoded));
  }
  return warnings;
}

function unhandledTypeViolation(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssVerificationWarning {
  return violation(
    ctx,
    `no fail-closed verifier for intent type '${ctx.intentType}': transaction bytes were not compared against intent`,
    {},
    { to: tx.to, value: tx.value, data: tx.data }
  );
}

function decodeApproveCalldataStrict(data: string): { spender: string; amount: string } {
  // Mirrors decodeApproveCalldata but tolerates trailing bytes the way ERC-20s do — the
  // spender and amount are still read strictly from the two ABI words after the selector.
  const normalized = normalizeCalldata(data);
  if (!normalized.startsWith(approveMethodId.toLowerCase())) {
    throw new Error(`expected approve selector ${approveMethodId}, got ${normalized.slice(0, 10)}`);
  }
  if (normalized.length < 2 + 8 + 2 * 64) {
    throw new Error('approve calldata is truncated');
  }
  const [spender, amount] = getRawDecoded(['address', 'uint256'], getBufferedByteCode(approveMethodId, data));
  return { spender: toAddressString(spender), amount: toBigInt(amount).toString() };
}

/**
 * Evaluate the decoded transaction against the intent. Returns every violated rule for the
 * canonical intent type; an empty array means the bytes match the closed set of accepted
 * shapes for that type.
 */
export function evaluateEvmTssIntent(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssVerificationWarning[] {
  switch (ctx.intentType) {
    case 'transfer':
      return verifyPayment(ctx, tx);
    case 'transferToken':
      return verifyTransferToken(ctx, tx);
    case 'tokenApproval':
      return verifyTokenApproval(ctx, tx);
    case 'fillNonce':
      return verifyFillNonce(ctx, tx);
    case 'consolidate':
      // The base-address check in verifyTssTransaction is the handler for consolidations.
      return [];
    case 'defiApprove':
    case 'defiDeposit':
    case 'defiWithdraw':
    case 'wrapApprove':
      // Dedicated fail-closed calldata checks in verifyTssTransaction handle these.
      return [];
    default:
      return [unhandledTypeViolation(ctx, tx)];
  }
}
