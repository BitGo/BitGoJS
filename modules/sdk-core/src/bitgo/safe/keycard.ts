/**
 * @prettier
 *
 * @experimental Safe keycard regeneration (WCN-3922): the keycard access/claim wire codecs,
 * the Box D (passcode) decryption helper, and `buildSafeKeycardRoots`, which assembles the
 * per-slot keychain triplets a regenerated keycard needs — re-encrypting user material under
 * the keycard (creation) password and reducing MPC signing shares to their keycard subset.
 */
import * as t from 'io-ts';
import type { RootKeyType } from '@bitgo/public-types';
import { DklsTypes, MPSTypes } from '@bitgo/sdk-lib-mpc';
import { BitGoBase } from '../bitgoBase';
import { IncorrectPasswordError } from '../errors';
import type { IEncryptionSession } from '../../api';
import type { KeychainsTriplet } from '../baseCoin';
import type { Keychain } from '../keychain';
import { buildSafeMpcKeyEnvelopes, parseSafeMpcKeyEnvelopes } from '../utils/tss/keyShareEnvelope';
import { SAFE_ROOT_SLOTS } from './rootCoin';

// One claimed root key, mirroring WP's `SafeKeycardRootKey` projection (WCN-3921). Exact codecs
// strip anything else, so the decoded value is a `Keychain` as-is and shape drift fails here.
const ClaimedKeychainCodec = t.intersection([
  t.exact(
    t.type({
      id: t.string,
      type: t.keyof({ tss: null, independent: null }),
      source: t.keyof({ user: null, backup: null, bitgo: null, cold: null }),
    })
  ),
  t.exact(t.partial({ pub: t.string, commonKeychain: t.string, encryptedPrv: t.string })),
]);
const ClaimedTripletCodec = t.type({
  user: ClaimedKeychainCodec,
  backup: ClaimedKeychainCodec,
  bitgo: ClaimedKeychainCodec,
});

// t.record over a t.keyof domain would require every slot; safe keycard material declares a
// subset, so the keys decode as strings and claimKeycardMaterial rejects unknown slots itself.
export const SafeKeycardMaterialCodec = t.type({
  roots: t.record(t.string, ClaimedTripletCodec),
  // Safes created before passcode codes existed have none; WP may serialize that as null.
  passcodeEncryptionCode: t.union([t.string, t.null, t.undefined]),
});

export const SafeKeycardAccessCodec = t.intersection([t.type({ expiresAt: t.string }), t.record(t.string, t.unknown)]);
export const SafeKeycardPendingApprovalCodec = t.intersection([
  t.type({ id: t.string, state: t.string }),
  t.record(t.string, t.unknown),
]);
export const RequestKeycardAccessResponseCodec = t.union([
  t.type({ keycardAccess: SafeKeycardAccessCodec }),
  t.type({ pendingApproval: SafeKeycardPendingApprovalCodec }),
]);

// 409 body when a request is already pending: the pending approval's id (WCN-3921, tags-flow shape).
export const RequestKeycardAccessConflictCodec = t.type({ pendingApproval: t.string });

export type SafeKeycardAccess = { expiresAt: string; [field: string]: unknown };
export type SafeKeycardPendingApproval = { id: string; state: string; [field: string]: unknown };

/**
 * Result of `Safe.requestKeycardAccess`: the active grant (200), the pending approval this request
 * created (202), or the id of the approval already pending from an earlier request (409).
 */
export type RequestKeycardAccessResult =
  | { keycardAccess: SafeKeycardAccess }
  | { pendingApproval: SafeKeycardPendingApproval }
  | { pendingApprovalId: string };

/** The safe's root triplets, keyed by rootKeyType. Any non-empty subset of the four slots. */
export type SafeKeychainRoots = Partial<Record<RootKeyType, KeychainsTriplet>>;

/** Material claimed from POST /safes/:safeId/keycard (WCN-3921 route contract). */
export type SafeKeycardMaterial = { roots: SafeKeychainRoots; passcodeEncryptionCode?: string };

