/**
 * @prettier
 */
import { Buffer } from 'buffer';
import { BitGoBase } from '../bitgoBase';
import { decryptKeychainPrivateKey, IKeychains, Keychain, KeychainWithEncryptedPrv } from '../keychain';
import {
  decodeEd25519StrKeyPublicKey,
  decodeEd25519StrKeySecretSeed,
  deriveSafeChildEd25519Hardened,
  deriveSafeChildHardenedFromXprv,
  DerivedFromParentWithHardenedPath,
  getEd25519MultisigCoinEncoders,
} from '@bitgo/sdk-lib-safes';
import { decodeWithCodec } from '../utils/codecs';
import { IncorrectPasswordError } from '../errors';
import type { DecryptedKeychainData } from './iWallet';

export class InvalidRootKeychainSourceError extends Error {
  constructor(id: string, source: string | undefined) {
    super(
      `Root keychain ${id} has source '${source ?? 'unknown'}'; expected 'user'. ` +
        `Using a backup or BitGo root would fail at signing.`
    );
    this.name = 'InvalidRootKeychainSourceError';
  }
}

/** Thrown when hardened derivation does not match the registered child public key. */
export class SafeDerivedPublicKeyMismatchError extends Error {
  constructor(walletId: string, expectedPub: string, derivedPub: string) {
    super(
      `Safe wallet ${walletId}: derived child public key does not match the registered user key. ` +
        `Expected ${expectedPub}, got ${derivedPub}.`
    );
    this.name = 'SafeDerivedPublicKeyMismatchError';
  }
}

/** Thrown when owner signing cannot resolve child key material for this safe user key (public-only TSS child). */
export class SafeOwnerSigningNotImplementedError extends Error {
  constructor(walletId: string, detail: string) {
    super(`Safe wallet ${walletId}: ${detail}`);
    this.name = 'SafeOwnerSigningNotImplementedError';
  }
}

/** Thrown when wallet sharing cannot resolve child key material for this safe user key (public-only TSS child). */
export class SafeShareNotImplementedError extends Error {
  constructor(walletId: string, detail: string) {
    super(`Safe wallet ${walletId}: ${detail}`);
    this.name = 'SafeShareNotImplementedError';
  }
}

/**
 * True when this is the safe minter's user key: wallet is in a safe, the key
 * has a parent root, and there is no child-level encryptedPrv (sharees have one).
 */
export function isSafeChildPublicOnlyKeychain(
  walletSafeId: string | undefined,
  keychain: Keychain | undefined
): keychain is Keychain & { parent: string } {
  return !!(walletSafeId && keychain?.parent && !keychain.encryptedPrv);
}

/**
 * Fetch the root user keychain for a safe child key.
 * Requires `source === 'user'` so a misconfigured parent fails early.
 */
export async function fetchRootKeychainForSafeChild(
  keychains: IKeychains,
  childKeychain: Keychain
): Promise<KeychainWithEncryptedPrv> {
  if (!childKeychain.parent) {
    throw new Error('childKeychain.parent is required to fetch the root keychain');
  }
  const root = await keychains.get({ id: childKeychain.parent });
  if (root.source !== 'user') {
    throw new InvalidRootKeychainSourceError(root.id, root.source);
  }
  if (!root.encryptedPrv) {
    throw new Error(`root keychain ${root.id} does not have property encryptedPrv`);
  }
  return root as KeychainWithEncryptedPrv;
}

/**
 * Shared params for resolving safe-owner key material (owner signing and wallet sharing).
 * Both resolvers extend this so the precondition/derivation path cannot diverge.
 */
export interface SafeKeyMaterialBaseParams {
  bitgo: BitGoBase;
  keychains: IKeychains;
  walletId: string;
  /** `'onchain'`: hardened-derive and verify the registered pub. Anything else throws. */
  multisigType: string | undefined;
  /** Coin family of the wallet (`baseCoin.getFamily()`); selects ed25519 vs secp256k1 derivation. */
  coinFamily: string;
  childKeychain: Keychain;
  walletPassphrase: string;
  /** When already fetched (passphrase preflight), skip a second GET. */
  rootKeychain?: KeychainWithEncryptedPrv;
}

export type ResolveSafeOwnerSigningPrvParams = SafeKeyMaterialBaseParams;

type ResolveSafeKeyMaterialParams = SafeKeyMaterialBaseParams & {
  /** Constructs the error for a non-onchain wallet whose user child has no encryptedPrv (signing vs sharing). */
  makeUnsupportedMultisigTypeError: (walletId: string) => Error;
};

