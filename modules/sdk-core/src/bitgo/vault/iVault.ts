/**
 * @prettier
 *
 * @experimental The vault client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import * as t from 'io-ts';
import type { FreezeOptions, Wallet, WalletShare } from '../wallet';
import * as VaultCodecs from './codecs';

// ---- data shapes (derived from the io-ts codecs in ./codecs — single source of truth) ----

export type RootKeyType = t.TypeOf<typeof VaultCodecs.RootKeyType>;
export type VaultPermission = t.TypeOf<typeof VaultCodecs.VaultPermission>;
export type VaultRootKeys = t.TypeOf<typeof VaultCodecs.VaultRootKeys>;
export type VaultMembershipData = t.TypeOf<typeof VaultCodecs.VaultMembershipData>;
export type VaultShareRequest = t.TypeOf<typeof VaultCodecs.VaultShareRequest>;
export type VaultData = t.TypeOf<typeof VaultCodecs.VaultData>;
export type VaultShareState = t.TypeOf<typeof VaultCodecs.VaultShareState>;
export type VaultShareKeychain = t.TypeOf<typeof VaultCodecs.VaultShareKeychain>;
export type VaultShareData = t.TypeOf<typeof VaultCodecs.VaultShareData>;

export interface InitializeVaultOptions {
  label: string;
}

// Phase 3 — the client hands back the 12 key ids it created in Phase 2:
export interface FinalizeVaultOptions {
  rootKeys: VaultRootKeys;
}

/**
 * Sharing ONE vault wallet with a non-member rides the existing wallet-share handshake (FR-13),
 * so the result is the existing WalletShare shape.
 */
export type WalletShareData = WalletShare;

// ---- per-vault operation options (bodies land in WCN-1203 / WCN-1204) ----

export interface CreateVaultWalletOptions {
  coin: string;
  label: string;
  type?: string;
  multisigTypeVersion?: string;
}

interface AddVaultMemberBase {
  permissions: VaultPermission[];
  /** required when 'spend' is included — the 4 root user keys ECDH-re-encrypted to the invitee */
  keychains?: VaultShareKeychain[];
  message?: string;
  /** when true, suppress the invitation email that would otherwise be sent to `email` */
  disableEmail?: boolean;
}

/** Add a member by either `userId` or `email` — exactly one is required. */
export type AddVaultMemberOptions =
  | (AddVaultMemberBase & { userId: string; email?: never })
  | (AddVaultMemberBase & { email: string; userId?: never });

export interface AddVaultWalletMemberOptions {
  walletId: string;
  /** required — sharing re-encrypts the user key, which needs hardened derivation from the passphrase */
  walletPassphrase: string;
  email?: string;
  permissions?: string[];
  message?: string;
}

export type AcceptVaultShareAsSpenderOptions = {
  vaultShareId: string;
  userPassword: string;
  newWalletPassphrase?: string;
};
export type AcceptVaultShareAsNonSpenderOptions = {
  vaultShareId: string;
};
export type AcceptVaultShareOptions = AcceptVaultShareAsSpenderOptions | AcceptVaultShareAsNonSpenderOptions;

/**
 * @experimental
 */
export interface IVault {
  id(): string;
  enterpriseId(): string;
  label(): string;
  status(): VaultData['status'];
  url(extra?: string): string;
  createWallet(params: CreateVaultWalletOptions): Promise<Wallet>;
  // whole-vault: view/admin/spend; spend opens a key share (also how a spender services a
  // vaultShareRequests entry in UMS orgs)
  addMember(params: AddVaultMemberOptions): Promise<VaultData>;
  // share ONE vault wallet, not the whole vault
  addMemberToWallet(params: AddVaultWalletMemberOptions): Promise<WalletShareData>;
  listShares(params?: { state?: VaultShareState }): Promise<VaultShareData[]>;
  acceptShare(params: AcceptVaultShareOptions): Promise<VaultShareData>;
  freeze(params?: FreezeOptions): Promise<VaultData>;
  archive(): Promise<VaultData>;
  toJSON(): VaultData;
}
