/**
 * @prettier
 */
import type { FreezeOptions, Wallet, WalletShare } from '../wallet';

/**
 * The four static root-key slots of a vault, keyed by (curve, scheme):
 * - secp256k1Multisig ① — UTXO/XRP/XTZ/TRX/EOS
 * - ecdsaMpc          ② — EVM/Cosmos (DKLS)
 * - eddsaMpc          ③ — SOL/SUI/NEAR/TON/APT/DOT
 * - ed25519Multisig   ④ — ALGO/XLM/HBAR
 */
export type RootKeyType = 'secp256k1Multisig' | 'ecdsaMpc' | 'eddsaMpc' | 'ed25519Multisig';

export type VaultPermission = 'view' | 'spend' | 'admin' | 'dapp';

/**
 * The 12 static root key ids, by (curve, scheme). Each entry is an ordered
 * [userKeyId, backupKeyId, bitgoKeyId] triplet — same shape and order as wallet.keys[].
 */
export type VaultRootKeys = Record<RootKeyType, [userKeyId: string, backupKeyId: string, bitgoKeyId: string]>;

export interface VaultMembershipData {
  userId: string; // new-model naming convention
  permissions: VaultPermission[];
  needsRecovery?: boolean;
}

/**
 * A pending UMS spend grant awaiting a key share — mirror of the wallet's walletShareRequests[].
 * Returned to spenders/admins and serviced via addMember.
 */
export interface VaultShareRequest {
  userId: string;
  permissions: VaultPermission[];
  createdAt: string;
}

export interface VaultData {
  id: string;
  enterpriseId: string;
  label: string;
  // freeze is NOT a status — a frozen vault stays 'active' with the freeze field set (wallet precedent)
  status: 'initializing' | 'active' | 'archived';
  creator: string;
  users: VaultMembershipData[];
  vaultShareRequests?: VaultShareRequest[];
  freeze?: { time?: string; expires?: string; reason?: string };
  rootKeys?: VaultRootKeys; // ordered, like wallet.keys
  archivedAt?: string;
  createdAt: string;
}

export interface InitializeVaultOptions {
  label: string; // Phase 1 carries no key material — key generation happens in Phase 2 via the existing keychain APIs
}

// Phase 3 — the client hands back the 12 key ids it created in Phase 2:
export interface FinalizeVaultOptions {
  rootKeys: VaultRootKeys;
}

/** Vault key-share states — identical to WalletShare states, no new states. */
export type VaultShareState = 'pendingapproval' | 'active' | 'accepted' | 'canceled' | 'rejected';

/**
 * One of the 4 root USER keyshares carried on a VaultShare, ECDH-re-encrypted to the recipient.
 * Body semantics land in the Part VI SDK ticket (WCN-1204).
 */
export interface VaultShareKeychain {
  rootKeyType: RootKeyType;
  rootKeyId: string;
  encryptedPrv: string;
  publicIdentifier: string;
  fromPubKey: string;
  toPubKey: string;
  path: string;
}

export interface VaultShareData {
  id: string;
  enterpriseId: string;
  vaultId: string;
  vaultLabel?: string;
  fromUser: string;
  toUser: string;
  permissions: VaultPermission[];
  state: VaultShareState;
  message?: string;
  pendingApprovalId?: string;
  isUMSInitiated?: boolean;
  keychains?: VaultShareKeychain[];
  createdAt: string;
  updatedAt?: string;
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
  multisigType?: string;
  multisigTypeVersion?: string;
}

export interface AddVaultMemberOptions {
  userId?: string;
  email?: string;
  permissions: VaultPermission[];
  // required when 'spend' is included — the 4 root user keys ECDH-re-encrypted to the invitee
  keychains?: VaultShareKeychain[];
  message?: string;
  disableEmail?: boolean;
}

export interface AddVaultWalletMemberOptions {
  walletId: string;
  email?: string;
  permissions?: string[];
  message?: string;
}

export interface AcceptVaultShareOptions {
  vaultShareId: string;
  userPassword?: string;
  newWalletPassphrase?: string;
  overrideEncryptedPrv?: string;
}

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
  // share ONE vault wallet (FR-13), not the whole vault
  addMemberToWallet(params: AddVaultWalletMemberOptions): Promise<WalletShareData>;
  listShares(params?: { state?: VaultShareState }): Promise<VaultShareData[]>;
  acceptShare(params: AcceptVaultShareOptions): Promise<VaultShareData>;
  freeze(params?: FreezeOptions): Promise<VaultData>;
  archive(): Promise<VaultData>;
  toJSON(): VaultData;
}
