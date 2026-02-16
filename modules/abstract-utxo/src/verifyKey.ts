/*

These are actually not utxo-specific and belong in a more general module.

 */
import assert from 'assert';

import buildDebug from 'debug';
import { BIP32, message } from '@bitgo/wasm-utxo';
import { BitGoBase, decryptKeychainPrivateKey, KeyIndices } from '@bitgo/sdk-core';

import { VerifyKeySignaturesOptions, VerifyUserPublicKeyOptions } from './abstractUtxoCoin';
import { ParsedTransaction } from './transaction/types';
import { UtxoKeychain } from './keychains';

const debug = buildDebug('bitgo:abstract-utxo:verifyKey');

/**
 * Verify signatures produced by the user key over the backup and bitgo keys.
 *
 * If set, these signatures ensure that the wallet keys cannot be changed after the wallet has been created.
 * @param {VerifyKeySignaturesOptions} params
 * @return {{backup: boolean, bitgo: boolean}}
 */
export function verifyKeySignature(params: VerifyKeySignaturesOptions): boolean {
  const { userKeychain, keychainToVerify, keySignature } = params;
  if (!userKeychain) {
    throw new Error('user keychain is required');
  }

  if (!keychainToVerify) {
    throw new Error('keychain to verify is required');
  }

  if (!keySignature) {
    throw new Error('key signature is required');
  }

  assert(userKeychain.pub);
  const publicKey = BIP32.fromBase58(userKeychain.pub).publicKey;

  assert(keychainToVerify.pub);
  try {
    return message.verifyMessage(keychainToVerify.pub, publicKey, Buffer.from(keySignature, 'hex'));
  } catch (e) {
    debug('error thrown from wasm-utxo while verifying key signature', e);
    return false;
  }
}

/**
 * Verify signatures against the user private key over the change wallet extended keys
 */
export function verifyCustomChangeKeySignatures<TNumber extends number | bigint>(
  tx: ParsedTransaction<TNumber>,
  userKeychain: UtxoKeychain
): boolean {
  if (!tx.customChange) {
    throw new Error('parsed transaction is missing required custom change verification data');
  }

  if (!Array.isArray(tx.customChange.keys) || !Array.isArray(tx.customChange.signatures)) {
    throw new Error('customChange property is missing keys or signatures');
  }

  for (const keyIndex of [KeyIndices.USER, KeyIndices.BACKUP, KeyIndices.BITGO]) {
    const keychainToVerify = tx.customChange.keys[keyIndex];
    const keySignature = tx.customChange.signatures[keyIndex];
    if (!keychainToVerify) {
      throw new Error(`missing required custom change ${KeyIndices[keyIndex].toLowerCase()} keychain public key`);
    }
    if (!keySignature) {
      throw new Error(`missing required custom change ${KeyIndices[keyIndex].toLowerCase()} keychain signature`);
    }
    if (!verifyKeySignature({ userKeychain, keychainToVerify, keySignature })) {
      debug('failed to verify custom change %s key signature!', KeyIndices[keyIndex].toLowerCase());
      return false;
    }
  }

  return true;
}

/**
 * Decrypt the wallet's user private key and verify that the claimed public key matches
 */
export function verifyUserPublicKey(bitgo: BitGoBase, params: VerifyUserPublicKeyOptions): boolean {
  const { userKeychain, txParams, disableNetworking } = params;
  if (!userKeychain) {
    throw new Error('user keychain is required');
  }

  const userPub = userKeychain.pub;

  let userPrv = userKeychain.prv;
  if (!userPrv && txParams.walletPassphrase) {
    userPrv = decryptKeychainPrivateKey(bitgo, userKeychain, txParams.walletPassphrase);
  }

  if (!userPrv) {
    const errorMessage = 'user private key unavailable for verification';
    if (disableNetworking) {
      console.log(errorMessage);
      return false;
    } else {
      throw new Error(errorMessage);
    }
  } else {
    const userPrivateKey = BIP32.fromBase58(userPrv);
    if (userPrivateKey.toBase58() === userPrivateKey.neutered().toBase58()) {
      throw new Error('user private key is only public');
    }
    if (userPrivateKey.neutered().toBase58() !== userPub) {
      throw new Error('user private key does not match public key');
    }
  }

  return true;
}
