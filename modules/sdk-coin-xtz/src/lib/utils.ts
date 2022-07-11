import { isValidXpub, SigningError } from '@bitgo/sdk-core';
import { InMemorySigner } from '@taquito/signer';
import * as base58check from 'bs58check';
import { ec as EC } from 'elliptic';
import sodium from 'libsodium-wrappers';
import { HashType, SignResponse } from './iface';
import { KeyPair } from './keyPair';
import { genericMultisigDataToSign } from './multisigUtils';

// By default, use the transactions prefix
export const DEFAULT_WATERMARK = new Uint8Array([3]);

/**
 * Encode the payload to base58 with a specific Tezos prefix.
 *
 * @param {Buffer} prefix to add to the encoded payload
 * @param {Buffer} payload to encode
 * @returns {any} base58 payload with a Tezos prefix
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
 * @returns {Promise<string>} The transaction id
 */
export async function calculateTransactionId(encodedTransaction: string): Promise<string> {
  await sodium.ready;
  const encodedTransactionBuffer = Uint8Array.from(Buffer.from(encodedTransaction, 'hex'));
  const operationHashPayload = sodium.crypto_generichash(32, encodedTransactionBuffer);
  return base58encode(hashTypes.o.prefix, Buffer.from(operationHashPayload));
}

/**
 * Calculate the address of a new originated account.
 *
 * @param {string} transactionId The transaction id
 * @param {number} index The index of the origination operation inside the transaction (starts at 0)
 * @returns {Promise<string>} An originated address with the KT prefix
 */
export async function calculateOriginatedAddress(transactionId: string, index: number): Promise<string> {
  // From https://github.com/TezTech/eztz/blob/cfdc4fcfc891f4f4f077c3056f414476dde3610b/src/main.js#L768
  const ob = base58check.decode(transactionId).slice(hashTypes.o.prefix.length);

  let tt: number[] = [];
  for (let i = 0; i < ob.length; i++) {
    tt.push(ob[i]);
  }

  tt = tt.concat([
    (index & 0xff000000) >> 24,
    (index & 0x00ff0000) >> 16,
    (index & 0x0000ff00) >> 8,
    index & 0x000000ff,
  ]);

  await sodium.ready;
  const payload = sodium.crypto_generichash(20, new Uint8Array(tt));
  return base58encode(hashTypes.KT.prefix, Buffer.from(payload));
}

/**
 * Generic data signing using Tezos library.
 *
 * @param {KeyPair} keyPair A Key Pair with a private key set
 * @param {string} data The data in hexadecimal to sign
 * @param {Uint8Array} watermark Magic byte: 1 for block, 2 for endorsement, 3 for generic
 * @returns {Promise<SignResponse>}
 */
export async function sign(
  keyPair: KeyPair,
  data: string,
  watermark: Uint8Array = DEFAULT_WATERMARK
): Promise<SignResponse> {
  if (!keyPair.getKeys().prv) {
    throw new SigningError('Missing private key');
  }
  const signer = new InMemorySigner(keyPair.getKeys().prv!);
  return signer.sign(data, watermark);
}

/**
 * Verifies the signature produced for a given message belongs to a secp256k1 public key.
 *
 * @param {string} message Message in hex format to verify
 * @param {string} publicKey secp256k1 public key with "sppk" prefix to verify the signature with
 * @param {string} signature Tezos signature with "sig" prefix
 * @param {Uint8Array} watermark Optional watermark used to generate the signature
 * @returns {Promise<boolean>}
 */
export async function verifySignature(
  message: string,
  publicKey: string,
  signature: string,
  watermark: Uint8Array = DEFAULT_WATERMARK
): Promise<boolean> {
  const rawPublicKey = decodeKey(publicKey, hashTypes.sppk);
  const ec = new EC('secp256k1');
  const key = ec.keyFromPublic(rawPublicKey);

  const messageBuffer = Uint8Array.from(Buffer.from(message, 'hex'));
  // Tezos signatures always have a watermark
  const messageWithWatermark = new Uint8Array(watermark.length + messageBuffer.length);
  messageWithWatermark.set(watermark);
  messageWithWatermark.set(messageBuffer, watermark.length);

  await sodium.ready;
  const bytesHash = Buffer.from(sodium.crypto_generichash(32, messageWithWatermark));

  const rawSignature = decodeSignature(signature, hashTypes.sig);
  return key.verify(bytesHash, { r: rawSignature.slice(0, 32), s: rawSignature.slice(32, 64) });
}

