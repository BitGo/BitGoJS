import { Buffer } from 'buffer';
import * as CSL from '@emurgo/cardano-serialization-lib-nodejs';
import { Decoder, Encoder } from 'cbor';

// Helper function to convert a Uint8Array or Buffer to a hex string
export function bytesToHex(bytes: Uint8Array | Buffer): string {
  return Buffer.from(bytes).toString('hex');
}

/**
 * Helper function to encode a value to CBOR bytes.
 *
 * Do not use `cbor`'s synchronous statics (`Encoder.encode`/`encodeOne`/`encodeCanonical`) here:
 * they internally return a single `read()` chunk, which truncates the encoding on Node.js 26
 * (the resulting bytes then fail to decode with "unexpected end of input").
 *
 * Keep the `data` listener: it puts the stream in flowing mode, so the encoder's chunks are
 * delivered (and released) synchronously as it writes. Draining buffered output with `read()`
 * instead does not work — once the readable buffer passes its high-water mark `push()` returns
 * false and the encoder's chunked `push()` chains short-circuit, truncating large values.
 */
function encodeCbor(value: unknown): Buffer {
  const encoder = new Encoder();
  const chunks: Buffer[] = [];
  encoder.on('data', (chunk: Buffer) => chunks.push(chunk));
  encoder.write(value);
  encoder.end();
  return Buffer.concat(chunks);
}

export interface CSLSigStructureOutput {
  sigStructureCborBytes: Uint8Array;
  protectedHeaderCborBytes: Uint8Array;
  payloadBytes: Buffer;
}

export interface CSLCoseObjectsOutput {
  manualCoseSign1Hex: string;
  manualCoseKeyHex: string;
}

/**
 * Creates the CSL signature structure for off-chain message signing.
 *
 * @param addressCborBytes - The CBOR bytes of the CSL address.
 * @param message - The message to be signed.
 * @returns An object containing the signature structure CBOR bytes, protected header CBOR bytes, and payload bytes.
 */
export function createCSLSigStructure(addressCborBytes: Uint8Array, message: string): CSLSigStructureOutput {
  // Payload
  const payloadBytes = Buffer.from(message, 'utf-8');

  // Protected Header
  const protectedHeaderMap = new Map<number | string, any>();
  protectedHeaderMap.set(1, -8); // Algorithm ID: EdDSA
  protectedHeaderMap.set('address', Buffer.from(addressCborBytes));
  const protectedHeaderCborBytes = encodeCbor(protectedHeaderMap);

  // Sig_structure
  const sigStructureArray: any[] = [
    'Signature1',
    Buffer.from(protectedHeaderCborBytes),
    Buffer.from([]), // Empty external_aad
    Buffer.from(payloadBytes),
  ];
  const sigStructureCborBytes = encodeCbor(sigStructureArray);

  return { sigStructureCborBytes, protectedHeaderCborBytes, payloadBytes };
}

// COSE objects construction function
export function constructCSLCoseObjects(
  protectedHeaderCborBytes: Uint8Array,
  payloadBytes: Buffer,
  cslSignatureBytes: Uint8Array,
  paymentPubKey: CSL.PublicKey
): CSLCoseObjectsOutput {
  // COSE_Sign1 Construction
  const unprotectedHeadersMap = new Map<string, any>();
  unprotectedHeadersMap.set('hashed', false);
  const coseSign1Array: any[] = [
    Buffer.from(protectedHeaderCborBytes),
    unprotectedHeadersMap,
    Buffer.from(payloadBytes),
    Buffer.from(cslSignatureBytes),
  ];
  const finalCoseSign1CborBytes = encodeCbor(coseSign1Array);
  /* // directly encoding the coseSign1Array without prepending the 0xD2 tag.
   * const coseSign1PayloadBytes = encodeCbor(coseSign1Array);
   * const coseSign1Tag = Buffer.from([0xD2]); // Tag 18 for COSE_Sign1
   * const finalCoseSign1CborBytes = Buffer.concat([coseSign1Tag, coseSign1PayloadBytes]);
   */
  const manualCoseSign1Hex = bytesToHex(finalCoseSign1CborBytes);

  // COSE_Key Construction
  const coseKeyMap = new Map<number, any>();
  coseKeyMap.set(1, 1); // kty: OKP (Octet Key Pair)
  coseKeyMap.set(3, -8); // alg: EdDSA
  coseKeyMap.set(-1, 6); // crv: Ed25519
  coseKeyMap.set(-2, Buffer.from(paymentPubKey.as_bytes())); // x: public_key_bytes (Ed25519 public key)
  const finalCoseKeyCborBytes = encodeCbor(coseKeyMap);
  const manualCoseKeyHex = bytesToHex(finalCoseKeyCborBytes);

  return { manualCoseSign1Hex, manualCoseKeyHex };
}

export function coseObjectsOutputToBuffer(output: CSLCoseObjectsOutput): Buffer {
  return encodeCbor(output);
}

export async function bufferToCoseObjectsOutput(buffer: Buffer): Promise<CSLCoseObjectsOutput> {
  return await Decoder.decodeFirst(buffer);
}
