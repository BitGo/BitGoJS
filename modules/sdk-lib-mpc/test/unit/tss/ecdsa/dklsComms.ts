import { decryptAndVerifySignedData, encryptAndDetachSignData } from '../../../../src/tss/ecdsa-dkls/commsLayer';
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
});
