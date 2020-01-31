import * as base58check from 'bs58check';

/**
 * Encode the payload to base58 with a specific Tezos prefix.
 * @param {Uint8Array} prefix to add to the encoded payload
 * @param {Buffer} payload to encode
 * @return {any} base58 payload with a Tezos prefix
 */
export function base58encode(prefix: Uint8Array, payload: Buffer): string {
  const n = Buffer.alloc(prefix.length + payload.length);
  n.set(prefix);
  n.set(payload, prefix.length);

  return base58check.encode(n);
}

/** Whether or not the string is a valid Tezos key given a prefix. */
export function isValidTezosKey(prefix: Uint8Array, text: string): boolean {
  const decodedText = base58check.decode(text);
  const textPrefix = decodedText.slice(0, prefix.length);
  // Check prefix
  if (!textPrefix.equals(Buffer.from(prefix))) {
    return false;
  }
  // Check length:
  // - 33 bytes for compressed pub keys (1 byte for the prefix)
  // - 65 bytes for uncompressed pub keys (1 byte for the prefix)
  // - 32 bytes for private keys
  const keyLength = (decodedText.length - textPrefix.length);
  if (keyLength != 33 && keyLength != 65 && keyLength != 32) {
    return false;
  }
  return true;
}

/**
 * Get the original key form the text without the given prefix.
 * @param {Uint8Array} prefix to remove from the text
 * @param {string} text base58 encoded key with a Tezos prefix
 * @return {Buffer} the original decoded key
 */
export function decodeKey(prefix: Uint8Array, text: string): Buffer {
  if (!isValidTezosKey(prefix, text)) {
    throw new Error('Unsupported private key');
  }
  const decodedPrv = base58check.decode(text);
  return Buffer.from(decodedPrv.slice(prefix.length, decodedPrv.length));
}

/** Tezos known prefixes bytes. */
export const prefix = {
  tz1: new Uint8Array([6, 161, 159]),
  tz2: new Uint8Array([6, 161, 161]),
  tz3: new Uint8Array([6, 161, 164]),
  KT: new Uint8Array([2,90,121]),

  edpk: new Uint8Array([13, 15, 37, 217]),
  edsk2: new Uint8Array([13, 15, 58, 7]),
  spsk: new Uint8Array([17, 162, 224, 201]),
  p2sk: new Uint8Array([16,81,238,189]),

  sppk: new Uint8Array([3, 254, 226, 86]),
  p2pk: new Uint8Array([3, 178, 139, 127]),

  edesk: new Uint8Array([7, 90, 60, 179, 41]),

  edsk: new Uint8Array([43, 246, 78, 7]),
  edsig: new Uint8Array([9, 245, 205, 134, 18]),
  spsig1: new Uint8Array([13, 115, 101, 19, 63]),
  p2sig: new Uint8Array([54, 240, 44, 52]),
  sig: new Uint8Array([4, 130, 43]),

  Net: new Uint8Array([87, 82, 0]),
  nce: new Uint8Array([69, 220, 169]),
  b: new Uint8Array([1,52]),
  o: new Uint8Array([5, 116]),
  Lo: new Uint8Array([133, 233]),
  LLo: new Uint8Array([29, 159, 109]),
  P: new Uint8Array([2, 170]),
  Co: new Uint8Array([79, 179]),
  id: new Uint8Array([153, 103]),
};
