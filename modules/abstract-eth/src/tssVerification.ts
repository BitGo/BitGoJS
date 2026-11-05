/**
 * Fail-closed EVM TSS intent verification.
 *
 * `verifyTssTransaction` must not let a user key share sign EVM bytes unless the decoded
 * `to` / `value` / `data` match the user intent (TOB-BITGOEDMPC-2 / INFOSEC-671). The intent
 * type picks the handler; each handler accepts a closed set of decoded transaction shapes
 * and anything unmatched is a violation. Types are never derived from calldata: selectors
 * are shared across intents and `payment + data` carries arbitrary calldata.
 *
 * The checks only return findings; `AbstractEthLikeNewCoins.verifyTssTransaction` applies the
 * policy in one place. A `fatal` finding (a check that already threw before this module existed)
 * always throws. `new` and `unhandled` findings are reported through `console.warn` plus an
 * optional `onVerificationWarning` callback, and throw when the client opts into
 * `strictTssVerification`.
 */
import {
  ITransactionRecipient,
  PopulatedIntent,
  TssVerificationMismatch,
  TssVerificationWarning,
} from '@bitgo/sdk-core';
import { coins, ContractAddressDefinedToken } from '@bitgo/statics';
import { Buffer } from 'buffer';
import { addHexPrefix, bufferToHex } from 'ethereumjs-util';
import {
  batchMethodId,
  batchTransferFromMethodId,
  BatchTransferData,
  BatchTransferFromData,
  confidentialTransferNoProofMethodId,
  confidentialTransferNoProofTypes,
  confidentialTransferWithProofMethodId,
  confidentialTransferWithProofTypes,
  decodeApproveCalldata,
  decodeBatchTransferData,
  decodeBatchTransferFromData,
  ERC1155BatchTransferTypeMethodId,
  ERC1155BatchTransferTypes,
  ERC1155SafeTransferTypeMethodId,
  ERC1155SafeTransferTypes,
  ERC721SafeTransferFromMethodId,
  ERC721SafeTransferTypeMethodId,
  ERC721SafeTransferTypes,
  ERC721TransferFromMethodId,
  ERC721TransferFromTypes,
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

/**
 * How a finding is enforced. `fatal` always throws: these are the checks that threw before
 * fail-closed verification existed. `new` (a mismatch on a handled intent type) and `unhandled`
 * (an intent type with no handler) follow the client's warn / strict policy.
 */
export type TssFindingSeverity = 'fatal' | 'new' | 'unhandled';

/** One rule the transaction bytes broke, with the severity that decides warn or throw. */
export interface TssFinding extends TssVerificationWarning {
  severity: TssFindingSeverity;
}

/** One token identity a recipient declares, either flat or through the intent `tokenData` shape. */
export interface EvmTokenIdentityDeclaration {
  tokenName?: string;
  tokenContractAddress?: string;
}

/**
 * The NFT fields of the intent `tokenData` shape. They say which standard and which token the
 * recipient moves; the contract identity itself stays in {@link EvmTokenIdentityDeclaration}, so
 * `tokenType` / `tokenId` / `tokenQuantity` are never fed into asset resolution.
 */
interface EvmTokenDataDeclaration extends EvmTokenIdentityDeclaration {
  tokenType?: string;
  tokenId?: string;
  tokenQuantity?: string;
}

/** One recipient of the user intent, flattened from txParams or the stored tx request intent. */
export interface EvmTssExpectedRecipient {
  address: string;
  amount: string;
  /** Raw calldata the intent declares for this recipient (WalletConnect / dApp flows). */
  data?: string;
  tokenName?: string;
  tokenContractAddress?: string;
  /**
   * Every token identity the source declared for this recipient (`tokenAddress` / `tokenName` and
   * `tokenData.tokenName` / `tokenData.tokenContractAddress`). They are all resolved, so two
   * declarations of different tokens stay ambiguous instead of one silently overriding the other.
   */
  declaredTokenIdentities?: EvmTokenIdentityDeclaration[];
  /** `tokenData.tokenType`: the declared standard, which picks the calldata shape (`transferToken`). */
  tokenType?: string;
  /** `tokenData.tokenId`: the declared NFT id (ERC-721 / ERC-1155). */
  tokenId?: string;
  /** `tokenData.tokenQuantity`: the declared amount (ERC-1155, and ERC-721 must be 1 when set). */
  tokenQuantity?: string;
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
  /**
   * Address whose nonce is filled (`fillNonce`), read from the source that speaks for the user
   * intent only: the declared `receiveAddress`, or the stored intent's `receiveAddress`.
   */
  receiveAddress?: string;
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

/**
 * Canonical calldata for every comparison: missing data, `''` and `'0x'` are the same empty
 * payload, hex is lowercased, and a dropped `0x` prefix is restored. Selector gates and decoders
 * all read this form, so a format difference can never route the same bytes past a check.
 */
function normalizeCalldata(data?: string): string {
  const lower = (data ?? '').toLowerCase();
  if (!lower || lower === '0x') {
    return '0x';
  }
  return lower.startsWith('0x') ? lower : `0x${lower}`;
}

function isEmptyCalldata(data?: string): boolean {
  return normalizeCalldata(data) === '0x';
}

function valuesEqual(a: unknown, b: unknown): boolean {
  try {
    return toBigInt(a) === toBigInt(b);
  } catch {
    return String(a) === String(b);
  }
}

function violation(
  ctx: Pick<EvmTssIntentContext, 'intentType'>,
  reason: string,
  expected: TssVerificationMismatch,
  decoded: TssVerificationMismatch,
  severity: TssFindingSeverity = 'new'
): TssFinding {
  return { intentType: ctx.intentType, reason, expected, decoded, severity };
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
 * Name prefixes of the statics placeholder entries each NFT standard uses when the collection is
 * not itself registered (`erc721:token` / `terc721:token`, and the per-chain placeholders). Only a
 * name of the recipient's own standard can be a label for its collection; any other name keeps its
 * identity meaning.
 */
const NFT_DISPLAY_NAME_PREFIXES: Record<'ERC721' | 'ERC1155', RegExp> = {
  ERC721: /^t?erc721:/i,
  ERC1155: /^t?erc1155:/i,
};

/**
 * Resolve the asset a payment is declared to move. Identity comes from the recipient's own
 * `tokenAddress` / `tokenName` / `tokenData` declarations, the top-level `tokenName`, and the
 * coin instance, and nothing else: the context never carries server-supplied token metadata when
 * the caller declared its own intent. No declared identity at all means native. Identity that
 * cannot be resolved to a contract, or that names two different contracts, is `unresolved`: the
 * intended asset is unknown, so no calldata shape can be accepted for it.
 *
 * `nftTokenType` (set by the `transferToken` handler for a declared ERC-721 / ERC-1155) enables one
 * narrow exception: a statics placeholder of that same standard (`tokenData.tokenName` is required
 * by the intent schema, and `getTokenName` leaves `erc721:token` in place when the collection is
 * unknown). Such a name is display metadata, so it is dropped from identity when the recipient also
 * declared a real collection address. Nothing else is: an unregistered name still fails
 * resolution, and a name that resolves to a real contract still contradicts the declared one.
 */
function resolveAsset(
  ctx: EvmTssIntentContext,
  declared: {
    tokenName?: string;
    tokenContractAddress?: string;
    declaredTokenIdentities?: EvmTokenIdentityDeclaration[];
  },
  nftTokenType?: 'ERC721' | 'ERC1155'
): PaymentAsset {
  const sources: { label: string; contract: string | undefined; native?: boolean }[] = [];
  // Only a real collection address can anchor a declared NFT; without one the name is the only
  // identity and must still resolve (or be reported unresolvable) exactly as for any token.
  const nftContract =
    nftTokenType && declared.tokenContractAddress && EVM_ADDRESS.test(declared.tokenContractAddress)
      ? declared.tokenContractAddress
      : undefined;
  const nftDisplayName = nftTokenType ? NFT_DISPLAY_NAME_PREFIXES[nftTokenType] : undefined;
  // True only for a statics placeholder of the declared standard whose contract is the
  // `0xerc721:token`-style pseudo-address: `getTokenName` leaves `tokenData.tokenName` as a generic
  // label when the collection is unknown, and the schema makes that field mandatory. An
  // unregistered name here still expresses an unresolvable token, so it keeps failing resolution.
  const isDisplayOnlyNftName = (name: string): boolean => {
    if (!nftContract || !nftDisplayName?.test(name)) {
      return false;
    }
    const contract = resolveTokenContractAddress(name);
    return contract !== undefined && !EVM_ADDRESS.test(contract);
  };
  // Every identity the recipient declared is resolved, not just the first that happens to be
  // set: two declarations of different tokens must stay ambiguous rather than one silently
  // overriding the other.
  const identities: EvmTokenIdentityDeclaration[] = declared.declaredTokenIdentities?.length
    ? declared.declaredTokenIdentities
    : [{ tokenName: declared.tokenName, tokenContractAddress: declared.tokenContractAddress }];
  for (const identity of identities) {
    if (identity.tokenContractAddress !== undefined) {
      sources.push({
        label: `tokenAddress '${identity.tokenContractAddress}'`,
        contract: EVM_ADDRESS.test(identity.tokenContractAddress) ? identity.tokenContractAddress : undefined,
      });
    }
    const name = identity.tokenName;
    if (!name || isDisplayOnlyNftName(name)) {
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
  const declaredTopLevelName = ctx.tokenName;
  if (declaredTopLevelName && !isDisplayOnlyNftName(declaredTopLevelName)) {
    let staticsCoin;
    try {
      staticsCoin = coins.get(declaredTopLevelName);
    } catch {
      staticsCoin = undefined;
    }
    if (staticsCoin && !(staticsCoin instanceof ContractAddressDefinedToken && staticsCoin.isToken)) {
      sources.push({ label: `coin '${declaredTopLevelName}'`, contract: undefined, native: true });
    } else {
      sources.push({
        label: `token '${declaredTopLevelName}'`,
        contract: resolveTokenContractAddress(declaredTopLevelName),
      });
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

/** EVM recipients also carry the intent `tokenData` shape that `populateIntent` preserves. */
type CallerDeclarableRecipient = ITransactionRecipient & { tokenData?: EvmTokenDataDeclaration };

type CallerDeclarableParams = {
  type?: string;
  tokenName?: string;
  recipients?: CallerDeclarableRecipient[];
  /** `fillNonce`: the address whose nonce is filled. */
  receiveAddress?: string;
};

/** True when the caller named a transaction type or recipients, i.e. declared its own intent. */
export function callerDeclaresIntent(callerParams?: CallerDeclarableParams): boolean {
  return !!(callerParams?.type || callerParams?.recipients?.length);
}

/**
 * Decide which source speaks for the user intent. Exactly one does:
 *
 * - The caller declared a type or recipients: the caller's own params. The stored intent is
 *   dropped entirely: it must not select the handler, add calldata, name the asset, or supply
 *   consolidation / DeFi fields. A caller that declares a payment type (`transfer` / `payment` /
 *   `transferToken`) but no recipients is rejected by `verifyTssTransaction` before any handler
 *   runs, because nothing would be left to verify the bytes against; the stored intent is never
 *   used instead.
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
 * params. Absent local `data` stays absent, a recipient's flat and `tokenData` token identities
 * are all kept (so conflicting declarations stay ambiguous), and only a source that declared no
 * identity of its own inherits the stored one. `receiveAddress` comes from that same source, so a
 * caller's declared receive address is never replaced by the stored intent's. The NFT fields of
 * `tokenData` (`tokenType` / `tokenId` / `tokenQuantity`) follow the same precedence and are read
 * from the stored intent directly when the effective params carry no `tokenData`.
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
    // The effective params carry no `tokenData` on the pending-approval path, so the stored
    // intent supplies it there. The NFT fields it carries (`tokenType` / `tokenId` /
    // `tokenQuantity`) never take part in asset identity resolution.
    const tokenData = recipient.tokenData ?? storedIntent?.recipients?.[i]?.tokenData;
    // Token identity reaches a recipient both flat (`tokenAddress` / `tokenName`) and inside the
    // intent `tokenData` shape that `populateIntent` keeps. Both are declarations of the source
    // that speaks for the user, so both stay in resolution; the stored intent only fills in when
    // the source declared no identity of its own.
    const declaredTokenIdentities: EvmTokenIdentityDeclaration[] = [];
    if (recipient.tokenAddress !== undefined || recipient.tokenName !== undefined) {
      declaredTokenIdentities.push({ tokenContractAddress: recipient.tokenAddress, tokenName: recipient.tokenName });
    }
    if (tokenData?.tokenContractAddress !== undefined || tokenData?.tokenName !== undefined) {
      declaredTokenIdentities.push({
        tokenContractAddress: tokenData.tokenContractAddress,
        tokenName: tokenData.tokenName,
      });
    }
    const storedTokenContractAddress = storedIntent?.recipients?.[i]?.tokenData?.tokenContractAddress;
    if (storedTokenContractAddress !== undefined) {
      declaredTokenIdentities.push({ tokenContractAddress: storedTokenContractAddress });
    }
    const tokenContractAddress =
      recipient.tokenAddress ?? tokenData?.tokenContractAddress ?? storedTokenContractAddress;
    const tokenName = recipient.tokenName ?? tokenData?.tokenName;
    return {
      address: recipient.address,
      amount: String(recipient.amount),
      ...(recipient.data !== undefined && { data: recipient.data }),
      ...(tokenName !== undefined && { tokenName }),
      ...(tokenContractAddress !== undefined && { tokenContractAddress }),
      ...(tokenData?.tokenType !== undefined && { tokenType: tokenData.tokenType }),
      ...(tokenData?.tokenId !== undefined && { tokenId: tokenData.tokenId }),
      ...(tokenData?.tokenQuantity !== undefined && { tokenQuantity: tokenData.tokenQuantity }),
      ...(declaredTokenIdentities.length > 0 && { declaredTokenIdentities }),
    };
  });

  return {
    intentType: params.intentType,
    recipients,
    tokenName: source?.tokenName ?? storedIntent?.tokenName,
    coinTokenContractAddress: params.coinTokenContractAddress,
    receiveAddress: source?.receiveAddress ?? storedIntent?.receiveAddress,
    baseAddress: params.baseAddress,
    batcherAddress: params.batcherAddress,
  };
}

/**
 * R1 — one recipient that declares raw calldata (WalletConnect / dApp): `to`, `value` and
 * `data` must each be exactly equal to the intent.
 */
function verifyExactCall(ctx: EvmTssIntentContext, tx: DecodedEvmTx, recipient: EvmTssExpectedRecipient): TssFinding[] {
  const warnings: TssFinding[] = [];
  const expected = { to: recipient.address, value: recipient.amount, data: normalizeCalldata(recipient.data) };
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
 * The payment checks that threw before fail-closed verification existed, kept fatal and in their
 * original order (amount, then destination). Empty calldata must match `to` and `value`; ERC-20
 * `transfer(address,uint256)` calldata must match the inner recipient and amount. A WalletConnect
 * recipient whose own calldata is an ERC-20 transfer supplies that expectation instead.
 */
function verifyHistoricPayment(
  ctx: EvmTssIntentContext,
  tx: DecodedEvmTx,
  recipient: EvmTssExpectedRecipient
): TssFinding[] {
  const findings: TssFinding[] = [];
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  // Compare and decode the canonical form only: `''`, `'0x'`, mixed case and a dropped `0x`
  // prefix all describe the same bytes, so none of them may skip the selector gate below.
  const calldata = normalizeCalldata(tx.data);
  if (calldata === '0x') {
    const expected = { to: recipient.address, value: recipient.amount, data: '0x' };
    if (!valuesEqual(tx.value, recipient.amount)) {
      findings.push(
        violation(
          ctx,
          'the transaction amount in txPrebuild does not match the value given by client',
          expected,
          decoded,
          'fatal'
        )
      );
    }
    if (normalizeAddress(tx.to) !== normalizeAddress(recipient.address)) {
      findings.push(
        violation(ctx, 'destination address does not match with the recipient address', expected, decoded, 'fatal')
      );
    }
    return findings;
  }
  if (!calldata.startsWith(erc20TransferMethodId)) {
    return findings;
  }

  const [innerRecipient, innerAmount] = getRawDecoded(
    ['address', 'uint256'],
    getBufferedByteCode(erc20TransferMethodId, calldata)
  );
  const decodedInner = { ...decoded, to: toAddressString(innerRecipient), value: toBigInt(innerAmount).toString() };
  const declaredData = recipient.data === undefined ? undefined : normalizeCalldata(recipient.data);
  let expected = { to: recipient.address, value: recipient.amount, data: declaredData };
  if (declaredData && declaredData.startsWith(erc20TransferMethodId)) {
    const [declaredRecipient, declaredAmount] = getRawDecoded(
      ['address', 'uint256'],
      getBufferedByteCode(erc20TransferMethodId, declaredData)
    );
    expected = { ...expected, to: toAddressString(declaredRecipient), value: toBigInt(declaredAmount).toString() };
  }
  if (!valuesEqual(decodedInner.value, expected.value)) {
    findings.push(
      violation(
        ctx,
        'the transaction amount in txPrebuild does not match the value given by client',
        expected,
        decodedInner,
        'fatal'
      )
    );
  }
  if (decodedInner.to !== normalizeAddress(expected.to)) {
    findings.push(
      violation(ctx, 'destination address does not match with the recipient address', expected, decodedInner, 'fatal')
    );
  }
  return findings;
}

/**
 * R3 — one ERC-20 recipient: `to` must be the token contract, `value` must be zero and the
 * decoded `transfer(address,uint256)` recipient and amount must match the intent.
 * ERC-7984 `confidentialTransfer` (`0x5bebed7e` / `0x2fb74e62`) is checked on the recipient
 * only, since the amount is encrypted. On a payment the ERC-20 recipient and amount are already
 * fatal checks (`verifyHistoricPayment`), so `checkInnerTransfer` is false there.
 */
function verifyTokenTransfer(
  ctx: EvmTssIntentContext,
  tx: DecodedEvmTx,
  recipient: EvmTssExpectedRecipient,
  tokenContract: string,
  checkInnerTransfer: boolean
): TssFinding[] {
  const warnings: TssFinding[] = [];
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
    if (!checkInnerTransfer) {
      return warnings;
    }
    let decodedRecipient: string;
    let decodedAmount: bigint;
    try {
      const [innerRecipient, innerAmount] = getRawDecoded(
        ['address', 'uint256'],
        getBufferedByteCode(erc20TransferMethodId, data)
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
      const [innerRecipient] = getRawDecoded(types, getBufferedByteCode(selector, data));
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

/** The `tokenData.tokenType` values with a dedicated calldata handler, or undefined for the rest. */
function normalizeNftTokenType(tokenType?: string): 'ERC721' | 'ERC1155' | undefined {
  const normalized = tokenType?.trim().toUpperCase();
  return normalized === 'ERC721' || normalized === 'ERC1155' ? normalized : undefined;
}

/** One calldata shape an NFT standard accepts, with the ABI types needed to decode it. */
interface NftTransferShape {
  selector: string;
  types: string[];
  /** `safeBatchTransferFrom`: the id and quantity are single-element arrays of the declared values. */
  batch?: boolean;
}

/** The ERC-721 transfer signatures this handler accepts. */
const ERC721_TRANSFER_SHAPES: NftTransferShape[] = [
  // `safeTransferFrom(address,address,uint256)`: the ERC-721 overload without the data parameter.
  { selector: ERC721SafeTransferFromMethodId, types: ERC721TransferFromTypes },
  // `safeTransferFrom(address,address,uint256,bytes)`: the ERC-721 overload with the data parameter.
  { selector: ERC721SafeTransferTypeMethodId, types: ERC721SafeTransferTypes },
  // `transferFrom(address,address,uint256)`: Hedera HTS NFTs only accept this form.
  { selector: ERC721TransferFromMethodId, types: ERC721TransferFromTypes },
];

/** The ERC-1155 transfer signatures this handler accepts (single entry or one-entry batch). */
const ERC1155_TRANSFER_SHAPES: NftTransferShape[] = [
  { selector: ERC1155SafeTransferTypeMethodId, types: ERC1155SafeTransferTypes },
  { selector: ERC1155BatchTransferTypeMethodId, types: ERC1155BatchTransferTypes, batch: true },
];

/**
 * R3b — one recipient that declares an NFT (`tokenData.tokenType`): `to` must be the collection
 * contract, `value` must be zero, and the decoded transfer must move the declared token id (and,
 * for ERC-1155, quantity) to the declared destination. Only the signatures listed for the
 * declared standard are accepted; a selector of the other standard, or an unknown one, is a
 * violation. The sender (`_from`) is not compared: it is the wallet or one of its forwarders, and
 * the intent never names it.
 */
function verifyNftTokenTransfer(
  ctx: EvmTssIntentContext,
  tx: DecodedEvmTx,
  recipient: EvmTssExpectedRecipient,
  tokenContract: string,
  tokenType: 'ERC721' | 'ERC1155'
): TssFinding[] {
  const findings: TssFinding[] = [];
  const data = normalizeCalldata(tx.data);
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  const expected = { to: tokenContract, value: '0', data: recipient.data };
  // Findings that are about the token id / quantity still name the destination pair, so the
  // report says which transfer was wrong without relabelling an id as a native amount.
  const expectedTransfer = { ...expected, to: recipient.address };
  const isErc721 = tokenType === 'ERC721';

  if (!valuesEqual(tx.value, '0')) {
    findings.push(violation(ctx, 'token transfer must not carry native value', expected, decoded));
  }
  if (normalizeAddress(tx.to) !== normalizeAddress(tokenContract)) {
    findings.push(violation(ctx, 'transaction to is not the intent token contract', expected, decoded));
  }

  const shape = (isErc721 ? ERC721_TRANSFER_SHAPES : ERC1155_TRANSFER_SHAPES).find(
    (candidate) => candidate.selector === data.slice(0, 10)
  );
  if (!shape) {
    findings.push(
      violation(
        ctx,
        `${tokenType} token transfer must use ${
          isErc721
            ? 'safeTransferFrom(address,address,uint256[,bytes]) or transferFrom(address,address,uint256)'
            : 'safeTransferFrom(address,address,uint256,uint256,bytes) or safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)'
        } calldata`,
        expected,
        decoded
      )
    );
    return findings;
  }

  const tokenId = recipient.tokenId;
  const tokenQuantity = recipient.tokenQuantity;
  if (tokenId === undefined) {
    findings.push(violation(ctx, `${tokenType} token transfer must declare tokenData.tokenId`, expected, decoded));
    return findings;
  }
  if (!isErc721 && tokenQuantity === undefined) {
    findings.push(violation(ctx, 'ERC1155 token transfer must declare tokenData.tokenQuantity', expected, decoded));
    return findings;
  }
  if (isErc721 && tokenQuantity !== undefined && !valuesEqual(tokenQuantity, '1')) {
    findings.push(violation(ctx, 'ERC721 token transfer must declare tokenData.tokenQuantity of 1', expected, decoded));
  }

  let decodedRecipient: string;
  let decodedIds: string[];
  let decodedQuantities: string[] | undefined;
  try {
    // The selector is already matched at offset 0, so decode exactly the arguments after it.
    // `getBufferedByteCode` splits the calldata on the selector string, which is wrong here: an
    // argument (a tokenId is 32 bytes) may legitimately contain the selector's bytes.
    const raw = getRawDecoded(shape.types, Buffer.from(data.slice(10), 'hex'));
    decodedRecipient = toAddressString(raw[1]);
    if (shape.batch) {
      decodedIds = (raw[2] as unknown[]).map((id) => toBigInt(id).toString());
      decodedQuantities = (raw[3] as unknown[]).map((quantity) => toBigInt(quantity).toString());
    } else {
      decodedIds = [toBigInt(raw[2]).toString()];
      decodedQuantities = isErc721 ? undefined : [toBigInt(raw[3]).toString()];
    }
  } catch (e) {
    findings.push(
      violation(ctx, `${tokenType} transfer calldata could not be decoded: ${(e as Error).message}`, expected, decoded)
    );
    return findings;
  }

  const decodedTransfer = { ...decoded, to: addHexPrefix(decodedRecipient) };
  if (normalizeAddress(decodedRecipient) !== normalizeAddress(recipient.address)) {
    findings.push(
      violation(ctx, 'destination address does not match with the recipient address', expectedTransfer, decodedTransfer)
    );
  }

  if (shape.batch && (decodedIds.length !== 1 || decodedQuantities?.length !== 1)) {
    findings.push(
      violation(
        ctx,
        `ERC1155 batch transfer must move exactly the declared tokenId and tokenQuantity (decoded ` +
          `${decodedIds.length} ids / ${decodedQuantities?.length ?? 0} quantities)`,
        expectedTransfer,
        decodedTransfer
      )
    );
    return findings;
  }
  if (!valuesEqual(decodedIds[0], tokenId)) {
    findings.push(
      violation(
        ctx,
        `${tokenType} tokenId in calldata does not match tokenData.tokenId (expected ${tokenId}, decoded ${decodedIds[0]})`,
        expectedTransfer,
        decodedTransfer
      )
    );
  }
  if (!isErc721 && decodedQuantities !== undefined && !valuesEqual(decodedQuantities[0], tokenQuantity)) {
    findings.push(
      violation(
        ctx,
        `ERC1155 tokenQuantity in calldata does not match tokenData.tokenQuantity (expected ${tokenQuantity}, decoded ${decodedQuantities[0]})`,
        expectedTransfer,
        decodedTransfer
      )
    );
  }
  return findings;
}

/**
 * R4 — more than one recipient: `to` must be the network batcher contract and the decoded
 * batch arrays must match the intent 1:1. Native `batch(address[],uint256[])` carries
 * `value` = the sum of amounts; token `batchTransferFrom(address,address[],uint256[])`
 * names the intent token contract and carries `value` = 0.
 */
function verifyBatch(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssFinding[] {
  const warnings: TssFinding[] = [];
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
      batch = decodeBatchTransferData(data);
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
      batch = decodeBatchTransferFromData(data);
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
function verifyPayment(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssFinding[] {
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
  return [...verifyHistoricPayment(ctx, tx, recipient), ...verifyPaymentShape(ctx, tx, recipient)];
}

/**
 * The new checks for a single-recipient payment: the calldata shape must match the declared
 * asset. The fields `verifyHistoricPayment` already compares fatally are not compared again.
 */
function verifyPaymentShape(
  ctx: EvmTssIntentContext,
  tx: DecodedEvmTx,
  recipient: EvmTssExpectedRecipient
): TssFinding[] {
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
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
      // `to` and `value` of a native send are fatal checks in verifyHistoricPayment.
      return [];
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
      return verifyTokenTransfer(ctx, tx, recipient, asset.contract, false);
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

/**
 * `transferToken` handler — exactly one recipient, which must move a token. A recipient that
 * declares `tokenData.tokenType` ERC-721 / ERC-1155 is verified against that standard's transfer
 * calldata (R3b); every other token keeps the R3 ERC-20 / ERC-7984 shapes.
 */
function verifyTransferToken(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssFinding[] {
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
  // A declared NFT standard picks its own calldata set. `tokenData.tokenName` is display metadata
  // only when it is that standard's statics placeholder, so the declared collection contract (or a
  // name that resolves to a real one) anchors the transfer.
  const nftTokenType = normalizeNftTokenType(recipient.tokenType);
  const asset = resolveAsset(ctx, recipient, nftTokenType);
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
  if (nftTokenType) {
    return verifyNftTokenTransfer(ctx, tx, recipient, asset.contract, nftTokenType);
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
  return verifyTokenTransfer(ctx, tx, recipient, asset.contract, true);
}

/**
 * `tokenApproval` handler — `to` must be the token contract and the calldata must be
 * `approve(spender = batcher, MAX)`, with `value` = 0. Guards against a substituted
 * `approve(attacker, MAX_UINT256)`.
 */
function verifyTokenApproval(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssFinding[] {
  const warnings: TssFinding[] = [];
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  const calldata = normalizeCalldata(tx.data);
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
    const decodedApprove = decodeApproveCalldata(calldata);
    spender = normalizeAddress(decodedApprove.spender);
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

/**
 * `fillNonce` handler — a 1-wei self-send to the address whose nonce is being filled: the
 * declared `receiveAddress` (the wallet's chosen receive address) when the intent names one,
 * otherwise the wallet base address.
 */
function verifyFillNonce(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssFinding[] {
  const warnings: TssFinding[] = [];
  const decoded = { to: tx.to, value: tx.value, data: tx.data };
  const expectedTo = ctx.receiveAddress ?? ctx.baseAddress;
  const expected = { to: expectedTo, value: '1', data: '0x' };
  if (!expectedTo) {
    warnings.push(
      violation(
        ctx,
        'fillNonce intent has no receive address or wallet base address to verify against',
        expected,
        decoded
      )
    );
    return warnings;
  }
  if (normalizeAddress(tx.to) !== normalizeAddress(expectedTo)) {
    warnings.push(
      violation(
        ctx,
        ctx.receiveAddress
          ? 'fillNonce transaction must send to the declared receive address'
          : 'fillNonce transaction must send to the wallet base address',
        expected,
        decoded
      )
    );
  }
  if (!valuesEqual(tx.value, '1')) {
    warnings.push(violation(ctx, 'fillNonce transaction must send exactly 1 wei', expected, decoded));
  }
  if (!isEmptyCalldata(tx.data)) {
    warnings.push(violation(ctx, 'fillNonce transaction must not carry calldata', expected, decoded));
  }
  return warnings;
}

function unhandledTypeViolation(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssFinding {
  return violation(
    ctx,
    `no fail-closed verifier for intent type '${ctx.intentType}': transaction bytes were not compared against intent`,
    {},
    { to: tx.to, value: tx.value, data: tx.data },
    'unhandled'
  );
}

/**
 * A consolidation must pay the wallet base address: a native send to it, or an ERC-20 transfer
 * to it that carries no native value. Without the value check, `transfer(baseAddress, 0)`
 * calldata sent to an arbitrary contract would move the native balance there.
 */
export function verifyConsolidation(tx: DecodedEvmTx, baseAddress: string, severity: TssFindingSeverity): TssFinding[] {
  const ctx = { intentType: 'consolidate' };
  const expected = { to: baseAddress };
  const decoded = { to: tx.to, value: tx.value };
  const calldata = normalizeCalldata(tx.data);
  if (!calldata.startsWith(erc20TransferMethodId)) {
    return normalizeAddress(tx.to) === normalizeAddress(baseAddress)
      ? []
      : [
          violation(
            ctx,
            'Consolidation transaction recipient does not match wallet base address',
            expected,
            decoded,
            severity
          ),
        ];
  }
  // For ERC-20 consolidations `to` is the token contract; the real recipient is in the calldata.
  const findings: TssFinding[] = [];
  const [innerRecipient] = getRawDecoded(['address', 'uint256'], getBufferedByteCode(erc20TransferMethodId, calldata));
  const decodedRecipient = toAddressString(innerRecipient);
  if (decodedRecipient !== normalizeAddress(baseAddress)) {
    findings.push(
      violation(
        ctx,
        'Consolidation transaction recipient does not match wallet base address',
        expected,
        { ...decoded, to: decodedRecipient },
        severity
      )
    );
  }
  if (!valuesEqual(tx.value, '0')) {
    findings.push(
      violation(
        ctx,
        'Consolidation token transfer must not carry native value',
        { ...expected, value: '0' },
        decoded,
        severity
      )
    );
  }
  return findings;
}

/**
 * Evaluate the decoded transaction against the intent. Returns every violated rule for the
 * canonical intent type; an empty array means the bytes match the closed set of accepted
 * shapes for that type.
 */
export function evaluateEvmTssIntent(ctx: EvmTssIntentContext, tx: DecodedEvmTx): TssFinding[] {
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
      // Caller-declared legs carry dedicated fail-closed calldata checks in verifyTssTransaction
      // (stored defi-* intents are rejected there before those checks run).
      return [];
    default:
      return [unhandledTypeViolation(ctx, tx)];
  }
}
