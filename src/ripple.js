const rippleKeypairs = require('ripple-keypairs');
const ripple = require('ripple-lib');
const prova = require('./prova');

const keypairs = require('ripple-keypairs');
const binary = require('ripple-binary-codec');
const { computeBinaryTransactionHash } = require('ripple-hashes');

function computeSignature(tx, privateKey, signAs) {
  const signingData = signAs ?
    binary.encodeForMultisigning(tx, signAs) : binary.encodeForSigning(tx);
  return keypairs.sign(signingData, privateKey);
}

const signWithPrivateKey = function(txJSON, privateKey, options) {
  let privateKeyBuffer = new Buffer(privateKey, 'hex');
  if (privateKeyBuffer.length === 33 && privateKeyBuffer[0] === 0) {
    privateKeyBuffer = privateKeyBuffer.slice(1, 33);
  }
  const privateKeyObject = prova.ECPair.fromPrivateKeyBuffer(privateKeyBuffer);
  const publicKey = privateKeyObject.getPublicKeyBuffer().toString('hex').toUpperCase();

  const tx = JSON.parse(txJSON);
  if (tx.TxnSignature || tx.Signers) {
    throw new Error('txJSON must not contain "TxnSignature" or "Signers" properties');
  }

  tx.SigningPubKey = (options && options.signAs) ? '' : publicKey;

  if (options && options.signAs) {
    const expectedSigner = rippleKeypairs.deriveAddress(publicKey);
    if (options.signAs !== expectedSigner) {
      throw new Error('signAs does not match private key');
    }
    const signer = {
      Account: options.signAs,
      SigningPubKey: publicKey,
      TxnSignature: computeSignature(tx, privateKey, options.signAs)
    };
    tx.Signers = [{ Signer: signer }];
  } else {
    tx.TxnSignature = computeSignature(tx, privateKey);
  }

  const serialized = binary.encode(tx);
  return {
    signedTransaction: serialized,
    id: computeBinaryTransactionHash(serialized)
  };
};

module.exports = (params) => {
  const rippleLib = new ripple.RippleAPI(params);
  rippleLib.signWithPrivateKey = signWithPrivateKey;
  return rippleLib;
};
