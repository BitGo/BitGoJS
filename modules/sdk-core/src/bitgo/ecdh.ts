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
import * as secp256k1 from 'secp256k1';
import { ECPairInterface, BIP32Interface, bip32, ECPair } from '@bitgo/utxo-lib';

/**
 * Validate that a public key is on the secp256k1 curve
 * This is a defense-in-depth check to prevent invalid curve attacks
 * @param publicKey Buffer containing the public key to validate
 * @returns boolean true if the key is valid, false otherwise
 */
function validatePublicKey(publicKey: Buffer): boolean {
  try {
    // Validates that the public key is a point on the secp256k1 curve
    return secp256k1.publicKeyVerify(publicKey);
  } catch (e) {
    return false;
  }
}

/**
 * Calculate the Elliptic Curve Diffie Hellman
 * @param privateKey HDNode of private key
 * @param publicKey [neutered] HDNode of public key
 * @returns Buffer public key buffer that can be used as shared secret (see note)
 */
export function getSharedSecret(
  privateKey: BIP32Interface | ECPairInterface | Buffer,
  publicKey: BIP32Interface | Buffer
): Buffer {
  function isBIP32Interface(k: any): k is BIP32Interface {
    return k.constructor.name === 'BIP32';
  }
  function isECPairInterface(k: any): k is ECPairInterface {
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

  // Extra validation to ensure the public key is on the curve
  // This provides defense-in-depth against CVE-2024-48930 (GHSA-584q-6j8j-r5pm)
  if (!validatePublicKey(publicKey)) {
    throw new Error(`invalid public key: not on secp256k1 curve`);
  }

  // FIXME(BG-34386): we should use `secp256k1.ecdh()` in the future
  //                  see discussion here https://github.com/bitcoin-core/secp256k1/issues/352
  //                  Additional validation has been added above to protect against CVE-2024-48930
  const buffer = Buffer.from(secp256k1.publicKeyTweakMul(publicKey, privateKey))
    // remove leading parity bit
    .slice(1);
  assert.strictEqual(buffer.length, 32);
  return buffer;
}

/**
 Signs a message using a given ecdh xprv at a given path
 */
export function signMessageWithDerivedEcdhKey(message: string, xprv: string, path: string): Buffer {
  return bip32.fromBase58(xprv).derivePath(path).sign(Buffer.from(message));
}

/**
 Verifies if a message was signed using the given ecdh key
 @param message message to verify
 @param signature hex encoded signature used to sign the message
 @param ecdhXpub pubkey/derived pubkey of ecdh keychain used to sign
 */
export function verifyEcdhSignature(message: string, signature: string, ecdhXpub: Buffer): boolean {
  const ecPairInterface = ECPair.fromPublicKey(ecdhXpub);
  return ecPairInterface.verify(Buffer.from(message), Buffer.from(signature, 'hex'));
}
