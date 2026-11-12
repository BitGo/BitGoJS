import { createSharedDataProof, commonTssMethods } from '@bitgo/sdk-core';
import * as openpgp from 'openpgp';

openpgp.config.rejectCurves = new Set();

describe('commonVerifyWalletSignature', function () {
  let gpgKey1;
  let gpgKey2;
  let gpgKey3;
  let key1Actual;
  let key2Actual;
  let key3Actual;
  let gpgKey1Id;
  let gpgKey2Id;

  before(async function () {
    const keyPromises: Promise<openpgp.SerializedKeyPair<string>>[] = [];
    for (let i = 0; i < 3; i++) {
      keyPromises.push(
        openpgp.generateKey({
          userIDs: [
            {
              name: `test${i}`,
              email: `test${i}@test.com`,
            },
          ],
          curve: 'secp256k1',
        })
      );
    }
    [gpgKey1, gpgKey2, gpgKey3] = await Promise.all(keyPromises);
    key1Actual = await openpgp.readKey({ armoredKey: gpgKey1.publicKey });
    key2Actual = await openpgp.readKey({ armoredKey: gpgKey2.publicKey });
    key3Actual = await openpgp.readKey({ armoredKey: gpgKey3.publicKey });
    gpgKey1Id = key1Actual.keyPacket.getFingerprint();
    gpgKey2Id = key2Actual.keyPacket.getFingerprint();
  });

  it('throws error if signature was not done by provided pub', async function () {
    const signatureString = await createSharedDataProof(gpgKey1.privateKey, gpgKey2.publicKey, []);
    const signature = await openpgp.readKey({ armoredKey: signatureString });

    await commonTssMethods
      .commonVerifyWalletSignature({
        walletSignature: signature,
        bitgoPub: key2Actual,
        commonKeychain: '',
        userKeyId: '',
        backupKeyId: '',
      })
      .should.be.rejectedWith('Invalid HSM GPG signature');

    await commonTssMethods
      .commonVerifyWalletSignature({
        walletSignature: signature,
        bitgoPub: key3Actual,
        commonKeychain: '',
        userKeyId: '',
        backupKeyId: '',
      })
      .should.be.rejectedWith('Invalid HSM GPG signature');
  });

  it('throws error when there are not exactly five raw notations in the signature', async function () {
    const signatureString = await createSharedDataProof(gpgKey1.privateKey, gpgKey2.publicKey, [
      { name: '', value: '' },
    ]);
    const signature = await openpgp.readKey({ armoredKey: signatureString });

    await commonTssMethods
      .commonVerifyWalletSignature({
        walletSignature: signature,
        bitgoPub: key1Actual,
        commonKeychain: '',
        userKeyId: '',
        backupKeyId: '',
      })
      .should.be.rejectedWith('invalid wallet signatures');
  });

  it('throws error when first raw notation does not match common keychain', async function () {
    const signatureString = await createSharedDataProof(gpgKey1.privateKey, gpgKey2.publicKey, [
      { name: '', value: '1234' },
      { name: '', value: '' },
      { name: '', value: '' },
      { name: '', value: '' },
      { name: '', value: '' },
    ]);
    const signature = await openpgp.readKey({ armoredKey: signatureString });

    await commonTssMethods
      .commonVerifyWalletSignature({
        walletSignature: signature,
        bitgoPub: key1Actual,
        commonKeychain: '5678',
        userKeyId: '',
        backupKeyId: '',
      })
      .should.be.rejectedWith('wallet signature does not match common keychain');
  });

  it('throw error when second raw notation does not match userKeyId', async function () {
    const signatureString = await createSharedDataProof(gpgKey1.privateKey, gpgKey2.publicKey, [
      { name: '', value: '1234' },
      { name: '', value: gpgKey1Id },
      { name: '', value: '' },
      { name: '', value: '' },
      { name: '', value: '' },
    ]);
    const signature = await openpgp.readKey({ armoredKey: signatureString });

    await commonTssMethods
      .commonVerifyWalletSignature({
        walletSignature: signature,
        bitgoPub: key1Actual,
        commonKeychain: '1234',
        userKeyId: gpgKey2Id,
        backupKeyId: '',
      })
      .should.be.rejectedWith('wallet signature does not match user key id');
  });

  it('throw error when third raw notation does not match backupKeyId', async function () {
    const signatureString = await createSharedDataProof(gpgKey1.privateKey, gpgKey2.publicKey, [
      { name: '', value: '1234' },
      { name: '', value: gpgKey2Id },
      { name: '', value: gpgKey2Id },
      { name: '', value: '' },
      { name: '', value: '' },
    ]);
    const signature = await openpgp.readKey({ armoredKey: signatureString });

    await commonTssMethods
      .commonVerifyWalletSignature({
        walletSignature: signature,
        bitgoPub: key1Actual,
        commonKeychain: '1234',
        userKeyId: gpgKey2Id,
        backupKeyId: gpgKey1Id,
      })
      .should.be.rejectedWith('wallet signature does not match backup key id');
  });

  it('succeeds and returns the raw notations', async function () {
    const rawNotations = [
      { name: '', value: '1234' },
      { name: '', value: gpgKey2Id },
      { name: '', value: gpgKey2Id },
      { name: '', value: '5678' },
      { name: '', value: '9012' },
    ];
    const signatureString = await createSharedDataProof(gpgKey1.privateKey, gpgKey2.publicKey, rawNotations);
    const signature = await openpgp.readKey({ armoredKey: signatureString });

    const returnedRawNotations = await commonTssMethods.commonVerifyWalletSignature({
      walletSignature: signature,
      bitgoPub: key1Actual,
      commonKeychain: '1234',
      userKeyId: gpgKey2Id,
      backupKeyId: gpgKey2Id,
    });

    returnedRawNotations.length.should.equal(rawNotations.length);
    for (let i = 0; i < rawNotations.length; i++) {
      Buffer.from(returnedRawNotations[i].value).toString().should.equal(rawNotations[i].value);
    }
  });

  it('throws error when a foreign certification is applied after the genuine one', async function () {
    const rawNotations = [
      { name: '', value: '1234' },
      { name: '', value: gpgKey2Id },
      { name: '', value: gpgKey2Id },
      { name: '', value: '5678' },
      { name: '', value: '9012' },
    ];
    const certified = await createSharedDataProof(gpgKey1.privateKey, gpgKey2.publicKey, rawNotations);
    const attacked = await createSharedDataProof(gpgKey3.privateKey, certified, rawNotations);
    const signature = await openpgp.readKey({ armoredKey: attacked });

    await commonTssMethods
      .commonVerifyWalletSignature({
        walletSignature: signature,
        bitgoPub: key1Actual,
        commonKeychain: '1234',
        userKeyId: gpgKey2Id,
        backupKeyId: gpgKey2Id,
      })
      .should.be.rejectedWith('Invalid HSM GPG signature');
  });

  it('throws error when the wallet key has no third-party certification', async function () {
    const signature = await openpgp.readKey({ armoredKey: gpgKey2.publicKey });

    await commonTssMethods
      .commonVerifyWalletSignature({
        walletSignature: signature,
        bitgoPub: key1Actual,
        commonKeychain: '',
        userKeyId: '',
        backupKeyId: '',
      })
      .should.be.rejectedWith('Invalid HSM GPG signature');
  });

  it('succeeds when a foreign certification without notations is applied after the genuine one', async function () {
    const rawNotations = [
      { name: '', value: '1234' },
      { name: '', value: gpgKey2Id },
      { name: '', value: gpgKey2Id },
      { name: '', value: '5678' },
      { name: '', value: '9012' },
    ];
    const certified = await createSharedDataProof(gpgKey1.privateKey, gpgKey2.publicKey, rawNotations);
    const peerCertified = await createSharedDataProof(gpgKey3.privateKey, certified, []);
    const signature = await openpgp.readKey({ armoredKey: peerCertified });

    const returnedRawNotations = await commonTssMethods.commonVerifyWalletSignature({
      walletSignature: signature,
      bitgoPub: key1Actual,
      commonKeychain: '1234',
      userKeyId: gpgKey2Id,
      backupKeyId: gpgKey2Id,
    });
    Buffer.from(returnedRawNotations[0].value).toString().should.equal('1234');
  });
});
