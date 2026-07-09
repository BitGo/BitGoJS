/**
 * @prettier
 *
 * @experimental The vault client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import { FinalizeVaultOptions, InitializeVaultOptions } from './iVault';
import { Vault } from './vault';

/**
 * Options for vault creation.
 *
 * v1 targets the HOT custody model only: the multisig root user/backup keys are generated locally
 * by the SDK, encrypted with `passphrase`, and registered on BitGo; the MPC roots run the standard
 * hot ceremonies with the same passphrase. Self-managed cold keys and custodial vaults are out of
 * scope for v1.
 */
export interface CreateVaultOptions {
  label: string;
  passphrase: string; // encrypts the locally-generated multisig user/backup prvs; shared with the MPC ceremonies
}

/** Handle returned by `initializeVault`, threaded into the key ceremonies and finalize. */
export interface VaultCreationHandle {
  vaultId: string;
}

/**
 * The 12 minted root key ids produced by `createVaultKeys`, as 4 ordered [user, backup, bitgo]
 * triplets — exactly the payload `finalizeVault` consumes.
 */
export type VaultKeys = FinalizeVaultOptions;

export interface ListVaultsOptions {
  cursor?: string; // opaque cursor from a previous response's nextCursor
  limit?: number;
}

export interface GetVaultOptions {
  id: string;
}

/**
 * @experimental
 */
export interface IVaults {
  /**
   * One-call convenience wrapper: initialize → createVaultKeys (4 vaultId-tagged ceremonies) →
   * finalize → keycard. HOT custody only in v1.
   */
  generateVault(params: CreateVaultOptions): Promise<Vault>;
  /** Phase 1 — initialize a vault (metadata only, no key material). */
  initializeVault(params: InitializeVaultOptions): Promise<Vault>;
  /** Phase 2 — run the 4 root key ceremonies tagged with `vaultId`; returns the 12 minted key ids. */
  createVaultKeys(params: CreateVaultOptions & VaultCreationHandle): Promise<VaultKeys>;
  /** Phase 3 — finalize a vault with the 12 root key ids. Idempotent. */
  finalizeVault(vaultId: string, params: FinalizeVaultOptions): Promise<Vault>;
  list(params?: ListVaultsOptions): Promise<{ vaults: Vault[]; nextCursor?: string }>;
  get(params: GetVaultOptions): Promise<Vault>;
}