/**
 * Thrown by {@link buildSafeKeycardRoots} when a backup root opens with the current password but
 * not with the given creation password. This happens for safes whose password was changed before
 * WCN-3920 write-protected backup envelopes, because that rotation re-encrypted the backups too.
 * For these safes the current password is the keycard password: rebuild with
 * `keycardPassphrase = currentPassphrase`, and write Box D with that same password. It extends
 * `IncorrectPasswordError`, so existing wrong-password handling still catches it.
 * @experimental
 */
export class SafeKeycardBackupsOnCurrentPasswordError extends IncorrectPasswordError {
  public readonly slot: RootKeyType;

  public constructor(slot: RootKeyType, cause?: unknown) {
    super(
      `the safe ${slot} backup root is encrypted under the current password, not the creation password ` +
        '(a password change rotated it before backups were write-protected); ' +
        'rebuild the keycard with the current password as keycardPassphrase',
      cause
    );
    this.name = 'SafeKeycardBackupsOnCurrentPasswordError';
    this.slot = slot;
  }
}
/**
 * Decrypts Box D of a safe keycard — the safe password encrypted under the passcode
 * encryption code — back into the creation password. Handles v1 and v2 envelopes.
 */
export async function decryptSafeKeycardBoxD(params: {
  bitgo: BitGoBase;
  boxD: string;
  passcodeEncryptionCode: string;
}): Promise<string> {
  try {
    return await params.bitgo.decrypt({ input: params.boxD, password: params.passcodeEncryptionCode });
  } catch (e) {
    throw new IncorrectPasswordError(
      'unable to decrypt the keycard Box D with the provided passcode encryption code',
      e
    );
  }
}

/** Re-encryption state shared by one {@link buildSafeKeycardRoots} call; each method builds one slot. */
class SafeKeycardRootBuilder {
  private session: IEncryptionSession | undefined;
  private keycardPassphraseVerified = false;

  constructor(
    private readonly bitgo: BitGoBase,
    private readonly currentPassphrase: string,
    private readonly keycardPassphrase: string
  ) {}

  destroy(): void {
    this.session?.destroy();
  }

  /** Multisig: re-encrypt the user envelope; copy the backup envelope byte-identical. */
  async buildMultisigSlot(slot: RootKeyType, triplet: KeychainsTriplet): Promise<KeychainsTriplet> {
    const { userKeychain, backupKeychain, bitgoKeychain } = triplet;
    if (!userKeychain.encryptedPrv || !backupKeychain.encryptedPrv) {
      throw new Error(`safe ${slot} user/backup root is missing encryptedPrv`);
    }
    await this.verifyKeycardPassphrase(backupKeychain.encryptedPrv, slot);
    const userPrv = await this.decryptUser(userKeychain.encryptedPrv, slot);
    return {
      userKeychain: { ...userKeychain, encryptedPrv: await this.encrypt(userPrv) },
      // The backup envelope never leaves the creation password — copy it byte-identical.
      backupKeychain,
      bitgoKeychain,
    };
  }

