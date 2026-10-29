/**
 * @prettier
 *
 * @experimental The safe client surface is experimental and may change (including breaking
 * changes) before the public release.
 */
import * as t from 'io-ts';
import {
  FinalizeSafeBody,
  InitializeSafeBody,
  InitializeSafeResponse,
  MultisigRootKeyType,
  RootKeysByType,
  RootKeyTriplet,
  RootKeyType,
  SafeData,
} from '@bitgo/public-types';
import { BitGoBase } from '../bitgoBase';
import { ApiResponseError } from '../errors';
import { decodeWithCodec } from '../utils/codecs';
import {
  decodeEd25519StrKeyPublicKey,
  encodeDerivableEd25519Pub,
  generateEd25519ChainCode,
  isDerivableEd25519Pub,
  isValidEd25519StrKeyPublicKey,
} from '@bitgo/sdk-lib-safes';
import { IBaseCoin } from '../baseCoin';
import { Keychain } from '../keychain';
import { postWithCodec } from '../utils/postWithCodec';
import { FinalizeSafeOptions, InitializeSafeOptions } from './iSafe';
import {
  CreateSafeOptions,
  GetSafeOptions,
  ISafes,
  ListSafesOptions,
  SafeCreationHandle,
  SafeKeys,
  SafeMultisigRootKeyOptions,
  SafeMultisigRootKeys,
} from './iSafes';
import { coinForRoot, SAFE_ROOT_SLOTS } from './rootCoin';
import { Safe } from './safe';

/**
 * Wire shape of the paginated `GET /enterprise/:eId/safes` response. WP paginates with the v2
 * `prevId`/`nextBatchPrevId` convention; the SDK re-exposes it as an opaque `cursor`/`nextCursor`
 * (see `list`).
 * @experimental
 */
const ListSafesResponse = t.intersection([
  t.type({ safes: t.array(SafeData) }),
  t.partial({ nextBatchPrevId: t.string }),
]);

/** The only slots whose backup root can be caller-supplied; MPC slots have no pub-only backup. */
const MULTISIG_ROOT_SLOTS: MultisigRootKeyType[] = ['secp256k1Multisig', 'ed25519Multisig'];

/**
 * Validates `multisigRoots` and returns the slots, in canonical order, that carry a caller-supplied
 * backup root. Throws for any key that is not a multisig slot, so an MPC slot can never reach a
 * ceremony.
 */
function externalBackupSlotsOf(multisigRoots: SafeMultisigRootKeys | undefined): MultisigRootKeyType[] {
  if (multisigRoots === undefined) {
    return [];
  }
  const unsupported = Object.keys(multisigRoots).filter((key) => !MULTISIG_ROOT_SLOTS.some((slot) => slot === key));
  if (unsupported.length > 0) {
    throw new Error(
      `multisigRoots only supports the multisig slots (${MULTISIG_ROOT_SLOTS.join(', ')}); got: ${unsupported.join(
        ', '
      )}`
    );
  }
  const slots = MULTISIG_ROOT_SLOTS.filter((slot) => multisigRoots[slot] !== undefined);
  for (const slot of slots) {
    const backupXpub = multisigRoots[slot]?.backupXpub;
    if (typeof backupXpub !== 'string' || backupXpub.length === 0) {
      throw new Error(`multisigRoots.${slot}.backupXpub must be a non-empty string`);
    }
  }
  return slots;
}

/**
 * Validates a caller-supplied backup root and returns the pub to register.
 *
 * Slot ①: must be a valid xpub (never a private key). Slot ④: an ed25519 StrKey is converted to the
 * derivable format (`pub32 || chainCode32`) by appending a fresh chain code, exactly as
 * `Keychains.createBackup` does for a local key; a 103-character derivable pub is used as is. The
 * derivable pub, including its chain code, is what goes on the keycard.
 */
