import * as utxolib from '@bitgo/utxo-lib';
import { canonicalizeObject, Signable } from './signableJson';
import { signMessage, verifyMessage } from '../bip32util';

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
  network: utxolib.Network
): boolean {
  const messageString = JSON.stringify(canonicalizeObject(message));
  const pubKey = utxolib.bip32.fromBase58(pub, network).publicKey;
  const signatureBuffer = Buffer.from(signature, 'hex');
  return verifyMessage(messageString, pubKey, signatureBuffer, network);
}

/**
 * Creates a signature for a given message.
 *
 * @param {Signable} message - The message to sign.
 * @param {string} prv - The private key in BIP32 format.
 * @param {utxolib.Network} network - The network to use for signing.
 * @returns {string} - Returns the signature in hexadecimal format.
 */
export function createMessageSignature(message: Signable, prv: string, network: utxolib.Network): string {
  const requestString = JSON.stringify(canonicalizeObject(message));
  const prvKey = utxolib.bip32.fromBase58(prv, network);
  return signMessage(requestString, prvKey, network).toString('hex');
}
