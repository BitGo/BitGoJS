/**
 * @hidden
 */

/**
 */
import * as rippleKeypairs from 'ripple-keypairs';
import * as xrpl from 'xrpl';
import { ECPair } from '@bitgo/secp256k1';

import * as binary from 'ripple-binary-codec';

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
    tx = binary.decode(txHex);
  } catch (e) {
    try {
      tx = JSON.parse(txHex);
    } catch (e) {
      throw new Error('txHex needs to be either hex or JSON string for XRP');
    }
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
    // Ordering of private key signing matters, or the Ripple fullnode will throw an 'Unsorted Signers array' error.
    // Additional signers must be added to the front of the signers array list.
    if (tx.TxnSignature || tx.Signers) {
      tx.Signers.unshift({ Signer: signer });
    } else {
      tx.Signers = [{ Signer: signer }];
    }
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
