/**
 * Derives a wallet passphrase from a WebAuthn PRF result.
 *
 * The PRF output (ArrayBuffer) is hex-encoded and used directly as the password
 * passed into Argon2id v2 encryption (`bitgo.encryptAsync` with
 * `encryptionVersion: 2`) and the auto-detecting `bitgo.decryptAsync` path.
 *
 * @param prfResult - Raw PRF output from WebAuthn credential assertion
 * @returns Lowercase hex string to use as walletPassphrase
 */
export function derivePassword(prfResult: ArrayBuffer): string {
  return Buffer.from(prfResult).toString('hex');
}
