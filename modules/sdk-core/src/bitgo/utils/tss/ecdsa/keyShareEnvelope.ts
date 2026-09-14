import { decode } from 'cbor-x';
import { Buffer } from 'buffer';

/** Version of the safe MPC keyshare envelope that carries VRF material. */
export const MPC_VRF_KEY_ENVELOPE_VERSION = 1;

export interface ParsedMpcV2KeyShare {
  /** Serialized DKLS signing keyshare or reduced signing keyshare. */
  signingKeyShare: Buffer;
  /** Serialized VRF keyshare, present in safe-root envelopes. */
  vrfKeyShare?: Buffer;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asBuffer(value: unknown, field: string): Buffer {
  if (!(value instanceof Uint8Array)) {
    throw new Error(`Invalid MPC keyshare envelope: ${field} must be a byte string`);
  }
  return Buffer.from(value);
}

/**
 * Parses decrypted MPCv2 key material.
 *
 * Legacy MPCv2 cards contain base64(CBOR ReducedKeyShare). Safe-root cards contain
 * base64(CBOR({ version: 1, prvKeyShare, vrf })); the signing share remains reduced,
 * while `vrf` is the complete serialized VrfKeyshare required by the VRF wasm API.
 *
 * The legacy path is intentionally retained because existing wallet cards do not have
 * VRF material and must continue to recover as before.
 */
export function parseMpcV2KeyShareEnvelope(decryptedKeyShare: string): ParsedMpcV2KeyShare {
  const encoded = Buffer.from(decryptedKeyShare, 'base64');
  let decoded: unknown;
  try {
    decoded = decode(encoded);
  } catch {
    return { signingKeyShare: encoded };
  }

  if (!isRecord(decoded) || !('version' in decoded)) {
    return { signingKeyShare: encoded };
  }

  if (decoded.version !== MPC_VRF_KEY_ENVELOPE_VERSION) {
    throw new Error(`Unsupported MPC keyshare envelope version: ${String(decoded.version)}`);
  }

  return {
    signingKeyShare: asBuffer(decoded.prvKeyShare, 'prvKeyShare'),
    vrfKeyShare: asBuffer(decoded.vrf, 'vrf'),
  };
}
