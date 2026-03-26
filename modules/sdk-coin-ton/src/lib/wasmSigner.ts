/**
 * WASM-based TON transaction signing.
 *
 * Replaces the TonWeb-based rebuild-and-sign path with direct WASM calls:
 *   Transaction.fromBase64() → addSignature() → toBroadcastFormat()
 *
 * The signable payload is a 32-byte cell hash (Ed25519 signs this directly).
 * The broadcast format is base64-encoded BOC, same as the input format.
 */

import { Transaction } from '@bitgo/wasm-ton';

export interface WasmSignResult {
  /** Base64-encoded signed BOC ready for broadcast */
  broadcastFormat: string;
  /** Transaction ID (base64url), undefined for unsigned transactions */
  id: string | undefined;
}

/**
 * Get the signable payload (32-byte cell hash) from a base64 BOC.
 *
 * @param txBase64 - Base64-encoded unsigned BOC
 * @returns 32-byte Uint8Array to sign with Ed25519
 */
export function getSignablePayload(txBase64: string): Uint8Array {
  const tx = Transaction.fromBase64(txBase64);
  return tx.signablePayload();
}

/**
 * Add an Ed25519 signature to a base64 BOC and return the signed BOC.
 *
 * @param txBase64 - Base64-encoded unsigned BOC
 * @param signatureHex - 128-character hex-encoded 64-byte Ed25519 signature
 * @returns Signed broadcast-ready BOC and transaction ID
 */
export function applySignature(txBase64: string, signatureHex: string): WasmSignResult {
  const tx = Transaction.fromBase64(txBase64);
  const signatureBytes = Buffer.from(signatureHex, 'hex');
  tx.addSignature(signatureBytes);
  return {
    broadcastFormat: tx.toBroadcastFormat(),
    id: tx.id,
  };
}
