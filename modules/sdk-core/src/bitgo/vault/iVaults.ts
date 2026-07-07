/**
 * @prettier
 */
import { InitializeVaultOptions, FinalizeVaultOptions } from './iVault';
import { Vault } from './vault';

/**
 * Options for the createVault orchestrator.
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

export interface ListVaultsOptions {
  cursor?: string; // opaque cursor from a previous response's nextCursor
  limit?: number;
}

export interface GetVaultOptions {
  id: string;
}

export interface IVaults {
  // orchestrates: initialize → 4 root key flows (vaultId-tagged) → finalize → keycard
  createVault(params: CreateVaultOptions): Promise<Vault>;
  initializeVault(params: InitializeVaultOptions): Promise<Vault>;
  finalizeVault(vaultId: string, params: FinalizeVaultOptions): Promise<Vault>;
  list(params?: ListVaultsOptions): Promise<{ vaults: Vault[]; nextCursor?: string }>;
  get(params: GetVaultOptions): Promise<Vault>;
}
