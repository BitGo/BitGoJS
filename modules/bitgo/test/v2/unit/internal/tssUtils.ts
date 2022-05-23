import * as _ from 'lodash';
import * as nock from 'nock';
import * as openpgp from 'openpgp';
import * as should from 'should';
import * as sinon from 'sinon';

import { Ed25519BIP32 } from '../../../../../account-lib/dist/src/mpc/hdTree';
import Eddsa, { KeyShare } from '../../../../../account-lib/dist/src/mpc/tss';
import { Wallet } from '../../../../src';
import { SignatureShareRecord, SignatureShareType, TssUtils, TxRequest } from '../../../../src/v2/internal/tssUtils';
import { TestBitGo } from '../../../lib/test_bitgo';
import { common, Keychain } from '@bitgo/sdk-core';
import { RequestTracer } from '../../../../src/v2/internal/util';
import { createUserSignShare, ShareKeyPosition } from '../../../../src/tss';

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
      y: '9e69e3e92978896e872d71ff7a9e63a963ab0f59583d4fcbe79f82cde9ea6bf9',
      seed: '1bd73e7a4592405bfd297a85a7d28bacc676f3f5a89d84023f0e4e0be2a0b526',
      chaincode: 'bda980c34aa06916f25c4c7934ea09a928bff7730a100902f4d53bb9236771a7',
    },
    commonChaincode: '99dd8f3e26f906a66ff0ee5d586afd403fd4cc8a6378a00347f90aa8983164b9',
    bitgoYShare: {
      i: 1,
      j: 3,
      y: '141fd5cbb901d46b8c2c783f3d4ee968ae91c38f71aba05146b3ba8bd4309596',
      u: 'd9d21c0a0a4434ddc17d386d47b022487169408429bd544e9d98b1cc9a73a508',
      chaincode: '67d33063052606f341cae40877709de725abda41f2df7f4765e3f58ce5030e1a',
    },
    backupYShare: {
      i: 1,
      j: 2,
      y: 'e2b844934b56f278b4a8a3665d43d14de80732241622ec7a8bd6cffc0f74452a',
      u: '971b424cea4c978cfe4669272c2fde01ef46b49a2823e4281a244bf877f1430b',
      chaincode: '7460de17d732969c3bc9bddbac1055aff168fad5668917b8ed3fd9628fc6e4f8',
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

    nock('https://bitgo.fakeurl')
      .persist()
      .get('/api/v1/client/constants')
      .reply(200, { ttl: 3600, constants });

    const bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();

    const baseCoin = bitgo.coin(coinName);

    bgUrl = common.Environments[bitgo.getEnv()].uri;

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
      unsignedTxs: [
        {
          serializedTxHex: 'ababfefe',
          signableHex: 'deadbeef',
          derivationPath: 'm/0/1/2',
        },
      ],
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
          publicShare: bitgoKeyShare.yShares[1].y + bitgoKeyShare.yShares[1].chaincode,
          privateShare: encryptedBitgoToUserMessage.toString(),
        },
        {
          from: 'bitgo',
          to: 'backup',
          publicShare: bitgoKeyShare.yShares[2].y + bitgoKeyShare.yShares[2].chaincode,
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

  async function nockSendTxRequest(params: {coin:string, walletId: string, txRequestId: string}): Promise<nock.Scope> {
    return nock('https://bitgo.fakeurl')
      .post(`/api/v2/${params.coin}/wallet/${params.walletId}/tx/send`, { txRequestId: params.txRequestId })
      .reply(200);
  }

  async function nockSendSignatureShare(params: { walletId: string, txRequestId: string, signatureShare: any, signerShare?: string}, status = 200): Promise<nock.Scope> {
    return nock('https://bitgo.fakeurl')
      .persist(true)
      .post(`/api/v2/wallet/${params.walletId}/txrequests/${params.txRequestId}/signatureshares`)
      .reply(status, (status === 200 ? params.signatureShare : { error: 'some error' }));
  }

  async function nockDeleteSignatureShare(params: { walletId: string, txRequestId: string, signatureShare: SignatureShareRecord}, status = 200): Promise<nock.Scope> {
    return nock('https://bitgo.fakeurl')
      .delete(`/api/v2/wallet/${params.walletId}/txrequests/${params.txRequestId}/signatureshares`)
      .reply(status, (status === 200 ? [params.signatureShare] : { error: 'some error' }));
  }

  async function nockCreateTxRequest(params: { walletId: string, requestBody: any, response: any }): Promise<nock.Scope> {
    return nock('https://bitgo.fakeurl')
      .post(`/api/v2/wallet/${params.walletId}/txrequests`, params.requestBody)
      .reply(200, params.response);
  }

  async function nockGetTxRequest(params: {walletId: string, txRequestId: string, response: any}): Promise<nock.Scope> {
    return nock('https://bitgo.fakeurl')
      .persist(true)
      .get(`/api/v2/wallet/${params.walletId}/txrequests?txRequestIds=${params.txRequestId}&latest=true`)
      .reply(200, params.response);
  }

  // #endregion Nock helpers
});
