import crypto from 'crypto';

/**
 * Decrypts a string using RSA
 * @param {string} privateKey The private key to use for decryption
 * @param {string} encryptedText The text to decrypt
 * @returns {string} The decrypted text
 */
export function _decryptRsa(privateKey: string, encryptedText: string): string {
  const key = crypto.createPrivateKey(privateKey);
  const decryptedData = crypto.privateDecrypt(
    {
      key,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encryptedText, 'base64')
  );

  return decryptedData.toString();
}
