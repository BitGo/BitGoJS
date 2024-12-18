/*

These are actually not utxo-specific and belong in a more general module.

 */
import assert from 'assert';

import buildDebug from 'debug';
import * as utxolib from '@bitgo/utxo-lib';
import { bip32 } from '@bitgo/utxo-lib';
import * as bitcoinMessage from 'bitcoinjs-message';
import { BitGoBase, decryptKeychainPrivateKey, KeyIndices } from '@bitgo/sdk-core';

import { ParsedTransaction, VerifyKeySignaturesOptions, VerifyUserPublicKeyOptions } from './abstractUtxoCoin';
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
  // first, let's verify the integrity of the user key, whose public key is used for subsequent verifications
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

  // verify the signature against the user public key
  assert(userKeychain.pub);
  const publicKey = bip32.fromBase58(userKeychain.pub).publicKey;
  // Due to interface of `bitcoinMessage`, we need to convert the public key to an address.
  // Note that this address has no relationship to on-chain transactions. We are
  // only interested in the address as a representation of the public key.
  const signingAddress = utxolib.address.toBase58Check(
    utxolib.crypto.hash160(publicKey),
    utxolib.networks.bitcoin.pubKeyHash,
    // we do not pass `this.network` here because it would fail for zcash
    // the bitcoinMessage library decodes the address and throws away the first byte
    // because zcash has a two-byte prefix, verify() decodes zcash addresses to an invalid pubkey hash
    utxolib.networks.bitcoin
  );

  // BG-5703: use BTC mainnet prefix for all key signature operations
  // (this means do not pass a prefix parameter, and let it use the default prefix instead)
  assert(keychainToVerify.pub);
  try {
    return bitcoinMessage.verify(keychainToVerify.pub, signingAddress, Buffer.from(keySignature, 'hex'));
  } catch (e) {
    debug('error thrown from bitcoinmessage while verifying key signature', e);
    return false;
  }
}

/**
 * Verify signatures against the user private key over the change wallet extended keys
 * @param {ParsedTransaction} tx
 * @param {Keychain} userKeychain
 * @return {boolean}
 * @protected
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
 * @param {BitGoBase} bitgo
 * @param {VerifyUserPublicKeyOptions} params
 * @return {boolean}
 * @protected
 */
export function verifyUserPublicKey(bitgo: BitGoBase, params: VerifyUserPublicKeyOptions): boolean {
  const { userKeychain, txParams, disableNetworking } = params;
  if (!userKeychain) {
    throw new Error('user keychain is required');
  }

  const userPub = userKeychain.pub;

  // decrypt the user private key, so we can verify that the claimed public key is a match
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
    const userPrivateKey = bip32.fromBase58(userPrv);
    if (userPrivateKey.toBase58() === userPrivateKey.neutered().toBase58()) {
      throw new Error('user private key is only public');
    }
    if (userPrivateKey.neutered().toBase58() !== userPub) {
      throw new Error('user private key does not match public key');
    }
  }

  return true;
}
