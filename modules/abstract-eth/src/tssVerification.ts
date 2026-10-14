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
  /** Token name from the stored intent or txParams (token sends / tokenApproval). */
  tokenName?: string;
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
 * Build the handler context from the caller txParams and the optional stored tx request
 * intent. Recipient precedence mirrors `resolveEffectiveTxParams`: explicit txParams
 * recipients win, intent recipients fill in, and intent-only token fields are merged.
 */
export function buildEvmTssIntentContext(params: {
  intentType: string;
  txParams: { tokenName?: string; recipients?: ITransactionRecipient[] };
  intent?: PopulatedIntent;
  baseAddress?: string;
  batcherAddress?: string;
}): EvmTssIntentContext {
  const { intent, txParams } = params;
  const intentRecipients: EvmTssExpectedRecipient[] | undefined = intent?.recipients?.map((recipient) => ({
    address: recipient.address.address,
    amount: String(recipient.amount.value),
    ...(recipient.data !== undefined && { data: recipient.data }),
    ...(recipient.tokenData?.tokenName !== undefined && { tokenName: recipient.tokenData.tokenName }),
    ...(recipient.tokenData?.tokenContractAddress !== undefined && {
      tokenContractAddress: recipient.tokenData.tokenContractAddress,
    }),
  }));
  const paramsRecipients: EvmTssExpectedRecipient[] | undefined = txParams.recipients?.map((recipient) => ({
    address: recipient.address,
    amount: String(recipient.amount),
    ...(recipient.data !== undefined && { data: recipient.data }),
    ...(recipient.tokenName !== undefined && { tokenName: recipient.tokenName }),
    ...(recipient.tokenAddress !== undefined && { tokenContractAddress: recipient.tokenAddress }),
  }));

  const primary = paramsRecipients?.length ? paramsRecipients : intentRecipients ?? [];
  const secondary = paramsRecipients?.length ? intentRecipients ?? [] : [];
  const recipients = primary.map((recipient, i) => {
    const extra = secondary[i];
    if (!extra) {
      return recipient;
    }
    return {
      ...recipient,
      ...(recipient.data === undefined && extra.data !== undefined && { data: extra.data }),
      ...(recipient.tokenName === undefined && extra.tokenName !== undefined && { tokenName: extra.tokenName }),
      ...(recipient.tokenContractAddress === undefined &&
        extra.tokenContractAddress !== undefined && { tokenContractAddress: extra.tokenContractAddress }),
    };
  });

  return {
    intentType: params.intentType,
    recipients,
    tokenName: intent?.tokenName ?? txParams.tokenName,
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

function tokenContractForRecipient(ctx: EvmTssIntentContext, recipient: EvmTssExpectedRecipient): string | undefined {
  return (
    recipient.tokenContractAddress ?? resolveTokenContractAddress(recipient.tokenName ?? ctx.tokenName) ?? undefined
  );
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
  if (recipient.tokenName || recipient.tokenContractAddress) {
    warnings.push(
      violation(
        ctx,
        'token recipient cannot be verified against a native transfer: intent declares a token',
        expected,
        decoded
      )
    );
    return warnings;
  }
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
  recipient: EvmTssExpectedRecipient
): TssVerificationWarning[] {
  const warnings: TssVerificationWarning[] = [];
  const data = normalizeCalldata(tx.data);
  const selector = data.slice(0, 10);
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  const expected = { to: recipient.tokenContractAddress, value: '0', data: recipient.data };

  if (!valuesEqual(tx.value, '0')) {
    warnings.push(violation(ctx, 'token transfer must not carry native value', expected, decoded));
  }

  const tokenContract = tokenContractForRecipient(ctx, recipient);
  if (tokenContract && normalizeAddress(tx.to) !== normalizeAddress(tokenContract)) {
    warnings.push(
      violation(ctx, 'transaction to is not the intent token contract', { ...expected, to: tokenContract }, decoded)
    );
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
    let batch: BatchTransferFromData;
    try {
      batch = decodeBatchTransferFromData(tx.data);
    } catch (e) {
      warnings.push(
        violation(ctx, `batchTransferFrom calldata could not be decoded: ${(e as Error).message}`, expected, decoded)
      );
      return warnings;
    }
    const tokenContract = resolveTokenContractAddress(
      ctx.recipients.find((r) => r.tokenName)?.tokenName ?? ctx.tokenName
    );
    if (tokenContract && normalizeAddress(batch.tokenContractAddress) !== normalizeAddress(tokenContract)) {
      warnings.push(
        violation(
          ctx,
          'batchTransferFrom token contract does not match the intent token contract',
          { ...expected, to: tokenContract },
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
  if (isEmptyCalldata(tx.data)) {
    return verifyNativeSend(ctx, tx, recipient);
  }
  const selector = normalizeCalldata(tx.data).slice(0, 10);
  if (selector === erc20TransferMethodId) {
    return verifyTokenTransfer(ctx, tx, recipient);
  }
  if (selector === confidentialTransferNoProofMethodId || selector === confidentialTransferWithProofMethodId) {
    return verifyTokenTransfer(ctx, tx, recipient);
  }
  if (selector === batchMethodId || selector === batchTransferFromMethodId) {
    return [
      violation(
        ctx,
        'batch calldata cannot be verified against a single declared recipient',
        { to: recipient.address, value: recipient.amount },
        decoded
      ),
    ];
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

/** `transferToken` handler — same shape set as R3, exactly one token recipient. */
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
  if (isEmptyCalldata(tx.data)) {
    return [
      violation(
        ctx,
        'transferToken transaction must use ERC-20 transfer(address,uint256) calldata; expected token calldata, got an empty data payload',
        { to: recipient.address, value: recipient.amount },
        decoded
      ),
    ];
  }
  return verifyTokenTransfer(ctx, tx, recipient);
}

/**
 * `tokenApproval` handler — `to` must be the token contract and the calldata must be
 * `approve(spender = batcher, MAX)`, with `value` = 0. Guards against a substituted
 * `approve(attacker, MAX_UINT256)`.
 */
function verifyTokenApproval(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssVerificationWarning[] {
  const warnings: TssVerificationWarning[] = [];
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  const tokenContract = resolveTokenContractAddress(ctx.tokenName);
  const expected = { to: tokenContract, value: '0', data: undefined };

  if (!valuesEqual(tx.value, '0')) {
    warnings.push(violation(ctx, 'tokenApproval transaction must not carry native value', expected, decoded));
  }
  if (!tokenContract) {
    warnings.push(
      violation(
        ctx,
        `tokenApproval intent names no token contract that can be resolved from statics ('${
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
