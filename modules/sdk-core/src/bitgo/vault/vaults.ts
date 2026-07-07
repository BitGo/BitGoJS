/**
 * @prettier
 */
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { FinalizeVaultOptions, InitializeVaultOptions } from './iVault';
import { CreateVaultOptions, GetVaultOptions, IVaults, ListVaultsOptions } from './iVaults';
import { Vault } from './vault';

/**
 * Collection accessor for a single enterprise's vaults, mirroring Wallets / Enterprises.
 * Vault routes are enterprise-scoped (/api/v2/enterprise/:eId/vaults), so the accessor is
 * constructed with the enterprise id (see Enterprise.vaults()).
 */
export class Vaults implements IVaults {
  private readonly bitgo: BitGoBase;
  private readonly baseCoin: IBaseCoin;
  private readonly enterpriseId: string;

  constructor(bitgo: BitGoBase, baseCoin: IBaseCoin, enterpriseId: string) {
    this.bitgo = bitgo;
    this.baseCoin = baseCoin;
    this.enterpriseId = enterpriseId;
  }

  /**
   * Enterprise-scoped v2 URL for the vaults collection, e.g. /api/v2/enterprise/:eId/vaults
   * @param extra
   */
  private url(extra = ''): string {
    return this.bitgo.url(`/enterprise/${this.enterpriseId}/vaults${extra}`, 2);
  }

  /**
   * One-call orchestrator: initialize → 4 root key ceremonies (vaultId-tagged) → finalize → keycard.
   * HOT custody only in v1. Implemented in WCN-1192 Phase 2.
   */
  async createVault(params: CreateVaultOptions): Promise<Vault> {
    throw new Error('Vaults.createVault is not yet implemented (WCN-1192 Phase 2)');
  }

  /**
   * Phase 1 — initialize a vault (metadata only, no key material).
   * Implemented in WCN-1192 Phase 2 (blocked on WCN-1175).
   */
  async initializeVault(params: InitializeVaultOptions): Promise<Vault> {
    throw new Error('Vaults.initializeVault is not yet implemented (WCN-1192 Phase 2)');
  }

  /**
   * Phase 3 — finalize a vault with the 12 root key ids as 4 ordered [user, backup, bitgo] triplets.
   * Idempotent. Implemented in WCN-1192 Phase 2 (blocked on WCN-1175).
   */
  async finalizeVault(vaultId: string, params: FinalizeVaultOptions): Promise<Vault> {
    throw new Error('Vaults.finalizeVault is not yet implemented (WCN-1192 Phase 2)');
  }

  /**
   * List the enterprise's vaults (cursor pagination).
   * Implemented in WCN-1192 Phase 3 (blocked on WCN-1177).
   */
  async list(params: ListVaultsOptions = {}): Promise<{ vaults: Vault[]; nextCursor?: string }> {
    throw new Error('Vaults.list is not yet implemented (WCN-1192 Phase 3)');
  }

  /**
   * Fetch a single vault by id.
   * Implemented in WCN-1192 Phase 3 (blocked on WCN-1177).
   */
  async get(params: GetVaultOptions): Promise<Vault> {
    throw new Error('Vaults.get is not yet implemented (WCN-1192 Phase 3)');
  }
}
