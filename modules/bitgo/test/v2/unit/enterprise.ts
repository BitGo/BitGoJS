//
// Tests for enterprises
//

import nock = require('nock');
import * as sinon from 'sinon';
import { common, ECDSAUtils, Enterprise } from '@bitgo/sdk-core';

require('should-sinon');

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src/bitgo';
import { mockChallengeA, mockChallengeB, mockChallengeC } from './internal/tssUtils/mocks/ecdsaNtilde';
import { bip32 } from '@bitgo/utxo-lib';

describe('Enterprise:', function () {
  let bitgo;
  let enterprise;
  let baseCoin;
  let bgUrl;

  before(function () {
    bitgo = TestBitGo.decorate(BitGo, { env: 'test' });
    bitgo.initializeTestVars();
    baseCoin = bitgo.coin('tbtc');
    enterprise = new Enterprise(bitgo, baseCoin, { id: '593f1ece99d37c23080a557283edcc89', name: 'Test Enterprise' });
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  describe('Transaction data', function () {
    it('should search for pending transaction correctly', async function () {
      const params = { enterpriseId: enterprise.id };
      const scope = nock(bgUrl).get('/api/v2/tbtc/tx/pending/first').query(params).reply(200);
      await enterprise.getFirstPendingTransaction().should.be.resolved();
      scope.isDone().should.be.True();
    });
  });

  it('should fetch the tss config correctly', async function () {
    const scope = nock(bgUrl)
      .get(`/api/v2/enterprise/${enterprise.id}/tssconfig`)
      .reply(200, {
        ecdsa: {
          challenge: {
            enterprise: {
              ...mockChallengeA,
              verifiers: {
                adminSignature: 'hex sig',
              },
            },
          },
        },
      });
    await enterprise.getExistingTssEcdsaChallenge().should.be.resolved();
    scope.isDone().should.be.True();
  });

  describe('Resign enterprise challenge', function () {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const enterprise = new Enterprise(bitgo, bitgo.coin('tbtc'), { id: '123', name: 'Test Enterprise' });

    const oldAdminEcdhKey = bitgo.keychains().create();
    const oldAdminDerivationPath = 'm/0/0';

    const newAdminEcdhKey = bitgo.keychains().create();
    const newAdminDerivationPath = 'm/0/1';

    const entChallenge = {
      ntilde: 'ent ntilde',
      h1: 'ent h1',
      h2: 'ent h2',
    };
    const bitgoChallenge = {
      ntilde: 'bitgo ntilde',
      h1: 'bitgo h1',
      h2: 'bitgo h2',
    };

    const signedEntChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
      entChallenge,
      oldAdminEcdhKey.xprv,
      oldAdminDerivationPath
    );

    const signedBitgoChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
      bitgoChallenge,
      oldAdminEcdhKey.xprv,
      oldAdminDerivationPath
    );

    const newSignedEntChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
      entChallenge,
      newAdminEcdhKey.xprv,
      newAdminDerivationPath
    );

    const newSignedBitgoChallenge = ECDSAUtils.EcdsaUtils.signChallenge(
      bitgoChallenge,
      newAdminEcdhKey.xprv,
      newAdminDerivationPath
    );

    const entChallengeWithVerifiers: ECDSAUtils.SerializedNtildeWithVerifiers = {
      ...entChallenge,
      verifiers: {
        adminSignature: signedEntChallenge.toString('hex'),
      },
    };
    const bitgoChallengeWithVerifier: ECDSAUtils.SerializedNtildeWithVerifiers = {
      ...bitgoChallenge,
      verifiers: {
        adminSignature: signedBitgoChallenge.toString('hex'),
      },
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should verify and resign enterprise challenge', async function () {
      const stubuUploadChallenges = sinon.stub(ECDSAUtils.EcdsaUtils, 'uploadChallengesToEnterprise');
      await enterprise
        .resignEnterpriseChallenges(
          {
            xprv: oldAdminEcdhKey.xprv,
            derivationPath: oldAdminDerivationPath,
            derivedPubKey: bip32
              .fromBase58(oldAdminEcdhKey.xpub)
              .derivePath(oldAdminDerivationPath)
              .publicKey.toString('hex'),
          },
          {
            xprv: newAdminEcdhKey.xprv,
            derivationPath: newAdminDerivationPath,
            derivedPubKey: bip32
              .fromBase58(newAdminEcdhKey.xpub)
              .derivePath(newAdminDerivationPath)
              .publicKey.toString('hex'),
          },
          entChallengeWithVerifiers,
          bitgoChallengeWithVerifier,
          bitgoChallengeWithVerifier
        )
        .should.not.be.rejected();
      stubuUploadChallenges.should.be.calledWith(
        bitgo,
        '123',
        entChallengeWithVerifiers,
        newSignedEntChallenge.toString('hex'),
        newSignedBitgoChallenge.toString('hex'),
        newSignedBitgoChallenge.toString('hex')
      );
    });

    it('should fail when the old ecdh keychain is incorrect', async function () {
      await enterprise
        .resignEnterpriseChallenges(
          {
            xprv: newAdminEcdhKey.xprv,
            derivationPath: newAdminDerivationPath,
            derivedPubKey: bip32
              .fromBase58(newAdminEcdhKey.xpub)
              .derivePath(newAdminDerivationPath)
              .publicKey.toString('hex'),
          },
          {
            xprv: newAdminEcdhKey.xprv,
            derivationPath: newAdminDerivationPath,
            derivedPubKey: bip32
              .fromBase58(newAdminEcdhKey.xpub)
              .derivePath(newAdminDerivationPath)
              .publicKey.toString('hex'),
          },
          entChallengeWithVerifiers,
          bitgoChallengeWithVerifier,
          bitgoChallengeWithVerifier
        )
        .should.be.rejectedWith('Cannot re-sign. The Enterprise TSS config was signed by another user.');
    });

    it('should fail when the WP-supplied derivedPubKey does not match the old keychain xprv', async function () {
      // oldEcdhKeypair carries a WP-supplied `derivedPubKey` matching the stored signatures, but the xprv is the
      // new admin's. Verification must anchor on the xprv, so this must be rejected.
      await enterprise
        .resignEnterpriseChallenges(
          {
            xprv: newAdminEcdhKey.xprv,
            derivationPath: newAdminDerivationPath,
            derivedPubKey: bip32
              .fromBase58(oldAdminEcdhKey.xpub)
              .derivePath(oldAdminDerivationPath)
              .publicKey.toString('hex'),
          },
          {
            xprv: newAdminEcdhKey.xprv,
            derivationPath: newAdminDerivationPath,
            derivedPubKey: bip32
              .fromBase58(newAdminEcdhKey.xpub)
              .derivePath(newAdminDerivationPath)
              .publicKey.toString('hex'),
          },
          entChallengeWithVerifiers,
          bitgoChallengeWithVerifier,
          bitgoChallengeWithVerifier
        )
        .should.be.rejectedWith('Cannot re-sign. The Enterprise TSS config was signed by another user.');
    });
    it('should fail when the enterprise challenge is a replayed BitGo HSM challenge', async function () {
      // the old keychain genuinely signed the HSM challenge during setup, so the signature verifies; the
      // HSM-equality guard must still reject it as the enterprise challenge
      const hsmReplayChallenge: ECDSAUtils.SerializedNtildeWithVerifiers = {
        ...bitgoChallenge,
        verifiers: {
          adminSignature: signedBitgoChallenge.toString('hex'),
        },
      };
      await enterprise
        .resignEnterpriseChallenges(
          {
            xprv: oldAdminEcdhKey.xprv,
            derivationPath: oldAdminDerivationPath,
            derivedPubKey: bip32
              .fromBase58(oldAdminEcdhKey.xpub)
              .derivePath(oldAdminDerivationPath)
              .publicKey.toString('hex'),
          },
          {
            xprv: newAdminEcdhKey.xprv,
            derivationPath: newAdminDerivationPath,
            derivedPubKey: bip32
              .fromBase58(newAdminEcdhKey.xpub)
              .derivePath(newAdminDerivationPath)
              .publicKey.toString('hex'),
          },
          hsmReplayChallenge,
          bitgoChallengeWithVerifier,
          bitgoChallengeWithVerifier
        )
        .should.be.rejectedWith('Cannot re-sign. The enterprise ECDSA challenge matches a BitGo HSM challenge.');
    });
  });
  describe('resignTssEcdsaChallenge', function () {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    const enterprise = new Enterprise(bitgo, bitgo.coin('tbtc'), { id: '123', name: 'Test Enterprise' });
    const bgUrl = common.Environments[bitgo.getEnv()].uri;
    const adminEcdhKey = bitgo.keychains().create();
    const otherEcdhKey = bitgo.keychains().create();
    const path = 'm/0/0';
    const userPassword = 'password123';
    let encryptedXprv: string;
    let uploadStub: sinon.SinonStub;

    const sign = (challenge: { ntilde: string; h1: string; h2: string }, key: { xprv: string }) =>
      ECDSAUtils.EcdsaUtils.signChallenge(challenge, key.xprv, path).toString('hex');

    before(async function () {
      encryptedXprv = await bitgo.encrypt({
        password: userPassword,
        input: adminEcdhKey.xprv,
      });
    });

    beforeEach(function () {
      // WP reports `other`'s pubkey: the verification anchor is the decrypted xprv, so this must not matter
      sinon.stub(bitgo, 'getSigningKeyForUser').resolves({
        userId: 'id',
        userEmail: 'user@bitgo.com',
        derivedPubkey: bip32.fromBase58(otherEcdhKey.xpub).derivePath(path).publicKey.toString('hex'),
        derivationPath: path,
        ecdhKeychain: 'my keychain',
      });
      sinon.stub(bitgo, 'getECDHKeychain').resolves({
        encryptedXprv: encryptedXprv,
      });
      sinon.stub(ECDSAUtils.EcdsaUtils, 'verifyBitGoChallenges').resolves(true);
      uploadStub = sinon.stub(ECDSAUtils.EcdsaUtils, 'uploadChallengesToEnterprise').resolves();
      nock(bgUrl)
        .get('/api/v2/tss/ecdsa/challenges')
        .reply(200, { bitgoInstitutionalHsm: mockChallengeA, bitgoNitroHsm: mockChallengeB });
    });

    afterEach(function () {
      sinon.restore();
      nock.cleanAll();
    });

    it('verifies the existing challenge and uploads the admin signatures', async function () {
      const entry = { ...mockChallengeC, verifiers: { adminSignature: sign(mockChallengeC, adminEcdhKey) } };
      nock(bgUrl)
        .get(`/api/v2/enterprise/${enterprise.id}/tssconfig`)
        .reply(200, { ecdsa: { challenge: { enterprise: entry } } });

      await enterprise.resignTssEcdsaChallenge(userPassword).should.not.be.rejected();
      uploadStub.callCount.should.equal(1);
      uploadStub.should.be.calledWith(
        bitgo,
        '123',
        {
          ntilde: mockChallengeC.ntilde,
          h1: mockChallengeC.h1,
          h2: mockChallengeC.h2,
          ntildeProof: mockChallengeC.ntildeProof,
        },
        sign(mockChallengeC, adminEcdhKey),
        sign(mockChallengeA, adminEcdhKey),
        sign(mockChallengeB, adminEcdhKey)
      );
    });

    it('rejects and does not upload when WP serves a challenge signed by another key', async function () {
      const entry = { ...mockChallengeC, verifiers: { adminSignature: sign(mockChallengeC, otherEcdhKey) } };
      nock(bgUrl)
        .get(`/api/v2/enterprise/${enterprise.id}/tssconfig`)
        .reply(200, { ecdsa: { challenge: { enterprise: entry } } });

      await enterprise
        .resignTssEcdsaChallenge(userPassword)
        .should.be.rejectedWith(
          'Cannot re-sign. The existing enterprise ECDSA challenge was not signed by your ECDH key. Generate a new challenge instead.'
        );
      uploadStub.callCount.should.equal(0);
    });

    it('rejects and does not upload when WP serves a BitGo HSM challenge as the enterprise challenge', async function () {
      const entry = { ...mockChallengeA, verifiers: { adminSignature: sign(mockChallengeA, adminEcdhKey) } };
      nock(bgUrl)
        .get(`/api/v2/enterprise/${enterprise.id}/tssconfig`)
        .reply(200, { ecdsa: { challenge: { enterprise: entry } } });

      await enterprise
        .resignTssEcdsaChallenge(userPassword)
        .should.be.rejectedWith(
          'Cannot re-sign. The existing enterprise ECDSA challenge matches a BitGo HSM challenge.'
        );
      uploadStub.callCount.should.equal(0);
    });
  });
});
