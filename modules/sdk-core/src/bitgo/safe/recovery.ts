/**
 * @prettier
 *
 * @experimental WRW-facing safe recovery entry points.
 */
import { Buffer } from 'buffer';
import { randomBytes } from 'crypto';
import { bip32 } from '@bitgo/utxo-lib';
import { MAX_BIP32_INDEX } from '@bitgo/statics';
import type { RootKeyType } from '@bitgo/public-types';
import {
  buildSafeBip44Path,
  decodeEd25519StrKeyPublicKey,
  deriveSafeChildEd25519Hardened,
  deriveSafeChildTriplet,
  Ed25519ChainCodeEntryCodec,
  getSafeBip44CoinType,
  parseSafeBip44Path,
  parseSafeKeycardBox,
  toSoftTwinPath,
  type SafeKeycardRootEntry,
} from '@bitgo/sdk-lib-safes';
import {
  softDeriveChildPubEd25519AtPath,
  softDeriveChildPrvEd25519AtPath,
  type Ed25519ExtendedKeyParts,
} from './derivableEd25519Pub';
import { DklsVrfUtils, MpsVrfUtils } from '@bitgo/sdk-lib-mpc';
import { BitGoBase } from '../bitgoBase';
import { IncorrectPasswordError } from '../errors';
import { parseSafeMpcKeyEnvelopes } from '../utils/tss/keyShareEnvelope';

export type DecryptedMpcSafeRoot = { signing: Buffer; vrf: Buffer };

export type OnchainSafeRoot = { user: string; backup: string; bitgo: string };
export type MpcSafeRoot = { user: DecryptedMpcSafeRoot; backup: DecryptedMpcSafeRoot; bitgo: string };
export type Ed25519MultisigSafeRoot = {
  user: string;
  backup: { prv: string; chainCode: string };
  bitgo: string;
};

export type Secp256k1MultisigChildKeys = {
  user: { prv: string; pub: string };
  backup: { prv: string; pub: string };
  bitgo: { pub: string };
};

export type EcdsaMpcChildKeys = {
  commonKeychain: string;
  user: string;
  backup: string;
};

export type EddsaMpcChildKeys = EcdsaMpcChildKeys;

/**
 * A hardened (SLIP-0010) ed25519 child. The `kind` discriminator prevents a raw seed from being
 * mistaken for an extended key downstream — both are 32-byte values that `isValidPub` would accept.
 */
export type SafeEd25519SeedKey = {
  readonly kind: 'seed';
  readonly seed: string; // 32-byte child seed (hex) — the signer input
  readonly pub: string; // 32-byte public key (hex)
};

/**
 * A soft (BIP32-Ed25519) ed25519 child. No 32-byte seed maps back to a soft-derived child, so the
 * signer needs both halves directly: `kL` (the clamped scalar) and `kR` (the nonce prefix).
 */
export type SafeEd25519ExtendedKey = { readonly kind: 'extended' } & Ed25519ExtendedKeyParts<string>; // hex

/** The three ed25519 co-signer children. BitGo is pub-only: its private key stays in the HSM. */
export type Ed25519MultisigChildKeys = {
  user: SafeEd25519SeedKey;
  backup: SafeEd25519ExtendedKey;
  bitgo: { readonly pub: string };
};

export type DerivedSafeWalletKeys =
  | { slot: 'secp256k1Multisig'; path: string; keys: Secp256k1MultisigChildKeys }
  | { slot: 'ecdsaMpc'; path: string; keys: EcdsaMpcChildKeys }
  | { slot: 'eddsaMpc'; path: string; keys: EddsaMpcChildKeys }
  | { slot: 'ed25519Multisig'; path: string; keys: Ed25519MultisigChildKeys };

export type SafeRecoverKeyParams = {
  userKey: string;
  backupKey: string;
  bitgoKey: string;
  walletPassphrase?: string;
};

export type DecryptedSafeRoots = {
  secp256k1Multisig: OnchainSafeRoot;
  ed25519Multisig: Ed25519MultisigSafeRoot;
  ecdsaMpc: MpcSafeRoot;
  eddsaMpc: MpcSafeRoot;
};

