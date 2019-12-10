import { ExtendedKeys } from '../coin/baseCoin/iface';
import { HDNode, ECPair, networks } from 'bitgo-utxo-lib';

/**
 * Get the uncompressed public key from a BIP32 xpub
 * @param {String} xpub the xpub to extract the compressed public key from
 * @return the compressed public key in hexadecimal
 */
export function xpubToUncompressedPub(xpub: string): string {
  if (!isValidXpub(xpub)) {
    throw new Error('invalid xpub');
  }
  const hdNode = HDNode.fromBase58(xpub, networks.bitcoin);
  return hdNode.keyPair.__Q.getEncoded(false).toString('hex');
}

/**
 * Get the original private key from its extended version.
 * @param xprv In base 58
 * @return the original compressed public key
 */
export function xprvToCompressedPrv(xprv: string): string {
  if (!isValidXprv(xprv)) {
    throw new Error('invalid xprv');
  }
  const hdNode = HDNode.fromBase58(xprv, networks.bitcoin);
  return hdNode.keyPair.d.toBuffer(32).toString('hex');
}

/**
 * Get the extended public and private key for a compressed private key.
 * @param prv Private key in hex format to get the extended keys for
 * @return xprv and xpub in string format
 */
export function compressedPrvToExtendedKeys(prv: string): ExtendedKeys {
  const keyPair = ECPair.fromPrivateKeyBuffer(Buffer.from(prv, 'hex'));
  const hd = new HDNode(keyPair, Buffer.alloc(32));
  return {
    xprv: hd.toBase58(),
    xpub: hd.neutered().toBase58(),
  };
}


/**
 * Whether the input is a valid BIP32 xpub or not
 */
export function isValidXpub(xpub: string): boolean {
  if (xpub.substr(0, 4) !== 'xpub') {
    // check for xpub formats we don't support, such as tpub
    return false;
  }
  try {
    HDNode.fromBase58(xpub, networks.bitcoin);
  } catch (err) {
    return false;
  }
  // if HD generation didn't throw, it is a valid xpub
  return true;
}

/**
 * Whether the input is a valid BIP32 xprv or not
 */
export function isValidXprv(xprv: string): boolean {
  if (xprv.substr(0, 4) !== 'xprv') {
    // check for xprv formats we don't support
    return false;
  }
  try {
    HDNode.fromBase58(xprv, networks.bitcoin);
  } catch (err) {
    return false;
  }
  // if HD generation didn't throw, it is a valid xprv
  return true;
}

/**
 * Whether the input is a valid secp256k1 public key
 */
export function isValidPub(pub: string): boolean {
  try {
    ECPair.fromPublicKeyBuffer(new Buffer(pub, 'hex'));
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Whether the input is a valid secp256k1 private key
 */
export function isValidPrv(prv: string): boolean {
  try {
    ECPair.fromPrivateKeyBuffer(new Buffer(prv, 'hex'));
  } catch (e) {
    return false;
  }
  return true;
}