  /** MPC: reduce the user share; copy an already-reduced backup, else reduce the full one. */
  async buildMpcSlot(slot: 'ecdsaMpc' | 'eddsaMpc', triplet: KeychainsTriplet): Promise<KeychainsTriplet> {
    const { userKeychain, backupKeychain, bitgoKeychain } = triplet;
    if (!userKeychain.encryptedPrv) {
      throw new Error(`safe ${slot} user root is missing encryptedPrv`);
    }
    // The reduced share embeds commonKeychain (MPS) or must match it, so every copy on the
    // triplet has to agree: a mismatched claimed value would print a root that cannot sign.
    const commonKeychains = new Set(
      [userKeychain, backupKeychain, bitgoKeychain].map((k) => k.commonKeychain).filter((c) => c !== undefined)
    );
    if (commonKeychains.size !== 1) {
      throw new Error(`safe ${slot} root ${commonKeychains.size ? 'has mismatched' : 'is missing'} commonKeychain`);
    }
    const [commonKeychain] = commonKeychains as Set<string>;

    let outBackupKeychain: Keychain;
    // A backup that already carries its reduced envelope (the triplets `generateSafe` returns:
    // WP redacts the backup encryptedPrv on the key-add response, and the ceremony keeps the
    // local reducedEncryptedPrv) is copied as-is, like a multisig backup. Otherwise — claimed
    // material, which carries the full backup envelope — it is reduced from encryptedPrv.
    // Only a usable string counts: null or empty falls through to the full-envelope reduce.
    const { reducedEncryptedPrv: backupReduced, encryptedPrv: backupFull } = backupKeychain;
    if (typeof backupReduced === 'string' && backupReduced.length > 0) {
      // Copied without being opened, so prove keycardPassphrase opens it (once per call).
      await this.verifyKeycardPassphrase(backupReduced, slot);
      outBackupKeychain = backupKeychain;
    } else if (backupFull) {
      const full = await this.decryptBackup(backupFull, slot);
      // Opening the full backup envelope already proved the creation password.
      this.keycardPassphraseVerified = true;
      outBackupKeychain = { ...backupKeychain, reducedEncryptedPrv: await this.reduce(full, slot, commonKeychain) };
    } else {
      throw new Error(`safe ${slot} backup root is missing both encryptedPrv and reducedEncryptedPrv`);
    }

    const userFull = await this.decryptUser(userKeychain.encryptedPrv, slot);
    return {
      userKeychain: { ...userKeychain, reducedEncryptedPrv: await this.reduce(userFull, slot, commonKeychain) },
      backupKeychain: outBackupKeychain,
      bitgoKeychain,
    };
  }

  /** Reduces a decrypted safe MPC envelope to its keycard subset, encrypted under keycardPassphrase. */
  private async reduce(full: string, slot: 'ecdsaMpc' | 'eddsaMpc', commonKeychain: string): Promise<string> {
    const { signing, vrf } = parseSafeMpcKeyEnvelopes(full);
    const reduced =
      slot === 'ecdsaMpc' ? DklsTypes.reduceDklsKeyShare(signing) : MPSTypes.reduceMpsKeyShare(signing, commonKeychain);
    const { reducedEnvelope } = buildSafeMpcKeyEnvelopes(signing, reduced, vrf);
    return this.encrypt(
      // btoa, not Buffer.toString('base64'): the browser deals with a Buffer as Uint8Array,
      // where .toString('base64') would produce a comma-separated string (see the
      // creation ceremonies' createParticipantKeychain).
      btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(reducedEnvelope))))
    );
  }

  private async encrypt(plaintext: string): Promise<string> {
    // One session (one KDF run) is shared across every slot; created lazily so a material
    // set with nothing to re-encrypt pays no KDF.
    this.session ??= await this.bitgo.createEncryptionSession(this.keycardPassphrase);
    return this.session.encrypt(plaintext);
  }

  private async decryptUser(envelope: string, slot: RootKeyType): Promise<string> {
    try {
      return await this.bitgo.decrypt({ input: envelope, password: this.currentPassphrase });
    } catch (e) {
      throw new IncorrectPasswordError(`unable to decrypt the safe ${slot} user root with the provided passphrase`, e);
    }
  }

  private async decryptBackup(envelope: string, slot: RootKeyType): Promise<string> {
    try {
      return await this.bitgo.decrypt({ input: envelope, password: this.keycardPassphrase });
    } catch (e) {
      throw await this.backupPasswordError(envelope, slot, e);
    }
  }

  // Copied backups (multisig envelopes, already-reduced MPC envelopes) are never opened, so
  // nothing else on those paths proves keycardPassphrase is the creation password: a mistyped
  // one would yield a keycard whose Box A/D use one password and Box B another. One trial
  // decrypt per call settles it, since every backup stays on the creation password.
  private async verifyKeycardPassphrase(envelope: string, slot: RootKeyType): Promise<void> {
    if (!this.keycardPassphraseVerified) {
      await this.decryptBackup(envelope, slot);
      this.keycardPassphraseVerified = true;
    }
  }

  // Classifies a backup envelope that keycardPassphrase failed to open. If the current password
  // opens it instead, the backups were rotated by a password change that ran before WCN-3920
  // write-protected them: say so with a dedicated error, so the caller can rebuild under the
  // current password. Switching passwords here would silently desync the card from the Box D
  // the caller writes with keycardPassphrase. Costs one extra decrypt, on the failure path only.
  private async backupPasswordError(
    envelope: string,
    slot: RootKeyType,
    cause: unknown
  ): Promise<IncorrectPasswordError> {
    if (this.currentPassphrase !== this.keycardPassphrase) {
      try {
        await this.bitgo.decrypt({ input: envelope, password: this.currentPassphrase });
        return new SafeKeycardBackupsOnCurrentPasswordError(slot, cause);
      } catch (probeError) {
        // Neither password opens it: the creation password is simply wrong (reported below).
      }
    }
    return new IncorrectPasswordError(
      `the keycard (creation) password does not open the safe ${slot} backup root`,
      cause
    );
  }
}

