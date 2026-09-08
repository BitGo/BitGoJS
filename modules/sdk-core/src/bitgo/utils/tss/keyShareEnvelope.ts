import { decode, encode } from 'cbor-x';
import { Buffer } from 'buffer';

/** Version of the Safe MPC keyshare envelope that carries VRF material. */
export const SAFE_MPC_KEY_ENVELOPE_VERSION = 1;

export interface ParsedMpcV2KeyShare {
  /** Serialized MPC signing keyshare (DKLS or MPS) or reduced signing keyshare. */
  signingKeyShare: Buffer;
  /** Serialized VRF keyshare, present in Safe-root envelopes. */
  vrfKeyShare?: Buffer;
}

type SafeMpcKeyEnvelope = {
  version: unknown;
  prvKeyShare: unknown;
  vrf: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSafeMpcKeyEnvelope(value: unknown): value is SafeMpcKeyEnvelope {
  return isRecord(value) && 'version' in value && 'prvKeyShare' in value && 'vrf' in value;
}

function asBuffer(value: unknown, field: string): Buffer {
  if (!(value instanceof Uint8Array)) {
    throw new Error(`Invalid MPC keyshare envelope: ${field} must be a byte string`);
  }
  return Buffer.from(value);
}

function tryDecodeCbor(
  decryptedKeyShare: string
): { encoded: Buffer; decoded: unknown } | { encoded: Buffer; error: unknown } {
  const encoded = Buffer.from(decryptedKeyShare, 'base64');
  try {
    return { encoded, decoded: decode(encoded) };
  } catch (error) {
    return { encoded, error };
  }
}

/**
 * Combines a signing keyshare with a VRF keyshare into the Safe MPC CBOR envelope
 * (`{ version, prvKeyShare, vrf }`). `envelope` wraps the full signing share for
 * `encryptedPrv`. `reducedEnvelope` wraps the reduced signing share for
 * `reducedEncryptedPrv`, which is what Safe keycards store.
 */
export function buildSafeMpcKeyEnvelopes(
  privateMaterial: Buffer,
  reducedPrivateMaterial: Buffer,
  vrfKeyShare: Buffer
): { envelope: Buffer; reducedEnvelope: Buffer } {
  const envelope = encode({
    version: SAFE_MPC_KEY_ENVELOPE_VERSION,
    prvKeyShare: new Uint8Array(privateMaterial),
    vrf: new Uint8Array(vrfKeyShare),
  });
  const reducedEnvelope = encode({
    version: SAFE_MPC_KEY_ENVELOPE_VERSION,
    prvKeyShare: new Uint8Array(reducedPrivateMaterial),
    vrf: new Uint8Array(vrfKeyShare),
  });
  return { envelope: Buffer.from(envelope), reducedEnvelope: Buffer.from(reducedEnvelope) };
}

/**
 * Parses a decrypted Safe MPC root blob produced by {@link buildSafeMpcKeyEnvelopes}.
 * Throws if the blob is not a versioned envelope with both shares. Wallet-card recovery
 * uses {@link parseMpcV2KeyShareEnvelope} instead, because legacy cards have no VRF share.
 */
export function parseSafeMpcKeyEnvelopes(decryptedBlob: string): { signing: Buffer; vrf: Buffer } {
  const decoded = tryDecodeCbor(decryptedBlob);
  if ('error' in decoded) {
    const message = decoded.error instanceof Error ? decoded.error.message : String(decoded.error);
    throw new Error(`Failed to decode safe MPC root key envelope: ${message}`);
  }
  if (!isSafeMpcKeyEnvelope(decoded.decoded)) {
    throw new Error('Invalid safe MPC root key envelope: expected version, signing keyshare, and VRF keyshare');
  }
  const { version, prvKeyShare, vrf } = decoded.decoded;
  if (version !== SAFE_MPC_KEY_ENVELOPE_VERSION) {
    throw new Error(`Unsupported safe MPC root key envelope version: ${String(version)}`);
  }
  if (!(prvKeyShare instanceof Uint8Array) || prvKeyShare.length === 0) {
    throw new Error('Safe MPC root key envelope is missing a signing keyshare');
  }
  if (!(vrf instanceof Uint8Array) || vrf.length === 0) {
    throw new Error('Safe MPC root key envelope is missing a VRF keyshare');
  }
  return { signing: Buffer.from(prvKeyShare), vrf: Buffer.from(vrf) };
}

/**
 * Parses decrypted MPCv2 key material from a wallet or Safe keycard.
 *
 * Legacy MPCv2 cards contain base64(CBOR ReducedKeyShare). Safe-root cards contain
 * base64(CBOR({ version: 1, prvKeyShare, vrf })); the signing share remains reduced,
 * while `vrf` is the complete serialized VrfKeyshare required by the VRF wasm API.
 *
 * The legacy path is intentionally retained because existing wallet cards do not have
 * VRF material and must continue to recover as before.
 */
export function parseMpcV2KeyShareEnvelope(decryptedKeyShare: string): ParsedMpcV2KeyShare {
  const decoded = tryDecodeCbor(decryptedKeyShare);
  if ('error' in decoded) {
    return { signingKeyShare: decoded.encoded };
  }

  if (!isRecord(decoded.decoded) || !('version' in decoded.decoded)) {
    return { signingKeyShare: decoded.encoded };
  }

  if (decoded.decoded.version !== SAFE_MPC_KEY_ENVELOPE_VERSION) {
    throw new Error(`Unsupported MPC keyshare envelope version: ${String(decoded.decoded.version)}`);
  }

  return {
    signingKeyShare: asBuffer(decoded.decoded.prvKeyShare, 'prvKeyShare'),
    vrfKeyShare: asBuffer(decoded.decoded.vrf, 'vrf'),
  };
}
