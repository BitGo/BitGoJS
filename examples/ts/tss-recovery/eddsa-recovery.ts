import { Eddsa } from '@bitgo/sdk-core';
import * as fs from 'fs';
import assert = require('assert');
import { bigIntFromBufferBE, bigIntFromBufferLE, Ed25519Bip32HdTree } from '@bitgo/sdk-lib-mpc';
import sjcl = require('sjcl');

const sampleMessage = "Hello, World!";
const derivationPath = "m/0";
// Replace the following variables with your own values. Moreover, copy the encrypted user and backup keys from the key card into the userKey.txt and backupKey.txt files.
const commonKeyChain = "<Public key from key card>";
const walletPassphrase = "<Wallet passphrase>";


async function testRecoveryEddsaTss() {
  const userKey = fs.readFileSync('userKey.txt', 'utf8').replace(/(\r\n|\n|\r)/gm, "");
  const backupKey = fs.readFileSync('backupKey.txt', 'utf8').replace(/(\r\n|\n|\r)/gm, "");
  // Produce a signature. Note: this function verifies the signature as well.
  const hdTree = await Ed25519Bip32HdTree.initialize();
  const MPC = await Eddsa.initialize(hdTree);
  const userSigningMaterial = JSON.parse(sjcl.decrypt(walletPassphrase, userKey));
  const backupSigningMaterial = JSON.parse(sjcl.decrypt(walletPassphrase, backupKey));
  const userCombine = MPC.keyCombine(userSigningMaterial.uShare, [
    userSigningMaterial.bitgoYShare,
    userSigningMaterial.backupYShare,
  ]);
  const backupCombine = MPC.keyCombine(backupSigningMaterial.uShare, [
    backupSigningMaterial.bitgoYShare,
    backupSigningMaterial.userYShare,
  ]);
  const userSubkey = MPC.keyDerive(
    userSigningMaterial.uShare,
    [userSigningMaterial.bitgoYShare, userSigningMaterial.backupYShare],
    derivationPath,
  );
  const backupSubkey = MPC.keyCombine(backupSigningMaterial.uShare, [
    userSubkey.yShares[2],
    backupSigningMaterial.bitgoYShare,
  ]);
  const messageBuffer = Buffer.from(sampleMessage, 'utf8');
  const userSignShare = MPC.signShare(messageBuffer, userSubkey.pShare, [userCombine.jShares[2]]);
  const backupSignShare = MPC.signShare(messageBuffer, backupSubkey.pShare, [backupCombine.jShares[1]]);
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
  const isSignatureValid = Eddsa.curve.verify(messageBuffer, signatureBuffer, derivedPub.pk);
  assert(isSignatureValid, "Signature is not valid.");
}

testRecoveryEddsaTss().catch((e) => console.error(e));
