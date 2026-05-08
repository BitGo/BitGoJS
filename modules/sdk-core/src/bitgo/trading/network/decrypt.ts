import { _decryptAesGcm } from './decrypt-aes-gcm';
import { _decryptRsa } from './decrypt-rsa';

/**
 * Provided an X.509/ OpenSSL PEM private key, and a string of text to decrypt,
 * This function will
 * 1. Split the encrypted text into the encrypted key and the encrypted text
 * 2. Decrypt the key using RSA-OAEP with the provided private key
 * 3. Decrypt the text using AES-GCM with the decrypted key
 * 4. Return the decrypted text
 *
 * @param {string} privateKey - The private key corresponding to the public key used for encryption
 * @param {string} encryptedText - The encrypted text to decrypt
 * @returns {string} The decrypted text
 */
export async function decryptRsaWithAesGcm(privateKey: string, encryptedText: string): Promise<string> {
  const [encryptedKey, encrypted] = encryptedText.split('\n');

  const gcmKey = await _decryptRsa(privateKey, encryptedKey);

  return _decryptAesGcm(Buffer.from(gcmKey, 'base64').toString(), encrypted);
}
