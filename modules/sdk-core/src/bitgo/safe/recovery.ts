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
  algoMultisigAddress,
  encodeAlgoKey,
  encodeHbarPublicKeyDer,
  encodeHbarPrivateKeyDer,
  encodeEd25519StrKeyPublicKey,
  encodeEd25519StrKeySecretSeed,
  type SafeKeycardRootEntry,
} from '@bitgo/sdk-lib-safes';
import {
  signEd25519Extended,
  softDeriveChildPubEd25519AtPath,
  softDeriveChildPrvEd25519AtPath,
  type Ed25519ExtendedKeyParts,
  type ExternalEd25519Signer,
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

export type MpcChildKeys = {
  commonKeychain: string;
  user: string;
  backup: string;
};

export type EcdsaMpcChildKeys = MpcChildKeys;

export type EddsaMpcChildKeys = MpcChildKeys;

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

export type SecpSafeRecoverKeyParams = {
  slot: 'secp256k1Multisig';
  userKey: string;
  backupKey: string;
  bitgoKey: string;
  walletPassphrase?: string;
};

/**
 * Safe recovery key params for the MPC slots (`ecdsaMpc`, `eddsaMpc`). A discriminated union on
 * `mode`, so the invalid combos are not representable: signed mode always carries the re-encrypted
 * child reduced shares and the ephemeral passphrase; unsigned mode carries only the child common
 * keychain.
 *
 * `broadcast: false` is always set so Safe recovery never auto-broadcasts: WRW's coin-agnostic
 * engine spreads these params into `coin.recover()`, and ICP is the one coin whose `recover()`
 * would otherwise submit the sweep to the network.
 */
type MpcSafeRecoverKeyParams<Slot extends 'ecdsaMpc' | 'eddsaMpc'> =
  | {
      slot: Slot;
      mode: 'signed';
      userKey: string;
      backupKey: string;
      bitgoKey: string;
      walletPassphrase: string;
      isTss: true;
      broadcast: false;
    }
  | {
      slot: Slot;
      mode: 'unsigned';
      bitgoKey: string;
      isTss: true;
      broadcast: false;
    };

export type EcdsaMpcSafeRecoverKeyParams = MpcSafeRecoverKeyParams<'ecdsaMpc'>;
export type EddsaMpcSafeRecoverKeyParams = MpcSafeRecoverKeyParams<'eddsaMpc'>;

/**
 * Slot-2 (ed25519Multisig) safe recovery key params. A discriminated union on `mode`, so the invalid
 * combos are not representable: signed mode always carries the lazy signer and never a `backupKey`,
 * unsigned mode always carries the encoded `backupKey` and never a signer or passphrase.
 *
 * `rootAddress` is the wallet's on-chain address. For ALGO it's the 2-of-3 multisig address over the
 * three child pubs — derivable here, but `recover()` still requires it as input. Note this is
 * *derived*, not independently verified against a known wallet address; callers with a recorded
 * address should cross-check it themselves. For HBAR this field is omitted so the caller's
 * network-assigned account ID is neither overwritten nor re-derived; the same goes for XLM, whose
 * base address is network-assigned too. For both, the caller must pass `rootAddress` to `recover()`.
 */
export type Ed25519SafeRecoverKeyParams =
  | {
      slot: 'ed25519Multisig';
      mode: 'signed';
      userKey: string;
      bitgoKey: string;
      walletPassphrase: string;
      rootAddress?: string;
      /**
       * Lazy signer for the seedless backup child. The backup child has no seed, so it cannot be
       * seed-signed; and its signature must cover `tx.bytesToSign()`, which only exists once
       * `recover()` builds the tx. So instead of a pre-made signature we pass a closure that holds
       * the private `kL`/`kR` and signs on demand — the private halves never leave it.
       */
      externalBackupSigner: ExternalEd25519Signer;
    }
  | {
      slot: 'ed25519Multisig';
      mode: 'unsigned';
      userKey: string;
      backupKey: string;
      bitgoKey: string;
      rootAddress?: string;
    };

export type SafeRecoverKeyParams =
  | SecpSafeRecoverKeyParams
  | Ed25519SafeRecoverKeyParams
  | EcdsaMpcSafeRecoverKeyParams
  | EddsaMpcSafeRecoverKeyParams;

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

const ED25519_32_BYTE_HEX = /^[0-9a-f]{64}$/i;

/**
 * Per-coin encoders for the `ed25519Multisig` slot: each slot-2 coin re-encodes the same 32-byte
 * children into its own address/seed string formats. A coin absent from the registry is not yet
 * supported for slot-2 recovery.
 */
const ALGO_ENCODERS = {
  encodePub: encodeAlgoKey,
  encodeSeed: encodeAlgoKey,
  deriveRootAddress: (userPub: Buffer, backupPub: Buffer, bitgoPub: Buffer) =>
    algoMultisigAddress(1, 2, [userPub, backupPub, bitgoPub]),
};

const XLM_ENCODERS = {
  encodePub: encodeEd25519StrKeyPublicKey,
  encodeSeed: encodeEd25519StrKeySecretSeed,
};

const ED25519_MULTISIG_COIN_ENCODERS: Record<
  string,
  | {
      encodePub: (bytes: Buffer) => string;
      encodeSeed: (bytes: Buffer) => string;
      deriveRootAddress?: (userPub: Buffer, backupPub: Buffer, bitgoPub: Buffer) => string;
    }
  | undefined
> = {
  algo: ALGO_ENCODERS,
  talgo: ALGO_ENCODERS,
  hbar: { encodePub: encodeHbarPublicKeyDer, encodeSeed: encodeHbarPrivateKeyDer },
  thbar: { encodePub: encodeHbarPublicKeyDer, encodeSeed: encodeHbarPrivateKeyDer },
  xlm: XLM_ENCODERS,
  txlm: XLM_ENCODERS,
};

/**
 * The request shape for `buildSafeRecoverKeyParams`. The `slot` literal is the discriminant that
 * ties each slot to its own `keys` shape, so TypeScript narrows `params.keys` automatically and a
 * slot added without a branch is a compile error rather than a silent cast.
 */
export type SafeRecoverKeyParamsRequest = {
  bitgo: BitGoBase;
  coin: string;
  mode: 'signed' | 'unsigned';
} & (
  | { slot: 'secp256k1Multisig'; keys: Secp256k1MultisigChildKeys }
  | { slot: 'ed25519Multisig'; keys: Ed25519MultisigChildKeys }
  | { slot: 'ecdsaMpc'; keys: EcdsaMpcChildKeys }
  | { slot: 'eddsaMpc'; keys: EddsaMpcChildKeys }
);

/**
 * Builds the key fields `coin.recover()` expects from derived Safe child keys.
 * Supports all four slots. Signed mode re-encrypts the child secrets under a fresh ephemeral
 * passphrase (v1/SJCL); unsigned mode returns pubs / the child common keychain. Where supported,
 * `rootAddress` is derived from the child keys, not independently verified; otherwise it is
 * omitted so the caller can supply it. MPC-slot params always carry `broadcast: false` so Safe
 * recovery never auto-broadcasts.
 */
export async function buildSafeRecoverKeyParams(
  params: Extract<SafeRecoverKeyParamsRequest, { slot: 'secp256k1Multisig' }>
): Promise<SecpSafeRecoverKeyParams>;
export async function buildSafeRecoverKeyParams(
  params: Extract<SafeRecoverKeyParamsRequest, { slot: 'ed25519Multisig' }>
): Promise<Ed25519SafeRecoverKeyParams>;
export async function buildSafeRecoverKeyParams(
  params: Extract<SafeRecoverKeyParamsRequest, { slot: 'ecdsaMpc' }>
): Promise<EcdsaMpcSafeRecoverKeyParams>;
export async function buildSafeRecoverKeyParams(
  params: Extract<SafeRecoverKeyParamsRequest, { slot: 'eddsaMpc' }>
): Promise<EddsaMpcSafeRecoverKeyParams>;
export async function buildSafeRecoverKeyParams(params: SafeRecoverKeyParamsRequest): Promise<SafeRecoverKeyParams>;
export async function buildSafeRecoverKeyParams(params: SafeRecoverKeyParamsRequest): Promise<SafeRecoverKeyParams> {
  const { bitgo, mode } = params;

  // Untyped (JS) callers can pass values the types forbid; fail closed rather than fall through.
  if (mode !== 'signed' && mode !== 'unsigned') {
    throw new Error(`buildSafeRecoverKeyParams: unknown mode '${mode}'`);
  }

  if (params.slot === 'ed25519Multisig') {
    return buildEd25519MultisigRecoverKeyParams(bitgo, params.coin, params.keys, mode);
  }

  if (params.slot === 'ecdsaMpc') {
    return buildMpcRecoverKeyParams(bitgo, 'ecdsaMpc', params.keys, mode);
  }

  if (params.slot === 'eddsaMpc') {
    return buildMpcRecoverKeyParams(bitgo, 'eddsaMpc', params.keys, mode);
  }

  // Every other typed slot returned above. The runtime guard keeps an unknown slot from falling
  // into slot-1 handling; the narrowing makes a slot added without a branch a compile error below.
  const slot: string = params.slot;
  if (slot !== 'secp256k1Multisig') {
    throw new Error(`buildSafeRecoverKeyParams: slot '${slot}' is not supported yet`);
  }

  const keys = params.keys;

  if (mode === 'unsigned') {
    return {
      slot: 'secp256k1Multisig',
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
    slot: 'secp256k1Multisig',
    userKey,
    backupKey,
    bitgoKey: keys.bitgo.pub,
    walletPassphrase,
  };
}

async function buildMpcRecoverKeyParams<Slot extends 'ecdsaMpc' | 'eddsaMpc'>(
  bitgo: BitGoBase,
  slot: Slot,
  keys: MpcChildKeys,
  mode: 'signed' | 'unsigned'
): Promise<MpcSafeRecoverKeyParams<Slot>> {
  if (mode === 'unsigned') {
    return { slot, mode, bitgoKey: keys.commonKeychain, isTss: true, broadcast: false };
  }

  const walletPassphrase = randomBytes(32).toString('hex');
  const [userKey, backupKey] = await Promise.all([
    bitgo.encrypt({ input: keys.user, password: walletPassphrase, encryptionVersion: 1 }),
    bitgo.encrypt({ input: keys.backup, password: walletPassphrase, encryptionVersion: 1 }),
  ]);

  return {
    slot,
    mode,
    userKey,
    backupKey,
    bitgoKey: keys.commonKeychain,
    walletPassphrase,
    isTss: true,
    broadcast: false,
  };
}

async function buildEd25519MultisigRecoverKeyParams(
  bitgo: BitGoBase,
  coin: string,
  keys: Ed25519MultisigChildKeys,
  mode: 'signed' | 'unsigned'
): Promise<Ed25519SafeRecoverKeyParams> {
  const encoders = ED25519_MULTISIG_COIN_ENCODERS[coin];
  if (!encoders) {
    throw new Error(`buildSafeRecoverKeyParams: coin '${coin}' ed25519Multisig is not supported yet`);
  }

  for (const pub of [keys.user.pub, keys.backup.pub, keys.bitgo.pub]) {
    // strict hex, not length-only: Buffer.from(pub, 'hex') truncates at the first bad pair, so a
    // length check alone would accept trailing garbage
    if (!ED25519_32_BYTE_HEX.test(pub)) {
      throw new Error('buildSafeRecoverKeyParams: ed25519 child public keys must be 32 bytes');
    }
  }

  const userPub = Buffer.from(keys.user.pub, 'hex');
  const backupPub = Buffer.from(keys.backup.pub, 'hex');
  const bitgoPub = Buffer.from(keys.bitgo.pub, 'hex');

  // The root address is derivable from child pubs for ALGO (version-1 2-of-3 multisig), but
  // not for HBAR (Hedera account IDs are network-assigned). Each coin declares, via its registry
  // entry, whether it can derive one; the caller supplies it otherwise.
  const rootAddress = encoders.deriveRootAddress?.(userPub, backupPub, bitgoPub);
  const rootAddressParams = rootAddress === undefined ? {} : { rootAddress };

  if (mode === 'unsigned') {
    return {
      slot: 'ed25519Multisig',
      mode: 'unsigned',
      userKey: encoders.encodePub(userPub),
      backupKey: encoders.encodePub(backupPub),
      bitgoKey: encoders.encodePub(bitgoPub),
      ...rootAddressParams,
    };
  }

  // The user child is a hardened SLIP-0010 seed, so it re-encrypts exactly like slot 1. The backup
  // child is a seedless soft extended key: it cannot be re-encrypted as a seed, so it becomes a lazy
  // external signer over the tx bytes (WCN-2895's extended-key signer, invoked by the coin).
  // strict hex: Buffer.from(seed, 'hex') truncates at the first bad pair, which would silently
  // encode a wrong private key
  if (!ED25519_32_BYTE_HEX.test(keys.user.seed)) {
    throw new Error('buildSafeRecoverKeyParams: ed25519 user seed must be 32 bytes');
  }
  const walletPassphrase = randomBytes(32).toString('hex');
  const userKey = await bitgo.encrypt({
    input: encoders.encodeSeed(Buffer.from(keys.user.seed, 'hex')),
    password: walletPassphrase,
    encryptionVersion: 1,
  });

  return {
    slot: 'ed25519Multisig',
    mode: 'signed',
    userKey,
    bitgoKey: encoders.encodePub(bitgoPub),
    walletPassphrase,
    ...rootAddressParams,
    externalBackupSigner: {
      publicKey: keys.backup.pub,
      sign: async (message) => ({
        signature: (
          await signEd25519Extended(
            Buffer.from(message),
            Buffer.from(keys.backup.kL, 'hex'),
            Buffer.from(keys.backup.kR, 'hex')
          )
        ).toString('hex'),
      }),
    },
  };
}