/**
 * Useful wrapper to create the generic multisig contract data to sign when moving funds.
 *
 * @param {string} contractAddress The wallet contract address with the funds to withdraw
 * @param {string} destinationAddress The address to transfer the funds to
 * @param {number} amount Number mutez to transfer
 * @param {string} contractCounter Wallet counter to use in the transaction
 * @returns {any} A JSON representation of the Michelson script to sign and approve a transfer
 */
export function generateDataToSign(
  contractAddress: string,
  destinationAddress: string,
  amount: string,
  contractCounter: string
): any {
  if (!isValidOriginatedAddress(contractAddress)) {
    throw new Error('Invalid contract address ' + contractAddress + '. An originated account address was expected');
  }
  if (!isValidAddress(destinationAddress)) {
    throw new Error('Invalid destination address ' + destinationAddress);
  }
  return genericMultisigDataToSign(contractAddress, destinationAddress, amount, contractCounter);
}

/**
 * Returns whether or not the string is a valid Tezos hash of the given type
 *
 * @param {string} hash - the string to validate
 * @param {HashType} hashType - the type of the provided hash
 * @returns {boolean}
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
 * @param {string} hash - the address to validate
 * @returns {boolean}
 */
export function isValidAddress(hash: string): boolean {
  return isValidImplicitAddress(hash) || isValidHash(hash, hashTypes.KT);
}

/**
 * Returns whether or not the string is a valid Tezos implicit account address
 *
 * @param {string} hash - the address to validate
 * @returns {boolean}
 */
export function isValidImplicitAddress(hash: string): boolean {
  return isValidHash(hash, hashTypes.tz1) || isValidHash(hash, hashTypes.tz2) || isValidHash(hash, hashTypes.tz3);
}

/**
 * Returns whether or not the string is a valid Tezos originated account address
 *
 * @param {string} hash - the address to validate
 * @returns {boolean}
 */
export function isValidOriginatedAddress(hash: string): boolean {
  return isValidHash(hash, hashTypes.KT);
}

/**
 * Returns whether or not the string is a valid Tezos signature
 *
 * @param {string} hash - the signature to validate
 * @returns {boolean}
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
 * Returns whether or not the string is a valid Tezos public key
 *
 * @param {string} publicKey The public key to validate
 * @returns {boolean}
 */
export function isValidPublicKey(publicKey: string): boolean {
  return (
    isValidHash(publicKey, hashTypes.sppk) ||
    isValidHash(publicKey, hashTypes.p2pk) ||
    isValidHash(publicKey, hashTypes.edpk) ||
    isValidXpub(publicKey) // xpubs are valid too.
  );
}

/**
 * Returns whether or not the string is a valid Tezos private key
 *
 * @param {string} privateKey The private key to validate
 * @returns {boolean}
 */
export function isValidPrivateKey(privateKey: string): boolean {
  return (
    isValidHash(privateKey, hashTypes.edesk) ||
    isValidHash(privateKey, hashTypes.edsk) ||
    isValidHash(privateKey, hashTypes.spsk) ||
    isValidHash(privateKey, hashTypes.p2sk)
  );
}

/**
 * Returns whether or not the string is a valid Tezos block hash
 *
 * @param {string} hash - the address to validate
 * @returns {boolean}
 */
export function isValidBlockHash(hash: string): boolean {
  return isValidHash(hash, hashTypes.b);
}

/**
 * Returns whether or not the string is a valid Tezos transaction hash
 *
 * @param {string} hash - the address to validate
 * @returns {boolean}
 */
export function isValidTransactionHash(hash: string): boolean {
  return isValidHash(hash, hashTypes.o);
}

