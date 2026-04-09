import { Eddsa } from '@bitgo/sdk-core';
import * as fs from 'fs';
import assert = require('assert');
import { bigIntFromBufferBE, bigIntFromBufferLE, Ed25519Bip32HdTree } from '@bitgo/sdk-lib-mpc';
import sjcl = require('sjcl');

const sampleMessage = "Hello, World!";
const derivationPath = "m/0";
// TODO: Replace the following variables with your own values. Moreover, copy the encrypted user and backup keys from the key card into the userKey.txt and backupKey.txt files.
const commonKeyChain = "<Public key from key card>";
const walletPassphrase = "<Wallet passphrase>";


async function testRecoveryEddsaTss() {
  const userKey = fs.readFileSync('userKey.txt', 'utf8').replace(/(\r\n|\n|\r)/gm, "");
  const backupKey = fs.readFileSync('backupKey.txt', 'utf8').replace(/(\r\n|\n|\r)/gm, "");
  // Produce a signature.
  const hdTree = await Ed25519Bip32HdTree.initialize();
  const MPC = await Eddsa.initialize(hdTree);
  const userSigningMaterial = JSON.parse(sjcl.decrypt(walletPassphrase, userKey));
  const backupSigningMaterial = JSON.parse(sjcl.decrypt(walletPassphrase, backupKey));
  // Combine the key shares from backup -> user, bitgo -> user, and the user's private share to form the backup signing key offset by the derivation path.
  const userSubkey = MPC.keyDerive(
    userSigningMaterial.uShare,
    [userSigningMaterial.bitgoYShare, userSigningMaterial.backupYShare],
    derivationPath,
  );
  // Combine the offset key shares from user -> backup, bitgo -> backup, and the backup's private share to form the backup signing key.
  const backupSubkey = MPC.keyCombine(backupSigningMaterial.uShare, [
    userSubkey.yShares[2],
    backupSigningMaterial.bitgoYShare,
  ]);
  const messageBuffer = Buffer.from(sampleMessage, 'utf8');
  // Partial Sign the message with the user and backup signing keys.
  const userSignShare = MPC.signShare(messageBuffer, userSubkey.pShare, [userSubkey.yShares[2]]);
  const backupSignShare = MPC.signShare(messageBuffer, backupSubkey.pShare, [backupSubkey.jShares[1]]);
  const userSign = MPC.sign(
    messageBuffer,
    userSignShare.xShare,
    [backupSignShare.rShares[1]],
    [userSigningMaterial.bitgoYShare]
  );
  const backupSign = MPC.sign(
    messageBuffer,
    backupSignShare.xShare,
    [userSignShare.rShares[2]],
    [backupSigningMaterial.bitgoYShare]
  );
  // Combine partial signatures to form the final signature.
  const signature = MPC.signCombine([userSign, backupSign]);
  const signatureBuffer = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);
  // Deriving the public key at path m/0 from the common key chain.
  const derivedPub = hdTree.publicDerive(
    {
      pk: bigIntFromBufferLE(Buffer.from(commonKeyChain.slice(0, 64), 'hex')),
      chaincode: bigIntFromBufferBE(Buffer.from(commonKeyChain.slice(64), 'hex')),
    },
    derivationPath
  );
  // Verify the signature.
  const isSignatureValid = Eddsa.curve.verify(messageBuffer, signatureBuffer, derivedPub.pk);
  assert(isSignatureValid, "Signature is not valid.");
}

testRecoveryEddsaTss().catch((e) => console.error(e));
