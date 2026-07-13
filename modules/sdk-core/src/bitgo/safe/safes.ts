/**
 * @prettier
 *
 * @experimental The safe client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import { BitGoBase } from '../bitgoBase';
import { FinalizeSafeOptions, InitializeSafeOptions } from './iSafe';
import { CreateSafeOptions, GetSafeOptions, ISafes, ListSafesOptions, SafeCreationHandle, SafeKeys } from './iSafes';
import { Safe } from './safe';

/**
 * Collection accessor for a single enterprise's safes, mirroring Wallets / Enterprises.
 * Safe routes are enterprise-scoped (/api/v2/enterprise/:eId/safes), so the accessor is
 * constructed with the enterprise id (see Enterprise.safes()).
 *
 * @experimental
 */
export class Safes implements ISafes {
  private readonly bitgo: BitGoBase;
  private readonly enterpriseId: string;

  constructor(bitgo: BitGoBase, enterpriseId: string) {
    this.bitgo = bitgo;
    this.enterpriseId = enterpriseId;
  }

  /**
   * Enterprise-scoped v2 URL for the safes collection, e.g. /api/v2/enterprise/:eId/safes
   * @param extra
   */
  private url(extra = ''): string {
    return this.bitgo.url(`/enterprise/${this.enterpriseId}/safes${extra}`, 2);
  }

  /**
   * One-call convenience wrapper: initialize → createSafeKeys (4 safeId-tagged ceremonies) →
   * finalize → keycard. HOT custody only. Implemented in WCN-1192 Phase 2.
   */
  async generateSafe(params: CreateSafeOptions): Promise<Safe> {
    throw new Error('Safes.generateSafe is not yet implemented (WCN-1192 Phase 2)');
  }

  /**
   * Phase 1 — initialize a safe (metadata only, no key material).
   * Implemented in WCN-1192 Phase 2 (blocked on WCN-1175).
   */
  async initializeSafe(params: InitializeSafeOptions): Promise<Safe> {
    throw new Error('Safes.initializeSafe is not yet implemented (WCN-1192 Phase 2)');
  }

  /**
   * Phase 2 — run the 4 root key ceremonies tagged with `safeId`; returns the 12 minted key ids.
   * Implemented in WCN-1192 Phase 2 (blocked on WCN-1176).
   */
  async createSafeKeys(params: CreateSafeOptions & SafeCreationHandle): Promise<SafeKeys> {
    throw new Error('Safes.createSafeKeys is not yet implemented (WCN-1192 Phase 2)');
  }

  /**
   * Phase 3 — finalize a safe with the 12 root key ids as 4 ordered [user, backup, bitgo] triplets.
   * Idempotent. Implemented in WCN-1192 Phase 2 (blocked on WCN-1175).
   */
  async finalizeSafe(safeId: string, params: FinalizeSafeOptions): Promise<Safe> {
    throw new Error('Safes.finalizeSafe is not yet implemented (WCN-1192 Phase 2)');
  }

  /**
   * List the enterprise's safes (cursor pagination).
   * Implemented in WCN-1192 Phase 3 (blocked on WCN-1177).
   */
  async list(params: ListSafesOptions = {}): Promise<{ safes: Safe[]; nextCursor?: string }> {
    throw new Error('Safes.list is not yet implemented (WCN-1192 Phase 3)');
  }

  /**
   * Fetch a single safe by id.
   * Implemented in WCN-1192 Phase 3 (blocked on WCN-1177).
   */
  async get(params: GetSafeOptions): Promise<Safe> {
    throw new Error('Safes.get is not yet implemented (WCN-1192 Phase 3)');
  }
}
