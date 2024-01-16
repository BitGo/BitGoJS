import { BitGoBase } from '../bitgoBase';
import { KeychainEncryptedKey } from './iKeychains';
import { notEmpty } from '../utils';

function maybeDecrypt(bitgo: BitGoBase, input: string, password: string): string | undefined {
  try {
    return bitgo.decrypt({
      input,
      password,
    });
  } catch (_e) {
    return undefined;
  }
}

/**
 * Decrypts the private key of a keychain.
 * This method will try the password against the traditional encryptedPrv,
 * and any webauthn device encryptedPrvs.
 *
 * @param bitgo
 * @param keychain
 * @param password
 */
export function decryptKeychainPrivateKey(
  bitgo: BitGoBase,
  keychain: KeychainEncryptedKey,
  password: string
): string | undefined {
  const prvs = [keychain.encryptedPrv, ...(keychain.webauthnDevices ?? []).map((d) => d.encryptedPrv)].filter(notEmpty);
  for (const prv of prvs) {
    const decrypted = maybeDecrypt(bitgo, prv, password);
    if (decrypted) {
      return decrypted;
    }
  }
  return undefined;
}
