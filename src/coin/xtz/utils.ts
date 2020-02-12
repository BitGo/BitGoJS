import * as base58check from 'bs58check';
import * as sodium from 'libsodium-wrappers';
import { HashType } from './iface';

/**
 * Encode the payload to base58 with a specific Tezos prefix.
 *
 * @param {Buffer} prefix to add to the encoded payload
 * @param {Buffer} payload to encode
 * @return {any} base58 payload with a Tezos prefix
 */
export function base58encode(prefix: Buffer, payload: Buffer): string {
  const n = Buffer.alloc(prefix.length + payload.length);
  n.set(prefix);
  n.set(payload, prefix.length);

  return base58check.encode(n);
}

/**
 * Calculate the transaction id for a for a signed transaction.
 *
 * @param {string} encodedTransaction Signed transaction in hexadecimal
 * @return {Promise<string>} The transaction id
 */
export async function calculateTransactionId(encodedTransaction: string): Promise<string> {
  await sodium.ready;
  const encodedTransactionBuffer = Uint8Array.from(Buffer.from(encodedTransaction, 'hex'));
  const operationHashPayload = sodium.crypto_generichash(32, encodedTransactionBuffer);
  return base58encode(this.hashTypes.o.prefix, Buffer.from(operationHashPayload));
}

/**
 * Calculate the address of a new originated account.
 *
 * @param {string} transactionId The transaction id
 * @param {number} index The index of the origination operation inside the transaction (starts at 0)
 * @return {Promise<string>} An originated address with the KT prefix
 */
export async function calculateOriginatedAddress(transactionId: string, index: number): Promise<string> {
  // From https://github.com/TezTech/eztz/blob/cfdc4fcfc891f4f4f077c3056f414476dde3610b/src/main.js#L768
  const ob = base58check.decode(transactionId).slice(this.hashTypes.o.prefix.length);

  let tt: number[] = [];
  for(let i = 0; i < ob.length; i++) {
    tt.push(ob[i]);
  }

  tt = tt.concat([
    (index & 0xff000000) >> 24,
    (index & 0x00ff0000) >> 16,
    (index & 0x0000ff00) >> 8,
    (index & 0x000000ff)
  ]);

  await sodium.ready;
  const payload = sodium.crypto_generichash(20, new Uint8Array(tt));
  return base58encode(this.hashTypes.KT.prefix, Buffer.from(payload));
}

/**
 * Returns whether or not the string is a valid Tezos hash of the given type
 *
 * @param {String} hash - the string to validate
 * @param {HashType} hashType - the type of the provided hash
 * @returns {Boolean}
 */
export function isValidHash(hash: string, hashType: HashType): boolean {
  // Validate encoding
  let decodedHash;
  try {
    decodedHash = base58check.decode(hash);
  } catch (e) {
    return false;
  }
  const hashPrefix = decodedHash.slice(0, hashType.prefix.length);

  // Check prefix
  if (!hashPrefix.equals(Buffer.from(hashType.prefix))) {
    return false;
  }

  // Check length
  const hashLength = decodedHash.length - hashPrefix.length;
  return hashLength === hashType.byteLength;
}

/**
 * Returns whether or not the string is a valid Tezos address
 *
 * @param {String} hash - the address to validate
 * @returns {Boolean}
 */
export function isValidAddress(hash: string): boolean {
  return (
    isValidHash(hash, hashTypes.tz1) ||
    isValidHash(hash, hashTypes.tz2) ||
    isValidHash(hash, hashTypes.tz3) ||
    isValidHash(hash, hashTypes.KT)
  );
}

/**
 * Returns whether or not the string is a valid Tezos signature
 *
 * @param {String} hash - the signature to validate
 * @returns {Boolean}
 */
export function isValidSignature(hash: string): boolean {
  return (
    isValidHash(hash, hashTypes.edsig) ||
    isValidHash(hash, hashTypes.spsig1) ||
    isValidHash(hash, hashTypes.p2sig) ||
    isValidHash(hash, hashTypes.sig)
  );
}

/**
 * Returns whether or not the string is a valid Tezos block hash
 *
 * @param {String} hash - the address to validate
 * @returns {Boolean}
 */
export function isValidBlockHash(hash: string): boolean {
  return isValidHash(hash, hashTypes.b);
}

/**
 * Returns whether or not the string is a valid Tezos transaction hash
 *
 * @param {String} hash - the address to validate
 * @returns {Boolean}
 */
export function isValidTransactionHash(hash: string): boolean {
  return isValidHash(hash, hashTypes.o);
}

/**
 * Returns whether or not the string is a valid Tezos key given a prefix
 *
 * @param {String} hash - the key to validate
 * @param {HashType} hashType - the type of the provided hash
 * @returns {Boolean}
 */
export function isValidKey(hash: string, hashType: HashType): boolean {
  return isValidHash(hash, hashType);
}

