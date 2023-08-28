//
// Tests for enterprises
//

import * as nock from 'nock';
import * as sinon from 'sinon';
import { common, ECDSAUtils, Enterprise } from '@bitgo/sdk-core';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../src/bitgo';
import { mockChallengeA } from './internal/tssUtils/mocks/ecdsaNtilde';
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
  });
});
