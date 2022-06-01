import * as openpgp from 'openpgp';
import 'should';

import { openpgpUtils } from '@bitgo/sdk-core';

describe('OpenGPG Utils Tests', function () {
  let senderKey: { publicKey: string, privateKey: string };
  let recipientKey: { publicKey: string, privateKey: string };
  let otherKey: { publicKey: string, privateKey: string };

  before(async function () {
    senderKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'sender',
          email: 'sender@username.com',
        },
      ],
    });
    recipientKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'recipient',
          email: 'recipient@username.com',
        },
      ],
    });
    otherKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'other',
          email: 'other@username.com',
        },
      ],
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
