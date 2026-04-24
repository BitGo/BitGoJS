/**
 * Derives a wallet passphrase from a WebAuthn PRF result.
 *
 * The PRF output (ArrayBuffer) is hex-encoded and used directly as the
 * walletPassphrase for SJCL-based encryption (bitgo.encrypt).
 *
 * @param prfResult - Raw PRF output from WebAuthn credential assertion
 * @returns Lowercase hex string to use as walletPassphrase
 */
export function derivePassword(prfResult: ArrayBuffer): string {
  return Buffer.from(prfResult).toString('hex');
}
