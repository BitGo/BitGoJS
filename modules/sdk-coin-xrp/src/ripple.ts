/**
 * @hidden
 */

/**
 */
import * as rippleKeypairs from 'ripple-keypairs';
import { ECPair } from '@bitgo/utxo-lib';

import * as binary from 'ripple-binary-codec';
import * as xrpl from 'xrpl';

function computeSignature(tx, privateKey, signAs) {
  const signingData = signAs ? binary.encodeForMultisigning(tx, signAs) : binary.encodeForSigning(tx);
  return rippleKeypairs.sign(signingData, privateKey);
}

/**
 * Sign Ripple transaction with a secp256k1 private key
 * @param txHex
 * @param privateKey
 * @param options
 * @returns {{signedTransaction: *, id}}
 */
const signWithPrivateKey = function (txHex, privateKey, options) {
  let privateKeyBuffer = Buffer.from(privateKey, 'hex');
  if (privateKeyBuffer.length === 33 && privateKeyBuffer[0] === 0) {
    privateKeyBuffer = privateKeyBuffer.slice(1, 33);
  }
  const publicKey = ECPair.fromPrivateKey(privateKeyBuffer).publicKey.toString('hex').toUpperCase();

  let tx;
  try {
    tx = JSON.parse(txHex);
  } catch (e) {
    tx = binary.decode(txHex);
    try {
    } catch (e) {
      throw new Error('txHex needs to be either hex or JSON string for XRP');
    }
  }
  if (tx.TxnSignature || tx.Signers) {
    throw new Error('transaction must not contain "TxnSignature" or "Signers" properties');
  }

  tx.SigningPubKey = options && options.signAs ? '' : publicKey;

  if (options && options.signAs) {
    const expectedSigner = rippleKeypairs.deriveAddress(publicKey);
    if (options.signAs !== expectedSigner) {
      throw new Error('signAs does not match private key');
    }
    const signer = {
      Account: options.signAs,
      SigningPubKey: publicKey,
      TxnSignature: computeSignature(tx, privateKey, options.signAs),
    };
    tx.Signers = [{ Signer: signer }];
  } else {
    tx.TxnSignature = computeSignature(tx, privateKey, undefined);
  }

  const serialized = binary.encode(tx);
  return {
    signedTransaction: serialized,
    id: xrpl.hashes.hashSignedTx(serialized),
  };
};

export = { ...xrpl, signWithPrivateKey };
