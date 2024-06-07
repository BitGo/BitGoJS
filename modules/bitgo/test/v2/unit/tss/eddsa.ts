import {
  encryptYShare,
  createCombinedKey,
  createUserSignShare,
  sendSignatureShare,
  getBitgoToUserRShare,
  getTxRequest,
  offerUserToBitgoRShare,
  createUserToBitGoGShare,
  sendUserToBitgoGShare,
  readSignedMessage,
  RequestType,
  SignatureShareRecord,
  Wallet,
  KeyShare,
  Ed25519BIP32,
  Eddsa,
  SignShare,
  CommitmentShareRecord,
  CommitmentType,
  SignatureShareType,
  RequestTracer,
} from '@bitgo/sdk-core';
import * as openpgp from 'openpgp';
import * as should from 'should';
import * as _ from 'lodash';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { nockGetTxRequest, nockSendSignatureShare } from './helpers';
import * as sinon from 'sinon';
import nock = require('nock');

describe('test tss helper functions', function () {
  let mpc: Eddsa;

  let userKeyShare: KeyShare;
  let backupKeyShare: KeyShare;
  let bitgoKeyShare: KeyShare;

  let userKey;
  let backupKey;
  let bitgoKey;

  let userGpgKeypair: { publicKey: string; privateKey: string };
  let backupGpgKeypair: { publicKey: string; privateKey: string };
  let bitgoGpgKeypair: { publicKey: string; privateKey: string };

  let commonKeychain: string;

  before(async function () {
    const hdTree = await Ed25519BIP32.initialize();
    mpc = await Eddsa.initialize(hdTree);

    userKeyShare = mpc.keyShare(1, 2, 3);
    backupKeyShare = mpc.keyShare(2, 2, 3);
    bitgoKeyShare = mpc.keyShare(3, 2, 3);

    userKey = mpc.keyCombine(userKeyShare.uShare, [backupKeyShare.yShares[1], bitgoKeyShare.yShares[1]]);
    backupKey = mpc.keyCombine(backupKeyShare.uShare, [userKeyShare.yShares[2], bitgoKeyShare.yShares[2]]);
    bitgoKey = mpc.keyCombine(bitgoKeyShare.uShare, [backupKeyShare.yShares[3], userKeyShare.yShares[3]]);

    (userKey.pShare.y + userKey.pShare.chaincode).should.equal(backupKey.pShare.y + backupKey.pShare.chaincode);
    (userKey.pShare.y + userKey.pShare.chaincode).should.equal(bitgoKey.pShare.y + bitgoKey.pShare.chaincode);
    commonKeychain = userKey.pShare.y + userKey.pShare.chaincode;

    userGpgKeypair = await openpgp.generateKey({
      userIDs: [
        {
          name: 'user',
          email: 'user@bitgo.com',
        },
      ],
    });
    backupGpgKeypair = await openpgp.generateKey({
      userIDs: [
        {
          name: 'backup',
          email: 'backup@bitgo.com',
        },
      ],
    });
    bitgoGpgKeypair = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@bitgo.com',
        },
      ],
    });
  });

  after(function () {
    nock.cleanAll();
  });

  describe('encryptYShare', function () {
    it('should encrypt y share', async function () {
      for (let i = 2; i <= 3; i++) {
        const encryptedYShare = await encryptYShare({
          keyShare: userKeyShare,
          recipientIndex: i,
          senderGpgPrivateArmor: userGpgKeypair.privateKey,
          recipientGpgPublicArmor: bitgoGpgKeypair.publicKey,
        });

        const decryptedMessage = await readSignedMessage(
          encryptedYShare.encryptedPrivateShare,
          userGpgKeypair.publicKey,
          bitgoGpgKeypair.privateKey
        );
        decryptedMessage.should.equal(userKeyShare.yShares[i].u + userKeyShare.yShares[i].chaincode);

        encryptedYShare.i.should.equal(i);
        encryptedYShare.j.should.equal(1);
        encryptedYShare.publicShare.should.equal(
          userKeyShare.uShare.y + userKeyShare.yShares[3].v + userKeyShare.uShare.chaincode
        );
      }
    });

    it('should error for invalid recipient index', async function () {
      await encryptYShare({
        keyShare: userKeyShare,
        recipientIndex: 1,
        senderGpgPrivateArmor: userGpgKeypair.privateKey,
        recipientGpgPublicArmor: bitgoGpgKeypair.publicKey,
      }).should.be.rejectedWith('Invalid recipient');
      await encryptYShare({
        keyShare: backupKeyShare,
        recipientIndex: 2,
        senderGpgPrivateArmor: userGpgKeypair.privateKey,
        recipientGpgPublicArmor: bitgoGpgKeypair.publicKey,
      }).should.be.rejectedWith('Invalid recipient');
      await encryptYShare({
        keyShare: bitgoKeyShare,
        recipientIndex: 3,
        senderGpgPrivateArmor: userGpgKeypair.privateKey,
        recipientGpgPublicArmor: bitgoGpgKeypair.publicKey,
      }).should.be.rejectedWith('Invalid recipient');
    });
  });

  describe('createCombinedKey', function () {
    it('should create combined user key', async function () {
      const bitgoToUserShare = await encryptYShare({
        keyShare: bitgoKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: bitgoGpgKeypair.privateKey,
      });
      const backupToUserShare = await encryptYShare({
        keyShare: backupKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: backupGpgKeypair.privateKey,
      });

      const combinedUserKey = await createCombinedKey({
        keyShare: userKeyShare,
        commonKeychain,
        encryptedYShares: [
          {
            yShare: bitgoToUserShare,
            recipientPrivateArmor: userGpgKeypair.privateKey,
            senderPublicArmor: bitgoGpgKeypair.publicKey,
          },
          {
            yShare: backupToUserShare,
            recipientPrivateArmor: userGpgKeypair.privateKey,
            senderPublicArmor: backupGpgKeypair.publicKey,
          },
        ],
      });

      combinedUserKey.commonKeychain.should.equal(commonKeychain);
      combinedUserKey.signingMaterial.uShare.should.deepEqual(userKeyShare.uShare);
      combinedUserKey.signingMaterial.backupYShare!.should.deepEqual(backupKeyShare.yShares[1]);
      combinedUserKey.signingMaterial.bitgoYShare.should.deepEqual(bitgoKeyShare.yShares[1]);
      should.not.exist(combinedUserKey.signingMaterial.userYShare);
    });

    it('should create combined backup key', async function () {
      const bitgoToBackupShare = await encryptYShare({
        keyShare: bitgoKeyShare,
        recipientIndex: 2,
        recipientGpgPublicArmor: backupGpgKeypair.publicKey,
        senderGpgPrivateArmor: bitgoGpgKeypair.privateKey,
      });
      const userToBackupShare = await encryptYShare({
        keyShare: userKeyShare,
        recipientIndex: 2,
        recipientGpgPublicArmor: backupGpgKeypair.publicKey,
        senderGpgPrivateArmor: userGpgKeypair.privateKey,
      });

      const combinedBackupKey = await createCombinedKey({
        keyShare: backupKeyShare,
        commonKeychain,
        encryptedYShares: [
          {
            yShare: bitgoToBackupShare,
            recipientPrivateArmor: backupGpgKeypair.privateKey,
            senderPublicArmor: bitgoGpgKeypair.publicKey,
          },
          {
            yShare: userToBackupShare,
            recipientPrivateArmor: backupGpgKeypair.privateKey,
            senderPublicArmor: userGpgKeypair.publicKey,
          },
        ],
      });

      combinedBackupKey.commonKeychain.should.equal(commonKeychain);
      combinedBackupKey.signingMaterial.uShare.should.deepEqual(backupKeyShare.uShare);
      combinedBackupKey.signingMaterial.userYShare!.should.deepEqual(userKeyShare.yShares[2]);
      combinedBackupKey.signingMaterial.bitgoYShare.should.deepEqual(bitgoKeyShare.yShares[2]);
      should.not.exist(combinedBackupKey.signingMaterial.backupYShare);
    });

    it('should fail if common keychains do not match', async function () {
      const bitgoToUserShare = await encryptYShare({
        keyShare: bitgoKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: bitgoGpgKeypair.privateKey,
      });
      const backupToUserShare = await encryptYShare({
        keyShare: backupKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: backupGpgKeypair.privateKey,
      });

      await createCombinedKey({
        keyShare: userKeyShare,
        commonKeychain: 'nottherightkeychain',
        encryptedYShares: [
          {
            yShare: bitgoToUserShare,
            recipientPrivateArmor: userGpgKeypair.privateKey,
            senderPublicArmor: bitgoGpgKeypair.publicKey,
          },
          {
            yShare: backupToUserShare,
            recipientPrivateArmor: userGpgKeypair.privateKey,
            senderPublicArmor: backupGpgKeypair.publicKey,
          },
        ],
      }).should.be.rejectedWith('Common keychains do not match');
    });

    it('should fail if gpg keys are mismatched', async function () {
      const bitgoToUserShare = await encryptYShare({
        keyShare: bitgoKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: bitgoGpgKeypair.privateKey,
      });
      const backupToUserShare = await encryptYShare({
        keyShare: backupKeyShare,
        recipientIndex: 1,
        recipientGpgPublicArmor: userGpgKeypair.publicKey,
        senderGpgPrivateArmor: backupGpgKeypair.privateKey,
      });

      await createCombinedKey({
        keyShare: userKeyShare,
        commonKeychain: 'nottherightkeychain',
        encryptedYShares: [
          {
            yShare: bitgoToUserShare,
            recipientPrivateArmor: backupGpgKeypair.privateKey,
            senderPublicArmor: bitgoGpgKeypair.publicKey,
          },
          {
            yShare: backupToUserShare,
            recipientPrivateArmor: userGpgKeypair.privateKey,
            senderPublicArmor: backupGpgKeypair.publicKey,
          },
        ],
      }).should.be.rejectedWith('Error decrypting message: Session key decryption failed.');
    });
  });

  describe('Eddsa tss signing helper function', async function () {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    let wallet: Wallet;
    const path = 'm/0';
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
    const validUserSignShare: SignShare = {
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

    const validUserToBitgoGShare = {
      i: 1,
      y: '4d9343988e68191aac945a6963031dddde3490f9020d0571a6e6c6e15cca0296',
      gamma: 'ce87a00d17e52b91bc5bb6e275983b84fc1998b2b37f7166c671a019c33d3905',
      R: 'aa6e5bad24ad4131b8793dcb95c72e03c5426456ab0b52fc99d61d7103c2f01b',
    };
    const validBitgoToUserSignShare: SignShare = {
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
    const signablePayload = Buffer.from(txRequest.unsignedTxs[0].signableHex);
    const bitgoToUserCommitment: CommitmentShareRecord = {
      from: SignatureShareType.BITGO,
      to: SignatureShareType.USER,
      share: validBitgoToUserSignShare.rShares[1].commitment!,
      type: CommitmentType.COMMITMENT,
    };

    let MPC: Eddsa;

    before('initializes', async function () {
      const hdTree = await Ed25519BIP32.initialize();
      MPC = await Eddsa.initialize(hdTree);

      const baseCoin = bitgo.coin('tsol');
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
    });

    describe('createUserSignShare:', async function () {
      it('should succeed to create User SignShare', async function () {
        const signingKey = MPC.keyDerive(
          validUserSigningMaterial.uShare,
          [validUserSigningMaterial.bitgoYShare, validUserSigningMaterial.backupYShare],
          path
        );
        const userSignShare = await createUserSignShare(signablePayload, signingKey.pShare);
        userSignShare.should.have.properties(['xShare', 'rShares']);
        const { xShare, rShares } = userSignShare;
        xShare.should.have.property('i').and.be.a.Number();
        xShare.should.have.property('y').and.be.a.String();
        xShare.should.have.property('u').and.be.a.String();
        xShare.should.have.property('r').and.be.a.String();
        xShare.should.have.property('R').and.be.a.String();
        rShares.should.have.property('3').and.be.an.Object();
        rShares[3].should.have.property('i').and.be.a.Number();
        rShares[3].should.have.property('j').and.be.a.Number();
        rShares[3].should.have.property('r').and.be.a.String();
        rShares[3].should.have.property('R').and.be.a.String();
      });

      it('should fail if the Pshare doesnt belong to the User', async function () {
        const invalidUserSigningMaterial = JSON.parse(
          '{"uShare":{"i":2,"t":2,"n":3,"y":"e2b844934b56f278b4a8a3665d43d14de80732241622ec7a8bd6cffc0f74452a","seed":"5259ee23a364429919f969247323eee2f4af5786457b4af67d423f8944d3a691","chaincode":"7460de17d732969c3bc9bddbac1055aff168fad5668917b8ed3fd9628fc6e4f8"},"bitgoYShare":{"i":2,"j":3,"y":"141fd5cbb901d46b8c2c783f3d4ee968ae91c38f71aba05146b3ba8bd4309596","u":"581cfacb3de956cc434a35a3ac927f7d0a4daaef48a95c162cadb7878ef2270b","chaincode":"67d33063052606f341cae40877709de725abda41f2df7f4765e3f58ce5030e1a"},"backupYShare":{"i":2,"j":1,"y":"9e69e3e92978896e872d71ff7a9e63a963ab0f59583d4fcbe79f82cde9ea6bf9","u":"52a539f79df448a2f5108a5e410377cbd1574b7c3d9864bb310ebf7beb13460d","chaincode":"bda980c34aa06916f25c4c7934ea09a928bff7730a100902f4d53bb9236771a7"}}'
        );
        const signingKey = MPC.keyDerive(
          invalidUserSigningMaterial.uShare,
          [invalidUserSigningMaterial.bitgoYShare, invalidUserSigningMaterial.backupYShare],
          path
        );
        await createUserSignShare(signablePayload, signingKey.pShare).should.be.rejectedWith(
          'Invalid PShare, PShare doesnt belong to the User'
        );
      });
    });

    describe('sendSignatureShare:', async function () {
      it('should succeed to send Signature Share', async function () {
        const signatureShare = { from: 'user', to: 'bitgo', share: '128bytestring' } as SignatureShareRecord;
        await nockSendSignatureShare({
          walletId: wallet.id(),
          txRequestId: txRequest.txRequestId,
          signatureShare,
          signerShare: 'signerShare',
        });
        const response = await sendSignatureShare(
          bitgo,
          wallet.id(),
          txRequest.txRequestId,
          signatureShare,
          RequestType.tx,
          'signerShare'
        );
        response.should.deepEqual(signatureShare);
      });

      it('should fail to send Signature Share', async function () {
        const invalidSignatureShare = { from: 'bitgo', to: 'user', share: '128bytestring' } as SignatureShareRecord;
        const nock = await nockSendSignatureShare(
          {
            walletId: wallet.id(),
            txRequestId: txRequest.txRequestId,
            signatureShare: invalidSignatureShare,
            signerShare: 'signerShare',
          },
          400
        );
        await sendSignatureShare(
          bitgo,
          wallet.id(),
          txRequest.txRequestId,
          invalidSignatureShare,
          RequestType.tx,
          'signerShare'
        ).should.be.rejectedWith('some error');
        nock.isDone().should.equal(true);
      });
    });

    describe('offerUserToBitgoRShare:', async function () {
      it('should succeed to send Signature Share', async function () {
        const signatureShare = {
          from: 'user',
          to: 'bitgo',
          share: validUserSignShare.rShares[3].r + validUserSignShare.rShares[3].R,
        } as SignatureShareRecord;
        const nock = await nockSendSignatureShare({
          walletId: wallet.id(),
          txRequestId: txRequest.txRequestId,
          signatureShare,
          signerShare: 'signerShare',
        });
        await offerUserToBitgoRShare(
          bitgo,
          wallet.id(),
          txRequest.txRequestId,
          validUserSignShare,
          'signerShare'
        ).should.be.fulfilled();
        nock.isDone().should.equal(true);
      });

      it('should fail if no rShare is found', async function () {
        const invalidUserSignShare = _.cloneDeep(validUserSignShare) as any;
        delete invalidUserSignShare.rShares[3];
        await offerUserToBitgoRShare(
          bitgo,
          wallet.id(),
          txRequest.txRequestId,
          invalidUserSignShare,
          'signerShare'
        ).should.be.rejectedWith('userToBitgo RShare not found');
      });

      it('should fail if the rShare found is invalid', async function () {
        const invalidUserSignShare = _.cloneDeep(validUserSignShare) as any;
        invalidUserSignShare.rShares[3].i = 1;
        await offerUserToBitgoRShare(
          bitgo,
          wallet.id(),
          txRequest.txRequestId,
          invalidUserSignShare,
          'signerShare'
        ).should.be.rejectedWith('Invalid RShare, is not from User to Bitgo');

        const invalidUserSignShare2 = _.cloneDeep(validUserSignShare) as any;
        invalidUserSignShare2.rShares[3].j = 3;
        await offerUserToBitgoRShare(
          bitgo,
          wallet.id(),
          txRequest.txRequestId,
          invalidUserSignShare2,
          'signerShare'
        ).should.be.rejectedWith('Invalid RShare, is not from User to Bitgo');
      });

      it('should call setRequestTracer', async function () {
        const signatureShare = {
          from: 'user',
          to: 'bitgo',
          share: validUserSignShare.rShares[3].r + validUserSignShare.rShares[3].R,
        } as SignatureShareRecord;
        const nock = await nockSendSignatureShare({
          walletId: wallet.id(),
          txRequestId: txRequest.txRequestId,
          signatureShare,
          signerShare: 'signerShare',
        });
        const reqId = new RequestTracer();
        const setRequestTracerSpy = sinon.spy(bitgo, 'setRequestTracer');
        setRequestTracerSpy.withArgs(reqId);
        await offerUserToBitgoRShare(
          bitgo,
          wallet.id(),
          txRequest.txRequestId,
          validUserSignShare,
          'signerShare',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          reqId
        ).should.be.fulfilled();
        nock.isDone().should.equal(true);
        sinon.assert.calledOnce(setRequestTracerSpy);
        setRequestTracerSpy.restore();
      });
    });

    describe('getBitgoToUserRShare:', async function () {
      it('should succeed to get the Bitgo to User RShare', async function () {
        const response = { txRequests: [txRequest] };
        const nock = await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
        const bitgoToUserRShare = await getBitgoToUserRShare(bitgo, wallet.id(), txRequest.txRequestId);
        bitgoToUserRShare.should.deepEqual(txRequest.signatureShares[0]);
        nock.isDone().should.equal(true);
      });

      it('should fail if there is no bitgo to user RShare', async function () {
        const invalidTxRequest = _.cloneDeep(txRequest);
        invalidTxRequest.signatureShares[0].to = 'bitgo';
        invalidTxRequest.signatureShares[0].from = 'user';
        const response = { txRequests: [invalidTxRequest] };
        const nock = await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
        await getBitgoToUserRShare(bitgo, wallet.id(), txRequest.txRequestId).should.be.rejectedWith(
          'Bitgo to User RShare not found for id: ' + txRequest.txRequestId
        );
        nock.isDone().should.equal(true);
      });

      it('should fail if there is no signaturesShares', async function () {
        const invalidTxRequest = _.cloneDeep(txRequest);
        invalidTxRequest.signatureShares = [];
        const response = { txRequests: [invalidTxRequest] };
        const nock = await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
        await getBitgoToUserRShare(bitgo, wallet.id(), txRequest.txRequestId).should.be.rejectedWith(
          'No signatures shares found for id: ' + txRequest.txRequestId
        );
        nock.isDone().should.equal(true);
      });

      it('should call setRequestTracer', async function () {
        const response = { txRequests: [txRequest] };
        const nock = await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
        const reqId = new RequestTracer();
        const setRequestTracerSpy = sinon.spy(bitgo, 'setRequestTracer');
        setRequestTracerSpy.withArgs(reqId);
        const bitgoToUserRShare = await getBitgoToUserRShare(bitgo, wallet.id(), txRequest.txRequestId, reqId);
        bitgoToUserRShare.should.deepEqual(txRequest.signatureShares[0]);
        nock.isDone().should.equal(true);
        sinon.assert.calledOnce(setRequestTracerSpy);
        setRequestTracerSpy.restore();
      });
    });

    describe('sendUserToBitgoGShare:', async function () {
      it('should succeed to send User to Bitgo GShare', async function () {
        const signatureShare = {
          from: 'user',
          to: 'bitgo',
          share: validUserToBitgoGShare.R + validUserToBitgoGShare.gamma,
        } as SignatureShareRecord;
        const nock = await nockSendSignatureShare({
          walletId: wallet.id(),
          txRequestId: txRequest.txRequestId,
          signatureShare,
        });
        await sendUserToBitgoGShare(
          bitgo,
          wallet.id(),
          txRequest.txRequestId,
          validUserToBitgoGShare
        ).should.be.fulfilled();
        nock.isDone().should.equal(true);
      });

      it('should fail when the GShare is not from the User', async function () {
        const invalidUserToBitgoGShare = _.cloneDeep(validUserToBitgoGShare);
        invalidUserToBitgoGShare.i = 3;
        await sendUserToBitgoGShare(
          bitgo,
          wallet.id(),
          txRequest.txRequestId,
          invalidUserToBitgoGShare
        ).should.be.rejectedWith('Invalid GShare, doesnt belong to the User');
      });

      it('should call setRequestTracer', async function () {
        const signatureShare = {
          from: 'user',
          to: 'bitgo',
          share: validUserToBitgoGShare.R + validUserToBitgoGShare.gamma,
        } as SignatureShareRecord;
        const nock = await nockSendSignatureShare({
          walletId: wallet.id(),
          txRequestId: txRequest.txRequestId,
          signatureShare,
        });
        const reqId = new RequestTracer();
        const setRequestTracerSpy = sinon.spy(bitgo, 'setRequestTracer');
        setRequestTracerSpy.withArgs(reqId);
        await sendUserToBitgoGShare(
          bitgo,
          wallet.id(),
          txRequest.txRequestId,
          validUserToBitgoGShare,
          undefined,
          reqId
        ).should.be.fulfilled();
        nock.isDone().should.equal(true);
        sinon.assert.calledOnce(setRequestTracerSpy);
        setRequestTracerSpy.restore();
      });
    });

    describe('getTxRequest:', async function () {
      it('should succeed to get txRequest by id', async function () {
        const response = { txRequests: [txRequest] };
        const nock = await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
        const txReq = await getTxRequest(bitgo, wallet.id(), txRequest.txRequestId);
        txReq.should.deepEqual(txRequest);
        nock.isDone().should.equal(true);
      });

      it('should fail if there are no txRequests', async function () {
        const response = { txRequests: [] };
        const nock = await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
        await getTxRequest(bitgo, wallet.id(), txRequest.txRequestId).should.be.rejectedWith(
          'Unable to find TxRequest with id randomId'
        );
        nock.isDone().should.equal(true);
      });

      it('should call setRequestTracer', async function () {
        const response = { txRequests: [txRequest] };
        const nock = await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
        const reqId = new RequestTracer();
        const setRequestTracerSpy = sinon.spy(bitgo, 'setRequestTracer');
        setRequestTracerSpy.withArgs(reqId);
        const txReq = await getTxRequest(bitgo, wallet.id(), txRequest.txRequestId, reqId);
        txReq.should.deepEqual(txRequest);
        nock.isDone().should.equal(true);
        sinon.assert.calledOnce(setRequestTracerSpy);
        setRequestTracerSpy.restore();
      });
    });

    describe('createUserToBitGoGShare:', async function () {
      it('should succeed to create a UserToBitGo GShare', async function () {
        const userToBitgoGShare = await createUserToBitGoGShare(
          validUserSignShare,
          txRequest.signatureShares[0] as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload
        );
        userToBitgoGShare.should.deepEqual(validUserToBitgoGShare);
      });

      it('should fail when XShare doesnt belong to the user', async function () {
        const invalidUserSignShare = _.cloneDeep(validUserSignShare);
        invalidUserSignShare.xShare.i = 3;
        await createUserToBitGoGShare(
          invalidUserSignShare,
          txRequest.signatureShares[0] as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload
        ).should.be.rejectedWith('Invalid XShare, doesnt belong to the User');
      });

      it('should fail when RShare doesnt belong to Bitgo', async function () {
        const invalidBitgoRShare = _.cloneDeep(txRequest.signatureShares[0]);
        invalidBitgoRShare.from = 'user';
        await createUserToBitGoGShare(
          validUserSignShare,
          invalidBitgoRShare as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload
        ).should.be.rejectedWith('Invalid RShare, is not from Bitgo to User');

        const invalidBitgoRShare2 = _.cloneDeep(txRequest.signatureShares[0]);
        invalidBitgoRShare2.to = 'bitgo';
        await createUserToBitGoGShare(
          validUserSignShare,
          invalidBitgoRShare2 as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload
        ).should.be.rejectedWith('Invalid RShare, is not from Bitgo to User');
      });
    });

    describe('createUserToBitGoGShare with commitment:', async function () {
      it('should succeed to create a UserToBitGo GShare', async function () {
        const userToBitgoGShare = await createUserToBitGoGShare(
          validUserSignShare,
          txRequest.signatureShares[0] as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload,
          bitgoToUserCommitment
        );
        userToBitgoGShare.should.deepEqual(validUserToBitgoGShare);
      });

      it('should fail when XShare doesnt belong to the user', async function () {
        const invalidUserSignShare = _.cloneDeep(validUserSignShare);
        invalidUserSignShare.xShare.i = 3;
        await createUserToBitGoGShare(
          invalidUserSignShare,
          txRequest.signatureShares[0] as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload,
          bitgoToUserCommitment
        ).should.be.rejectedWith('Invalid XShare, doesnt belong to the User');
      });

      it('should fail when commitment is invalid', async function () {
        const invalidBitgoToUserCommitment = _.cloneDeep(bitgoToUserCommitment);
        invalidBitgoToUserCommitment.share = 'deadbeef';
        await createUserToBitGoGShare(
          validUserSignShare,
          txRequest.signatureShares[0] as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload,
          invalidBitgoToUserCommitment
        ).should.be.rejectedWith('Could not verify other player share');
      });

      it('should fail when RShare doesnt belong to Bitgo', async function () {
        const invalidBitgoRShare = _.cloneDeep(txRequest.signatureShares[0]);
        invalidBitgoRShare.from = 'user';
        await createUserToBitGoGShare(
          validUserSignShare,
          invalidBitgoRShare as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload,
          bitgoToUserCommitment
        ).should.be.rejectedWith('Invalid RShare, is not from Bitgo to User');

        const invalidBitgoRShare2 = _.cloneDeep(txRequest.signatureShares[0]);
        invalidBitgoRShare2.to = 'bitgo';
        await createUserToBitGoGShare(
          validUserSignShare,
          invalidBitgoRShare2 as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload,
          bitgoToUserCommitment
        ).should.be.rejectedWith('Invalid RShare, is not from Bitgo to User');
      });
    });
  });
});