/**
 * Returns whether or not the string is a valid Tezos key given a prefix
 *
 * @param {string} hash - the key to validate
 * @param {HashType} hashType - the type of the provided hash
 * @returns {boolean}
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

/**
 * Get the raw signature from a Tezos encoded one.
 *
 * @param {string} signature Tezos signatures prefixed with sig, edsig, p2sig or spsig
 * @param {HashType} hashType The prefix of remove
 * @returns {Buffer} The decoded signature without prefix
 */
export function decodeSignature(signature: string, hashType: HashType): Buffer {
  if (!isValidSignature(signature)) {
    throw new Error('Unsupported signature');
  }
  const decodedPrv = base58check.decode(signature);
  return Buffer.from(decodedPrv.slice(hashType.prefix.length, decodedPrv.length));
}

// Base58Check is used for encoding
// hashedTypes is used to validate hashes by type, by checking their prefix and
// the length of the Buffer obtained by decoding the hash (excluding the prefix)
export const hashTypes = {
  /* 20 bytes long */
  // ed25519 public key hash
  tz1: {
    prefix: Buffer.from([6, 161, 159]),
    byteLength: 20,
  },
  // secp256k1 public key hash
  tz2: {
    prefix: Buffer.from([6, 161, 161]),
    byteLength: 20,
  },
  // p256 public key hash
  tz3: {
    prefix: Buffer.from([6, 161, 164]),
    byteLength: 20,
  },
  KT: {
    prefix: Buffer.from([2, 90, 121]),
    byteLength: 20,
  },
  /* 32 bytes long */
  // ed25519 public key
  edpk: {
    prefix: Buffer.from([13, 15, 37, 217]),
    byteLength: 32,
  },
  // ed25519 secret key
  edsk2: {
    prefix: Buffer.from([13, 15, 58, 7]),
    byteLength: 32,
  },
  // secp256k1 secret key
  spsk: {
    prefix: Buffer.from([17, 162, 224, 201]),
    byteLength: 32,
  },
  // p256 secret key
  p2sk: {
    prefix: Buffer.from([16, 81, 238, 189]),
    byteLength: 32,
  },
  // block hash
  b: {
    prefix: Buffer.from([1, 52]),
    byteLength: 32,
  },
  // operation hash
  o: {
    prefix: Buffer.from([5, 116]),
    byteLength: 32,
  },
  // operation list hash
  Lo: {
    prefix: Buffer.from([133, 233]),
    byteLength: 32,
  },
  // operation list list hash
  LLo: {
    prefix: Buffer.from([29, 159, 109]),
    byteLength: 32,
  },
  // protocol hash
  P: {
    prefix: Buffer.from([2, 170]),
    byteLength: 32,
  },
  // context hash
  Co: {
    prefix: Buffer.from([79, 179]),
    byteLength: 32,
  },
  /* 33 bytes long */
  // secp256k1 public key
  sppk: {
    prefix: Buffer.from([3, 254, 226, 86]),
    byteLength: 33,
  },
  // p256 public key
  p2pk: {
    prefix: Buffer.from([3, 178, 139, 127]),
    byteLength: 33,
  },
  /* 56 bytes long */
  // ed25519 encrypted seed
  edesk: {
    prefix: Buffer.from([7, 90, 60, 179, 41]),
    byteLength: 56,
  },
  /* 63 bytes long */
  // ed25519 secret key
  edsk: {
    prefix: Buffer.from([43, 246, 78, 7]),
    byteLength: 64,
  },
  // ed25519 signature
  edsig: {
    prefix: Buffer.from([9, 245, 205, 134, 18]),
    byteLength: 64,
  },
  // secp256k1 signature
  spsig1: {
    prefix: Buffer.from([13, 115, 101, 19, 63]),
    byteLength: 64,
  },
  // p256_signature
  p2sig: {
    prefix: Buffer.from([54, 240, 44, 52]),
    byteLength: 64,
  },
  // generic signature
  sig: {
    prefix: Buffer.from([4, 130, 43]),
    byteLength: 64,
  },
  /* 15 bytes long */
  // network hash
  Net: {
    prefix: Buffer.from([87, 82, 0]),
    byteLength: 15,
  },
  // nonce hash
  nce: {
    prefix: Buffer.from([69, 220, 169]),
    byteLength: 15,
  },
  /* 4 bytes long */
  // chain id
  id: {
    prefix: Buffer.from([153, 103]),
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