function isEd25519StrKeySecretSeed(value: string): boolean {
  try {
    decodeEd25519StrKeySecretSeed(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Shared core that resolves safe key material for a pub-only safe child. Returns the CHILD
 * `{prv, pub}` only — never the root — so the root can never leak into a share document.
 *
 * - Onchain secp256k1: decrypt the root (BIP32 xprv), hardened-derive at
 *   `derivedFromParentWithPath` (`m/44'/<coinType>'/<slot>'/<account>'`) and verify the registered pub.
 * - Onchain ed25519 (coins with an entry in the ed25519 multisig encoder registry): decrypt the
 *   root (a StrKey secret seed), SLIP-0010 hardened-derive at the same path, and encode the
 *   child into the coin's native formats. The derived pub, encoded for the coin, must equal the
 *   registered child pub; the returned `prv` is the coin-encoded child seed and the returned
 *   `pub` is the registered (coin-format) child pub.
 * - Anything else (`multisigType !== 'onchain'`): an MPC safe child always carries its own
 *   encryptedPrv and never reaches this resolver, so a public-only one is an invalid state and
 *   fails closed via `makeUnsupportedMultisigTypeError`.
 */
async function resolveSafeKeyMaterial(params: ResolveSafeKeyMaterialParams): Promise<{ prv: string; pub: string }> {
  const {
    bitgo,
    keychains,
    walletId,
    multisigType,
    coinFamily,
    childKeychain,
    walletPassphrase,
    makeUnsupportedMultisigTypeError,
  } = params;

  if (multisigType !== 'onchain') {
    throw makeUnsupportedMultisigTypeError(walletId);
  }

  const rootKeychain = params.rootKeychain ?? (await fetchRootKeychainForSafeChild(keychains, childKeychain));
  const rootPrv = await decryptKeychainPrivateKey(bitgo, rootKeychain, walletPassphrase);
  if (!rootPrv) {
    throw new IncorrectPasswordError();
  }

  if (!childKeychain.pub) {
    throw new Error(`Safe wallet ${walletId}: child keychain is missing pub for pre-sign verification`);
  }
  if (childKeychain.derivedFromParentWithPath === undefined) {
    throw new Error(`Safe wallet ${walletId}: child keychain is missing derivedFromParentWithPath`);
  }
  const path = decodeWithCodec(
    DerivedFromParentWithHardenedPath,
    childKeychain.derivedFromParentWithPath,
    'derivedFromParentWithPath'
  );

  const encoders = getEd25519MultisigCoinEncoders(coinFamily);
  if (encoders) {
    const derived = deriveSafeChildEd25519Hardened(rootPrv, path);
    const encodedPub = encoders.encodePub(decodeEd25519StrKeyPublicKey(derived.pub));
    if (encodedPub !== childKeychain.pub) {
      throw new SafeDerivedPublicKeyMismatchError(walletId, childKeychain.pub, encodedPub);
    }
    // The root pub is a StrKey; the child pub is coin-format. Compare in both forms.
    if (derived.pub === rootKeychain.pub || encodedPub === rootKeychain.pub) {
      throw new Error(`Safe wallet ${walletId}: derived child pub unexpectedly equals the root pub`);
    }
    return { prv: encoders.encodeSeed(Buffer.from(derived.prv, 'hex')), pub: childKeychain.pub };
  }

  if (isEd25519StrKeySecretSeed(rootPrv)) {
    throw new Error(
      `Safe wallet ${walletId}: coin family '${coinFamily}' has an ed25519 safe root but no ed25519 multisig key encoders`
    );
  }

  const derived = deriveSafeChildHardenedFromXprv(rootPrv, path);
  if (derived.pub !== childKeychain.pub) {
    throw new SafeDerivedPublicKeyMismatchError(walletId, childKeychain.pub, derived.pub);
  }

  if (derived.pub === rootKeychain.pub) {
    throw new Error(`Safe wallet ${walletId}: derived child pub unexpectedly equals the root pub`);
  }
  return { prv: derived.prv, pub: derived.pub };
}

/**
 * Resolve signing material for a safe owner (child key has no encryptedPrv).
 *
 * Onchain secp256k1 and onchain ed25519 (ALGO, XLM, HBAR): decrypt the root, hardened-derive the
 * child at `derivedFromParentWithPath` (`m/44'/<coinType>'/<slot>'/<account>'`), verify the registered
 * pub, and return the child private key in the format the coin signs with. Never returns the root.
 * A public-only TSS child is an invalid state and throws.
 *
 * Do not use for wallet sharing — that must not receive root key material.
 * Call only when `isSafeChildPublicOnlyKeychain` is true.
 */
export async function resolveSafeOwnerSigningPrv(params: ResolveSafeOwnerSigningPrvParams): Promise<string> {
  const { prv } = await resolveSafeKeyMaterial({
    ...params,
    makeUnsupportedMultisigTypeError: (walletId) =>
      new SafeOwnerSigningNotImplementedError(
        walletId,
        `cannot resolve an owner signing key from a public-only ${params.multisigType ?? 'unknown'} user key. ` +
          'MPC safe user keys always carry their own encrypted signing share, so this keychain is in an invalid state.'
      ),
  });
  return prv;
}

export type ResolveSafeChildPrvForSharingParams = SafeKeyMaterialBaseParams;

/**
 * Resolve sharing material for a safe owner (child key has no encryptedPrv).
 *
 * Onchain secp256k1 and onchain ed25519 (ALGO, XLM, HBAR): decrypt the root, hardened-derive the
 * child at `derivedFromParentWithPath`, verify the registered pub, and return the CHILD
 * `{prv, pub}` — never the root. `prv` is in the format the coin signs with and `pub` is the
 * registered child pub, as the platform stores it.
 * A public-only TSS child is an invalid state and throws `SafeShareNotImplementedError`.
 *
 * Call only when `isSafeChildPublicOnlyKeychain` is true.
 */
export async function resolveSafeChildPrvForSharing(
  params: ResolveSafeChildPrvForSharingParams
): Promise<DecryptedKeychainData> {
  return resolveSafeKeyMaterial({
    ...params,
    makeUnsupportedMultisigTypeError: (walletId) =>
      new SafeShareNotImplementedError(
        walletId,
        `cannot share a public-only ${params.multisigType ?? 'unknown'} user key. ` +
          'MPC safe user keys always carry their own encrypted signing share, so this keychain is in an invalid state.'
      ),
  });
}
