import * as assert from 'assert';
import * as _ from 'lodash';
import * as nock from 'nock';
import * as openpgp from 'openpgp';
import * as should from 'should';
import * as sinon from 'sinon';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../../src';
import {
  common,
  Keychain,
  Wallet,
  Ecdsa,
  ECDSA,
  ECDSAUtils,
  ECDSAMethods,
  TxRequest,
  SignatureShareType,
  SignatureShareRecord,
  RequestTracer,
  BitgoHeldBackupKeyShare,
  BackupKeyShare,
} from '@bitgo/sdk-core';
import { keyShares, mockAShare, mockDShare, otherKeyShares } from '../../../fixtures/tss/ecdsaFixtures';
import { nockSendSignatureShareWithResponse } from './common';
import { nockGetTxRequest } from '../../tss/helpers';

const encryptNShare = ECDSAMethods.encryptNShare;
type KeyShare = ECDSA.KeyShare;

describe('TSS Ecdsa Utils:', async function () {
  let sandbox: sinon.SinonSandbox;
  let MPC: Ecdsa;
  let bgUrl: string;
  let tssUtils: ECDSAUtils.EcdsaUtils;
  let wallet: Wallet;
  let bitgoKeyShare;
  let userKeyShare: KeyShare;
  let backupKeyShare: KeyShare;
  let userGpgKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let backupGpgKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let bitGoGPGKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let nockedBitGoKeychain: Keychain;
  let nockedUserKeychain: Keychain;

  const coinName = 'gteth';
  const reqId = new RequestTracer;

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  before(async function () {
    nock.cleanAll();
    MPC = new Ecdsa();
    userKeyShare = keyShares.userKeyShare;
    backupKeyShare = keyShares.backupKeyShare;
    bitgoKeyShare = keyShares.bitgoKeyShare;

    const gpgKeyPromises = [openpgp.generateKey({
      userIDs: [
        {
          name: 'test',
          email: 'test@test.com',
        },
      ],
    }),
    openpgp.generateKey({
      userIDs: [
        {
          name: 'backup',
          email: 'backup@test.com',
        },
      ],
    }),
    openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@test.com',
        },
      ],
    })];
    [userGpgKey, backupGpgKey, bitGoGPGKey] = await Promise.all(gpgKeyPromises);
    const constants = {
      mpc: {
        bitgoPublicKey: bitGoGPGKey.publicKey,
      },
    };

    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    const baseCoin = bitgo.coin(coinName);

    bgUrl = common.Environments[bitgo.getEnv()].uri;

    nock(bgUrl)
      .persist()
      .get('/api/v1/client/constants')
      .reply(200, { ttl: 3600, constants });

    const nockPromises = [
      nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        userGpgKey,
        backupGpgKey,
      }),
      nockKeychain({ coin: coinName, keyChain: { id: '1', pub: '' }, source: 'user' }),
      nockKeychain({ coin: coinName, keyChain: { id: '2', pub: '' }, source: 'backup' }),
    ];
    [nockedBitGoKeychain, nockedUserKeychain] = await Promise.all(nockPromises);

    const walletData = {
      id: '5b34252f1bf349930e34020a00000000',
      coin: coinName,
      coinSpecific: {},
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new ECDSAUtils.EcdsaUtils(bitgo, baseCoin, wallet);
  });

  after(function () {
    nock.cleanAll();
  });

  describe('TSS key chains', async function() {
    it('should create backup key share held by BitGo', async function () {
      const expectedKeyShare = await nockCreateBitgoHeldBackupKeyShare(coinName, userGpgKey, backupKeyShare, bitGoGPGKey);
      const result = await tssUtils.createBitgoHeldBackupKeyShare(userGpgKey);
      result.should.eql(expectedKeyShare);
    });

    it('should finalize backup key share held by BitGo', async function () {
      const commonKeychain = '4428';
      const originalKeyShare = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, bitGoGPGKey);
      const expectedFinalKeyShare = await nockFinalizeBitgoHeldBackupKeyShare(coinName, originalKeyShare, commonKeychain, userKeyShare, bitGoGPGKey, nockedBitGoKeychain);

      const result = await tssUtils.finalizeBitgoHeldBackupKeyShare(originalKeyShare.id, commonKeychain, userKeyShare, nockedBitGoKeychain);
      result.should.eql(expectedFinalKeyShare);
    });

    it('should create a user keychain from third party backup provider', async function() {
      const backupKeyShares = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, bitGoGPGKey);
      const backupShareHolder: BackupKeyShare = {
        bitGoHeldKeyShares: backupKeyShares,
      };
      assert(backupShareHolder.bitGoHeldKeyShares);
      const userKeychain = await tssUtils.createUserKeychainFromThirdPartyBackup(userGpgKey, userKeyShare, backupShareHolder.bitGoHeldKeyShares?.keyShares, nockedBitGoKeychain, 'password', '1234');
      userKeychain.should.deepEqual(nockedUserKeychain);
    });

    it('should get the respective backup key shares based on provider', async function() {
      await nockCreateBitgoHeldBackupKeyShare(coinName, userGpgKey, backupKeyShare, bitGoGPGKey);
      let backupKeyShares = await tssUtils.createBackupKeyShares(true, userGpgKey);
      should.exist(backupKeyShares.bitGoHeldKeyShares);
      should.not.exist(backupKeyShares.userHeldKeyShare);

      await nockCreateBitgoHeldBackupKeyShare(coinName, userGpgKey, backupKeyShare, bitGoGPGKey);
      backupKeyShares = await tssUtils.createBackupKeyShares(false, userGpgKey);
      should.exist(backupKeyShares.userHeldKeyShare);
      should.not.exist(backupKeyShares.bitGoHeldKeyShares);
    });

    it('getBackupEncryptedNShare should get valid encrypted n shares based on provider', async function() {
      // Backup key held by third party
      const bitgoHeldBackupKeyShare = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, bitGoGPGKey);
      const backupShareHolder: BackupKeyShare = {
        bitGoHeldKeyShares: bitgoHeldBackupKeyShare,
      };
      const backupToBitgoShare = bitgoHeldBackupKeyShare.keyShares.find(
        (keyShare) => keyShare.from === 'backup' && keyShare.to === 'bitgo'
      );
      const bitgoGpgKeyPubKey = await tssUtils.getBitgoPublicGpgKey();
      let backupToBitgoEncryptedNShare = await tssUtils.getBackupEncryptedNShare(backupShareHolder, 3, bitgoGpgKeyPubKey.armor(), true);
      should.exist(backupToBitgoEncryptedNShare);
      should.equal(backupToBitgoEncryptedNShare.encryptedPrivateShare, backupToBitgoShare?.privateShare);

      // Backup key held by user
      const backupShareHolderNew: BackupKeyShare = {
        userHeldKeyShare: backupKeyShare,
      };
      backupToBitgoEncryptedNShare = await tssUtils.getBackupEncryptedNShare(backupShareHolderNew, 3, bitgoGpgKeyPubKey.armor(), false);
      const encryptedNShare = await encryptNShare(backupKeyShare, 3, bitgoGpgKeyPubKey.armor());
      // cant verify the encrypted shares, since they will be encrypted with diff. values
      should.equal(backupToBitgoEncryptedNShare.publicShare, encryptedNShare.publicShare);
    });

    it('should generate TSS key chains', async function () {
      const backupShareHolder: BackupKeyShare = {
        userHeldKeyShare: backupKeyShare,
      };
      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupShareHolder);
      const usersKeyChainPromises = [tssUtils.createParticipantKeychain(
        userGpgKey,
        1,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase'), tssUtils.createParticipantKeychain(
        backupGpgKey,
        2,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase')];
      const [userKeychain, backupKeychain] = await Promise.all(usersKeyChainPromises);

      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      userKeychain.should.deepEqual(nockedUserKeychain);

      // unencrypted `prv` property should exist on backup keychain
      const keyChainPrv = JSON.parse(backupKeychain.prv ?? '');
      _.isEqual(keyChainPrv.pShare, backupKeyShare.pShare).should.be.true();
      _.isEqual(keyChainPrv.bitgoNShare, bitgoKeyShare.nShares[2]).should.be.true();
      _.isEqual(keyChainPrv.userNShare, userKeyShare.nShares[2]).should.be.true();
      should.exist(backupKeychain.encryptedPrv);
    });

    it('should generate TSS key chains when backup provider is BitGo', async function () {
      const backupProvider = 'BitGoKRS';
      const isThirdPartyBackup = true;
      const bitgoHeldBackupShares = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, bitGoGPGKey);
      const backupShareHolder: BackupKeyShare = {
        bitGoHeldKeyShares: bitgoHeldBackupShares,
      };
      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupShareHolder, undefined, isThirdPartyBackup);
      assert(bitgoKeychain.commonKeychain);

      await nockFinalizeBitgoHeldBackupKeyShare(coinName, bitgoHeldBackupShares, bitgoKeychain.commonKeychain, userKeyShare, bitGoGPGKey, bitgoKeychain);

      const userBackupKeyChainPromises = [tssUtils.createUserKeychain(
        userGpgKey,
        userKeyShare,
        backupShareHolder,
        bitgoKeychain,
        'passphrase',
        undefined,
        isThirdPartyBackup), tssUtils.createBackupKeychain(
        userGpgKey,
        userKeyShare,
        backupShareHolder,
        bitgoKeychain,
        undefined,
        backupProvider)];
      const [userKeychain, backupKeychain] = await Promise.all(userBackupKeyChainPromises);

      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      userKeychain.should.deepEqual(nockedUserKeychain);
      backupKeychain.id.should.equal('2');
      backupKeychain.provider?.should.equal(backupProvider);
    });

    it('should generate TSS key chains with optional params', async function () {
      const enterprise = 'enterprise';
      const backupShareHolder: BackupKeyShare = {
        userHeldKeyShare: backupKeyShare,
      };
      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupShareHolder, enterprise);
      const usersKeyChainPromises = [tssUtils.createParticipantKeychain(
        userGpgKey,
        1,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase',
        'originalPasscodeEncryptionCode'), tssUtils.createParticipantKeychain(
        backupGpgKey,
        2,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase')];

      const [userKeychain, backupKeychain] = await Promise.all(usersKeyChainPromises);
      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      userKeychain.should.deepEqual(nockedUserKeychain);

      // unencrypted `prv` property should exist on backup keychain
      const keyChainPrv = JSON.parse(backupKeychain.prv ?? '');
      _.isEqual(keyChainPrv.pShare, backupKeyShare.pShare).should.be.true();
      _.isEqual(keyChainPrv.bitgoNShare, bitgoKeyShare.nShares[2]).should.be.true();
      _.isEqual(keyChainPrv.userNShare, userKeyShare.nShares[2]).should.be.true();
      should.exist(backupKeychain.encryptedPrv);
    });

    it('should fail to generate TSS key chains', async function () {
      const backupShareHolder: BackupKeyShare = {
        userHeldKeyShare: backupKeyShare,
      };
      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupShareHolder);
      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      const testKeyShares = otherKeyShares;
      const testCasesPromises = [
        tssUtils.createParticipantKeychain(
          userGpgKey,
          1,
          userKeyShare,
          testKeyShares[0],
          bitgoKeychain,
          'passphrase').should.be.rejectedWith('Common keychains do not match'),
        tssUtils.createParticipantKeychain(
          userGpgKey,
          1,
          testKeyShares[1],
          backupKeyShare,
          bitgoKeychain,
          'passphrase')
          .should.be.rejectedWith('Common keychains do not match'),
        tssUtils.createParticipantKeychain(
          backupGpgKey,
          2,
          testKeyShares[2],
          backupKeyShare,
          bitgoKeychain,
          'passphrase')
          .should.be.rejectedWith('Common keychains do not match'),
        tssUtils.createParticipantKeychain(
          backupGpgKey,
          2,
          userKeyShare,
          testKeyShares[3],
          bitgoKeychain,
          'passphrase').should.be.rejectedWith('Common keychains do not match'),
      ];
      await Promise.all(testCasesPromises);
    });
  });

  describe('signTxRequest:', () => {
    const txRequestId = 'randomidEcdsa';
    const txRequest: TxRequest = {
      txRequestId,
      transactions: [{
        unsignedTx: {
          serializedTxHex: 'TOO MANY SECRETS',
          signableHex: 'TOO MANY SECRETS',
          derivationPath: '', // Needs this when key derivation is supported
        },
        state: 'pendingSignature',
        signatureShares: [],
      }],
      unsignedTxs: [
        {
          serializedTxHex: 'TOO MANY SECRETS',
          signableHex: 'TOO MANY SECRETS',
          derivationPath: '', // Needs this when key derivation is supported
        },
      ],
      date: new Date().toISOString(),
      intent: {
        intentType: 'payment',
      },
      latest: true,
      state: 'pendingUserSignature',
      walletType: 'hot',
      walletId: 'walletId',
      policiesChecked: true,
      version: 1,
      userId: 'userId',
    };

    beforeEach(async () => {

      // Initializing user and bitgo for creating shares for nocks
      const userSigningKey = MPC.keyCombine(userKeyShare.pShare, [
        bitgoKeyShare.nShares[1], backupKeyShare.nShares[1],
      ]);
      const bitgoSigningKey = MPC.keyCombine(bitgoKeyShare.pShare, [
        userKeyShare.nShares[3], backupKeyShare.nShares[3],
      ]);

      /**
       * START STEP ONE
       * 1) User creates signShare, saves wShare and sends kShare to bitgo
       * 2) Bitgo performs signConvert operation using its private xShare , yShare
       *  and KShare from user and responds back with aShare and saves bShare for later use
       */
      const userSignShare = await ECDSAMethods.createUserSignShare(userSigningKey.xShare, userSigningKey.yShares[3]);
      const signatureShareOneFromUser: SignatureShareRecord = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        share: userSignShare.kShare.k + userSignShare.kShare.n,
      };
      const getBitgoAandBShare = MPC.signConvert({
        kShare: userSignShare.kShare,
        xShare: bitgoSigningKey.xShare,
        yShare: bitgoSigningKey.yShares['1'], // corresponds to the user
      });
      const bitgoAshare = getBitgoAandBShare.aShare as ECDSA.AShare;
      const aShareBitgoResponse = (bitgoAshare.k as string) + (bitgoAshare.alpha as string) + (bitgoAshare.mu as string) + (bitgoAshare.n as string);
      const signatureShareOneFromBitgo: SignatureShareRecord = {
        from: SignatureShareType.BITGO,
        to: SignatureShareType.USER,
        share: aShareBitgoResponse,
      };
      await nockSendSignatureShareWithResponse({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        signatureShare: signatureShareOneFromUser,
        response: signatureShareOneFromBitgo,
        tssType: 'ecdsa',
      });
      /**  END STEP ONE */

      /**
       * START STEP TWO
       * 1) Using the aShare got from bitgo and wShare from previous step,
       * user creates gShare and muShare and sends muShare to bitgo
       * 2) Bitgo using the signConvert step using bShare from previous step
       * and muShare from user generates its gShare.
       * 3) Using the signCombine operation using gShare, Bitgo generates oShare
       * which it saves and dShare which is send back to the user.
       */
      const userGammaAndMuShares = await ECDSAMethods.createUserGammaAndMuShare(userSignShare.wShare, bitgoAshare);
      const signatureShareTwoFromUser: SignatureShareRecord = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        share: (userGammaAndMuShares?.muShare?.alpha as string) + (userGammaAndMuShares?.muShare?.mu as string),
      };
      const getBitGoGShareAndSignerIndexes = MPC.signConvert({
        bShare: getBitgoAandBShare.bShare,
        muShare: userGammaAndMuShares.muShare,
      });

      const getBitgoOShareAndDShares = MPC.signCombine(
        {
          gShare: getBitGoGShareAndSignerIndexes.gShare as ECDSA.GShare,
          signIndex: {
            i: 1,
            j: 3,
          },
        }
      );
      const bitgoDshare = getBitgoOShareAndDShares.dShare as ECDSA.DShare;
      const dShareBitgoResponse = (bitgoDshare.delta as string) + (bitgoDshare.Gamma as string);
      const signatureShareTwoFromBitgo: SignatureShareRecord = {
        from: SignatureShareType.BITGO,
        to: SignatureShareType.USER,
        share: dShareBitgoResponse,
      };
      await nockSendSignatureShareWithResponse({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        signatureShare: signatureShareTwoFromUser,
        response: signatureShareTwoFromBitgo,
        tssType: 'ecdsa',
      });
      /**  END STEP TWO */


      /**
       * START STEP THREE
       * 1) User creates its oShare and  dShare using the  private gShare
       * from step two
       * 2) User uses the private oShare and dShare from bitgo from step
       * two to generate its signature share which it sends back along with dShare that
       * user generated from the above step
       * 3) Bitgo using its private oShare from step two and dShare from bitgo creates
       * its signature share. Using the Signature Share received from user from the above
       * step, bitgo constructs the final signature and is returned to the user
       */
      const userOmicronAndDeltaShare = await ECDSAMethods.createUserOmicronAndDeltaShare(userGammaAndMuShares.gShare as ECDSA.GShare);
      const signablePayload = Buffer.from(txRequest.unsignedTxs[0].signableHex, 'hex');
      const userSShare = await ECDSAMethods.createUserSignatureShare(userOmicronAndDeltaShare.oShare, bitgoDshare, signablePayload);
      const signatureShareThreeFromUser: SignatureShareRecord = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        share: userSShare.R + userSShare.s + userSShare.y + userOmicronAndDeltaShare.dShare.delta + userOmicronAndDeltaShare.dShare.Gamma,
      };
      const getBitGoSShare = MPC.sign(signablePayload, getBitgoOShareAndDShares.oShare, userOmicronAndDeltaShare.dShare);
      const getBitGoFinalSignature = MPC.constructSignature([getBitGoSShare, userSShare]);
      const finalSigantureBitgoResponse = getBitGoFinalSignature.r + getBitGoFinalSignature.s + getBitGoFinalSignature.y;
      const signatureShareThreeFromBitgo: SignatureShareRecord = {
        from: SignatureShareType.BITGO,
        to: SignatureShareType.USER,
        share: finalSigantureBitgoResponse,
      };
      await nockSendSignatureShareWithResponse({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        signatureShare: signatureShareThreeFromUser,
        response: signatureShareThreeFromBitgo,
        tssType: 'ecdsa',
      });
      /* END STEP THREE */
    });

    it('signTxRequest should succeed with txRequest object as input', async function () {
      await setupSignTxRequestNocks(false);
      const signedTxRequest = await tssUtils.signTxRequest({
        txRequest,
        prv: JSON.stringify({
          pShare: userKeyShare.pShare,
          bitgoNShare: bitgoKeyShare.nShares[1],
          backupNShare: backupKeyShare.nShares[1],
        }),
        reqId,
      });
      signedTxRequest.unsignedTxs.should.deepEqual(txRequest.unsignedTxs);
    });

    it('signTxRequest should succeed with txRequest id as input', async function () {
      await setupSignTxRequestNocks();
      const signedTxRequest = await tssUtils.signTxRequest({
        txRequest: txRequestId,
        prv: JSON.stringify({
          pShare: userKeyShare.pShare,
          bitgoNShare: bitgoKeyShare.nShares[1],
          backupNShare: backupKeyShare.nShares[1],
        }),
        reqId,
      });
      signedTxRequest.unsignedTxs.should.deepEqual(txRequest.unsignedTxs);
    });

    it('signTxRequest should fail with invalid user prv', async function () {
      const getTxRequest = sandbox.stub(tssUtils, 'getTxRequest');
      getTxRequest.resolves(txRequest);
      getTxRequest.calledWith(txRequestId);

      setupSignTxRequestNocks();

      const invalidUserKey = { ...userKeyShare, pShare: { ...userKeyShare.pShare, i: 2 } };
      await tssUtils.signTxRequest({
        txRequest: txRequestId,
        prv: JSON.stringify({
          pShare: invalidUserKey.pShare,
          bitgoNShare: bitgoKeyShare.nShares[1],
          backupNShare: backupKeyShare.nShares[1],
        }),
        reqId,
      }).should.be.rejectedWith('Invalid user key');

      sandbox.verifyAndRestore();
    });

    it('signTxRequest should fail with no backupNShares', async function () {
      const getTxRequest = sandbox.stub(tssUtils, 'getTxRequest');
      getTxRequest.resolves(txRequest);
      getTxRequest.calledWith(txRequestId);

      setupSignTxRequestNocks();

      await tssUtils.signTxRequest({
        txRequest: txRequestId,
        prv: JSON.stringify({
          pShare: userKeyShare.pShare,
          bitgoNShare: bitgoKeyShare.nShares[1],
        }),
        reqId,
      }).should.be.rejectedWith('Invalid user key - missing backupNShare');

      sandbox.verifyAndRestore();
    });

    async function setupSignTxRequestNocks(isTxRequest = true) {
      let response = { txRequests: [{ ...txRequest, transactions: [{ ...txRequest, unsignedTx: { signableHex: txRequest.unsignedTxs[0].signableHex, serializedTxHex: txRequest.unsignedTxs[0].serializedTxHex } }] }] };
      if (isTxRequest) {
        await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
      }
      const aRecord = ECDSAMethods.convertAShare(mockAShare);
      const signatureShares = [aRecord];
      txRequest.signatureShares = signatureShares;
      response = { txRequests: [{ ...txRequest, transactions: [{ ...txRequest, unsignedTx: { signableHex: txRequest.unsignedTxs[0].signableHex, serializedTxHex: txRequest.unsignedTxs[0].serializedTxHex } }] }] };
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
      const dRecord = ECDSAMethods.convertDShare(mockDShare);
      signatureShares.push(dRecord);
      response = { txRequests: [{ ...txRequest, transactions: [{ ...txRequest, unsignedTx: { signableHex: txRequest.unsignedTxs[0].signableHex, serializedTxHex: txRequest.unsignedTxs[0].serializedTxHex } }] }] };
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
    }
  });


  // #region Nock helpers
  async function createIncompleteBitgoHeldBackupKeyShare(userGpgKey: openpgp.SerializedKeyPair<string>, backupKeyShare: KeyShare, bitgoGpgKey: openpgp.SerializedKeyPair<string>): Promise<BitgoHeldBackupKeyShare> {
    const nSharePromises = [encryptNShare(
      backupKeyShare,
      1,
      userGpgKey.publicKey,
      false,
    ), encryptNShare(
      backupKeyShare,
      3,
      bitgoGpgKey.publicKey,
      false,
    )];

    const backupToUserPublicShare = Buffer.concat([
      Buffer.from(backupKeyShare.nShares[1].y, 'hex'),
      Buffer.from(backupKeyShare.nShares[1].chaincode, 'hex'),
    ]).toString('hex');

    const backupToBitgoPublicShare = Buffer.concat([
      Buffer.from(backupKeyShare.nShares[3].y, 'hex'),
      Buffer.from(backupKeyShare.nShares[3].chaincode, 'hex'),
    ]).toString('hex');

    return {
      id: '4711',
      keyShares: [{
        from: 'backup',
        to: 'user',
        publicShare: backupToUserPublicShare,
        privateShare: (await nSharePromises[0]).encryptedPrivateShare,
      }, {
        from: 'backup',
        to: 'bitgo',
        publicShare: backupToBitgoPublicShare,
        privateShare: (await nSharePromises[1]).encryptedPrivateShare,
      }],
    };
  }

  async function nockCreateBitgoHeldBackupKeyShare(coin: string, userGpgKey: openpgp.SerializedKeyPair<string>, backupKeyShare: KeyShare, bitgoGpgKey: openpgp.SerializedKeyPair<string>): Promise<BitgoHeldBackupKeyShare> {
    const keyShare = await createIncompleteBitgoHeldBackupKeyShare(userGpgKey, backupKeyShare, bitgoGpgKey);

    nock(bgUrl)
      .post(`/api/v2/${coin}/krs/backupkeys`, _.matches({ userGPGPublicKey: userGpgKey.publicKey }))
      .reply(201, keyShare);

    return keyShare;
  }

  async function nockFinalizeBitgoHeldBackupKeyShare(coin: string, originalKeyShare: BitgoHeldBackupKeyShare, commonKeychain: string, userKeyShare: KeyShare, backupGpgKey: openpgp.SerializedKeyPair<string>, bitgoKeychain: Keychain): Promise<BitgoHeldBackupKeyShare> {
    const encryptedUserToBackupKeyShare = await encryptNShare(
      userKeyShare,
      2,
      backupGpgKey.publicKey,
      false,
    );

    assert(bitgoKeychain.keyShares);
    const bitgoToBackupKeyShare = bitgoKeychain.keyShares.find((keyShare) => keyShare.from === 'bitgo' && keyShare.to === 'backup');
    assert(bitgoToBackupKeyShare);

    const userPublicShare = Buffer.concat([
      Buffer.from(userKeyShare.nShares[2].y, 'hex'),
      Buffer.from(userKeyShare.nShares[2].chaincode, 'hex'),
    ]).toString('hex');

    const expectedKeyShares = [{
      from: 'user',
      to: 'backup',
      publicShare: userPublicShare,
      // Omitting the private share, the actual encryption happens inside the function where we make the matching call
      // to this nock. We cannot recreate the same encrypted value here because gpg encryption is not deterministic
    }, bitgoToBackupKeyShare];

    const updatedKeyShare: BitgoHeldBackupKeyShare = {
      id: originalKeyShare.id,
      commonKeychain,
      keyShares: [
        ...originalKeyShare.keyShares,
        {
          from: 'user',
          to: 'backup',
          publicShare: userPublicShare,
          privateShare: encryptedUserToBackupKeyShare.encryptedPrivateShare,
        },
        bitgoToBackupKeyShare,
      ],
    };

    nock(bgUrl)
      .put(`/api/v2/${coin}/krs/backupkeys/${originalKeyShare.id}`, _.matches({ commonKeychain, keyShares: expectedKeyShares }))
      .reply(200, updatedKeyShare);

    return updatedKeyShare;
  }

  async function nockBitgoKeychain(params: {
    coin: string,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    userGpgKey: openpgp.SerializedKeyPair<string>,
    backupGpgKey: openpgp.SerializedKeyPair<string>,
  }): Promise<Keychain> {
    const bitgoCombined = MPC.keyCombine(bitgoKeyShare.pShare, [params.userKeyShare.nShares[3], params.backupKeyShare.nShares[3]]);
    const nSharePromises = [encryptNShare(
      bitgoKeyShare,
      1,
      userGpgKey.publicKey,
      false,
    ),
    encryptNShare(
      bitgoKeyShare,
      2,
      backupGpgKey.publicKey,
      false,
    )];

    const [userToBitgoShare, backupToBitgoShare] = await Promise.all(nSharePromises);
    const bitgoKeychain: Keychain = {
      id: '3',
      pub: '',
      commonKeychain: bitgoCombined.xShare.y + bitgoCombined.xShare.chaincode,
      keyShares: [
        {
          from: 'bitgo',
          to: 'user',
          publicShare: userToBitgoShare.publicShare,
          privateShare: userToBitgoShare.encryptedPrivateShare,
          n: userToBitgoShare.n,
          vssProof: userToBitgoShare.vssProof,
        },
        {
          from: 'bitgo',
          to: 'backup',
          publicShare: backupToBitgoShare.publicShare,
          privateShare: backupToBitgoShare.encryptedPrivateShare,
          n: backupToBitgoShare.n,
          vssProof: backupToBitgoShare.vssProof,
        },
      ],
    };

    nock(bgUrl)
      .persist()
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: 'bitgo' }))
      .reply(200, bitgoKeychain);

    return bitgoKeychain;
  }

  async function nockKeychain(params: {
    coin: string,
    keyChain: Keychain,
    source: 'user' | 'backup'
  }): Promise<Keychain> {

    nock('https://bitgo.fakeurl')
      .persist()
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: params.source }))
      .reply(200, params.keyChain);

    return params.keyChain;
  }
  // #endregion Nock helpers
});
