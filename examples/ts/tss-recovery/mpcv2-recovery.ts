import { ECDSAUtils } from '@bitgo/sdk-core';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as secp256k1 from 'secp256k1';
import assert = require('assert');
import { bigIntFromBufferBE, bigIntToBufferBE, HDTree, Secp256k1Bip32HdTree } from '@bitgo/sdk-lib-mpc';

const sampleMessage = "Hello, World!";
// Replace the following variables with your own values. Moreover, copy the encrypted user and backup keys from the key card into the userKey.txt and backupKey.txt files.
const commonKeyChain = "<Public key from key card>";
const walletPassphrase = "<Wallet passphrase>";


async function testRecoveryMpcV2() {
  const userKey = fs.readFileSync('userKey.txt', 'utf8').replace(/(\r\n|\n|\r)/gm, "");
  const backupKey = fs.readFileSync('backupKey.txt', 'utf8').replace(/(\r\n|\n|\r)/gm, "");
  // Converting the user and backup keys on the keycard to key buffers that can be used in signing.
  const mpcv2KeyChain = await ECDSAUtils.getMpcV2RecoveryKeyShares(userKey, backupKey, walletPassphrase);
  assert(mpcv2KeyChain.commonKeyChain === commonKeyChain, "Common key chain on keys do not match the common key chain from keycard.");
  // Computing SHA256 hash of the message.
  const messageHash = crypto.createHash('sha256').update(Buffer.from(sampleMessage, 'utf8')).digest();
  // Signing the message hash using the MPCv2 recovery key shares.
  const signature = await ECDSAUtils.signRecoveryMpcV2(messageHash, mpcv2KeyChain.userKeyShare, mpcv2KeyChain.backupKeyShare, commonKeyChain);
  const hdTree: HDTree = new Secp256k1Bip32HdTree();
  // Deriving the public key at path m/0 from the common key chain.
  const derivedPub = hdTree.publicDerive(
    {
      pk: bigIntFromBufferBE(Buffer.from(commonKeyChain.slice(0, 66), 'hex')),
      chaincode: bigIntFromBufferBE(Buffer.from(commonKeyChain.slice(66), 'hex')),
    },
    'm/0'
  );
  // Verifying that the signature is valid.
  const isSignatureValid = secp256k1.ecdsaVerify(Buffer.concat([Buffer.from(signature.r, 'hex'), Buffer.from(signature.s, 'hex')]), messageHash, bigIntToBufferBE(derivedPub.pk));
  assert(isSignatureValid, "Signature is not valid.");
}

testRecoveryMpcV2().catch((e) => console.error(e));
