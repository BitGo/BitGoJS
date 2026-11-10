import * as openpgp from 'openpgp';
import should = require('should');
import * as crypto from 'crypto';
import * as assert from 'assert';

import { openpgpUtils } from '@bitgo/sdk-core';
import { ecc as secp256k1 } from '@bitgo/utxo-lib';
import * as sinon from 'sinon';

const sodium = require('libsodium-wrappers-sumo');

describe('OpenGPG Utils Tests', function () {
  let senderKey: { publicKey: string; privateKey: string };
  let recipientKey: { publicKey: string; privateKey: string };
  let otherKey: { publicKey: string; privateKey: string };

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
    it('should create an Ed share proof', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue, 'eddsa');

      // verify proof
      const decodedProof = await openpgp.readKey({ armoredKey: proof }).should.be.fulfilled();
      const decodedPubKey = await openpgp.readKey({ armoredKey: senderKey.publicKey }).should.be.fulfilled();
      const isValid = (await decodedProof.verifyPrimaryUser([decodedPubKey]))[0].valid;
      isValid.should.be.true();

      const proofSubkeys = decodedProof.getSubkeys()[1];

      const decodedUValueProof = Buffer.from(proofSubkeys.keyPacket.publicParams.Q.slice(1)).toString('hex');
      const rawUValueProof = Buffer.from(
        sodium.crypto_scalarmult_ed25519_base_noclamp(Buffer.from(uValue, 'hex'))
      ).toString('hex');

      decodedUValueProof.should.equal(rawUValueProof);
    });

    it('should create an Ec share proof', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue, 'ecdsa');

      // verify proof
      const decodedProof = await openpgp.readKey({ armoredKey: proof }).should.be.fulfilled();
      const decodedPubKey = await openpgp.readKey({ armoredKey: senderKey.publicKey }).should.be.fulfilled();
      const isValid = (await decodedProof.verifyPrimaryUser([decodedPubKey]))[0].valid;
      isValid.should.be.true();

      const proofSubkeys = decodedProof.getSubkeys()[1];

      const decodedUValueProof = proofSubkeys.keyPacket.publicParams.Q;
      const rawUValueProof = secp256k1.pointFromScalar(Buffer.from(uValue, 'hex'), false);
      equal(decodedUValueProof, rawUValueProof).should.be.true();
    });
  });

  describe('verifyPrimaryUserWrapper', function () {
    it('should verify primary user with a date check', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue, 'eddsa');

      // verify proof
      const decodedProof = await openpgp.readKey({ armoredKey: proof }).should.be.fulfilled();
      const decodedPubKey = await openpgp.readKey({ armoredKey: senderKey.publicKey }).should.be.fulfilled();
      const isValid = (await openpgpUtils.verifyPrimaryUserWrapper(decodedProof, decodedPubKey, true))[0].valid;
      should.exist(isValid);
      if (isValid !== null) {
        isValid.should.be.true();
      }
    });

    it('should verify primary user without a date check', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue, 'eddsa');

      // verify proof
      const decodedProof = await openpgp.readKey({ armoredKey: proof }).should.be.fulfilled();
      const decodedPubKey = await openpgp.readKey({ armoredKey: senderKey.publicKey }).should.be.fulfilled();
      const isValid = (await openpgpUtils.verifyPrimaryUserWrapper(decodedProof, decodedPubKey, false))[0].valid;
      should.exist(isValid);
      if (isValid !== null) {
        isValid.should.be.true();
      }
    });
  });

  describe('verifyShareProof EdDSA', function () {
    it('should be able to verify a valid proof', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue, 'eddsa');
      const isValid = await openpgpUtils.verifyShareProof(senderKey.publicKey, proof, uValue, 'eddsa');
      isValid.should.be.true();
    });

    it('should be able to detect sender is an attacker', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(otherKey.privateKey, uValue, 'eddsa');
      const isValid = await openpgpUtils.verifyShareProof(senderKey.publicKey, proof, uValue, 'eddsa');
      isValid.should.be.false();
    });

    it('should be able to detect u value is corrupted', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue, 'eddsa');
      const uValueCorrupted = crypto.randomBytes(32).toString('hex');
      const isValid = await openpgpUtils.verifyShareProof(senderKey.publicKey, proof, uValueCorrupted, 'eddsa');
      isValid.should.be.false();
    });
  });

  describe('verifyShareProof ECDSA', function () {
    it('should be able to verify a valid proof', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue, 'ecdsa');
      const isValid = await openpgpUtils.verifyShareProof(senderKey.publicKey, proof, uValue, 'ecdsa');
      isValid.should.be.true();
    });

    it('should reject a proof whose subkey binding is not signed by the primary key', async function () {
      const uForged = crypto.randomBytes(32).toString('hex');
      const Q = secp256k1.pointFromScalar(Buffer.from(uForged, 'hex'), false);
      // openpgp typings omit the runtime oid.write()/computeFingerprintAndKeyID() used to
      // hand-assemble packets here
      const oid = [0x2b, 0x81, 0x04, 0x00, 0x0a] as unknown as { write: () => Uint8Array };
      oid.write = () => new Uint8Array(Buffer.from('052b8104000a', 'hex'));
      const subkey = new openpgp.PublicSubkeyPacket();
      subkey.algorithm = openpgp.enums.publicKey.ecdsa;
      subkey.publicParams = { oid, Q };
      const subkeyWithFingerprint = subkey as unknown as { computeFingerprintAndKeyID(): Promise<void> };
      await subkeyWithFingerprint.computeFingerprintAndKeyID();
      const binding = new openpgp.SignaturePacket();
      binding.signatureType = openpgp.enums.signature.subkeyBinding;
      binding.publicKeyAlgorithm = openpgp.enums.publicKey.ecdsa;
      binding.hashAlgorithm = openpgp.enums.hash.sha256;
      binding.keyFlags = new Uint8Array([openpgp.enums.keyFlags.authentication]);
      const senderKeyObj = await openpgp.readKey({ armoredKey: senderKey.publicKey });
      const recipientKeyObj = await openpgp.readPrivateKey({ armoredKey: recipientKey.privateKey });
      // openpgp types PrivateKey.keyPacket as a union; signing needs the primary secret packet
      const attackerSecretPacket = recipientKeyObj.keyPacket as unknown as openpgp.SecretKeyPacket;
      // openpgp types sign()'s data as bytes only; subkeyBinding signing takes {key, bind} at runtime
      const bindingData = { key: senderKeyObj.keyPacket, bind: subkey } as unknown as Uint8Array;
      await binding.sign(attackerSecretPacket, bindingData, new Date());
      const forged = new openpgp.PacketList();
      senderKeyObj.toPacketList().forEach((p) => forged.push(p));
      forged.push(subkey);
      forged.push(binding);
      const forgedProof = openpgp.armor(openpgp.enums.armor.publicKey, forged.write());
      const isValid = await openpgpUtils.verifyShareProof(senderKey.publicKey, forgedProof, uForged, 'ecdsa');
      isValid.should.be.false();
    });

    it('should be able to detect sender is an attacker', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(otherKey.privateKey, uValue, 'ecdsa');
      const isValid = await openpgpUtils.verifyShareProof(senderKey.publicKey, proof, uValue, 'ecdsa');
      isValid.should.be.false();
    });

    it('should be able to detect u value is corrupted', async function () {
      const uValue = crypto.randomBytes(32).toString('hex');
      const proof = await openpgpUtils.createShareProof(senderKey.privateKey, uValue, 'ecdsa');
      const uValueCorrupted = crypto.randomBytes(32).toString('hex');
      const isValid = await openpgpUtils.verifyShareProof(senderKey.publicKey, proof, uValueCorrupted, 'ecdsa');
      isValid.should.be.false();
    });
  });

  describe('verifySharedDataProof and createSharedDataProof test', function () {
    it('should be able to detect if proof value is corrupted or not', async function () {
      const sharedData1 = crypto.randomBytes(32).toString('hex');
      const sharedData2 = crypto.randomBytes(32).toString('hex');
      const dataToProofArray = [
        { name: 's1', value: sharedData1 },
        { name: 's2', value: sharedData2 },
      ];
      const proof = await openpgpUtils.createSharedDataProof(
        senderKey.privateKey,
        otherKey.publicKey,
        dataToProofArray
      );
      let isValid = await openpgpUtils.verifySharedDataProof(senderKey.publicKey, proof, dataToProofArray);
      isValid.should.be.true();
      // tamper with the data
      dataToProofArray[0].value = 'tampered data';
      isValid = await openpgpUtils.verifySharedDataProof(senderKey.publicKey, proof, dataToProofArray);
      isValid.should.be.false();
    });

    it('should reject the proof when a foreign certification is applied after the genuine one', async function () {
      const sharedData1 = crypto.randomBytes(32).toString('hex');
      const sharedData2 = crypto.randomBytes(32).toString('hex');
      const dataToProofArray = [
        { name: 's1', value: sharedData1 },
        { name: 's2', value: sharedData2 },
      ];
      const proof = await openpgpUtils.createSharedDataProof(
        senderKey.privateKey,
        otherKey.publicKey,
        dataToProofArray
      );
      const attacked = await openpgpUtils.createSharedDataProof(recipientKey.privateKey, proof, [
        { name: 's1', value: sharedData1 },
        { name: 's2', value: sharedData2 },
      ]);
      const isValid = await openpgpUtils.verifySharedDataProof(senderKey.publicKey, attacked, dataToProofArray);
      isValid.should.be.false();
    });

    it('should accept the proof when a foreign certification without notations is applied after the genuine one', async function () {
      const sharedData1 = crypto.randomBytes(32).toString('hex');
      const sharedData2 = crypto.randomBytes(32).toString('hex');
      const dataToProofArray = [
        { name: 's1', value: sharedData1 },
        { name: 's2', value: sharedData2 },
      ];
      const proof = await openpgpUtils.createSharedDataProof(
        senderKey.privateKey,
        otherKey.publicKey,
        dataToProofArray
      );
      const peerCertified = await openpgpUtils.createSharedDataProof(recipientKey.privateKey, proof, []);
      const isValid = await openpgpUtils.verifySharedDataProof(senderKey.publicKey, peerCertified, dataToProofArray);
      isValid.should.be.true();
    });

    it('should reject a proof whose only verified certification carries no notations', async function () {
      const dataToProofArray = [
        { name: 's1', value: crypto.randomBytes(32).toString('hex') },
        { name: 's2', value: crypto.randomBytes(32).toString('hex') },
      ];
      const proof = await openpgpUtils.createSharedDataProof(senderKey.privateKey, otherKey.publicKey, []);
      const isValid = await openpgpUtils.verifySharedDataProof(senderKey.publicKey, proof, dataToProofArray);
      isValid.should.be.false();
    });

    it('should be able verify data proof if created in the future', async function () {
      const sharedData1 = crypto.randomBytes(32).toString('hex');
      const sharedData2 = crypto.randomBytes(32).toString('hex');
      const dataToProofArray = [
        { name: 's1', value: sharedData1 },
        { name: 's2', value: sharedData2 },
      ];
      const proof = await openpgpUtils.createSharedDataProof(
        senderKey.privateKey,
        otherKey.publicKey,
        dataToProofArray
      );
      const clock = sinon.useFakeTimers(new Date('2001-02-14T12:00:00Z').getTime());
      const isValid = await openpgpUtils.verifySharedDataProof(senderKey.publicKey, proof, dataToProofArray);
      isValid.should.be.true();
      clock.restore();
    });
  });

  describe('encrypt and decrypt with signing', function () {
    it('should successfully encrypt, sign, and decrypt', async function () {
      const text = 'original message';

      const signedMessage = await openpgpUtils.encryptAndSignText(text, recipientKey.publicKey, senderKey.privateKey);
      const decryptedMessage = await openpgpUtils.readSignedMessage(
        signedMessage,
        senderKey.publicKey,
        recipientKey.privateKey
      );

      decryptedMessage.should.equal(text);
    });

    it('should fail on verification with wrong public key', async function () {
      const text = 'original message';

      const signedMessage = await openpgpUtils.encryptAndSignText(text, recipientKey.publicKey, senderKey.privateKey);
      await openpgpUtils
        .readSignedMessage(signedMessage, otherKey.publicKey, recipientKey.privateKey)
        .should.be.rejected();
    });

    it('should fail on decryption with wrong private key', async function () {
      const text = 'original message';

      const signedMessage = await openpgpUtils.encryptAndSignText(text, recipientKey.publicKey, senderKey.privateKey);
      await openpgpUtils
        .readSignedMessage(signedMessage, senderKey.publicKey, otherKey.privateKey)
        .should.be.rejectedWith('Error decrypting message: Session key decryption failed.');
    });

    it('should encrypt, sign, and decrypt without previously clearing rejectedCurves', async function () {
      openpgp.config.rejectCurves = new Set([openpgp.enums.curve.secp256k1]);

      const text = 'original message';
      const signedMessage = await openpgpUtils.encryptAndSignText(text, recipientKey.publicKey, senderKey.privateKey);
      const decryptedMessage = await openpgpUtils.readSignedMessage(
        signedMessage,
        senderKey.publicKey,
        recipientKey.privateKey
      );
      decryptedMessage.should.equal(text);

      openpgp.config.rejectCurves = new Set();
    });
  });

  describe('signatures and verification', function () {
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

  describe('GPG key generation', function () {
    it('should generate a a GPG key for secp256k1 with random name and email', async function () {
      const gpgKey = await openpgpUtils.generateGPGKeyPair('secp256k1');

      should.exist(gpgKey);
      should.exist(gpgKey.privateKey);
      should.exist(gpgKey.publicKey);
    });

    it('should generate a a GPG key for ed25519 with random name and email', async function () {
      const gpgKey = await openpgpUtils.generateGPGKeyPair('ed25519');

      should.exist(gpgKey);
      should.exist(gpgKey.privateKey);
      should.exist(gpgKey.publicKey);
    });

    it('should generate an ed25519 GPG key with a dedicated signing subkey', async function () {
      const gpgKey = await openpgpUtils.generateGPGKeyPair('ed25519');
      const parsedKey = await openpgp.readKey({ armoredKey: gpgKey.publicKey });

      const signingKey = await parsedKey.getSigningKey();
      // The signing key must be a subkey (has bindingSignatures), not the primary key.
      // The HSM verifies the binding signature during MPS keygen round 1.
      assert.ok('bindingSignatures' in signingKey, 'signing key should be a subkey with bindingSignatures');
      assert.ok(signingKey.bindingSignatures.length > 0, 'signing subkey should have at least one binding signature');
    });

    it('should generate a a GPG key with provided name and email', async function () {
      const userName = 'John Doe';
      const userEmail = 'john.doe@example.com';
      const gpgKey = await openpgpUtils.generateGPGKeyPair('secp256k1', userName, userEmail);

      should.exist(gpgKey);
      should.exist(gpgKey.privateKey);
      should.exist(gpgKey.publicKey);

      const parsedKey = await openpgp.readKey({ armoredKey: gpgKey.publicKey });
      should.exist(parsedKey);

      assert.ok(parsedKey);
      const primaryUser = await parsedKey.getPrimaryUser();
      primaryUser.user.userID?.name?.should.equal(userName);
      primaryUser.user.userID?.email?.should.equal(userEmail);
    });

    it('should fail to generate a a GPG key for unknown curve', async function () {
      await openpgpUtils
        .generateGPGKeyPair('unknownCurve' as openpgp.EllipticCurveName)
        .should.be.rejectedWith('Error generating keypair: Unknown curve');
    });
  });

  function equal(buf1, buf2) {
    if (buf1.byteLength != buf2.byteLength) return false;
    const dv1 = new Int8Array(buf1);
    const dv2 = new Int8Array(buf2);
    for (let i = 0; i != buf1.byteLength; i++) {
      if (dv1[i] != dv2[i]) return false;
    }
    return true;
  }
});