export async function decryptSafeKeycard(params: {
  bitgo: BitGoBase;
  userKeyBox: string;
  backupKeyBox: string;
  bitgoKeyBox: string;
  password: string;
}): Promise<DecryptedSafeRoots> {
  const { bitgo, userKeyBox, backupKeyBox, bitgoKeyBox, password } = params;

  const userRoots = parseSafeKeycardBox(userKeyBox);
  const backupRoots = parseSafeKeycardBox(backupKeyBox);
  const bitgoRoots = parseSafeKeycardBox(bitgoKeyBox);

  const decryptRoot = async (root: string): Promise<string> => {
    try {
      return await bitgo.decrypt({ input: root, password });
    } catch (e) {
      throw new IncorrectPasswordError('unable to decrypt the safe keycard with the provided password', e);
    }
  };

  const unwrapMpcRoot = (decrypted: string): DecryptedMpcSafeRoot => {
    try {
      return parseSafeMpcKeyEnvelopes(decrypted);
    } catch (e) {
      throw new IncorrectPasswordError('unable to decrypt the safe keycard with the provided password', e);
    }
  };

  // Only box B's ed25519Multisig slot may carry the derivable `{ prv, chainCode }` object; every
  // other entry — all of boxes A and C, and every non-ed25519 slot in box B — is a bare string and
  // fails closed if it carries the object instead.
  const requireBareString = (entry: SafeKeycardRootEntry): string => {
    if (Ed25519ChainCodeEntryCodec.is(entry)) {
      throw new Error('unexpected ed25519 chain-code entry where a bare string was required');
    }
    return entry;
  };

  const decryptEd25519Backup = async (entry: SafeKeycardRootEntry): Promise<{ prv: string; chainCode: string }> => {
    if (!Ed25519ChainCodeEntryCodec.is(entry)) {
      throw new Error('ed25519 backup root must carry a chain code');
    }
    return { prv: await decryptRoot(entry.prv), chainCode: entry.chainCode };
  };

  return {
    secp256k1Multisig: {
      user: await decryptRoot(requireBareString(userRoots.secp256k1Multisig)),
      backup: await decryptRoot(requireBareString(backupRoots.secp256k1Multisig)),
      bitgo: requireBareString(bitgoRoots.secp256k1Multisig),
    },
    ed25519Multisig: {
      user: await decryptRoot(requireBareString(userRoots.ed25519Multisig)),
      backup: await decryptEd25519Backup(backupRoots.ed25519Multisig),
      bitgo: requireBareString(bitgoRoots.ed25519Multisig),
    },
    ecdsaMpc: {
      user: unwrapMpcRoot(await decryptRoot(requireBareString(userRoots.ecdsaMpc))),
      backup: unwrapMpcRoot(await decryptRoot(requireBareString(backupRoots.ecdsaMpc))),
      bitgo: requireBareString(bitgoRoots.ecdsaMpc),
    },
    eddsaMpc: {
      user: unwrapMpcRoot(await decryptRoot(requireBareString(userRoots.eddsaMpc))),
      backup: unwrapMpcRoot(await decryptRoot(requireBareString(backupRoots.eddsaMpc))),
      bitgo: requireBareString(bitgoRoots.eddsaMpc),
    },
  };
}

/**
 * Derives a Safe wallet's child keys at the BIP44 path for a given slot and account.
 * Supports all four slots: `secp256k1Multisig`, `ed25519Multisig`, `ecdsaMpc`, and `eddsaMpc`.
 */
