/**
 * @prettier
 *
 * Utility methods for Ellipic-Curve Diffie-Hellman (ECDH) shared secret generation
 *
 * > Elliptic-curve Diffie–Hellman (ECDH) is a key agreement protocol that allows two parties, each having an
 * > elliptic-curve public–private key pair, to establish a shared secret over an insecure channel.
 * > This shared secret may be directly used as a key, or to derive another key. The key, or the derived key, can then
 * > be used to encrypt subsequent communications using a symmetric-key cipher. It is a variant of the Diffie–Hellman
 * > protocol using elliptic-curve cryptography.
 *
 * https://en.wikipedia.org/wiki/Elliptic-curve_Diffie%E2%80%93Hellman
 */

import * as assert from 'assert';
import * as bip32 from 'bip32';
import * as secp256k1 from 'secp256k1';
import * as utxolib from '@bitgo/utxo-lib';

/**
 * Calculate the Elliptic Curve Diffie Hellman
 * @param privateKey HDNode of private key
 * @param publicKey [neutered] HDNode of public key
 * @returns Buffer public key buffer that can be used as shared secret (see note)
 */
export function getSharedSecret(
  privateKey: bip32.BIP32Interface | utxolib.ECPair.ECPairInterface | Buffer,
  publicKey: bip32.BIP32Interface | Buffer
): Buffer {
  function isBIP32Interface(k: any): k is bip32.BIP32Interface {
    return k.constructor.name === 'BIP32';
  }
  function isECPairInterface(k: any): k is utxolib.ECPair.ECPairInterface {
    return k.constructor.name === 'ECPair';
  }
  if (isBIP32Interface(privateKey)) {
    if (!privateKey.privateKey) {
      throw new Error(`privateNode must be private key`);
    }
    privateKey = privateKey.privateKey;
  } else if (isECPairInterface(privateKey)) {
    if (privateKey.privateKey === undefined || !Buffer.isBuffer(privateKey.privateKey)) {
      throw new Error(`unexpected ECPair`);
    }
    privateKey = privateKey.privateKey;
  }

  if (!Buffer.isBuffer(publicKey)) {
    publicKey = publicKey.publicKey;
  }

  if (!Buffer.isBuffer(privateKey) || !Buffer.isBuffer(publicKey)) {
    throw new Error(`invalid state`);
  }

  assert.strictEqual(privateKey.length, 32);
  assert.strictEqual(publicKey.length, 33);

  // FIXME(BG-34386): we should use `secp256k1.ecdh()` in the future
  //                  see discussion here https://github.com/bitcoin-core/secp256k1/issues/352
  const buffer = Buffer.from(secp256k1.publicKeyTweakMul(publicKey, privateKey))
    // remove leading parity bit
    .slice(1);
  assert.strictEqual(buffer.length, 32);
  return buffer;
}
