import * as utxolib from '@bitgo/utxo-lib';
import * as sdkcore from '@bitgo/sdk-core';
import { canonicalizeObject, Signable } from './signableJson';

/**
 * Verifies a signature for a given message.
 *
 * @param {Signable} message - The message to verify.
 * @param {string} signature - The signature to verify, in hexadecimal format.
 * @param {string} pub - The public key in BIP32 format.
 * @param {utxolib.Network} network - The network to use for verification.
 * @returns {boolean} - Returns true if the signature is valid, false otherwise.
 */
export function verifyMessageSignature(
  message: Signable,
  signature: string,
  pub: string,
  network: utxolib.Network = utxolib.networks.bitcoin
): boolean {
  const messageString = JSON.stringify(canonicalizeObject(message));
  const pubKey = utxolib.bip32.fromBase58(pub, network).publicKey;
  const signatureBuffer = Buffer.from(signature, 'hex');
  return sdkcore.verifyMessage(messageString, pubKey, signatureBuffer, network);
}

/**
 * Creates a signature for a given message.
 *
 * @param {Signable} message - The message to sign.
 * @param {string} prv - The private key in BIP32 format.
 * @param {utxolib.Network} network - The network to use for signing.
 * @returns {string} - Returns the signature in hexadecimal format.
 */
export function createMessageSignature(
  message: Signable,
  xprv: string,
  network: utxolib.Network = utxolib.networks.bitcoin
): string {
  const requestString = JSON.stringify(canonicalizeObject(message));
  const prvKey = utxolib.bip32.fromBase58(xprv, network);
  return sdkcore.signMessage(requestString, prvKey, network).toString('hex');
}