export async function deriveSafeWalletKeys(params: {
  coin: string;
  slot: RootKeyType;
  account: number;
  roots: DecryptedSafeRoots;
}): Promise<DerivedSafeWalletKeys> {
  if (!Number.isInteger(params.account) || params.account < 0 || params.account > MAX_BIP32_INDEX) {
    throw new Error(`deriveSafeWalletKeys: invalid account '${params.account}'`);
  }

  const { account, roots } = params;
  const path = buildSafeBip44Path(getSafeBip44CoinType(params.coin), params.slot, account);
  const { coinType, slotOrdinal } = parseSafeBip44Path(path);

  if (params.slot === 'secp256k1Multisig') {
    return { slot: 'secp256k1Multisig', path, keys: deriveSafeChildTriplet(roots.secp256k1Multisig, path) };
  }

  if (params.slot === 'ecdsaMpc') {
    const { commonKeychain, userChild, backupChild } = await DklsVrfUtils.deriveSafeEcdsaMpcChild({
      userRoot: roots.ecdsaMpc.user,
      backupRoot: roots.ecdsaMpc.backup,
      account,
      coinType,
      safeSlotOrdinal: slotOrdinal,
    });
    return {
      slot: 'ecdsaMpc',
      path,
      keys: { commonKeychain, user: userChild, backup: backupChild },
    };
  }

  if (params.slot === 'eddsaMpc') {
    const { commonKeychain, userChild, backupChild } = await MpsVrfUtils.deriveSafeEddsaMpcChild({
      userRoot: roots.eddsaMpc.user,
      backupRoot: roots.eddsaMpc.backup,
      account,
      coinType,
      safeSlotOrdinal: slotOrdinal,
    });
    return {
      slot: 'eddsaMpc',
      path,
      keys: { commonKeychain, user: userChild, backup: backupChild },
    };
  }

  if (params.slot === 'ed25519Multisig') {
    const root = roots.ed25519Multisig;
    const cosignerPath = toSoftTwinPath(path);

    const user = deriveSafeChildEd25519Hardened(root.user, path);
    const backup = await softDeriveChildPrvEd25519AtPath({
      seedStrKey: root.backup.prv,
      chainCode: root.backup.chainCode,
      path: cosignerPath,
    });
    const bitgo = await softDeriveChildPubEd25519AtPath(root.bitgo, cosignerPath);

    return {
      slot: 'ed25519Multisig',
      path,
      keys: {
        user: { kind: 'seed', seed: user.prv, pub: decodeEd25519StrKeyPublicKey(user.pub).toString('hex') },
        backup: {
          kind: 'extended',
          kL: backup.kL.toString('hex'),
          kR: backup.kR.toString('hex'),
          pub: backup.pub.toString('hex'),
        },
        bitgo: { pub: bitgo.toString('hex') },
      },
    };
  }

  throw new Error(`deriveSafeWalletKeys: slot '${params.slot}' is not supported yet`);
}

/**
 * Builds the key fields `coin.recover()` expects from derived Safe child keys.
 * Only `secp256k1Multisig` (slot 1) is supported for now. Signed mode re-encrypts the
 * child xprvs under a fresh ephemeral passphrase (v1/SJCL); unsigned mode returns pubs.
 */
export async function buildSafeRecoverKeyParams(params: {
  bitgo: BitGoBase;
  coin: string;
  slot: RootKeyType;
  keys: Secp256k1MultisigChildKeys;
  mode: 'signed' | 'unsigned';
}): Promise<SafeRecoverKeyParams> {
  if (params.slot !== 'secp256k1Multisig') {
    throw new Error(`buildSafeRecoverKeyParams: slot '${params.slot}' is not supported yet`);
  }
  const { bitgo, keys, mode } = params;

  if (mode === 'unsigned') {
    return {
      userKey: keys.user.pub,
      backupKey: keys.backup.pub,
      bitgoKey: keys.bitgo.pub,
    };
  }

  const userPrv = bip32.fromBase58(keys.user.prv);
  const backupPrv = bip32.fromBase58(keys.backup.prv);
  if (!userPrv.privateKey || !backupPrv.privateKey) {
    throw new Error('buildSafeRecoverKeyParams: keys.user.prv and keys.backup.prv must be private xprvs');
  }

  const walletPassphrase = randomBytes(32).toString('hex');
  const [userKey, backupKey] = await Promise.all([
    bitgo.encrypt({ input: keys.user.prv, password: walletPassphrase, encryptionVersion: 1 }),
    bitgo.encrypt({ input: keys.backup.prv, password: walletPassphrase, encryptionVersion: 1 }),
  ]);

  return {
    userKey,
    backupKey,
    bitgoKey: keys.bitgo.pub,
    walletPassphrase,
  };
}
