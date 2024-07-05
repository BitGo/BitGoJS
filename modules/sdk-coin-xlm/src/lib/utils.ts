import { isValidEd25519PublicKey, isValidEd25519SecretKey } from '@bitgo/sdk-core';
import * as stellar from 'stellar-sdk';

/**
 * Creates a Stellar keypair from a public key.
 * Public key can be either a raw root public key (hex string) or a Stellar public key (prefixed with 'G')
 * @param pub Either hex root public key or Stellar public key
 * @returns Stellar keypair from the provided pub
 */
export function createStellarKeypairFromPub(pub: string): stellar.Keypair {
  if (pub.startsWith('G')) {
    return stellar.Keypair.fromPublicKey(pub);
  }
  return stellar.Keypair.fromPublicKey(encodePublicKey(Buffer.from(pub, 'hex')));
}

/**
 * Creates a Stellar keypair from a private key.
 * Private key can be either a raw root private key (hex string) or a Stellar private key (prefixed with 'S').
 * @param secret Either hex root private key or Stellar private key
 * @returns Stellar keypair from the provided prv
 */
export function createStellarKeypairFromPrv(prv: string): stellar.Keypair {
  if (prv.startsWith('S')) {
    return stellar.Keypair.fromSecret(prv);
  }
  return stellar.Keypair.fromSecret(encodePrivateKey(Buffer.from(prv.slice(0, 64), 'hex')));
}

/**
 * Validates a Stellar public key
 * Stellar public keys are prefixed with 'G'
 * @param pub A Stellar public key to validate
 * @returns Whether the input is a valid Stellar public key
 */
export function isValidStellarPublicKey(pub: string): boolean {
  return stellar.StrKey.isValidEd25519PublicKey(pub);
}

/**
 * Validates a ed25519 root public key
 * @param pub A hexadecimal public key to validate
 * @returns Whether the input is a valid public key
 */
export function isValidRootPublicKey(pub: string): boolean {
  return isValidEd25519PublicKey(pub);
}

/**
 * Validates a Stellar private key
 * Stellar private keys are prefixed with 'S'
 * @param seed A Stellar private key to validate
 * @returns Whether the input is a valid Stellar private key
 */
export function isValidStellarPrivateKey(seed: string): boolean {
  return stellar.StrKey.isValidEd25519SecretSeed(seed);
}

/**
 * Validates a ed25519 root private key
 * @param prv A hexadecimal private key to validate
 * @returns Whether the input is a valid private key
 */
export function isValidRootPrivateKey(prv: string): boolean {
  return isValidEd25519SecretKey(prv);
}

/**
 * Encodes a raw public key to a G-prefixed Stellar public key
 * @param pub Raw public key
 * @returns Encoded Stellar public key
 */
export function encodePublicKey(pub: Buffer): string {
  return stellar.StrKey.encodeEd25519PublicKey(pub);
}

/**
 * Encodes a raw private key to a S-prefixed Stellar private key
 * @param prv Raw private key
 * @returns Encoded Stellar private key
 */
export function encodePrivateKey(prv: Buffer): string {
  return stellar.StrKey.encodeEd25519SecretSeed(prv);
}

/**
 * Decodes a Stellar public key to a raw public key
 * @param pub Encoded Stellar G-prefixed public key
 * @returns Raw hexadecimal public key
 */
export function decodePublicKey(pub: string): Buffer {
  return stellar.StrKey.decodeEd25519PublicKey(pub);
}

/**
 * Decodes a Stellar private key to a raw private key
 * @param prv Encoded Stellar S-prefixed private key
 * @returns Raw hexadecimal private key
 */
export function decodePrivateKey(prv: string): Buffer {
  return stellar.StrKey.decodeEd25519SecretSeed(prv);
}
