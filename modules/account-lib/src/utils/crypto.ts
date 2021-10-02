import * as bip32 from 'bip32';
import { ECPair, networks } from 'bitcoinjs-lib';
import * as nacl from 'tweetnacl';
import { ExtendedKeys } from '../coin/baseCoin/iface';
import { toUint8Array } from '../coin/hbar/utils';

/**
 * @param {string} xpub - a base-58 encoded extended public key (BIP32)
 * @returns {string} the uncompressed public key in hexadecimal
 */
export function xpubToUncompressedPub(xpub: string): string {
  if (!isValidXpub(xpub)) {
    throw new Error('invalid xpub');
  }
  return ECPair.fromPublicKey(bip32.fromBase58(xpub, networks.bitcoin).publicKey, {
    compressed: false,
  }).publicKey.toString('hex');
}

/**
 * @param {string} xprv - base58-encoded extended private key (BIP32)
 * @returns {string} the hex-encoded raw private key
 */
export function xprvToRawPrv(xprv: string): string {
  if (!isValidXprv(xprv)) {
    throw new Error('invalid xprv');
  }

  const { privateKey } = bip32.fromBase58(xprv, networks.bitcoin);
  if (!privateKey) {
    throw new Error('invalid xprv');
  }
  return privateKey.toString('hex');
}

/**
 * @param {string} prv - Private key in hex format to get the extended keys for
 * @returns {ExtendedKeys} xprv and xpub in string format
 */
export function rawPrvToExtendedKeys(prv: string): ExtendedKeys {
  const hd = bip32.fromPrivateKey(Buffer.from(prv, 'hex'), Buffer.alloc(32));
  return {
    xprv: hd.toBase58(),
    xpub: hd.neutered().toBase58(),
  };
}

/**
 * Whether the input is a valid BIP32 xpub or not
 *
 * @param xpub
 */
export function isValidXpub(xpub: string): boolean {
  if (xpub.substr(0, 4) !== 'xpub') {
    // check for xpub formats we don't support, such as tpub
    return false;
  }
  try {
    bip32.fromBase58(xpub, networks.bitcoin);
  } catch (err) {
    return false;
  }
  // if HD generation didn't throw, it is a valid xpub
  return true;
}

/**
 * Whether the input is a valid BIP32 xprv or not
 *
 * @param xprv
 */
export function isValidXprv(xprv: string): boolean {
  if (xprv.substr(0, 4) !== 'xprv') {
    // check for xprv formats we don't support
    return false;
  }
  try {
    bip32.fromBase58(xprv, networks.bitcoin);
  } catch (err) {
    return false;
  }
  // if HD generation didn't throw, it is a valid xprv
  return true;
}

/**
 * Whether the input is a valid secp256k1 public key
 *
 * @param pub
 */
export function isValidPub(pub: string): boolean {
  try {
    ECPair.fromPublicKey(Buffer.from(pub, 'hex'));
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Whether the input is a valid secp256k1 private key
 *
 * @param prv
 */
export function isValidPrv(prv: string): boolean {
  try {
    ECPair.fromPrivateKey(Buffer.from(prv, 'hex'));
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Whether the input is a valid ed25519 private key
 *
 * @param {string} prv A hexadecimal private key to validate
 * @returns {boolean} Whether the input is a valid public key or not
 */
export function isValidEd25519Seed(prv: string): boolean {
  try {
    const decodedPrv = toUint8Array(prv);
    return decodedPrv.length === nacl.sign.seedLength;
  } catch (e) {
    return false;
  }
}

/**
 * Whether the input is a valid ed25519 private key
 *
 * @param {string} prv A hexadecimal private key to validate
 * @returns {boolean} Whether the input is a valid public key or not
 */
export function isValidEd25519SecretKey(prv: string): boolean {
  try {
    const decodedPrv = toUint8Array(prv);
    return decodedPrv.length === nacl.sign.secretKeyLength;
  } catch (e) {
    return false;
  }
}

/**
 * Whether the input is a valid ed25519 public key
 *
 * @param {string} pub A hexadecimal public key to validate
 * @returns {boolean} Whether the input is a valid public key or not
 */
export function isValidEd25519PublicKey(pub: string): boolean {
  try {
    const decodedPub = new Uint8Array(Buffer.from(pub, 'hex'));
    return decodedPub.length === nacl.sign.publicKeyLength;
  } catch (e) {
    return false;
  }
}
