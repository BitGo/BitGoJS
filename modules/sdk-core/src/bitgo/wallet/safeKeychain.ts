/**
 * @prettier
 */
import { IKeychains, Keychain, KeychainWithEncryptedPrv } from '../keychain';

export class InvalidRootKeychainSourceError extends Error {
  constructor(id: string, source: string | undefined) {
    super(
      `Root keychain ${id} has source '${source ?? 'unknown'}'; expected 'user'. ` +
        `Using a backup or BitGo root would fail at signing.`
    );
    this.name = 'InvalidRootKeychainSourceError';
  }
}

/**
 * Fetch the root user keychain for a safe child key doc.
 * Asserts source === 'user'; throws InvalidRootKeychainSourceError otherwise
 * to surface misconfiguration early (backup-root material fails later with a
 * cryptic 'Invalid user key - missing backupYShare' deep in eddsa.ts:541).
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
