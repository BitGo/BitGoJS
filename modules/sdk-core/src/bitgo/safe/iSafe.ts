/**
 * @prettier
 *
 * @experimental The safe client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
// Wire/data shapes are owned by @bitgo/public-types — import them where needed rather than
// re-exporting from sdk-core.
import type {
  FreezeSafeBody,
  SafeData,
  SafePermission,
  SafeRootKeys,
  SafeShareData,
  SafeShareKeychain,
  SafeShareState,
} from '@bitgo/public-types';
import type { Wallet, WalletShare } from '../wallet';

/** @experimental */
export interface InitializeSafeOptions {
  label: string;
}

/**
 * Phase 3 — the client hands back the 12 key ids it created in Phase 2.
 * @experimental
 */
export interface FinalizeSafeOptions {
  rootKeys: SafeRootKeys;
}

/**
 * Sharing ONE safe wallet with a non-member rides the existing wallet-share handshake (FR-13),
 * so the result is the existing WalletShare shape.
 */
export type WalletShareData = WalletShare;

// ---- per-safe operation options (bodies land in WCN-1203 / WCN-1204) ----

export interface CreateSafeWalletOptions {
  coin: string;
  label: string;
  type?: string;
  multisigTypeVersion?: string;
}

interface AddSafeMemberBase {
  permissions: SafePermission[];
  /** required when 'spend' is included — the 4 root user keys ECDH-re-encrypted to the invitee */
  keychains?: SafeShareKeychain[];
  message?: string;
  /** when true, suppress the invitation email that would otherwise be sent to `email` */
  disableEmail?: boolean;
}

/** Add a member by either `userId` or `email` — exactly one is required. */
export type AddSafeMemberOptions =
  | (AddSafeMemberBase & { userId: string; email?: never })
  | (AddSafeMemberBase & { email: string; userId?: never });

export interface AddSafeWalletMemberOptions {
  walletId: string;
  /** required — sharing re-encrypts the user key, which needs hardened derivation from the passphrase */
  walletPassphrase: string;
  email?: string;
  permissions?: string[];
  message?: string;
}

export type AcceptSafeShareAsSpenderOptions = {
  safeShareId: string;
  userPassword: string;
  newWalletPassphrase?: string;
};
export type AcceptSafeShareAsNonSpenderOptions = {
  safeShareId: string;
};
export type AcceptSafeShareOptions = AcceptSafeShareAsSpenderOptions | AcceptSafeShareAsNonSpenderOptions;

/**
 * @experimental
 */
export interface ISafe {
  id(): string;
  enterpriseId(): string;
  label(): string;
  status(): SafeData['status'];
  url(extra?: string): string;
  createWallet(params: CreateSafeWalletOptions): Promise<Wallet>;
  // whole-safe: view/admin/spend/dapp; spend opens a key share (also how a spender services a
  // safeShareRequests entry in UMS orgs)
  addMember(params: AddSafeMemberOptions): Promise<SafeData>;
  // share ONE safe wallet, not the whole safe
  addMemberToWallet(params: AddSafeWalletMemberOptions): Promise<WalletShareData>;
  listShares(params?: { state?: SafeShareState }): Promise<SafeShareData[]>;
  acceptShare(params: AcceptSafeShareOptions): Promise<SafeShareData>;
  freeze(params?: FreezeSafeBody): Promise<SafeData>;
  archive(): Promise<SafeData>;
  toJSON(): SafeData;
}
