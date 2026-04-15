import {
  decryptAndVerifySignedData,
  encryptAndDetachSignData,
  verifySignedData,
  SIGNATURE_DATE_TOLERANCE_MS,
} from '../../../../src/tss/ecdsa-dkls/commsLayer';
import * as openpgp from 'openpgp';

describe('DKLS Communication Layer', function () {
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

  it('should succeed on encryption with detached signature and decryption with verification', async function () {
    const text = 'ffffffff';

    const signedMessage = await encryptAndDetachSignData(
      Buffer.from(text, 'base64'),
      recipientKey.publicKey,
      senderKey.privateKey
    );
    (await decryptAndVerifySignedData(signedMessage, senderKey.publicKey, recipientKey.privateKey)).should.equal(text);
  });

  it('should fail on encryption with detached signature and decryption with wrong private key', async function () {
    const text = 'ffffffff';

    const signedMessage = await encryptAndDetachSignData(
      Buffer.from(text, 'base64'),
      recipientKey.publicKey,
      senderKey.privateKey
    );
    await decryptAndVerifySignedData(signedMessage, senderKey.publicKey, otherKey.privateKey).should.be.rejectedWith(
      'Error decrypting message: Session key decryption failed.'
    );
  });

  it('should fail on encryption with detached signature and decryption verification with wrong sender public key', async function () {
    const text = 'ffffffff';

    const signedMessage = await encryptAndDetachSignData(
      Buffer.from(text, 'base64'),
      recipientKey.publicKey,
      senderKey.privateKey
    );
    await decryptAndVerifySignedData(signedMessage, otherKey.publicKey, recipientKey.privateKey).should.be.rejectedWith(
      `Could not find signing key with key ID ${(await openpgp.readKey({ armoredKey: senderKey.publicKey }))
        .getKeyID()
        .toHex()}`
    );
  });

  it('should fail on encryption with detached signature by unintended sender and decryption verification', async function () {
    const text = 'ffffffff';

    const signedMessage = await encryptAndDetachSignData(
      Buffer.from(text, 'base64'),
      recipientKey.publicKey,
      otherKey.privateKey
    );
    await decryptAndVerifySignedData(
      signedMessage,
      senderKey.publicKey,
      recipientKey.privateKey
    ).should.be.rejectedWith(
      `Could not find signing key with key ID ${(await openpgp.readKey({ armoredKey: otherKey.publicKey }))
        .getKeyID()
        .toHex()}`
    );
  });

  describe('signature date tolerance', function () {
    it('should confirm tolerance constant is 24 hours', function () {
      SIGNATURE_DATE_TOLERANCE_MS.should.equal(24 * 60 * 60 * 1000);
    });

    it('should reject encryption to an expired key', async function () {
      // Key created 48h ago with a 23h lifetime → expired 25h ago.
      const expiredKey = await openpgp.generateKey({
        userIDs: [{ name: 'expired', email: 'expired@username.com' }],
        curve: 'secp256k1',
        date: new Date(Date.now() - 48 * 60 * 60 * 1000),
        keyExpirationTime: 23 * 3600,
      });

      await encryptAndDetachSignData(
        Buffer.from('ffffffff', 'base64'),
        expiredKey.publicKey,
        senderKey.privateKey
      ).should.be.rejectedWith('Error encrypting message: Primary key is expired');
    });

    it('should accept verification of a signature created by a device whose clock is ahead', async function () {
      // Simulate a signature created by a device whose clock is 12 hours
      // ahead. The verify tolerance (now + 24h) should accept it.
      const futureDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const message = await openpgp.createMessage({ binary: Buffer.from('ffffffff', 'base64') });
      const privateKey = await openpgp.readPrivateKey({ armoredKey: senderKey.privateKey });
      const signature = await openpgp.sign({
        message,
        signingKeys: privateKey,
        format: 'armored',
        detached: true,
        date: futureDate,
        config: { rejectCurves: new Set(), showVersion: false, showComment: false },
      });

      const result = await verifySignedData(
        { message: Buffer.from('ffffffff', 'base64').toString('base64'), signature },
        senderKey.publicKey
      );
      result.should.equal(true);
    });

    it('should reject verification of a signature created more than 24h in the future', async function () {
      // Simulate a signature from a device whose clock is 25 hours ahead.
      const farFutureDate = new Date(Date.now() + 25 * 60 * 60 * 1000);
      const message = await openpgp.createMessage({ binary: Buffer.from('ffffffff', 'base64') });
      const privateKey = await openpgp.readPrivateKey({ armoredKey: senderKey.privateKey });
      const signature = await openpgp.sign({
        message,
        signingKeys: privateKey,
        format: 'armored',
        detached: true,
        date: farFutureDate,
        config: { rejectCurves: new Set(), showVersion: false, showComment: false },
      });

      const result = await verifySignedData(
        { message: Buffer.from('ffffffff', 'base64').toString('base64'), signature },
        senderKey.publicKey
      );
      result.should.equal(false);
    });
  });
});