function prepareExternalBackupPub(
  slot: MultisigRootKeyType,
  coin: IBaseCoin,
  external: SafeMultisigRootKeyOptions
): string {
  const { backupXpub } = external;
  if (slot === 'secp256k1Multisig') {
    // The coin's own check: a valid xpub in BitGo's key encoding, never a private key.
    if (!coin.isValidPub(backupXpub)) {
      throw new Error('Safe secp256k1Multisig backupXpub must be a valid xpub (a private key is never accepted)');
    }
    return backupXpub;
  }
  const pub = isValidEd25519StrKeyPublicKey(backupXpub)
    ? encodeDerivableEd25519Pub(decodeEd25519StrKeyPublicKey(backupXpub), generateEd25519ChainCode())
    : backupXpub;
  if (!isDerivableEd25519Pub(pub)) {
    throw new Error(
      'Safe ed25519Multisig backupXpub must be an ed25519 public key (StrKey) or a 103-character derivable public key'
    );
  }
  return pub;
}

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
   * initialize (Phase 1) → createSafeKeys (Phase 2, enabled-slot ceremonies) →
   * finalize (Phase 3). HOT custody only in v1.
   *
   * With `multisigRoots`, the listed multisig slots take a caller-supplied backup root public key
   * (BYOK) instead of a locally generated backup key; they are declared to the server at initialize.
   *
   * If a key ceremony fails, `createSafeKeys` archives the safe before throwing, so a failed run
   * leaves no half-created safe behind — create a new safe and retry.
   * @experimental
   */
  async generateSafe(params: CreateSafeOptions): Promise<Safe> {
    // Validate before initialize so a bad option never leaves a half-created safe behind.
    const externalBackupSlots = externalBackupSlotsOf(params.multisigRoots);
    const safe = await this.initializeSafe({
      label: params.label,
      ...(externalBackupSlots.length > 0 ? { externalBackupSlots } : {}),
    });
    const rootKeys = await this.createSafeKeys({
      ...params,
      safeId: safe.id,
      enabledRootSlots: safe.enabledRootSlots,
      externalBackupSlots: safe.externalBackupSlots,
    });
    return await this.finalizeSafe(safe.id, rootKeys);
  }

  /**
   * Phase 1 — initialize a safe (metadata only, no key material).
   * POST /api/v2/enterprise/:eId/safes { label, externalBackupSlots? }
   * Response is `{ id, status }` plus optional `enabledRootSlots` and `externalBackupSlots`
   * (absent on older WP).
   * @experimental
   */
  async initializeSafe(params: InitializeSafeOptions): Promise<InitializeSafeResponse> {
    // Encoding does not validate, so reject an MPC slot name here rather than at the server.
    if (params.externalBackupSlots !== undefined && !t.array(MultisigRootKeyType).is(params.externalBackupSlots)) {
      throw new Error(`externalBackupSlots only supports the multisig slots (${MULTISIG_ROOT_SLOTS.join(', ')})`);
    }
    const response = await postWithCodec(this.bitgo, this.url(), InitializeSafeBody, params).result();
    return decodeWithCodec(InitializeSafeResponse, response, 'InitializeSafeResponse');
  }

  /**
   * Phase 2 — run the enabled root key ceremonies tagged with `safeId`; returns ordered
   * [user, backup, bitgo] triplets for those slots. HOT custody only in v1.
   *
   * Absent `enabledRootSlots` (older WP, pre-gating) runs all 4 slots. Enabled ceremonies
   * (2.1 multisig ①④, 2.2 MPC ②③) run in parallel. If any of them fail, the
   * partially-created safe is archived (a legal `initializing → archived` transition, so the
   * orphaned tagged keys are inert) and an error listing every ceremony failure is thrown —
   * create a new safe and retry.
   *
   * Not independently idempotent: re-running against a safe that already has some roots hits WP's
   * unique root-slot index.
   *
   * `multisigRoots` must agree with the `externalBackupSlots` the server recorded at initialize (a
   * slot with a supplied backup key that was not declared, or the reverse, throws before any key is
   * created, and the safe is archived).
   * @experimental
   */
  async createSafeKeys(params: CreateSafeOptions & SafeCreationHandle): Promise<SafeKeys> {
    const { safeId, passphrase, enabledRootSlots, multisigRoots } = params;
    const enterprise = this.enterpriseId;

    const suppliedSlots = externalBackupSlotsOf(multisigRoots);
    const declaredSlots = new Set(params.externalBackupSlots ?? []);
    const notDeclared = suppliedSlots.filter((slot) => !declaredSlots.has(slot));
    const notSupplied = [...declaredSlots].filter((slot) => !suppliedSlots.includes(slot));
    const notEnabled =
      enabledRootSlots === undefined ? [] : suppliedSlots.filter((slot) => !enabledRootSlots.includes(slot));
    if (notDeclared.length > 0 || notSupplied.length > 0 || notEnabled.length > 0) {
      const problems = [
        notDeclared.length > 0 ? `backup key supplied but not declared at initialize: ${notDeclared.join(', ')}` : '',
        notSupplied.length > 0 ? `declared at initialize but no backup key supplied: ${notSupplied.join(', ')}` : '',
        notEnabled.length > 0 ? `backup key supplied for a slot that is not enabled: ${notEnabled.join(', ')}` : '',
      ].filter((problem) => problem !== '');
      let message = `multisigRoots does not match the safe's external backup slots (${problems.join('; ')}).`;
      // No key exists yet, but leave no initializing safe behind.
      try {
        await this.archiveSafe(safeId);
        message += ` The safe (${safeId}) has been archived; create a new safe and retry.`;
      } catch (e) {
        message += ` NOTE: archiving the safe (${safeId}) also failed (${
          e instanceof Error ? e.message : String(e)
        }); archive it manually before retrying.`;
      }
      throw new Error(message);
    }

    // Absent `enabledRootSlots` (older WP, pre-gating) ⇒ all 4, preserving current behavior.
    // Ordered by scheme: the two multisig roots first, then the two MPC roots.
    const enabled = new Set(enabledRootSlots ?? SAFE_ROOT_SLOTS);
    const slots = SAFE_ROOT_SLOTS.filter((slot) => enabled.has(slot));
    const ceremonies: Record<RootKeyType, () => Promise<RootKeyTriplet>> = {
      // Phase 2.1 — multisig roots (①④): local user/backup keypairs + BitGo key, all safeId-tagged.
      secp256k1Multisig: () =>
        this.createMultisigRoot('secp256k1Multisig', safeId, passphrase, enterprise, multisigRoots?.secp256k1Multisig),
      ed25519Multisig: () =>
        this.createMultisigRoot('ed25519Multisig', safeId, passphrase, enterprise, multisigRoots?.ed25519Multisig),
      // Phase 2.2 — MPC roots (②③): the existing DKLS (②) and EdDSA (③) ceremonies, safeId threaded.
      ecdsaMpc: () => this.createMpcRoot('ecdsaMpc', safeId, passphrase, enterprise),
      eddsaMpc: () => this.createMpcRoot('eddsaMpc', safeId, passphrase, enterprise),
    };
    const results = await Promise.allSettled(slots.map((slot) => ceremonies[slot]()));

    // Single pass over the settled results: `status === 'fulfilled'` narrows `.value` to a
    // RootKeyTriplet, and rejections are collected per-slot for the error below.
    const hot: RootKeysByType = {};
    const failures: string[] = [];
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        hot[slots[i]] = result.value;
      } else {
        const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
        // ApiResponseError carries the server-echoed `Request-ID` header — include it (when
        // present) so a failed ceremony can be correlated with WP's server-side logs.
        const requestId = result.reason instanceof ApiResponseError ? result.reason.requestId : undefined;
        failures.push(`${slots[i]}: ${reason}${requestId ? ` (requestId: ${requestId})` : ''}`);
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
   * Phase 3 — finalize a safe with the minted root key ids as ordered [user, backup, bitgo] triplets.
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
   * Phase 2.1 helper — mint one onchain-multisig root (cold model, as wallet creation does today):
   * generate user/backup keypairs locally, encrypt with `passphrase`, register via POST /:coin/key
   * with `safeId`; the BitGo key is created through the same route's `source:'bitgo'` path.
   * With `external`, the backup is the caller-supplied public key (BYOK) added as a pub-only
   * `source: 'backup'` key, and no backup private key is generated or encrypted.
   * Returns the [user, backup, bitgo] key id triplet.
   * @experimental
   */
  private async createMultisigRoot(
    slot: MultisigRootKeyType,
    safeId: string,
    passphrase: string,
    enterprise: string,
    external?: SafeMultisigRootKeyOptions
  ): Promise<RootKeyTriplet> {
    const coin = coinForRoot(this.bitgo, slot);
    const keychains = coin.keychains();
    // Validate the supplied pub before any key is created for this slot.
    const externalBackupPub = external === undefined ? undefined : prepareExternalBackupPub(slot, coin, external);

    const userKeyPair = keychains.create();
    const userKeychainPromise = keychains.add({
      pub: userKeyPair.pub,
      encryptedPrv: await this.bitgo.encrypt({ input: userKeyPair.prv, password: passphrase }),
      source: 'user',
      safeId,
    });
    const backupKeychainPromise: Promise<Keychain> =
      externalBackupPub === undefined
        ? keychains.createBackup({ passphrase, safeId })
        : keychains.add({ pub: externalBackupPub, source: 'backup', safeId, enterprise });
    const bitgoKeychainPromise = keychains.createBitGo({ enterprise, safeId });

    const [userKeychain, backupKeychain, bitgoKeychain] = await Promise.all([
      userKeychainPromise,
      backupKeychainPromise,
      bitgoKeychainPromise,
    ]);

    // Slot ④ roots use neutral raw public derivation material (32-byte public key plus 32-byte
    // chain code), serialized together as canonical unpadded RFC 4648 base32 (103 characters).
    // Coin-specific child encoding is performed by Wallet Platform after soft derivation.
    if (
      slot === 'ed25519Multisig' &&
      (!backupKeychain.pub ||
        !isDerivableEd25519Pub(backupKeychain.pub) ||
        !bitgoKeychain.pub ||
        !isDerivableEd25519Pub(bitgoKeychain.pub))
    ) {
      throw new Error('Safe ed25519Multisig roots are not derivable: expected 64-byte canonical base32 material');
    }

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
    const { userKeychain, backupKeychain, bitgoKeychain } = await coinForRoot(this.bitgo, slot)
      .keychains()
      .createMpc({ multisigType: 'tss', passphrase, enterprise, safeId });
    return [userKeychain.id, backupKeychain.id, bitgoKeychain.id];
  }

  /**
   * List the enterprise's safes the caller is a member of (cursor pagination).
   * GET /api/v2/enterprise/:eId/safes?limit&prevId
   *
   * `cursor` is the opaque `nextCursor` returned by a previous call; page forward until
   * `nextCursor` is absent.
   * @experimental
   */
  async list(params: ListSafesOptions = {}): Promise<{ safes: Safe[]; nextCursor?: string }> {
    // SDK exposes an opaque cursor; WP speaks prevId/nextBatchPrevId (v2 list convention).
    const query: { limit?: number; prevId?: string } = {};
    if (params.limit !== undefined) {
      query.limit = params.limit;
    }
    if (params.cursor !== undefined) {
      query.prevId = params.cursor;
    }
    const response = await this.bitgo.get(this.url()).query(query).result();
    const { safes, nextBatchPrevId } = decodeWithCodec(ListSafesResponse, response, 'ListSafesResponse');
    return {
      safes: safes.map((safeData) => new Safe(this.bitgo, safeData)),
      nextCursor: nextBatchPrevId,
    };
  }

  /**
   * Fetch a single safe by id. Non-members get a 404 (existence is not leaked).
   * GET /api/v2/enterprise/:eId/safes/:safeId
   * @experimental
   */
  async get(params: GetSafeOptions): Promise<Safe> {
    const response = await this.bitgo.get(this.url(`/${params.id}`)).result();
    const safeData = decodeWithCodec(SafeData, response, 'SafeData');
    return new Safe(this.bitgo, safeData);
  }
}
