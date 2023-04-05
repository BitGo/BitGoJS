import { createSharedDataProof, commonTssMethods } from '@bitgo/sdk-core';
import * as openpgp from 'openpgp';
import * as sinon from 'sinon';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';
import { nockGetChallenges } from './helpers';
import { bip32 } from '@bitgo/utxo-lib';
import * as should from 'should';

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
      keyPromises.push(openpgp.generateKey({
        userIDs: [
          {
            name: `test${i}`,
            email: `test${i}@test.com`,
          },
        ],
        curve: 'secp256k1',
      }));
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

    await commonTssMethods.commonVerifyWalletSignature({
      walletSignature: signature,
      bitgoPub: key2Actual,
      commonKeychain: '',
      userKeyId: '',
      backupKeyId: '',
    }).should.be.rejectedWith('Invalid HSM GPG signature');

    await commonTssMethods.commonVerifyWalletSignature({
      walletSignature: signature,
      bitgoPub: key3Actual,
      commonKeychain: '',
      userKeyId: '',
      backupKeyId: '',
    }).should.be.rejectedWith('Invalid HSM GPG signature');
  });

  it('throws error when there are not exactly five raw notations in the signature', async function () {
    const signatureString = await createSharedDataProof(gpgKey1.privateKey, gpgKey2.publicKey, [
      { name: '', value: '' },
    ]);
    const signature = await openpgp.readKey({ armoredKey: signatureString });

    await commonTssMethods.commonVerifyWalletSignature({
      walletSignature: signature,
      bitgoPub: key1Actual,
      commonKeychain: '',
      userKeyId: '',
      backupKeyId: '',
    }).should.be.rejectedWith('invalid wallet signatures');
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

    await commonTssMethods.commonVerifyWalletSignature({
      walletSignature: signature,
      bitgoPub: key1Actual,
      commonKeychain: '5678',
      userKeyId: '',
      backupKeyId: '',
    }).should.be.rejectedWith('wallet signature does not match common keychain');
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

    await commonTssMethods.commonVerifyWalletSignature({
      walletSignature: signature,
      bitgoPub: key1Actual,
      commonKeychain: '1234',
      userKeyId: gpgKey2Id,
      backupKeyId: '',
    }).should.be.rejectedWith('wallet signature does not match user key id');
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

    await commonTssMethods.commonVerifyWalletSignature({
      walletSignature: signature,
      bitgoPub: key1Actual,
      commonKeychain: '1234',
      userKeyId: gpgKey2Id,
      backupKeyId: gpgKey1Id,
    }).should.be.rejectedWith('wallet signature does not match backup key id');
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
});

describe('getChallengesForEcdsaSigning', function() {
  const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
  const rawEntChallenge = {
    nTilde: 'ent ntilde',
    h1: 'ent h1',
    h2: 'ent h2',
  };
  const rawBitGoChallenge = {
    nTilde: 'bitgo ntilde',
    h1: 'bitgo h1',
    h2: 'bitgo h2',
  };
  const walletId = 'walletId';
  const entId = 'entId';
  let adminEcdhKey;
  let fakeAdminEcdhKey;

  before(function() {

    adminEcdhKey = bitgo.keychains().create();
    fakeAdminEcdhKey = bitgo.keychains().create();

    sinon.stub(bitgo, 'getSigningKeyForUser').resolves({
      userId: 'id',
      userEmail: 'user@bitgo.com',
      pubkey: adminEcdhKey.xpub,
      path: 'm/0/0',
      ecdhKeychain: 'my keychain',
    });
  });

  it('Fetches the challenges and verifies the admin signatures correctly', async function() {
    const adminSignatureEntChallenge = bip32.fromBase58(adminEcdhKey.xprv).sign(Buffer.from(JSON.stringify(rawEntChallenge)));
    const adminSignatureBitGoChallenge = bip32.fromBase58(adminEcdhKey.xprv).sign(Buffer.from(JSON.stringify(rawBitGoChallenge)));
    const mockChallengesResponse = {
      enterpriseChallenge: {
        ...rawEntChallenge,
        verifiers: {
          adminSignature: adminSignatureEntChallenge.toString('hex'),
        },
      },
      bitGoChallenge: {
        ...rawBitGoChallenge,
        verifiers: {
          adminSignature: adminSignatureBitGoChallenge.toString('hex'),
        },
      },
      createdBy: 'id',
    };
    await nockGetChallenges({ walletId: walletId, response: mockChallengesResponse });
    const apiChallenges = await commonTssMethods.getChallengesForEcdsaSigning(bitgo, walletId, entId);
    should.exist(apiChallenges);
    apiChallenges.enterpriseChallenge.should.deepEqual(rawEntChallenge);
    apiChallenges.bitGoChallenge.should.deepEqual(rawBitGoChallenge);
  });

  it('Fails if the enterprise challenge signature is different from the admin ecdh key', async function() {
    // Bad sign
    const adminSignedEntChallenge = bip32.fromBase58(fakeAdminEcdhKey.xprv).sign(Buffer.from(JSON.stringify(rawEntChallenge)));
    const adminSignedBitGoChallenge = bip32.fromBase58(adminEcdhKey.xprv).sign(Buffer.from(JSON.stringify(rawBitGoChallenge)));
    const mockChallengesResponse = {
      enterpriseChallenge: {
        ...rawEntChallenge,
        verifiers: {
          adminSignature: adminSignedEntChallenge.toString('hex'),
        },
      },
      bitGoChallenge: {
        ...rawBitGoChallenge,
        verifiers: {
          adminSignature: adminSignedBitGoChallenge.toString('hex'),
        },
      },
      createdBy: 'id',
    };
    await nockGetChallenges({ walletId: walletId, response: mockChallengesResponse });
    await commonTssMethods.getChallengesForEcdsaSigning(bitgo, walletId, entId).should.be.rejectedWith('Admin signature for enterprise challenge is not valid. Please contact your enterprise admin.');
  });

  it('Fails if the bitgo challenge signature is different from the admin ecdh key', async function() {
    const adminSignedEntChallenge = bip32.fromBase58(adminEcdhKey.xprv).sign(Buffer.from(JSON.stringify(rawEntChallenge)));
    // Bad sign
    const adminSignedBitGoChallenge = bip32.fromBase58(fakeAdminEcdhKey.xprv).sign(Buffer.from(JSON.stringify(rawBitGoChallenge)));
    const mockChallengesResponse = {
      enterpriseChallenge: {
        ...rawEntChallenge,
        verifiers: {
          adminSignature: adminSignedEntChallenge.toString('hex'),
        },
      },
      bitGoChallenge: {
        ...rawBitGoChallenge,
        verifiers: {
          adminSignature: adminSignedBitGoChallenge.toString('hex'),
        },
      },
      createdBy: 'id',
    };
    await nockGetChallenges({ walletId: walletId, response: mockChallengesResponse });
    await commonTssMethods.getChallengesForEcdsaSigning(bitgo, walletId, entId).should.be.rejectedWith('Admin signature for BitGo\'s challenge is not valid. Please contact your enterprise admin.');
  });
});
