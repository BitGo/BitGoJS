import { BIP32Interface } from 'bip32';
import * as bitcoinMessage from 'bitcoinjs-message';

const createHash = require('create-hash');
const bs58check = require('bs58check');

/**
 * Computes hash160 (RIPEMD160(SHA256(data)))
 */
function hash160(data: Buffer): Buffer {
  const sha256Hash = createHash('sha256').update(data).digest();
  return createHash('ripemd160').update(sha256Hash).digest();
}

/**
 * Encodes a hash with version byte in Base58Check format
 */
function toBase58Check(hash: Buffer, version: number): string {
  const payload = Buffer.allocUnsafe(21);
  payload.writeUInt8(version, 0);
  hash.copy(payload, 1);
  return bs58check.encode(payload);
}

// Bitcoin mainnet pubKeyHash version byte
const BITCOIN_PUBKEY_HASH_VERSION = 0x00;

/**
 * bip32-aware wrapper around bitcoin-message package
 * @see {bitcoinMessage.sign}
 */
export function signMessage(
  message: string | Buffer,
  privateKey: BIP32Interface | Buffer,
  network: { messagePrefix: string }
): Buffer {
  if (!Buffer.isBuffer(privateKey)) {
    privateKey = privateKey.privateKey as Buffer;
    if (!privateKey) {
      throw new Error(`must provide privateKey`);
    }
  }
  if (network === null || typeof network !== 'object' || typeof network.messagePrefix !== 'string') {
    throw new Error(`invalid argument 'network'`);
  }
  const compressed = true;
  return bitcoinMessage.sign(message, privateKey, compressed, network.messagePrefix);
}

/**
 * bip32-aware wrapper around bitcoin-message package
 * @see {bitcoinMessage.verify}
 */
export function verifyMessage(
  message: string | Buffer,
  publicKey: BIP32Interface | Buffer,
  signature: Buffer,
  network: { messagePrefix: string }
): boolean {
  if (!Buffer.isBuffer(publicKey)) {
    publicKey = publicKey.publicKey;
  }
  if (network === null || typeof network !== 'object' || typeof network.messagePrefix !== 'string') {
    throw new Error(`invalid argument 'network'`);
  }

  const address = toBase58Check(hash160(publicKey), BITCOIN_PUBKEY_HASH_VERSION);
  return bitcoinMessage.verify(message, address, signature, network.messagePrefix);
}
