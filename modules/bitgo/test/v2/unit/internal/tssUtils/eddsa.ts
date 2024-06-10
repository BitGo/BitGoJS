import * as sodium from 'libsodium-wrappers-sumo';
import * as _ from 'lodash';
import * as nock from 'nock';
import * as openpgp from 'openpgp';
import * as should from 'should';
import * as sinon from 'sinon';

import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../../src/bitgo';
import {
  common,
  Keychain,
  RequestTracer,
  SignatureShareRecord,
  SignatureShareType,
  TssUtils,
  TxRequest,
  Wallet,
  Eddsa,
  KeyShare,
  Ed25519BIP32,
  createSharedDataProof,
  CommitmentShareRecord,
  CommitmentType,
  ExchangeCommitmentResponse,
  EncryptedSignerShareType,
  BaseCoin,
} from '@bitgo/sdk-core';
import { createWalletSignatures } from '../../tss/helpers';
import {
  nockSendSignatureShare,
  nockGetTxRequest,
  nockCreateTxRequest,
  nockDeleteSignatureShare,
  nockSendTxRequest,
  nockExchangeCommitments,
} from './common';

openpgp.config.rejectCurves = new Set();

describe('TSS Utils:', async function () {
  let sandbox: sinon.SinonSandbox;
  let MPC: Eddsa;
  let bgUrl: string;
  let tssUtils: TssUtils;
  let userGpgKey;
  let backupGpgKey;
  let bitgoGpgKey;
  let bitgo: TestableBG & BitGo;
  let baseCoin: BaseCoin;
  let wallet: Wallet;
  let bitgoKeyShare;
  const reqId = new RequestTracer();
  const coinName = 'tsol';
  const validUserSigningMaterial = {
    uShare: {
      i: 1,
      t: 2,
      n: 3,
      y: '093c8603ad86c41d5ee25a814b88185b435dd3a9ceccf9c9fd691a465ac4a8b0',
      seed: 'ca40c789813250c334ddd2ba19050f6ed20b5a08853ceca492358f2711ad4b15',
      chaincode: '596d5404a7eb918ee78247b952d06539619884091fdd9e0ff5a665f349e32fca',
    },
    commonChaincode: '596d5404a7eb918ee78247b952d06539619884091fdd9e0ff5a665f349e32fca',
    bitgoYShare: {
      i: 1,
      j: 3,
      y: '59d8000ba5e85fa402f39382960e7d5ede82b1b6e22b146a18b7df238c3a3225',
      v: '01ea3f425b1adf8aec6cfe4fc8f9b94755c34657965f32397655dcd784f1b517',
      u: '9ce3204a8c9757738967f3f81b463d87267bf6f2c0e5eaf2843167537b872b0b',
      chaincode: 'd21dbd8eae5d4789292ecea2efa53e0165b2439d57f5158eb4dd57dc26b59236',
    },
    backupYShare: {
      i: 1,
      j: 2,
      y: 'e0ae75077715686a121acb41b29a55bde426971154f40a41fc317f7f774a9424',
      v: 'f76ef629dfc15ab5e4531e532b5d67f2176637ca752b195876b7e3172459c969',
      u: 'fe6b89fb6acfcd7392c35c084f58bde0846b888c4df57e466caf0a3271b06a05',
      chaincode: '1c34e5dfbbd4a870f4479caaa5e6a46e3438f976ad5aefd4905b8fe8bca1101e',
    },
  };

  const validUserSignShare = {
    xShare: {
      i: 1,
      y: '4d9343988e68191aac945a6963031dddde3490f9020d0571a6e6c6e15cca0296',
      u: '1e159d6a0ae3a8dccc74615113e7c3e25d3080e5e0ffeb0ae04dd6a967268102',
      r: 'c8f64cc48926216c3f60e1d8ff1e24eba060d7c1ff020d0fc1d735d4564efd03',
      R: '9be2208ee28cd4b2577a9a66f6aab1ed8b08a300969eeb9b203a52aa54d2c23c',
    },
    rShares: {
      3: {
        i: 3,
        j: 1,
        u: 'd675f9099fbef03aa9fcdca4009286f435e56369c374d0042f03cc60b49e690a',
        v: '3c090e88ed42da0dd0bade35c8d6b88bc050284536b98e5b27d33ff45da9755b',
        r: '7f16224dbf5b02adb6c21380fcb2a8ee00323daae62cac3575a4d328fd23a905',
        R: '9be2208ee28cd4b2577a9a66f6aab1ed8b08a300969eeb9b203a52aa54d2c23c',
        commitment: '445c8cb1dee0166b6bdd5ad1d0a53fbfe86c4d3a470f184745530a863eedff28',
      },
    },
  };

  const validBitgoToUserSignShare = {
    xShare: {
      i: 3,
      y: '4d9343988e68191aac945a6963031dddde3490f9020d0571a6e6c6e15cca0296',
      u: '1315dbe18069825b4a27188b813eae7ff2917a614499ed553e70d65d4fa4820b',
      r: 'd0539375e6566f2fe540cba48c5e56bd1cdf68cfe1f0d527d2b730fe4e879809',
      R: 'c883fe2ae9b8da1764cc36a526cfa1a21f81d604320b209867f8de9223f1de32',
    },
    rShares: {
      1: {
        i: 1,
        j: 3,
        u: '9ce3204a8c9757738967f3f81b463d87267bf6f2c0e5eaf2843167537b872b0b',
        v: '01ea3f425b1adf8aec6cfe4fc8f9b94755c34657965f32397655dcd784f1b517',
        r: '0375e8c5a5691a73c21df00d49d423e3f83fe08d7b5d5af33c5c6aa9cae59d0a',
        R: 'c883fe2ae9b8da1764cc36a526cfa1a21f81d604320b209867f8de9223f1de32',
        commitment: '62b21f98bf885841ad469145192d4df0697b3f42c581e3e926394eae0b101ecb',
      },
    },
  };

  const txRequest = {
    txRequestId: 'randomId',
    unsignedTxs: [{ signableHex: 'MPC on a Friday night', serializedTxHex: 'MPC on a Friday night' }],
    signatureShares: [
      {
        from: 'bitgo',
        to: 'user',
        share: validBitgoToUserSignShare.rShares[1].r + validBitgoToUserSignShare.rShares[1].R,
      },
    ],
  };

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  before('initializes mpc', async function () {
    const hdTree = await Ed25519BIP32.initialize();
    MPC = await Eddsa.initialize(hdTree);
  });

  before(async function () {
    bitgoKeyShare = await MPC.keyShare(3, 2, 3);

    userGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'test',
          email: 'test@test.com',
        },
      ],
      curve: 'secp256k1',
    });

    backupGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'testBackup',
          email: 'testBackup@test.com',
        },
      ],
      curve: 'secp256k1',
    });

    bitgoGpgKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@test.com',
        },
      ],
      curve: 'secp256k1',
    });
    const constants = {
      mpc: {
        bitgoPublicKey: bitgoGpgKey.publicKey,
      },
    };

    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    baseCoin = bitgo.coin(coinName);

    bgUrl = common.Environments[bitgo.getEnv()].uri;

    // TODO(WP-346): sdk-test mocks conflict so we can't use persist
    nock(bgUrl).get('/api/v1/client/constants').times(23).reply(200, { ttl: 3600, constants });

    const walletData = {
      id: '5b34252f1bf349930e34020a00000000',
      coin: 'tsol',
      keys: [
        '5b3424f91bf349930e34017500000000',
        '5b3424f91bf349930e34017600000000',
        '5b3424f91bf349930e34017700000000',
      ],
      coinSpecific: {},
      multisigType: 'tss',
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new TssUtils(bitgo, baseCoin, wallet);
  });

  after(function () {
    nock.cleanAll();
  });

  describe('TSS key chains:', async function () {
    it('should generate TSS key chains', async function () {
      const userKeyShare = MPC.keyShare(1, 2, 3);
      const backupKeyShare = MPC.keyShare(2, 2, 3);

      const nockedBitGoKeychain = await nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare,
        userGpgKey,
        backupGpgKey,
        bitgoGpgKey,
      });
      const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
      await nockBackupKeychain({ coin: coinName });

      const bitgoKeychain = await tssUtils.createBitgoKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare,
      });
      const userKeychain = await tssUtils.createUserKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        passphrase: 'passphrase',
      });
      const backupKeychain = await tssUtils.createBackupKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        passphrase: 'passphrase',
      });

      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      userKeychain.should.deepEqual(nockedUserKeychain);

      // unencrypted `prv` property should exist on backup keychain
      JSON.stringify({
        uShare: backupKeyShare.uShare,
        bitgoYShare: bitgoKeyShare.yShares[2],
        userYShare: userKeyShare.yShares[2],
      }).should.equal(backupKeychain.prv);
      should.exist(backupKeychain.encryptedPrv);
    });

    it('should generate TSS key chains without passphrase', async function () {
      const userKeyShare = MPC.keyShare(1, 2, 3);
      const backupKeyShare = MPC.keyShare(2, 2, 3);

      const nockedBitGoKeychain = await nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare,
        userGpgKey,
        // reusing the user gpg key as the backup gpg key, i.e. the user is their own the backup provider
        backupGpgKey,
        bitgoGpgKey,
      });
      const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
      await nockBackupKeychain({ coin: coinName });

      const bitgoKeychain = await tssUtils.createBitgoKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare,
      });
      const userKeychain = await tssUtils.createUserKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
      });
      const backupKeychain = await tssUtils.createBackupKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
      });

      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      userKeychain.should.deepEqual(nockedUserKeychain);

      // unencrypted `prv` property should exist on backup keychain
      JSON.stringify({
        uShare: backupKeyShare.uShare,
        bitgoYShare: bitgoKeyShare.yShares[2],
        userYShare: userKeyShare.yShares[2],
      }).should.equal(backupKeychain.prv);
    });

    it('should generate TSS key chains with optional params', async function () {
      const enterprise = 'enterprise';

      const userKeyShare = MPC.keyShare(1, 2, 3);
      const backupKeyShare = MPC.keyShare(2, 2, 3);

      const nockedBitGoKeychain = await nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare,
        userGpgKey,
        backupGpgKey,
        bitgoGpgKey,
      });
      const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
      await nockBackupKeychain({ coin: coinName });

      const bitgoKeychain = await tssUtils.createBitgoKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare,
        enterprise,
      });
      const userKeychain = await tssUtils.createUserKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        passphrase: 'passphrase',
        originalPasscodeEncryptionCode: 'originalPasscodeEncryptionCode',
      });
      const backupKeychain = await tssUtils.createBackupKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        passphrase: 'passphrase',
      });

      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);
      userKeychain.should.deepEqual(nockedUserKeychain);

      // unencrypted `prv` property should exist on backup keychain
      JSON.stringify({
        uShare: backupKeyShare.uShare,
        bitgoYShare: bitgoKeyShare.yShares[2],
        userYShare: userKeyShare.yShares[2],
      }).should.equal(backupKeychain.prv);
      should.exist(backupKeychain.encryptedPrv);
    });

    it('should fail to generate TSS keychains when received invalid number of wallet signatures', async function () {
      const userKeyShare = MPC.keyShare(1, 2, 3);
      const backupKeyShare = MPC.keyShare(2, 2, 3);

      const bitgoKeychain = await generateBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare,
        userGpgKey,
        backupGpgKey,
        bitgoGpgKey,
      });

      const certsString = await createSharedDataProof(bitgoGpgKey.privateKey, userGpgKey.publicKey, []);
      const certsKey = await openpgp.readKey({ armoredKey: certsString });
      const finalKey = new openpgp.PacketList();
      certsKey.toPacketList().forEach((packet) => finalKey.push(packet));
      // the underlying function only requires two arguments but the according .d.ts file for openpgp has the further
      // arguments marked as mandatory as well.
      // Once the following PR has been merged and released we no longer need the ts-ignore:
      // https://github.com/openpgpjs/openpgpjs/pull/1576
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      bitgoKeychain.walletHSMGPGPublicKeySigs = openpgp.armor(openpgp.enums.armor.publicKey, finalKey.write());

      await tssUtils
        .verifyWalletSignatures(userGpgKey.publicKey, backupGpgKey.publicKey, bitgoKeychain, '', 1)
        .should.be.rejectedWith('Invalid wallet signatures');
    });

    it('should fail to generate TSS keychains when wallet signature fingerprints do not match passed user/backup fingerprints', async function () {
      const userKeyShare = MPC.keyShare(1, 2, 3);
      const backupKeyShare = MPC.keyShare(2, 2, 3);

      const bitgoKeychain = await generateBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare,
        userGpgKey,
        backupGpgKey,
        bitgoGpgKey,
      });

      // using the backup gpg here instead of the user gpg key to simulate that the first signature has a different
      // fingerprint from the passed in first gpg key
      await tssUtils
        .verifyWalletSignatures(backupGpgKey.publicKey, backupGpgKey.publicKey, bitgoKeychain, '', 1)
        .should.be.rejectedWith(
          `first wallet signature's fingerprint does not match passed user gpg key's fingerprint`
        );

      // using the user gpg here instead of the backup gpg key to simulate that the second signature has a different
      // fingerprint from the passed in second gpg key
      await tssUtils
        .verifyWalletSignatures(userGpgKey.publicKey, userGpgKey.publicKey, bitgoKeychain, '', 1)
        .should.be.rejectedWith(
          `second wallet signature's fingerprint does not match passed backup gpg key's fingerprint`
        );
    });

    it('should fail to generate TSS keychains when wallet signature is for different key share', async function () {
      const userKeyShare = MPC.keyShare(1, 2, 3);
      const backupKeyShare = MPC.keyShare(2, 2, 3);
      const customBitgoKeyShare = MPC.keyShare(3, 2, 3);

      const bitgoKeychain1 = await generateBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare,
        userGpgKey,
        backupGpgKey,
        bitgoGpgKey,
      });
      const bitgoKeychain2 = await generateBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare: customBitgoKeyShare,
        userGpgKey,
        backupGpgKey,
        bitgoGpgKey,
      });

      // using the other bitgo keychains common keychain and walletHSMGPGPublicKeySigs so that the verification of the
      // commmon keychain passes but fails for the bitgo to user/ backup shares
      bitgoKeychain1.commonKeychain = bitgoKeychain2.commonKeychain;
      bitgoKeychain1.walletHSMGPGPublicKeySigs = bitgoKeychain2.walletHSMGPGPublicKeySigs;

      await tssUtils
        .createUserKeychain({
          userGpgKey,
          backupGpgKey,
          userKeyShare,
          backupKeyShare,
          bitgoKeychain: bitgoKeychain1,
        })
        .should.be.rejectedWith('bitgo share mismatch');

      await tssUtils
        .createBackupKeychain({
          userGpgKey,
          backupGpgKey,
          userKeyShare,
          backupKeyShare,
          bitgoKeychain: bitgoKeychain1,
        })
        .should.be.rejectedWith('bitgo share mismatch');
    });

    it('should fail to generate TSS key chains when common keychains do not match', async function () {
      const userKeyShare = MPC.keyShare(1, 2, 3);
      const backupKeyShare = MPC.keyShare(2, 2, 3);

      const nockedBitGoKeychain = await nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare,
        userGpgKey,
        backupGpgKey,
        bitgoGpgKey,
      });
      const bitgoKeychain = await tssUtils.createBitgoKeychain({
        userGpgKey,
        backupGpgKey,
        userKeyShare,
        backupKeyShare,
      });
      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);

      await tssUtils
        .createUserKeychain({
          userGpgKey,
          backupGpgKey,
          userKeyShare,
          backupKeyShare: MPC.keyShare(2, 2, 3),
          bitgoKeychain,
          passphrase: 'passphrase',
        })
        .should.be.rejectedWith('Failed to create user keychain - commonKeychains do not match.');
      await tssUtils
        .createUserKeychain({
          userGpgKey,
          backupGpgKey,
          userKeyShare: MPC.keyShare(1, 2, 3),
          backupKeyShare,
          bitgoKeychain,
          passphrase: 'passphrase',
        })
        .should.be.rejectedWith('Failed to create user keychain - commonKeychains do not match.');

      await tssUtils
        .createBackupKeychain({
          userGpgKey,
          backupGpgKey,
          userKeyShare: MPC.keyShare(1, 2, 3),
          backupKeyShare,
          bitgoKeychain,
          passphrase: 'passphrase',
        })
        .should.be.rejectedWith('Failed to create backup keychain - commonKeychains do not match.');
      await tssUtils
        .createBackupKeychain({
          userGpgKey,
          backupGpgKey,
          userKeyShare,
          backupKeyShare: MPC.keyShare(2, 2, 3),
          bitgoKeychain,
          passphrase: 'passphrase',
        })
        .should.be.rejectedWith('Failed to create backup keychain - commonKeychains do not match.');
    });
  });

  describe('signTxRequest:', function () {
    const txRequestId = 'randomid';
    const txRequest: TxRequest = {
      txRequestId,
      transactions: [],
      unsignedTxs: [
        {
          serializedTxHex: 'MPC on a Friday night',
          signableHex: 'MPC on a Friday night',
          derivationPath: 'm/0',
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

    beforeEach(async function () {
      const userSignShare = validUserSignShare;
      const rShare = userSignShare.rShares[3];
      const signatureShare: SignatureShareRecord = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        share: rShare.r + rShare.R,
      };

      await nockSendSignatureShare({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        signatureShare,
      });

      const signatureShare2: SignatureShareRecord = {
        from: SignatureShareType.BITGO,
        to: SignatureShareType.USER,
        share: validBitgoToUserSignShare.rShares[1].r + validBitgoToUserSignShare.rShares[1].R,
      };
      const response = { txRequests: [{ ...txRequest, signatureShares: [signatureShare2] }] };
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });

      const bitgoToUserCommitmentShare: CommitmentShareRecord = {
        from: SignatureShareType.BITGO,
        to: SignatureShareType.USER,
        type: CommitmentType.COMMITMENT,
        share: validBitgoToUserSignShare.rShares[1].commitment,
      };
      const exchangeCommitResponse: ExchangeCommitmentResponse = { commitmentShare: bitgoToUserCommitmentShare };
      await nockExchangeCommitments({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        response: exchangeCommitResponse,
      });
    });

    it('signTxRequest should succeed with txRequest object as input', async function () {
      const signedTxRequest = await tssUtils.signTxRequest({
        txRequest,
        prv: JSON.stringify(validUserSigningMaterial),
        reqId,
      });
      signedTxRequest.unsignedTxs.should.deepEqual(txRequest.unsignedTxs);

      sandbox.verifyAndRestore();
    });

    it('signTxRequest should succeed with txRequest id as input', async function () {
      const getTxRequest = sandbox.stub(tssUtils, 'getTxRequest');
      getTxRequest.resolves(txRequest);
      getTxRequest.calledWith(txRequestId);

      const signedTxRequest = await tssUtils.signTxRequest({
        txRequest: txRequestId,
        prv: JSON.stringify(validUserSigningMaterial),
        reqId,
      });
      signedTxRequest.unsignedTxs.should.deepEqual(txRequest.unsignedTxs);

      sandbox.verifyAndRestore();
    });
  });

  describe('signTxRequest With Commitment:', function () {
    const txRequestId = 'randomid';
    const txRequest: TxRequest = {
      txRequestId,
      transactions: [],
      unsignedTxs: [
        {
          serializedTxHex: 'MPC on a Friday night',
          signableHex: 'MPC on a Friday night',
          derivationPath: 'm/0',
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

    beforeEach(async function () {
      const userSignShare = validUserSignShare;
      const rShare = userSignShare.rShares[3];
      const signatureShare: SignatureShareRecord = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        share: rShare.r + rShare.R,
      };

      await nockSendSignatureShare({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        signatureShare,
      });

      const signatureShare2: SignatureShareRecord = {
        from: SignatureShareType.BITGO,
        to: SignatureShareType.USER,
        share: validBitgoToUserSignShare.rShares[1].r + validBitgoToUserSignShare.rShares[1].R,
      };
      const response = { txRequests: [{ ...txRequest, signatureShares: [signatureShare2] }] };
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
      const bitgoToUserCommitmentShare: CommitmentShareRecord = {
        from: SignatureShareType.BITGO,
        to: SignatureShareType.USER,
        type: CommitmentType.COMMITMENT,
        share: validBitgoToUserSignShare.rShares[1].commitment,
      };
      const exchangeCommitResponse: ExchangeCommitmentResponse = { commitmentShare: bitgoToUserCommitmentShare };
      await nockExchangeCommitments({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        response: exchangeCommitResponse,
      });
    });

    it('signTxRequest should succeed with txRequest object as input', async function () {
      const signedTxRequest = await tssUtils.signTxRequest({
        txRequest,
        prv: JSON.stringify(validUserSigningMaterial),
        reqId,
      });
      signedTxRequest.unsignedTxs.should.deepEqual(txRequest.unsignedTxs);

      sandbox.verifyAndRestore();
    });

    it('signTxRequest should succeed with txRequest id as input', async function () {
      const getTxRequest = sandbox.stub(tssUtils, 'getTxRequest');
      getTxRequest.resolves(txRequest);
      getTxRequest.calledWith(txRequestId);

      const signedTxRequest = await tssUtils.signTxRequest({
        txRequest: txRequestId,
        prv: JSON.stringify(validUserSigningMaterial),
        reqId,
      });
      signedTxRequest.unsignedTxs.should.deepEqual(txRequest.unsignedTxs);

      sandbox.verifyAndRestore();
    });
  });

  describe('prebuildTxWithIntent:', async function () {
    it('should build single recipient tx', async function () {
      const nockedCreateTx = await nockCreateTxRequest({
        walletId: wallet.id(),
        requestBody: {
          apiVersion: 'lite',
          intent: {
            intentType: 'payment',
            recipients: [
              {
                address: {
                  address: 'recipient',
                },
                amount: {
                  value: '10000',
                  symbol: 'tsol',
                },
              },
            ],
          },
        },
        // don't care about the actual response - just need to make sure request body matches
        response: {},
      });

      await tssUtils.prebuildTxWithIntent({
        reqId,
        recipients: [
          {
            address: 'recipient',
            amount: '10000',
          },
        ],
        intentType: 'payment',
      });

      nockedCreateTx.isDone().should.be.true();
    });

    it('should build multiple recipients with memo tx', async function () {
      const nockedCreateTx = await nockCreateTxRequest({
        walletId: wallet.id(),
        requestBody: {
          apiVersion: 'lite',
          intent: {
            intentType: 'payment',
            recipients: [
              {
                address: {
                  address: 'recipient1',
                },
                amount: {
                  value: '10000',
                  symbol: 'tsol',
                },
              },
              {
                address: {
                  address: 'recipient2',
                },
                amount: {
                  value: '20000',
                  symbol: 'tsol',
                },
              },
            ],
            memo: 'memo',
          },
        },
        // don't care about the actual response - just need to make sure request body matches
        response: {},
      });

      await tssUtils.prebuildTxWithIntent({
        reqId,
        recipients: [
          {
            address: 'recipient1',
            amount: '10000',
          },
          {
            address: 'recipient2',
            amount: '20000',
          },
        ],
        memo: {
          value: 'memo',
          type: 'text',
        },
        intentType: 'payment',
      });

      nockedCreateTx.isDone().should.be.true();
    });
  });

  describe('delete SignatureShare:', async function () {
    it('should succeed to delete Signature Share', async function () {
      const signatureShare = { from: 'user', to: 'bitgo', share: '128bytestring' } as SignatureShareRecord;
      const nock = await nockDeleteSignatureShare({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        signatureShare,
      });
      const response = await tssUtils.deleteSignatureShares(txRequest.txRequestId);
      response.should.deepEqual([signatureShare]);
      response.should.length(1);
      nock.isDone().should.equal(true);
    });

    it('should call setRequestTracer', async function () {
      const signatureShare = { from: 'user', to: 'bitgo', share: '128bytestring' } as SignatureShareRecord;
      const nock = await nockDeleteSignatureShare({
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
        signatureShare,
      });
      const reqId = new RequestTracer();
      const setRequestTracerSpy = sinon.spy(bitgo, 'setRequestTracer');
      setRequestTracerSpy.withArgs(reqId);
      const response = await tssUtils.deleteSignatureShares(txRequest.txRequestId, reqId);
      response.should.deepEqual([signatureShare]);
      response.should.length(1);
      nock.isDone().should.equal(true);
      sinon.assert.calledOnce(setRequestTracerSpy);
      setRequestTracerSpy.restore();
    });
  });

  describe('sendTxRequest:', async function () {
    it('should succeed to send tx request', async function () {
      const nock = await nockSendTxRequest({
        coin: coinName,
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
      });
      await tssUtils.sendTxRequest(txRequest.txRequestId).should.be.fulfilled();
      nock.isDone().should.equal(true);
    });

    it('should call setRequestTracer', async function () {
      const nock = await nockSendTxRequest({
        coin: coinName,
        walletId: wallet.id(),
        txRequestId: txRequest.txRequestId,
      });
      const reqId = new RequestTracer();
      const setRequestTracerSpy = sinon.spy(bitgo, 'setRequestTracer');
      setRequestTracerSpy.withArgs(reqId);
      await tssUtils.sendTxRequest(txRequest.txRequestId, reqId).should.be.fulfilled();
      nock.isDone().should.equal(true);
      sinon.assert.calledOnce(setRequestTracerSpy);
      setRequestTracerSpy.restore();
    });
  });

  describe('createUserToBitgoCommitmentShare', function () {
    it('should create a valid commitmentShare', async function () {
      const value = 'randomstring';
      const validUserToBitgoCommitmentShare = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        type: CommitmentType.COMMITMENT,
        share: value,
      };
      const commitmentShare = tssUtils.createUserToBitgoCommitmentShare(value);
      commitmentShare.should.deepEqual(validUserToBitgoCommitmentShare);
    });
  });

  describe('createUserToBitgoEncryptedSignerShare', function () {
    it('should create a valid encryptedSignerShare', async function () {
      const value = 'randomstring';
      const validUserToBitgoEncryptedSignerShare = {
        from: SignatureShareType.USER,
        to: SignatureShareType.BITGO,
        type: EncryptedSignerShareType.ENCRYPTED_SIGNER_SHARE,
        share: value,
      };
      const encryptedSignerShare = tssUtils.createUserToBitgoEncryptedSignerShare(value);
      encryptedSignerShare.should.deepEqual(validUserToBitgoEncryptedSignerShare);
    });
  });

  describe('supportedTxRequestVersions', function () {
    it('should return full for custodial wallets', async function () {
      const custodialWallet = new Wallet(bitgo, baseCoin, { multisigType: 'tss', type: 'custodial' });
      const custodialTssUtils = new TssUtils(bitgo, baseCoin, custodialWallet);
      custodialTssUtils.supportedTxRequestVersions().should.deepEqual(['full']);
    });
    it('should return full for cold wallets', async function () {
      const coldWallet = new Wallet(bitgo, baseCoin, { multisigType: 'tss', type: 'cold' });
      const coldWalletTssUtils = new TssUtils(bitgo, baseCoin, coldWallet);
      coldWalletTssUtils.supportedTxRequestVersions().should.deepEqual(['full']);
    });
    it('should return full and lite for hot wallets', async function () {
      const hotWallet = new Wallet(bitgo, baseCoin, { multisigType: 'tss', type: 'hot' });
      const hotTssUtils = new TssUtils(bitgo, baseCoin, hotWallet);
      const supportedTxRequestVersions = hotTssUtils.supportedTxRequestVersions();
      supportedTxRequestVersions.should.deepEqual(['lite', 'full']);
    });
    it('should return empty for trading wallets', function () {
      const tradingWallets = new Wallet(bitgo, baseCoin, { multisigType: 'tss', type: 'trading' });
      const tradingWalletTssUtils = new TssUtils(bitgo, baseCoin, tradingWallets);
      const supportedTxRequestVersions = tradingWalletTssUtils.supportedTxRequestVersions();
      supportedTxRequestVersions.should.deepEqual([]);
    });
    it('should return empty for non-tss wallets', function () {
      const nonTssWalletData = { coin: 'btc', multisigType: 'onchain' };
      const btcCoin = bitgo.coin('tbtc');
      const nonTssWallet = new Wallet(bitgo, btcCoin, nonTssWalletData);
      const nonTssWalletTssUtils = new TssUtils(bitgo, btcCoin, nonTssWallet);
      nonTssWalletTssUtils.supportedTxRequestVersions().should.deepEqual([]);
    });
  });

  describe('isPendingApprovalTxRequestFull', () => {
    it('should return true for full apiVersion and pendingApproval state', async () => {
      const txRequest = {
        apiVersion: 'full',
        state: 'pendingApproval',
      } as TxRequest;
      const result = await tssUtils.isPendingApprovalTxRequestFull(txRequest);
      result.should.be.true();
    });

    it('should return false for non-full apiVersion', async () => {
      const txRequest = {
        apiVersion: 'lite',
        state: 'pendingApproval',
      } as TxRequest;
      const result = await tssUtils.isPendingApprovalTxRequestFull(txRequest);
      result.should.be.false();
    });

    it('should return false for non-pendingApproval state', async () => {
      const txRequest = {
        apiVersion: 'full',
        state: 'pendingDelivery',
      } as TxRequest;
      const result = await tssUtils.isPendingApprovalTxRequestFull(txRequest);
      result.should.be.false();
    });
  });

  // #region Nock helpers
  async function generateBitgoKeychain(params: {
    coin: string;
    userKeyShare: KeyShare;
    backupKeyShare: KeyShare;
    bitgoKeyShare: KeyShare;
    userGpgKey: openpgp.SerializedKeyPair<string>;
    backupGpgKey: openpgp.SerializedKeyPair<string>;
    bitgoGpgKey: openpgp.SerializedKeyPair<string>;
  }): Promise<Keychain> {
    const bitgoCombined = MPC.keyCombine(params.bitgoKeyShare.uShare, [
      params.userKeyShare.yShares[3],
      params.backupKeyShare.yShares[3],
    ]);
    const userGpgKeyActual = await openpgp.readKey({ armoredKey: params.userGpgKey.publicKey });
    const backupGpgKeyActual = await openpgp.readKey({ armoredKey: params.backupGpgKey.publicKey });

    const bitgoToUserMessage = await openpgp.createMessage({
      text: Buffer.concat([
        Buffer.from(params.bitgoKeyShare.yShares[1].u, 'hex'),
        Buffer.from(params.bitgoKeyShare.yShares[1].chaincode, 'hex'),
      ]).toString('hex'),
    });
    const encryptedBitgoToUserMessage = await openpgp.encrypt({
      message: bitgoToUserMessage,
      encryptionKeys: [userGpgKeyActual.toPublic()],
      format: 'armored',
    });

    const bitgoToBackupMessage = await openpgp.createMessage({
      text: Buffer.concat([
        Buffer.from(params.bitgoKeyShare.yShares[2].u, 'hex'),
        Buffer.from(params.bitgoKeyShare.yShares[2].chaincode, 'hex'),
      ]).toString('hex'),
    });
    const encryptedBitgoToBackupMessage = await openpgp.encrypt({
      message: bitgoToBackupMessage,
      encryptionKeys: [backupGpgKeyActual.toPublic()],
      format: 'armored',
    });

    const bitgoKeychain: Keychain = {
      id: '3',
      pub: '',
      commonKeychain: bitgoCombined.pShare.y + bitgoCombined.pShare.chaincode,
      keyShares: [
        {
          from: 'bitgo',
          to: 'user',
          publicShare: params.bitgoKeyShare.yShares[1].y + params.bitgoKeyShare.yShares[1].chaincode,
          privateShare: encryptedBitgoToUserMessage.toString(),
          vssProof: params.bitgoKeyShare.yShares[1].v,
        },
        {
          from: 'bitgo',
          to: 'backup',
          publicShare: params.bitgoKeyShare.yShares[2].y + params.bitgoKeyShare.yShares[2].chaincode,
          privateShare: encryptedBitgoToBackupMessage.toString(),
          vssProof: params.bitgoKeyShare.yShares[2].v,
        },
      ],
      type: 'tss',
    };

    const userKeyId = userGpgKeyActual.keyPacket.getFingerprint();
    const backupKeyId = backupGpgKeyActual.keyPacket.getFingerprint();
    const bitgoToUserPublicShare =
      Buffer.from(
        await sodium.crypto_scalarmult_ed25519_base_noclamp(Buffer.from(params.bitgoKeyShare.yShares[1].u, 'hex'))
      ).toString('hex') + params.bitgoKeyShare.yShares[1].chaincode;
    const bitgoToBackupPublicShare =
      Buffer.from(
        await sodium.crypto_scalarmult_ed25519_base_noclamp(Buffer.from(params.bitgoKeyShare.yShares[2].u, 'hex'))
      ).toString('hex') + params.bitgoKeyShare.yShares[2].chaincode;

    bitgoKeychain.walletHSMGPGPublicKeySigs = await createWalletSignatures(
      params.bitgoGpgKey.privateKey,
      params.userGpgKey.publicKey,
      params.backupGpgKey.publicKey,
      [
        { name: 'commonKeychain', value: bitgoCombined.pShare.y + bitgoCombined.pShare.chaincode },
        { name: 'userKeyId', value: userKeyId },
        { name: 'backupKeyId', value: backupKeyId },
        { name: 'bitgoToUserPublicShare', value: bitgoToUserPublicShare },
        { name: 'bitgoToBackupPublicShare', value: bitgoToBackupPublicShare },
      ]
    );

    return bitgoKeychain;
  }

  async function nockBitgoKeychain(params: {
    coin: string;
    userKeyShare: KeyShare;
    backupKeyShare: KeyShare;
    bitgoKeyShare: KeyShare;
    userGpgKey: openpgp.SerializedKeyPair<string>;
    backupGpgKey: openpgp.SerializedKeyPair<string>;
    bitgoGpgKey: openpgp.SerializedKeyPair<string>;
  }): Promise<Keychain> {
    const bitgoKeychain = await generateBitgoKeychain(params);

    nock(bgUrl)
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: 'bitgo' }))
      .reply(200, bitgoKeychain);

    return bitgoKeychain;
  }

  async function nockUserKeychain(params: { coin: string }): Promise<Keychain> {
    const userKeychain: Keychain = {
      id: '1',
      pub: '',
      type: 'tss',
    };

    nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: 'user' }))
      .reply(200, userKeychain);

    return userKeychain;
  }

  async function nockBackupKeychain(params: { coin: string }): Promise<Keychain> {
    const backupKeychain: Keychain = {
      id: '2',
      pub: '',
      type: 'tss',
    };

    nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: 'backup' }))
      .reply(200, backupKeychain);

    return backupKeychain;
  }

  // #endregion Nock helpers
});
