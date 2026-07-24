import { BitGoBase } from '../bitgoBase';
import { OptionalKeychainEncryptedKey } from './iKeychains';
import { notEmpty } from '../utils';

async function maybeDecrypt(bitgo: BitGoBase, input: string, password: string): Promise<string | undefined> {
  try {
    return await bitgo.decrypt({
      input,
      password,
    });
  } catch (_e) {
    return undefined;
  }
}

/**
 * Decrypts the private key of a keychain (supports v1 and v2 envelopes).
 * This method will try the password against the traditional encryptedPrv,
 * and any webauthn device encryptedPrvs.
 * Auto-detects v1 (SJCL) and v2 (Argon2id) envelopes.
 *
 * @param bitgo
 * @param keychain
 * @param password
 */
export async function decryptKeychainPrivateKey(
  bitgo: BitGoBase,
  keychain: OptionalKeychainEncryptedKey,
  password: string
): Promise<string | undefined> {
  const prvs = [keychain.encryptedPrv, ...(keychain.webauthnDevices ?? []).map((d) => d.encryptedPrv)].filter(notEmpty);
  for (const prv of prvs) {
    const decrypted = await maybeDecrypt(bitgo, prv, password);
    if (decrypted) {
      return decrypted;
    }
  }
  return undefined;
}
