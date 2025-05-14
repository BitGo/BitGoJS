/**
 * @hidden
 */

/**
 */
import * as rippleKeypairs from 'ripple-keypairs';
import * as xrpl from 'xrpl';
import { ECPair } from '@bitgo/secp256k1';
import BigNumber from 'bignumber.js';

import * as binary from 'ripple-binary-codec';

/**
 * Convert an XRP address to a BigNumber for numeric comparison.
 * This is needed for proper sorting of signers as required by the XRP protocol.
 *
 * @param address - The XRP address to convert
 * @returns BigNumber representation of the address
 */
function addressToBigNumber(address: string): BigNumber {
  const hex = Buffer.from(xrpl.decodeAccountID(address)).toString('hex');
  return new BigNumber(hex, 16);
}

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
    // XRP requires Signers array to be sorted based on numeric value of signer addresses (lowest first)
    if (tx.Signers) {
      // Add the current signer
      tx.Signers.push({ Signer: signer });

      // Sort the Signers array by numeric value of Account (address) to ensure proper ordering
      tx.Signers.sort((a, b) => {
        const addressBN1 = addressToBigNumber(a.Signer.Account);
        const addressBN2 = addressToBigNumber(b.Signer.Account);
        return addressBN1.comparedTo(addressBN2);
      });
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
