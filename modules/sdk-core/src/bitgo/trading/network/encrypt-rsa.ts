import crypto from 'crypto';

/**
 * Encrypts a string using RSA
 * @param {string} publicKey The public key to use for encryption
 * @param {string} text The text to encrypt
 * @returns {string} The encrypted text
 */
export function _encryptRsa(publicKey: string, text: string): string {
  const key = crypto.createPublicKey(publicKey);
  const encryptedData = crypto.publicEncrypt(
    {
      key,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(text)
  );

  return encryptedData.toString('base64');
}
