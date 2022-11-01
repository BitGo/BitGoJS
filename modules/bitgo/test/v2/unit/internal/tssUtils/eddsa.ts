import * as _ from 'lodash';
import * as nock from 'nock';
import * as openpgp from 'openpgp';
import * as should from 'should';
import * as sinon from 'sinon';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../../src/bitgo';
import {
  common,
  createUserSignShare,
  Keychain,
  RequestTracer,
  ShareKeyPosition,
  SignatureShareRecord,
  SignatureShareType,
  TssUtils,
  TxRequest,
  Wallet,
  Eddsa,
  KeyShare,
  Ed25519BIP32,
} from '@bitgo/sdk-core';
import { nockSendSignatureShare, nockGetTxRequest, nockCreateTxRequest, nockDeleteSignatureShare, nockSendTxRequest } from './common';

openpgp.config.rejectCurves = new Set();

describe('TSS Utils:', async function () {
  let sandbox: sinon.SinonSandbox;
  let MPC: Eddsa;
  let bgUrl: string;
  let tssUtils: TssUtils;
  let wallet: Wallet;
  let bitgoKeyShare;
  const reqId = new RequestTracer;
  const coinName = 'tsol';
  const validUserSigningMaterial = {
    uShare: {
      i: 1,
      t: 2,
      n: 3,
      y: '2f97f50e81507c2d3aaaf35673a9ec2eb5be706ab2aa6302a8a1dbc6dc8b13a4',
      seed: 'e49bcb10aed940823180ec841b562593a5111d221319920720dee209633a7c1e',
      chaincode: '1175780188727cdc222b55ab36a21e4f9a81f34fd66b216d55d497e806095404',
    },
    commonChaincode: '3b8ceb8c78b151ba2e6cf123b385ab83fd16b50554335fb9d30967a2977b1c18',
    bitgoYShare: {
      i: 1,
      j: 3,
      y: '367523d7d49fbaf5b3ddac8d95fbae6b5ae5df93bcd28facdf5b2845db96a456',
      v: '2757f7b44ba338c4d917c46ce59e64d5d5b340c8f56bed4d6548674b7262326a',
      u: '657127c5ad7f019ca2d13564a61dcea69b36869a5e0b1d0bcb4e9aff12f4f702',
      chaincode: '5a16fcb16a53904409f41cb9ea253df50b3396ac5ecce9c17124f5a79b890f24',
    },
    backupYShare: {
      i: 1,
      j: 2,
      y: 'a287d3396a25a30a11d893212ede64823687e86b3e8ab7d9d30511bda225bdee',
      v: 'dd1fd4864d9739ec5e5d99fb2d4fa2841179c03f1661d9c0dd7383a870bed975',
      u: '012e025099bffc0b97522cec86d043ced552bc076ba29f1045e480a717a2150b',
      chaincode: 'd00076d985eb449a024d7ebe92be4f3f57612b091efb548b0c0fda12f5e8b8f0',
    },
  };
  const txRequest = {
    txRequestId: 'randomId',
    unsignedTxs: [{ signableHex: 'randomhex', serializedTxHex: 'randomhex2', derivationPath: 'm/0/1/2',
    }],
    signatureShares: [
      { from: 'bitgo',
        to: 'user',
        share: '9d7159a76700635b10edf1fb983ce1ad1690a9686927e137cb4a70b32ad77b0e7f0394fa3ac3db433aec1097ca88ee43034d3a9fb0c4f87b63ff38fc1d1c8f4f' }],
  };
  const signablePayload = Buffer.from(txRequest.unsignedTxs[0].signableHex, 'hex');

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  before('initializes mpc', async function() {
    const hdTree = await Ed25519BIP32.initialize();
    MPC = await Eddsa.initialize(hdTree);
  });

  before(async function () {
    bitgoKeyShare = await MPC.keyShare(3, 2, 3);

    const bitGoGPGKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@test.com',
        },
      ],
    });
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

    const walletData = {
      id: '5b34252f1bf349930e34020a00000000',
      coin: 'tsol',
      keys: [
        '5b3424f91bf349930e34017500000000',
        '5b3424f91bf349930e34017600000000',
        '5b3424f91bf349930e34017700000000',
      ],
      coinSpecific: {},
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new TssUtils(bitgo, baseCoin, wallet);
  });

  after(function () {
    nock.cleanAll();
  });

  describe('TSS key chains:', async function() {
    it('should generate TSS key chains', async function () {
      const userKeyShare = MPC.keyShare(1, 2, 3);
      const backupKeyShare = MPC.keyShare(2, 2, 3);
      const userGpgKey = await openpgp.generateKey({
        userIDs: [
          {
            name: 'test',
            email: 'test@test.com',
          },
        ],
        curve: 'secp256k1',
      });

      const nockedBitGoKeychain = await nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        userGpgKey,
      });
      const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
      await nockBackupKeychain({ coin: coinName });

      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare);
      const userKeychain = await tssUtils.createUserKeychain(
        userGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase');
      const backupKeychain = await tssUtils.createBackupKeychain(
        userGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase');

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
      const userGpgKey = await openpgp.generateKey({
        userIDs: [
          {
            name: 'test',
            email: 'test@test.com',
          },
        ],
        curve: 'secp256k1',
      });

      const nockedBitGoKeychain = await nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        userGpgKey,
      });
      const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
      await nockBackupKeychain({ coin: coinName });

      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare);
      const userKeychain = await tssUtils.createUserKeychain(
        userGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain);
      const backupKeychain = await tssUtils.createBackupKeychain(
        userGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain);

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
      const userGpgKey = await openpgp.generateKey({
        userIDs: [
          {
            name: 'test',
            email: 'test@test.com',
          },
        ],
        curve: 'secp256k1',
      });

      const nockedBitGoKeychain = await nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        userGpgKey,
      });
      const nockedUserKeychain = await nockUserKeychain({ coin: coinName });
      await nockBackupKeychain({ coin: coinName });

      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare, enterprise);
      const userKeychain = await tssUtils.createUserKeychain(
        userGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase',
        'originalPasscodeEncryptionCode');
      const backupKeychain = await tssUtils.createBackupKeychain(
        userGpgKey,
        userKeyShare,
        backupKeyShare,
        bitgoKeychain,
        'passphrase');

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

    it('should fail to generate TSS key chains', async function () {
      const userKeyShare = MPC.keyShare(1, 2, 3);
      const backupKeyShare = MPC.keyShare(2, 2, 3);
      const userGpgKey = await openpgp.generateKey({
        userIDs: [
          {
            name: 'test',
            email: 'test@test.com',
          },
        ],
        curve: 'secp256k1',
      });

      const nockedBitGoKeychain = await nockBitgoKeychain({
        coin: coinName,
        userKeyShare,
        backupKeyShare,
        userGpgKey,
      });
      const bitgoKeychain = await tssUtils.createBitgoKeychain(userGpgKey, userKeyShare, backupKeyShare);
      bitgoKeychain.should.deepEqual(nockedBitGoKeychain);

      await tssUtils.createUserKeychain(
        userGpgKey,
        userKeyShare,
        MPC.keyShare(2, 2, 3),
        bitgoKeychain,
        'passphrase')
        .should.be.rejectedWith('Failed to create user keychain - commonKeychains do not match.');
      await tssUtils.createUserKeychain(
        userGpgKey,
        MPC.keyShare(1, 2, 3),
        backupKeyShare,
        bitgoKeychain,
        'passphrase')
        .should.be.rejectedWith('Failed to create user keychain - commonKeychains do not match.');

      await tssUtils.createBackupKeychain(
        userGpgKey,
        MPC.keyShare(1, 2, 3),
        backupKeyShare,
        bitgoKeychain,
        'passphrase')
        .should.be.rejectedWith('Failed to create backup keychain - commonKeychains do not match.');
      await tssUtils.createBackupKeychain(
        userGpgKey,
        userKeyShare,
        MPC.keyShare(2, 2, 3),
        bitgoKeychain,
        'passphrase')
        .should.be.rejectedWith('Failed to create backup keychain - commonKeychains do not match.');
    });
  });

  describe('signTxRequest:', function() {
    const txRequestId = 'randomid';
    const txRequest: TxRequest = {
      txRequestId,
      transactions: [],
      unsignedTxs: [
        {
          serializedTxHex: 'ababfefe',
          signableHex: 'deadbeef',
          derivationPath: 'm/0/1/2',
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
      const signingKey = MPC.keyDerive(
        validUserSigningMaterial.uShare,
        [validUserSigningMaterial.bitgoYShare, validUserSigningMaterial.backupYShare],
        txRequest.unsignedTxs[0].derivationPath
      );

      const userSignShare = await createUserSignShare(signablePayload, signingKey.pShare);
      const rShare = userSignShare.rShares[ShareKeyPosition.BITGO];
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
        share: rShare.r + rShare.R,
      };
      const response = { txRequests: [{ ...txRequest, signatureShares: [signatureShare2] }] };
      await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });

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

  describe('prebuildTxWithIntent:', async function() {
    it('should build single recipient tx', async function () {
      const nockedCreateTx = await nockCreateTxRequest({
        walletId: wallet.id(),
        requestBody: {
          apiVersion: 'lite',
          intent: {
            intentType: 'payment',
            recipients: [{
              address: {
                address: 'recipient',
              },
              amount: {
                value: '10000',
                symbol: 'tsol',
              },
            }],
          },
        },
        // don't care about the actual response - just need to make sure request body matches
        response: {},
      });

      await tssUtils.prebuildTxWithIntent({
        reqId,
        recipients: [{
          address: 'recipient',
          amount: '10000',
        }],
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
            recipients: [{
              address: {
                address: 'recipient1',
              },
              amount: {
                value: '10000',
                symbol: 'tsol',
              },
            }, {
              address: {
                address: 'recipient2',
              },
              amount: {
                value: '20000',
                symbol: 'tsol',
              },
            }],
            memo: 'memo',
          },
        },
        // don't care about the actual response - just need to make sure request body matches
        response: {},
      });

      await tssUtils.prebuildTxWithIntent({
        reqId,
        recipients: [{
          address: 'recipient1',
          amount: '10000',
        }, {
          address: 'recipient2',
          amount: '20000',
        }],
        memo: {
          value: 'memo',
          type: 'text',
        },
        intentType: 'payment',
      });

      nockedCreateTx.isDone().should.be.true();
    });
  });

  describe('delete SignatureShare:', async function() {
    it('should succeed to delete Signature Share', async function() {
      const signatureShare = { from: 'user', to: 'bitgo', share: '128bytestring' } as SignatureShareRecord;
      const nock = await nockDeleteSignatureShare({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, signatureShare });
      const response = await tssUtils.deleteSignatureShares(txRequest.txRequestId);
      response.should.deepEqual([signatureShare]);
      response.should.length(1);
      nock.isDone().should.equal(true);
    });
  });


  describe('sendTxRequest:', async function() {
    it('should succeed to send tx request', async function() {
      const nock = await nockSendTxRequest({ coin: coinName, walletId: wallet.id(), txRequestId: txRequest.txRequestId });
      await tssUtils.sendTxRequest(txRequest.txRequestId).should.be.fulfilled();
      nock.isDone().should.equal(true);
    });
  });


  // #region Nock helpers
  async function nockBitgoKeychain(params: {
    coin: string,
    userKeyShare: KeyShare,
    backupKeyShare: KeyShare,
    userGpgKey: openpgp.SerializedKeyPair<string>,
  }): Promise<Keychain> {
    const bitgoCombined = MPC.keyCombine(bitgoKeyShare.uShare, [params.userKeyShare.yShares[3], params.backupKeyShare.yShares[3]]);
    const userGpgKeyActual = await openpgp.readKey({ armoredKey: params.userGpgKey.publicKey });

    const bitgoToUserMessage = await openpgp.createMessage({ text: Buffer.concat([
      Buffer.from(bitgoKeyShare.yShares[1].u, 'hex'),
      Buffer.from(bitgoKeyShare.yShares[1].chaincode, 'hex'),
    ]).toString('hex'),
    });
    const encryptedBitgoToUserMessage = await openpgp.encrypt({
      message: bitgoToUserMessage,
      encryptionKeys: [userGpgKeyActual.toPublic()],
      format: 'armored',
    });

    const bitgoToBackupMessage = await openpgp.createMessage({
      text: Buffer.concat([
        Buffer.from(bitgoKeyShare.yShares[2].u, 'hex'),
        Buffer.from(bitgoKeyShare.yShares[2].chaincode, 'hex'),
      ]).toString('hex'),
    });
    const encryptedBitgoToBackupMessage = await openpgp.encrypt({
      message: bitgoToBackupMessage,
      encryptionKeys: [userGpgKeyActual.toPublic()],
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
          publicShare: bitgoKeyShare.yShares[1].y + bitgoKeyShare.yShares[1].v + bitgoKeyShare.yShares[1].chaincode,
          privateShare: encryptedBitgoToUserMessage.toString(),
        },
        {
          from: 'bitgo',
          to: 'backup',
          publicShare: bitgoKeyShare.yShares[2].y + bitgoKeyShare.yShares[2].v + bitgoKeyShare.yShares[2].chaincode,
          privateShare: encryptedBitgoToBackupMessage.toString(),
        },
      ],
    };

    nock(bgUrl)
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: 'bitgo' }))
      .reply(200, bitgoKeychain);

    return bitgoKeychain;
  }

  async function nockUserKeychain(params: {
    coin: string,
  }): Promise<Keychain> {
    const userKeychain: Keychain = {
      id: '1',
      pub: '',
    };

    nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: 'user' }))
      .reply(200, userKeychain);

    return userKeychain;
  }

  async function nockBackupKeychain(params: {
    coin: string,
  }): Promise<Keychain> {
    const backupKeychain: Keychain = {
      id: '2',
      pub: '',
    };

    nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/key`, _.matches({ keyType: 'tss', source: 'backup' }))
      .reply(200, backupKeychain);

    return backupKeychain;
  }

  // #endregion Nock helpers
});
