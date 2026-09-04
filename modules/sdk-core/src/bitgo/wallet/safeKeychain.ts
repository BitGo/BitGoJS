/**
 * @prettier
 */
import { BitGoBase } from '../bitgoBase';
import { decryptKeychainPrivateKey, IKeychains, Keychain, KeychainWithEncryptedPrv } from '../keychain';
import { deriveSafeChildHardenedFromXprv, parseDerivedFromParentWithHardenedPath } from '../safe/safeDerivation';
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

/** Thrown when owner signing is not implemented for this safe slot (TSS, ed25519 multisig, …). */
export class SafeOwnerSigningNotImplementedError extends Error {
  constructor(walletId: string, detail: string) {
    super(`Safe wallet ${walletId}: ${detail}`);
    this.name = 'SafeOwnerSigningNotImplementedError';
  }
}

/** Thrown when wallet sharing is not implemented for this safe slot (TSS, ed25519 multisig, …). */
export class SafeShareNotImplementedError extends Error {
  constructor(walletId: string, detail: string) {
    super(`Safe wallet ${walletId}: ${detail}`);
    this.name = 'SafeShareNotImplementedError';
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

/**
 * Shared params for resolving safe-owner key material (owner signing and wallet sharing).
 * Both resolvers extend this so the precondition/derivation path cannot diverge.
 */
export interface SafeKeyMaterialBaseParams {
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

export type ResolveSafeOwnerSigningPrvParams = SafeKeyMaterialBaseParams;

type SafeKeyMaterialSlot = 'tss' | 'ed25519';

type ResolveSafeKeyMaterialParams = SafeKeyMaterialBaseParams & {
  /** Constructs the not-implemented error for the current resolver (signing vs sharing). */
  makeNotImplementedError: (slot: SafeKeyMaterialSlot, walletId: string) => Error;
};

/**
 * Shared core that resolves safe key material for a pub-only safe child. Returns the CHILD
 * `{prv, pub}` only — never the root — so the root can never leak into a share document.
 *
 * Onchain secp256k1: decrypt root, hardened-derive at `derivedFromParentWithHardenedPath`
 * (`m/<n>'`), and verify the registered pub. TSS and ed25519 onchain throw via
 * `makeNotImplementedError` — the caller constructs its own error class + message, so the
 * guard set stays shared while signing/sharing report their own errors.
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
    makeNotImplementedError,
  } = params;

  if (multisigType !== 'onchain') {
    throw makeNotImplementedError('tss', walletId);
  }
  if (ED25519_ONCHAIN_FAMILIES.has(coinFamily)) {
    throw makeNotImplementedError('ed25519', walletId);
  }

  const rootKeychain = params.rootKeychain ?? (await fetchRootKeychainForSafeChild(keychains, childKeychain));
  const rootPrv = await decryptKeychainPrivateKey(bitgo, rootKeychain, walletPassphrase);
  if (!rootPrv) {
    throw new IncorrectPasswordError();
  }

  if (!childKeychain.pub) {
    throw new Error(`Safe wallet ${walletId}: child keychain is missing pub for pre-sign verification`);
  }
  if (childKeychain.derivedFromParentWithHardenedPath === undefined) {
    throw new Error(`Safe wallet ${walletId}: child keychain is missing derivedFromParentWithHardenedPath`);
  }

  const derived = deriveSafeChildHardenedFromXprv(
    rootPrv,
    parseDerivedFromParentWithHardenedPath(childKeychain.derivedFromParentWithHardenedPath)
  );
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
 * Onchain secp256k1: decrypt root, hardened-derive at `derivedFromParentWithHardenedPath`
 * (`m/<n>'`), and verify the registered pub.
 * TSS and ed25519 onchain: throw — do not return root material or BIP32-derive the wrong curve.
 *
 * Do not use for wallet sharing — that must not receive root key material.
 * Call only when `isSafeChildPublicOnlyKeychain` is true.
 */
export async function resolveSafeOwnerSigningPrv(params: ResolveSafeOwnerSigningPrvParams): Promise<string> {
  const { prv } = await resolveSafeKeyMaterial({
    ...params,
    makeNotImplementedError: (slot, walletId) =>
      slot === 'ed25519'
        ? new SafeOwnerSigningNotImplementedError(
            walletId,
            `ed25519 multisig owner derivation (${params.coinFamily}) is not implemented; BIP32 would produce the wrong child key.`
          )
        : new SafeOwnerSigningNotImplementedError(
            walletId,
            'TSS owner signing from the root keyshare is not implemented. ' +
              'Returning the root private key would expose material that can derive every child in this slot.'
          ),
  });
  return prv;
}

export interface ResolveSafeChildPrvForSharingParams extends SafeKeyMaterialBaseParams {
  mpcAlgorithm?: 'ecdsa' | 'eddsa';
}

/** Slot-named not-implemented detail for wallet sharing. */
function safeShareSlotDetail(slot: SafeKeyMaterialSlot, params: ResolveSafeChildPrvForSharingParams): string {
  if (slot === 'ed25519') {
    return `ed25519 multisig safe sharing (${params.coinFamily}) is not implemented; BIP32 would derive the wrong child.`;
  }
  return params.mpcAlgorithm === 'eddsa'
    ? 'eddsaMpc safe sharing is not implemented (needs the EdDSA derive ceremony).'
    : 'ecdsaMpc safe sharing is not implemented (needs the DKLS derive ceremony).';
}

/**
 * Resolve sharing material for a safe owner (child key has no encryptedPrv).
 *
 * Onchain secp256k1: decrypt root, hardened-derive at `derivedFromParentWithHardenedPath`
 * (`m/<n>'`), verify the registered pub, and return the CHILD `{prv, pub}` — never the root.
 * TSS and ed25519 onchain: throw `SafeShareNotImplementedError` naming the slot + blocker.
 *
 * Call only when `isSafeChildPublicOnlyKeychain` is true.
 */
export async function resolveSafeChildPrvForSharing(
  params: ResolveSafeChildPrvForSharingParams
): Promise<DecryptedKeychainData> {
  return resolveSafeKeyMaterial({
    ...params,
    makeNotImplementedError: (slot, walletId) =>
      new SafeShareNotImplementedError(walletId, safeShareSlotDetail(slot, params)),
  });
}
