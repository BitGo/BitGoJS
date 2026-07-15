/**
 * @prettier
 *
 * @experimental The safe client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import { FinalizeSafeBody, InitializeSafeBody, RootKeyTriplet, RootKeyType, SafeData } from '@bitgo/public-types';
import { Environments } from '../../common';
import { IBaseCoin } from '../baseCoin';
import { BitGoBase } from '../bitgoBase';
import { decodeWithCodec } from '../utils/codecs';
import { postWithCodec } from '../utils/postWithCodec';
import { FinalizeSafeOptions, InitializeSafeOptions } from './iSafe';
import { CreateSafeOptions, GetSafeOptions, ISafes, ListSafesOptions, SafeCreationHandle, SafeKeys } from './iSafes';
import { Safe } from './safe';

/**
 * Representative coin per root slot, by network. Safe roots are curve/scheme-scoped, not
 * coin-scoped — WP stamps `curve` server-side from the coin's key curve, so any coin of the
 * right (curve, scheme) works. These are stable, always-available choices used only to route
 * the key-generation ceremony; the resulting root is interchangeable across coins of the slot.
 * @experimental
 */
const ROOT_COIN_BY_NETWORK: Record<'mainnet' | 'testnet', Record<RootKeyType, string>> = {
  mainnet: {
    // multisig roots
    secp256k1Multisig: 'btc',
    ed25519Multisig: 'xlm',
    // MPC roots
    ecdsaMpc: 'eth',
    eddsaMpc: 'sol',
  },
  testnet: {
    // multisig roots
    secp256k1Multisig: 'tbtc',
    ed25519Multisig: 'txlm',
    // MPC roots
    ecdsaMpc: 'hteth',
    eddsaMpc: 'tsol',
  },
};

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
   * One-call convenience wrapper chaining the three creation phases:
   * initialize (Phase 1) → createSafeKeys (Phase 2, 4 safeId-tagged ceremonies) →
   * finalize (Phase 3). HOT custody only in v1.
   *
   * If a key ceremony fails, `createSafeKeys` archives the safe before throwing, so a failed run
   * leaves no half-created safe behind — create a new safe and retry.
   * @experimental
   */
  async generateSafe(params: CreateSafeOptions): Promise<Safe> {
    const safe = await this.initializeSafe({ label: params.label });
    const rootKeys = await this.createSafeKeys({ ...params, safeId: safe.id() });
    return await this.finalizeSafe(safe.id(), rootKeys);
  }

  /**
   * Phase 1 — initialize a safe (metadata only, no key material).
   * POST /api/v2/enterprise/:eId/safes { label }
   * @experimental
   */
  async initializeSafe(params: InitializeSafeOptions): Promise<Safe> {
    const response = await postWithCodec(this.bitgo, this.url(), InitializeSafeBody, params).result();
    const safeData = decodeWithCodec(SafeData, response, 'SafeData');
    return new Safe(this.bitgo, safeData);
  }

  /**
   * Phase 2 — run the 4 root key ceremonies tagged with `safeId`; returns the 12 minted key ids
   * as 4 ordered [user, backup, bitgo] triplets. HOT custody only in v1.
   *
   * All 4 ceremonies (2.1 multisig ①④, 2.2 MPC ②③) run in parallel. If any of them fail, the
   * partially-created safe is archived (a legal `initializing → archived` transition, so the
   * orphaned tagged keys are inert) and an error listing every ceremony failure is thrown —
   * create a new safe and retry.
   *
   * Not independently idempotent: re-running against a safe that already has some roots hits WP's
   * unique root-slot index.
   * @experimental
   */
  async createSafeKeys(params: CreateSafeOptions & SafeCreationHandle): Promise<SafeKeys> {
    const { safeId, passphrase } = params;
    const enterprise = this.enterpriseId;

    // `slots` MUST stay index-aligned with the Promise.allSettled array below. Ordered by scheme:
    // the two multisig roots first, then the two MPC roots.
    const slots: RootKeyType[] = ['secp256k1Multisig', 'ed25519Multisig', 'ecdsaMpc', 'eddsaMpc'];
    const results = await Promise.allSettled([
      // Phase 2.1 — multisig roots (①④): local user/backup keypairs + BitGo key, all safeId-tagged.
      this.createMultisigRoot('secp256k1Multisig', safeId, passphrase, enterprise),
      this.createMultisigRoot('ed25519Multisig', safeId, passphrase, enterprise),
      // Phase 2.2 — MPC roots (②③): the existing DKLS (②) and EdDSA (③) ceremonies, safeId threaded.
      this.createMpcRoot('ecdsaMpc', safeId, passphrase, enterprise),
      this.createMpcRoot('eddsaMpc', safeId, passphrase, enterprise),
    ]);

    // Single pass over the settled results: `status === 'fulfilled'` narrows `.value` to a
    // RootKeyTriplet (no cast needed), and rejections are collected per-slot for the error below.
    const hot = {} as SafeKeys['rootKeys']['hot'];
    const failures: string[] = [];
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        hot[slots[i]] = result.value;
      } else {
        const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
        failures.push(`${slots[i]}: ${reason}`);
      }
    });

    if (failures.length > 0) {
      // Best-effort abandon the partially-created safe so a retry starts from a clean slate. Keep
      // the ceremony failures as the primary error; note it if the cleanup archive also failed.
      let archiveError: Error | undefined;
      try {
        await this.archiveSafe(safeId);
      } catch (e) {
        archiveError = e instanceof Error ? e : new Error(String(e));
      }
      let message =
        `Safe key generation failed for ${failures.length} root ceremony/ies ` +
        `[${failures.join('; ')}]. The safe (${safeId}) has been archived; create a new safe and retry.`;
      if (archiveError) {
        message += ` NOTE: archiving the safe also failed (${archiveError.message}); archive it manually before retrying.`;
      }
      throw new Error(message);
    }

    return { rootKeys: { hot } };
  }

  /**
   * Archive a safe. Also the abandonment path for a stuck `initializing` safe (used by
   * `createSafeKeys` to clean up after a failed ceremony).
   * POST /api/v2/enterprise/:eId/safes/:safeId/archive
   * @experimental
   */
  async archiveSafe(safeId: string): Promise<Safe> {
    const response = await this.bitgo
      .post(this.url(`/${safeId}/archive`))
      .send()
      .result();
    const safeData = decodeWithCodec(SafeData, response, 'SafeData');
    return new Safe(this.bitgo, safeData);
  }

  /**
   * Phase 3 — finalize a safe with the 12 root key ids as 4 ordered [user, backup, bitgo] triplets.
   * POST /api/v2/enterprise/:eId/safes/:safeId/finalize { rootKeys }.
   * Idempotent: re-finalizing with the same `rootKeys` returns the active safe again (200).
   * @experimental
   */
  async finalizeSafe(safeId: string, params: FinalizeSafeOptions): Promise<Safe> {
    const response = await postWithCodec(
      this.bitgo,
      this.url(`/${safeId}/finalize`),
      FinalizeSafeBody,
      params
    ).result();
    const safeData = decodeWithCodec(SafeData, response, 'SafeData');
    return new Safe(this.bitgo, safeData);
  }

  /**
   * Coin used to route a given root's key ceremony (see ROOT_COIN_BY_NETWORK).
   * @experimental
   */
  private coinForRoot(slot: RootKeyType): IBaseCoin {
    // V1Network is exactly 'bitcoin' | 'testnet', so this branch is exhaustive over every
    // environment: 'bitcoin' is mainnet and every other value is a testnet.
    const network = Environments[this.bitgo.getEnv()].network === 'bitcoin' ? 'mainnet' : 'testnet';
    return this.bitgo.coin(ROOT_COIN_BY_NETWORK[network][slot]);
  }

  /**
   * Phase 2.1 helper — mint one onchain-multisig root (cold model, as wallet creation does today):
   * generate user/backup keypairs locally, encrypt with `passphrase`, register via POST /:coin/key
   * with `safeId`; the BitGo key is created through the same route's `source:'bitgo'` path.
   * Returns the [user, backup, bitgo] key id triplet.
   * @experimental
   */
  private async createMultisigRoot(
    slot: 'secp256k1Multisig' | 'ed25519Multisig',
    safeId: string,
    passphrase: string,
    enterprise: string
  ): Promise<RootKeyTriplet> {
    const keychains = this.coinForRoot(slot).keychains();

    const userKeyPair = keychains.create();
    const userKeychainPromise = keychains.add({
      pub: userKeyPair.pub,
      encryptedPrv: await this.bitgo.encrypt({ input: userKeyPair.prv, password: passphrase }),
      source: 'user',
      safeId,
    });
    const backupKeychainPromise = keychains.createBackup({ passphrase, safeId });
    const bitgoKeychainPromise = keychains.createBitGo({ enterprise, safeId });

    const [userKeychain, backupKeychain, bitgoKeychain] = await Promise.all([
      userKeychainPromise,
      backupKeychainPromise,
      bitgoKeychainPromise,
    ]);
    return [userKeychain.id, backupKeychain.id, bitgoKeychain.id];
  }

  /**
   * Phase 2.2 helper — run one MPC ceremony (DKLS for ecdsaMpc, EdDSA for eddsaMpc) via the
   * existing `createMpc` flow with `safeId` threaded through, so the resulting user/backup/bitgo
   * keys land tagged. Returns the [user, backup, bitgo] key id triplet.
   * @experimental
   */
  private async createMpcRoot(
    slot: 'ecdsaMpc' | 'eddsaMpc',
    safeId: string,
    passphrase: string,
    enterprise: string
  ): Promise<RootKeyTriplet> {
    const { userKeychain, backupKeychain, bitgoKeychain } = await this.coinForRoot(slot)
      .keychains()
      .createMpc({ multisigType: 'tss', passphrase, enterprise, safeId });
    return [userKeychain.id, backupKeychain.id, bitgoKeychain.id];
  }

  /**
   * List the enterprise's safes (cursor pagination).
   * Implemented in WCN-1192 Phase 3 (blocked on WCN-1177).
   * @experimental
   */
  async list(params: ListSafesOptions = {}): Promise<{ safes: Safe[]; nextCursor?: string }> {
    throw new Error('Safes.list is not yet implemented (WCN-1192 Phase 3)');
  }

  /**
   * Fetch a single safe by id.
   * Implemented in WCN-1192 Phase 3 (blocked on WCN-1177).
   * @experimental
   */
  async get(params: GetSafeOptions): Promise<Safe> {
    throw new Error('Safes.get is not yet implemented (WCN-1192 Phase 3)');
  }
}
