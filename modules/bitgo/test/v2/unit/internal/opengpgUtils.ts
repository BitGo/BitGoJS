import * as openpgp from 'openpgp';
import 'should';
import * as crypto from 'crypto';

import { openpgpUtils } from '@bitgo/sdk-core';

const sodium = require('libsodium-wrappers-sumo');

describe('OpenGPG Utils Tests', function () {
  let senderKey: { publicKey: string, privateKey: string };
  let recipientKey: { publicKey: string, privateKey: string };
  let otherKey: { publicKey: string, privateKey: string };

  before(async function () {
    openpgp.config.rejectCurves = new Set();
    senderKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'sender',
          email: 'sender@username.com',
        },
      ],
      curve: 'secp256k1',
    });
    recipientKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'recipient',
          email: 'recipient@username.com',
        },
      ],
      curve: 'secp256k1',
    });
    otherKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'other',
          email: 'other@username.com',
        },
      ],
      curve: 'secp256k1',
    });
  });

  describe('createShareProof', function () {
    it('should create a share proof', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue);

      // verify proof
      const decodedProof = await openpgp.readKey({ armoredKey: proof }).should.be.fulfilled();
      const isValid = (await decodedProof.verifyPrimaryUser())[0].valid;
      isValid.should.be.true();

      const proofSubkeys = decodedProof.getSubkeys()[1];

      const decodedUValueProof = Buffer.from(proofSubkeys.keyPacket.publicParams.Q.slice(1)).toString('hex');
      const rawUValueProof = Buffer.from(sodium.crypto_scalarmult_ed25519_base_noclamp(Buffer.from(uValue, 'hex'))).toString('hex');

      decodedUValueProof.should.equal(rawUValueProof);
    });
  });

  describe('verifyShareProof positive case', function () {
    it('should be able to verify a valid proof', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue);
      // verify proof
      const isValid = await openpgpUtils.verifyEdShareProof(senderKey.publicKey, proof, uValue);
      isValid.should.be.true();
    });
  });

  describe('verifyShareProof attack proof', function () {
    it('should be able to detect sender is an attacker', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(otherKey.privateKey, uValue);
      // verify proof
      const isValid = await openpgpUtils.verifyEdShareProof(senderKey.publicKey, proof, uValue);
      isValid.should.be.false();
    });
  });

  describe('verifyShareProof attack u value', function () {
    it('should be able to detect u value is corrupted', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue);
      const uValueCorrupted = crypto.randomBytes(32).toString('hex');
      // verify proof
      const isValid = await openpgpUtils.verifyEdShareProof(senderKey.publicKey, proof, uValueCorrupted);
      isValid.should.be.false();
    });
  });

  describe('verifySharedDataProof and createSharedDataProof test', function () {
    it('should be able to detect if proof value is corrupted or not', async function () {
      const sharedData1 = crypto.randomBytes(32).toString('hex');
      const sharedData2 = crypto.randomBytes(32).toString('hex');
      const dataToProofArray = [{ name: 's1', value: sharedData1 },
        { name: 's2', value: sharedData2 }];
      const proof = await openpgpUtils.createSharedDataProof(senderKey.privateKey, otherKey.publicKey, dataToProofArray);
      let isValid = await openpgpUtils.verifySharedDataProof(senderKey.publicKey, proof, dataToProofArray);
      isValid.should.be.true();
      // tamper with the data
      dataToProofArray[0].value = 'tampered data';
      isValid = await openpgpUtils.verifySharedDataProof(senderKey.publicKey, proof, dataToProofArray);
      isValid.should.be.false();
    });
  });

  describe('encrypt and decrypt with signing', function() {
    it('should successfully encrypt, sign, and decrypt', async function () {
      const text = 'original message';

      const signedMessage = await openpgpUtils.encryptAndSignText(text, recipientKey.publicKey, senderKey.privateKey);
      const decryptedMessage = await openpgpUtils.readSignedMessage(signedMessage, senderKey.publicKey, recipientKey.privateKey);

      decryptedMessage.should.equal(text);
    });

    it('should fail on verification with wrong public key', async function () {
      const text = 'original message';

      const signedMessage = await openpgpUtils.encryptAndSignText(text, recipientKey.publicKey, senderKey.privateKey);
      await openpgpUtils.readSignedMessage(signedMessage, otherKey.publicKey, recipientKey.privateKey)
        .should.be.rejected();
    });

    it('should fail on decryption with wrong private key', async function () {
      const text = 'original message';

      const signedMessage = await openpgpUtils.encryptAndSignText(text, recipientKey.publicKey, senderKey.privateKey);
      await openpgpUtils.readSignedMessage(signedMessage, senderKey.publicKey, otherKey.privateKey)
        .should.be.rejectedWith('Error decrypting message: Session key decryption failed.');
    });

    it('should encrypt, sign, and decrypt without previously clearing rejectedCurves', async function() {
      openpgp.config.rejectCurves = new Set([openpgp.enums.curve.secp256k1]);

      const text = 'original message';
      const signedMessage = await openpgpUtils.encryptAndSignText(text, recipientKey.publicKey, senderKey.privateKey);
      const decryptedMessage = await openpgpUtils.readSignedMessage(signedMessage, senderKey.publicKey, recipientKey.privateKey);
      decryptedMessage.should.equal(text);

      openpgp.config.rejectCurves = new Set();
    });
  });

  describe('signatures and verification', function() {
    it('should verify signature', async function () {
      const text = 'some payload';
      const signature = await openpgpUtils.signText(text, senderKey.privateKey);
      const isValidSignature = await openpgpUtils.verifySignature(text, signature, senderKey.publicKey);

      isValidSignature.should.be.true();
    });

    it('should fail verification if public key is incorrect', async function () {
      const text = 'some payload';
      const signature = await openpgpUtils.signText(text, senderKey.privateKey);
      const isValidSignature = await openpgpUtils.verifySignature(text, signature, recipientKey.publicKey);

      isValidSignature.should.be.false();
    });

    it('should fail verification if message is incorrect', async function () {
      const text = 'some payload';
      const signature = await openpgpUtils.signText(text, senderKey.privateKey);
      const isValidSignature = await openpgpUtils.verifySignature('something else', signature, senderKey.publicKey);

      isValidSignature.should.be.false();
    });
  });
});