const isTriplet = (value: KeychainsTriplet | null | undefined): value is KeychainsTriplet =>
  !!value && !!value.userKeychain && !!value.backupKeychain && !!value.bitgoKeychain;

/**
 * Assembles the per-slot keychain triplets a regenerated safe keycard carries, from claimed
 * material (or the triplets returned by `generateSafe`). Multisig user envelopes are re-encrypted
 * under the keycard password; multisig backup envelopes are copied byte-identical. MPC roots are
 * decrypted, reduced to the keycard subset (`reduceDklsKeyShare` / `reduceMpsKeyShare`), re-wrapped
 * into the versioned signing+VRF reduced envelope and encrypted as `reducedEncryptedPrv` — the
 * same form the creation ceremony stores. An MPC backup that already carries `reducedEncryptedPrv`
 * (the `generateSafe` shape) is copied as-is instead. Every copied backup is checked against
 * `keycardPassphrase` first, so a wrong creation password throws `IncorrectPasswordError` rather
 * than producing a mixed-password keycard. A backup that opens only with `currentPassphrase`
 * (rotated by a password change before backups were write-protected) throws
 * {@link SafeKeycardBackupsOnCurrentPasswordError}: rebuild with the current password instead.
 * One encryption session (one KDF run) is shared across every re-encryption and destroyed
 * afterwards; `bitgoKeychain` passes through untouched.
 *
 * Throws on an unknown slot or a slot whose value is not a triplet (including null/undefined),
 * rather than building a keycard that silently lacks that root.
 */
export async function buildSafeKeycardRoots(params: {
  bitgo: BitGoBase;
  material: SafeKeycardMaterial;
  /** Opens user envelopes; same as keycardPassphrase unless the safe password changed. */
  currentPassphrase: string;
  /** The creation password: opens backup envelopes; every output is (re-)encrypted under it. */
  keycardPassphrase: string;
}): Promise<SafeKeychainRoots> {
  const { bitgo, material, currentPassphrase, keycardPassphrase } = params;
  for (const [slot, triplet] of Object.entries(material.roots)) {
    if (!SAFE_ROOT_SLOTS.includes(slot as RootKeyType)) {
      throw new Error(`safe keycard material has unknown root slot ${slot}`);
    }
    if (!isTriplet(triplet)) {
      throw new Error(`safe keycard material ${slot} root is not a keychain triplet`);
    }
  }
  const slots = SAFE_ROOT_SLOTS.filter((slot) => slot in material.roots);
  if (slots.length === 0) {
    throw new Error('safe keycard material carries no root slots');
  }

  const builder = new SafeKeycardRootBuilder(bitgo, currentPassphrase, keycardPassphrase);
  try {
    const roots: SafeKeychainRoots = {};
    for (const slot of slots) {
      const triplet = material.roots[slot] as KeychainsTriplet;
      roots[slot] =
        slot === 'ecdsaMpc' || slot === 'eddsaMpc'
          ? await builder.buildMpcSlot(slot, triplet)
          : await builder.buildMultisigSlot(slot, triplet);
    }
    return roots;
  } finally {
    builder.destroy();
  }
}
