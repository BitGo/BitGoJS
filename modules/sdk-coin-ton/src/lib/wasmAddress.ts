/**
 * WASM-based TON address derivation.
 *
 * Replaces the async TonWeb-based getAddressFromPublicKey with a synchronous
 * call into @bitgo/wasm-ton's encodeAddress.
 */

import { encodeAddress, validateAddress } from '@bitgo/wasm-ton';

/**
 * Derive a TON address from a hex-encoded Ed25519 public key.
 *
 * Defaults to V4R2 wallet contract and non-bounceable format (UQ...) which
 * is the standard for user-facing TON addresses.
 *
 * @param publicKeyHex - 64-character hex-encoded 32-byte Ed25519 public key
 * @param bounceable - whether to produce a bounceable (EQ...) address (default: false)
 * @param walletVersion - wallet contract version (default: "V4R2")
 * @returns Base64url-encoded TON address
 */
export function getAddressFromPublicKey(
  publicKeyHex: string,
  bounceable = false,
  walletVersion: 'V3R2' | 'V4R2' | 'V5R1' = 'V4R2'
): string {
  const pubKeyBytes = Buffer.from(publicKeyHex, 'hex');
  return encodeAddress(pubKeyBytes, { bounceable, walletVersion });
}

/**
 * Validate a TON address string (base64url encoded, 48 characters).
 *
 * @param address - TON address to validate
 * @returns true if valid
 */
export function isValidTonAddress(address: string): boolean {
  try {
    return validateAddress(address);
  } catch {
    return false;
  }
}
