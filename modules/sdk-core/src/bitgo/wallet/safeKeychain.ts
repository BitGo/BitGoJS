/**
 * @prettier
 */
import { BitGoBase } from '../bitgoBase';
import { decryptKeychainPrivateKey, IKeychains, Keychain, KeychainWithEncryptedPrv } from '../keychain';
import { deriveSafeChildHardenedFromXprv } from '../safe/safeDerivation';
import { IncorrectPasswordError } from '../errors';

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

/** Thrown when owner signing is not implemented for this safe slot (TSS, ed25519 multisig, …). */
export class SafeOwnerSigningNotImplementedError extends Error {
  constructor(walletId: string, detail: string) {
    super(`Safe wallet ${walletId}: ${detail}`);
    this.name = 'SafeOwnerSigningNotImplementedError';
  }
}

/** ed25519 onchain multisig (slot ④). Needs SLIP-0010, not secp256k1 BIP32. */
const ED25519_ONCHAIN_FAMILIES = new Set(['algo', 'xlm', 'hbar']);

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

export interface ResolveSafeOwnerSigningPrvParams {
  bitgo: BitGoBase;
  keychains: IKeychains;
  walletId: string;
  /** Onchain secp256k1: hardened-derive and verify pub. Other slots throw. */
  multisigType: string | undefined;
  coinFamily: string;
  childKeychain: Keychain;
  walletPassphrase: string;
  /** When already fetched (passphrase preflight), skip a second GET. */
  rootKeychain?: KeychainWithEncryptedPrv;
}

/**
 * Resolve signing material for a safe owner (child key has no encryptedPrv).
 *
 * Onchain secp256k1: decrypt root → hardened-derive at `derivedFromParentWithSeed` →
 * verify derived pub against the registered child pub.
 * TSS and ed25519 onchain: throw — do not return root material or BIP32-derive the wrong curve.
 *
 * Do not use for wallet sharing — that must not receive root key material.
 * Call only when `isSafeChildPublicOnlyKeychain` is true.
 */
export async function resolveSafeOwnerSigningPrv(params: ResolveSafeOwnerSigningPrvParams): Promise<string> {
  const { bitgo, keychains, walletId, multisigType, coinFamily, childKeychain, walletPassphrase } = params;

  if (multisigType !== 'onchain') {
    throw new SafeOwnerSigningNotImplementedError(
      walletId,
      'TSS owner signing from the root keyshare is not implemented. ' +
        'Returning the root private key would expose material that can derive every child in this slot.'
    );
  }
  if (ED25519_ONCHAIN_FAMILIES.has(coinFamily)) {
    throw new SafeOwnerSigningNotImplementedError(
      walletId,
      `ed25519 multisig owner derivation (${coinFamily}) is not implemented; BIP32 would produce the wrong child key.`
    );
  }

  const rootKeychain = params.rootKeychain ?? (await fetchRootKeychainForSafeChild(keychains, childKeychain));
  const rootPrv = await decryptKeychainPrivateKey(bitgo, rootKeychain, walletPassphrase);
  if (!rootPrv) {
    throw new IncorrectPasswordError();
  }

  if (childKeychain.derivedFromParentWithSeed === undefined) {
    throw new Error(`Safe wallet ${walletId}: child keychain is missing derivedFromParentWithSeed (derivation index)`);
  }

  const derived = deriveSafeChildHardenedFromXprv(rootPrv, childKeychain.derivedFromParentWithSeed);

  if (!childKeychain.pub) {
    throw new Error(`Safe wallet ${walletId}: child keychain is missing pub for pre-sign verification`);
  }
  if (derived.pub !== childKeychain.pub) {
    throw new SafeDerivedPublicKeyMismatchError(walletId, childKeychain.pub, derived.pub);
  }

  return derived.prv;
}
