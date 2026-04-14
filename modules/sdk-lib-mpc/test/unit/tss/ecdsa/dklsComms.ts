import {
  decryptAndVerifySignedData,
  encryptAndDetachSignData,
  decryptAndVerifyIncomingMessages,
  encryptAndAuthOutgoingMessages,
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

describe('DKLS encryptAndAuthOutgoingMessages / decryptAndVerifyIncomingMessages', function () {
  let partyAKey: { publicKey: string; privateKey: string };
  let partyBKey: { publicKey: string; privateKey: string };
  let tampererKey: { publicKey: string; privateKey: string };

  before(async function () {
    openpgp.config.rejectCurves = new Set();
    partyAKey = await openpgp.generateKey({
      userIDs: [{ name: 'partyA', email: 'a@test.com' }],
      curve: 'secp256k1',
    });
    partyBKey = await openpgp.generateKey({
      userIDs: [{ name: 'partyB', email: 'b@test.com' }],
      curve: 'secp256k1',
    });
    tampererKey = await openpgp.generateKey({
      userIDs: [{ name: 'tamperer', email: 'evil@test.com' }],
      curve: 'secp256k1',
    });
  });

  const partyAId = 0;
  const partyBId = 2;

  it('should sign signatureR and verify it on receive', async function () {
    const payload = Buffer.from('deadbeef', 'hex').toString('base64');
    const signatureRBytes = Buffer.from('cafebabe', 'hex').toString('base64');

    const encrypted = await encryptAndAuthOutgoingMessages(
      {
        p2pMessages: [],
        broadcastMessages: [{ from: partyAId, payload, signatureR: signatureRBytes }],
      },
      [{ partyId: partyBId, gpgKey: partyBKey.publicKey }],
      [{ partyId: partyAId, gpgKey: partyAKey.privateKey }]
    );

    const broadcastMsg = encrypted.broadcastMessages[0];
    broadcastMsg.signatureR!.message.should.equal(signatureRBytes);
    broadcastMsg.signatureR!.signature.should.not.equal('');

    const decrypted = await decryptAndVerifyIncomingMessages(
      {
        p2pMessages: [],
        broadcastMessages: [broadcastMsg],
      },
      [{ partyId: partyAId, gpgKey: partyAKey.publicKey }],
      [{ partyId: partyBId, gpgKey: partyBKey.privateKey }]
    );

    decrypted.broadcastMessages[0].signatureR!.should.equal(signatureRBytes);
  });

  it('should reject a tampered signatureR on receive', async function () {
    const payload = Buffer.from('deadbeef', 'hex').toString('base64');
    const signatureRBytes = Buffer.from('cafebabe', 'hex').toString('base64');

    const encrypted = await encryptAndAuthOutgoingMessages(
      {
        p2pMessages: [],
        broadcastMessages: [{ from: partyAId, payload, signatureR: signatureRBytes }],
      },
      [{ partyId: partyBId, gpgKey: partyBKey.publicKey }],
      [{ partyId: partyAId, gpgKey: partyAKey.privateKey }]
    );

    const tampered = {
      ...encrypted.broadcastMessages[0],
      signatureR: {
        message: Buffer.from('00000000', 'hex').toString('base64'),
        signature: encrypted.broadcastMessages[0].signatureR!.signature,
      },
    };

    await decryptAndVerifyIncomingMessages(
      { p2pMessages: [], broadcastMessages: [tampered] },
      [{ partyId: partyAId, gpgKey: partyAKey.publicKey }],
      [{ partyId: partyBId, gpgKey: partyBKey.privateKey }]
    ).should.be.rejectedWith(`Failed to authenticate signatureR in broadcast message from party: ${partyAId}`);
  });

  it('should reject a signatureR signed by a different key', async function () {
    const payload = Buffer.from('deadbeef', 'hex').toString('base64');
    const signatureRBytes = Buffer.from('cafebabe', 'hex').toString('base64');

    const encrypted = await encryptAndAuthOutgoingMessages(
      {
        p2pMessages: [],
        broadcastMessages: [{ from: partyAId, payload, signatureR: signatureRBytes }],
      },
      [{ partyId: partyBId, gpgKey: partyBKey.publicKey }],
      [{ partyId: partyAId, gpgKey: tampererKey.privateKey }]
    );

    await decryptAndVerifyIncomingMessages(
      { p2pMessages: [], broadcastMessages: [encrypted.broadcastMessages[0]] },
      [{ partyId: partyAId, gpgKey: partyAKey.publicKey }],
      [{ partyId: partyBId, gpgKey: partyBKey.privateKey }]
    ).should.be.rejectedWith(`Failed to authenticate broadcast message from party: ${partyAId}`);
  });

  it('should handle broadcast messages without signatureR unchanged', async function () {
    const payload = Buffer.from('deadbeef', 'hex').toString('base64');

    const encrypted = await encryptAndAuthOutgoingMessages(
      {
        p2pMessages: [],
        broadcastMessages: [{ from: partyAId, payload }],
      },
      [{ partyId: partyBId, gpgKey: partyBKey.publicKey }],
      [{ partyId: partyAId, gpgKey: partyAKey.privateKey }]
    );

    (encrypted.broadcastMessages[0].signatureR === undefined).should.equal(true);

    const decrypted = await decryptAndVerifyIncomingMessages(
      { p2pMessages: [], broadcastMessages: [encrypted.broadcastMessages[0]] },
      [{ partyId: partyAId, gpgKey: partyAKey.publicKey }],
      [{ partyId: partyBId, gpgKey: partyBKey.privateKey }]
    );

    (decrypted.broadcastMessages[0].signatureR === undefined).should.equal(true);
  });

  it('should skip signatureR verification when signatureR field is omitted (soft downgrade)', async function () {
    const payload = Buffer.from('deadbeef', 'hex').toString('base64');
    const signatureRBytes = Buffer.from('cafebabe', 'hex').toString('base64');

    const encrypted = await encryptAndAuthOutgoingMessages(
      {
        p2pMessages: [],
        broadcastMessages: [{ from: partyAId, payload, signatureR: signatureRBytes }],
      },
      [{ partyId: partyBId, gpgKey: partyBKey.publicKey }],
      [{ partyId: partyAId, gpgKey: partyAKey.privateKey }]
    );

    const broadcastWithoutAuthR = {
      from: encrypted.broadcastMessages[0].from,
      payload: encrypted.broadcastMessages[0].payload,
    };

    const decrypted = await decryptAndVerifyIncomingMessages(
      { p2pMessages: [], broadcastMessages: [broadcastWithoutAuthR] },
      [{ partyId: partyAId, gpgKey: partyAKey.publicKey }],
      [{ partyId: partyBId, gpgKey: partyBKey.privateKey }]
    );

    (decrypted.broadcastMessages[0].signatureR === undefined).should.equal(true);
  });

  it('should reject when signatureR message is present but signature is empty string', async function () {
    const payload = Buffer.from('deadbeef', 'hex').toString('base64');
    const signatureRBytes = Buffer.from('cafebabe', 'hex').toString('base64');

    const encrypted = await encryptAndAuthOutgoingMessages(
      {
        p2pMessages: [],
        broadcastMessages: [{ from: partyAId, payload, signatureR: signatureRBytes }],
      },
      [{ partyId: partyBId, gpgKey: partyBKey.publicKey }],
      [{ partyId: partyAId, gpgKey: partyAKey.privateKey }]
    );

    const strippedSig = {
      ...encrypted.broadcastMessages[0],
      signatureR: {
        message: encrypted.broadcastMessages[0].signatureR!.message,
        signature: '',
      },
    };

    // Empty armor: OpenPGP fails parsing before verifySignedData returns false.
    await decryptAndVerifyIncomingMessages(
      { p2pMessages: [], broadcastMessages: [strippedSig] },
      [{ partyId: partyAId, gpgKey: partyAKey.publicKey }],
      [{ partyId: partyBId, gpgKey: partyBKey.privateKey }]
    ).should.be.rejected();
  });
});