/**
 * Get the original key form the text without the given prefix.
 *
 * @param {string} hash - base58 encoded key with a Tezos prefix
 * @param {HashType} hashType - the type of the provided hash
 * @returns {Buffer} the original decoded key
 */
export function decodeKey(hash: string, hashType: HashType): Buffer {
  if (!isValidKey(hash, hashType)) {
    throw new Error('Unsupported private key');
  }
  const decodedPrv = base58check.decode(hash);
  return Buffer.from(decodedPrv.slice(hashType.prefix.length, decodedPrv.length));
}

// Base58Check is used for encoding
// hashedTypes is used to validate hashes by type, by checking their prefix and
// the length of the Buffer obtained by decoding the hash (excluding the prefix)
export const hashTypes = {
  /* 20 bytes long */
  // ed25519 public key hash
  tz1: {
    prefix: new Buffer([6, 161, 159]),
    byteLength: 20,
  },
  // secp256k1 public key hash
  tz2: {
    prefix: new Buffer([6, 161, 161]),
    byteLength: 20,
  },
  // p256 public key hash
  tz3: {
    prefix: new Buffer([6, 161, 164]),
    byteLength: 20,
  },
  KT: {
    prefix: new Buffer([2, 90, 121]),
    byteLength: 20,
  },
  /* 32 bytes long */
  // ed25519 public key
  edpk: {
    prefix: new Buffer([13, 15, 37, 217]),
    byteLength: 32,
  },
  // ed25519 secret key
  edsk2: {
    prefix: new Buffer([13, 15, 58, 7]),
    byteLength: 32,
  },
  // secp256k1 secret key
  spsk: {
    prefix: new Buffer([17, 162, 224, 201]),
    byteLength: 32,
  },
  // p256 secret key
  p2sk: {
    prefix: new Buffer([16, 81, 238, 189]),
    byteLength: 32,
  },
  // block hash
  b: {
    prefix: new Buffer([1, 52]),
    byteLength: 32,
  },
  // operation hash
  o: {
    prefix: new Buffer([5, 116]),
    byteLength: 32,
  },
  // operation list hash
  Lo: {
    prefix: new Buffer([133, 233]),
    byteLength: 32,
  },
  // operation list list hash
  LLo: {
    prefix: new Buffer([29, 159, 109]),
    byteLength: 32,
  },
  // protocol hash
  P: {
    prefix: new Buffer([2, 170]),
    byteLength: 32,
  },
  // context hash
  Co: {
    prefix: new Buffer([79, 179]),
    byteLength: 32,
  },
  /* 33 bytes long */
  // secp256k1 public key
  sppk: {
    prefix: new Buffer([3, 254, 226, 86]),
    byteLength: 33,
  },
  // p256 public key
  p2pk: {
    prefix: new Buffer([3, 178, 139, 127]),
    byteLength: 33,
  },
  /* 56 bytes long */
  // ed25519 encrypted seed
  edesk: {
    prefix: new Buffer([7, 90, 60, 179, 41]),
    byteLength: 56,
  },
  /* 63 bytes long */
  // ed25519 secret key
  edsk: {
    prefix: new Buffer([43, 246, 78, 7]),
    byteLength: 64,
  },
  // ed25519 signature
  edsig: {
    prefix: new Buffer([9, 245, 205, 134, 18]),
    byteLength: 64,
  },
  // secp256k1 signature
  spsig1: {
    prefix: new Buffer([13, 115, 101, 19, 63]),
    byteLength: 64,
  },
  // p256_signature
  p2sig: {
    prefix: new Buffer([54, 240, 44, 52]),
    byteLength: 64,
  },
  // generic signature
  sig: {
    prefix: new Buffer([4, 130, 43]),
    byteLength: 64,
  },
  /* 15 bytes long */
  // network hash
  Net: {
    prefix: new Buffer([87, 82, 0]),
    byteLength: 15,
  },
  // nonce hash
  nce: {
    prefix: new Buffer([69, 220, 169]),
    byteLength: 15,
  },
  /* 4 bytes long */
  // chain id
  id: {
    prefix: new Buffer([153, 103]),
    byteLength: 4,
  },
};

// From https://github.com/ecadlabs/taquito/blob/master/packages/taquito/src/constants.ts

export enum DEFAULT_GAS_LIMIT {
  DELEGATION = 10600,
  ORIGINATION = 10600,
  TRANSFER = 10600,
  REVEAL = 10600,
}

export enum DEFAULT_FEE {
  DELEGATION = 1257,
  ORIGINATION = 10000,
  TRANSFER = 10000,
  REVEAL = 1420,
}

export enum DEFAULT_STORAGE_LIMIT {
  DELEGATION = 0,
  ORIGINATION = 257,
  TRANSFER = 257,
  REVEAL = 0,
}
