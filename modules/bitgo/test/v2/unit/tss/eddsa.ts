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
} from '@bitgo/sdk-core';
import * as openpgp from 'openpgp';
import * as should from 'should';
import * as _ from 'lodash';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { nockGetTxRequest, nockSendSignatureShare } from './helpers';
import nock = require('nock');

describe('test tss helper functions', function () {
  let mpc: Eddsa;

  let userKeyShare: KeyShare;
  let backupKeyShare: KeyShare;
  let bitgoKeyShare: KeyShare;

  let userKey;
  let backupKey;
  let bitgoKey;

  let userGpgKeypair: { publicKey: string, privateKey: string };
  let backupGpgKeypair: { publicKey: string, privateKey: string };
  let bitgoGpgKeypair: { publicKey: string, privateKey: string };

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

        const decryptedMessage = await readSignedMessage(encryptedYShare.encryptedPrivateShare, userGpgKeypair.publicKey, bitgoGpgKeypair.privateKey);
        decryptedMessage.should.equal(userKeyShare.yShares[i].u + userKeyShare.yShares[i].chaincode);

        encryptedYShare.i.should.equal(i);
        encryptedYShare.j.should.equal(1);
        encryptedYShare.publicShare.should.equal(userKeyShare.uShare.y + userKeyShare.yShares[3].v + userKeyShare.uShare.chaincode);
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
        encryptedYShares: [{
          yShare: bitgoToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          yShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
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
        encryptedYShares: [{
          yShare: bitgoToBackupShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          yShare: userToBackupShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: userGpgKeypair.publicKey,
        }],
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
        encryptedYShares: [{
          yShare: bitgoToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          yShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
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
        encryptedYShares: [{
          yShare: bitgoToUserShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          yShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
      }).should.be.rejectedWith('Error decrypting message: Session key decryption failed.');
    });
  });

  describe('Eddsa tss signing helper function', async function() {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    let wallet: Wallet;
    const path = 'm/0';
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
      unsignedTxs: [{ signableHex: 'randomhex', serializedTxHex: 'randomhex2' }],
      signatureShares: [
        {
          from: 'bitgo',
          to: 'user',
          share: '9d7159a76700635b10edf1fb983ce1ad1690a9686927e137cb4a70b32ad77b0e7f0394fa3ac3db433aec1097ca88ee43034d3a9fb0c4f87b63ff38fc1d1c8f4f',
        }],
    };
    const signablePayload = Buffer.from(txRequest.unsignedTxs[0].signableHex, 'hex');
    const validUserSignShare = {
      xShare: {
        i: 1,
        y: 'bb055c0cf5230140a97d229bee0a1edbbfde6806cfbda743230d11398b443bbf',
        u: 'aef915654c84753e51c06960c0b7f6bd0c449880d964606c0182b1d42e347003',
        r: 'aa5ec75127d9fa7bdedbb3c6801b61dda1dba912fda0bbc0f7c42e93d39e280a',
        R: '87c111ea06d9654b2b2f2937cbe845424753329899e2bdab3623219534459dca',
      },
      rShares: {
        3: {
          i: 3,
          j: 1,
          u: '097d672cd5010aaec3c4b2b9e35418c4966bfe77a1cb680a629acc22a8f31b07',
          v: 'c6a34e7a11bf1eeb8441d037cdd3e163ab4c60580102cc2fe8472ff435e5d7a9',
          r: '859148eabb36952dfbc6adbff64021e1f96ad5c090f66db6a2d2983fbc643403',
          R: '87c111ea06d9654b2b2f2937cbe845424753329899e2bdab3623219534459dca',
        },
      },
    };
    const validUserToBitgoGShare = {
      i: 1,
      y: 'bb055c0cf5230140a97d229bee0a1edbbfde6806cfbda743230d11398b443bbf',
      gamma: '1f77841296a362214dd0890e14de9c035e1ce3eced733cf742f7726e5384520d',
      R: 'c339f3ff342bac6b95b7b3a93a5ddb93343aff6145cf496950e85fcc4de45496',
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
        const invalidUserSigningMaterial = JSON.parse('{"uShare":{"i":2,"t":2,"n":3,"y":"e2b844934b56f278b4a8a3665d43d14de80732241622ec7a8bd6cffc0f74452a","seed":"5259ee23a364429919f969247323eee2f4af5786457b4af67d423f8944d3a691","chaincode":"7460de17d732969c3bc9bddbac1055aff168fad5668917b8ed3fd9628fc6e4f8"},"bitgoYShare":{"i":2,"j":3,"y":"141fd5cbb901d46b8c2c783f3d4ee968ae91c38f71aba05146b3ba8bd4309596","u":"581cfacb3de956cc434a35a3ac927f7d0a4daaef48a95c162cadb7878ef2270b","chaincode":"67d33063052606f341cae40877709de725abda41f2df7f4765e3f58ce5030e1a"},"backupYShare":{"i":2,"j":1,"y":"9e69e3e92978896e872d71ff7a9e63a963ab0f59583d4fcbe79f82cde9ea6bf9","u":"52a539f79df448a2f5108a5e410377cbd1574b7c3d9864bb310ebf7beb13460d","chaincode":"bda980c34aa06916f25c4c7934ea09a928bff7730a100902f4d53bb9236771a7"}}');
        const signingKey = MPC.keyDerive(
          invalidUserSigningMaterial.uShare,
          [invalidUserSigningMaterial.bitgoYShare, invalidUserSigningMaterial.backupYShare],
          path
        );
        await createUserSignShare(signablePayload, signingKey.pShare).should.be.rejectedWith('Invalid PShare, PShare doesnt belong to the User');
      });
    });

    describe('sendSignatureShare:', async function() {
      it('should succeed to send Signature Share', async function() {
        const signatureShare = { from: 'user', to: 'bitgo', share: '128bytestring' } as SignatureShareRecord;
        await nockSendSignatureShare({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, signatureShare, signerShare: 'signerShare' });
        const response = await sendSignatureShare(bitgo, wallet.id(), txRequest.txRequestId, signatureShare, RequestType.tx, 'signerShare');
        response.should.deepEqual(signatureShare);
      });

      it('should fail to send Signature Share', async function() {
        const invalidSignatureShare = { from: 'bitgo', to: 'user', share: '128bytestring' } as SignatureShareRecord;
        const nock = await nockSendSignatureShare({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, signatureShare: invalidSignatureShare, signerShare: 'signerShare' }, 400);
        await sendSignatureShare(bitgo, wallet.id(), txRequest.txRequestId, invalidSignatureShare, RequestType.tx, 'signerShare').should.be.rejectedWith('some error');
        nock.isDone().should.equal(true);
      });
    });

    describe('offerUserToBitgoRShare:', async function() {
      it('should succeed to send Signature Share', async function() {
        const signatureShare = { from: 'user', to: 'bitgo', share: validUserSignShare.rShares[3].r + validUserSignShare.rShares[3].R + validUserSignShare.rShares[3].v } as SignatureShareRecord;
        const nock = await nockSendSignatureShare({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, signatureShare, signerShare: 'signerShare' });
        await offerUserToBitgoRShare(bitgo, wallet.id(), txRequest.txRequestId, validUserSignShare, 'signerShare').should.be.fulfilled();
        nock.isDone().should.equal(true);
      });

      it('should fail if no rShare is found', async function() {
        const invalidUserSignShare = _.cloneDeep(validUserSignShare) as any ;
        delete invalidUserSignShare.rShares[3];
        await offerUserToBitgoRShare(bitgo, wallet.id(), txRequest.txRequestId, invalidUserSignShare, 'signerShare').should.be.rejectedWith('userToBitgo RShare not found');
      });

      it('should fail if the rShare found is invalid', async function() {
        const invalidUserSignShare = _.cloneDeep(validUserSignShare) as any ;
        invalidUserSignShare.rShares[3].i = 1;
        await offerUserToBitgoRShare(bitgo, wallet.id(), txRequest.txRequestId, invalidUserSignShare, 'signerShare' ).should.be.rejectedWith('Invalid RShare, is not from User to Bitgo');

        const invalidUserSignShare2 = _.cloneDeep(validUserSignShare) as any ;
        invalidUserSignShare2.rShares[3].j = 3;
        await offerUserToBitgoRShare(bitgo, wallet.id(), txRequest.txRequestId, invalidUserSignShare2, 'signerShare' ).should.be.rejectedWith('Invalid RShare, is not from User to Bitgo');
      });
    });

    describe('getBitgoToUserRShare:', async function() {
      it('should succeed to get the Bitgo to User RShare', async function() {
        const response = { txRequests: [txRequest] };
        const nock = await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
        const bitgoToUserRShare = await getBitgoToUserRShare(bitgo, wallet.id(), txRequest.txRequestId);
        bitgoToUserRShare.should.deepEqual(txRequest.signatureShares[0]);
        nock.isDone().should.equal(true);
      });

      it('should fail if there is no bitgo to user RShare', async function() {
        const invalidTxRequest = _.cloneDeep(txRequest);
        invalidTxRequest.signatureShares[0].to = 'bitgo';
        invalidTxRequest.signatureShares[0].from = 'user';
        const response = { txRequests: [invalidTxRequest] };
        const nock = await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
        await getBitgoToUserRShare(bitgo, wallet.id(), txRequest.txRequestId).should.be.rejectedWith('Bitgo to User RShare not found for id: ' + txRequest.txRequestId);
        nock.isDone().should.equal(true);
      });

      it('should fail if there is no signaturesShares', async function() {
        const invalidTxRequest = _.cloneDeep(txRequest);
        invalidTxRequest.signatureShares = [];
        const response = { txRequests: [invalidTxRequest] };
        const nock = await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response });
        await getBitgoToUserRShare(bitgo, wallet.id(), txRequest.txRequestId).should.be.rejectedWith('No signatures shares found for id: ' + txRequest.txRequestId);
        nock.isDone().should.equal(true);
      });
    });

    describe('sendUserToBitgoGShare:', async function() {
      it('should succeed to send User to Bitgo GShare', async function() {
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
        await sendUserToBitgoGShare(bitgo, wallet.id(), txRequest.txRequestId, validUserToBitgoGShare).should.be.fulfilled();
        nock.isDone().should.equal(true);
      });

      it('should fail when the GShare is not from the User', async function() {
        const invalidUserToBitgoGShare = _.cloneDeep(validUserToBitgoGShare);
        invalidUserToBitgoGShare.i = 3;
        await sendUserToBitgoGShare(bitgo, wallet.id(), txRequest.txRequestId, invalidUserToBitgoGShare).should.be.rejectedWith('Invalid GShare, doesnt belong to the User');
      });
    });

    describe('getTxRequest:', async function() {
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
        await getTxRequest(bitgo, wallet.id(), txRequest.txRequestId).should.be.rejectedWith('Unable to find TxRequest with id randomId');
        nock.isDone().should.equal(true);
      });
    });

    describe('createUserToBitGoGShare:', async function() {
      it('should succeed to create a UserToBitGo GShare', async function() {
        const userToBitgoGShare = await createUserToBitGoGShare(
          validUserSignShare,
          txRequest.signatureShares[0] as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload
        );
        userToBitgoGShare.should.deepEqual(validUserToBitgoGShare);
      });

      it('should fail when XShare doesnt belong to the user', async function() {
        const invalidUserSignShare = _.cloneDeep(validUserSignShare) ;
        invalidUserSignShare.xShare.i = 3;
        await createUserToBitGoGShare(
          invalidUserSignShare,
          txRequest.signatureShares[0] as SignatureShareRecord,
          validUserSigningMaterial.backupYShare,
          validUserSigningMaterial.bitgoYShare,
          signablePayload
        ).should.be.rejectedWith('Invalid XShare, doesnt belong to the User');
      });

      it('should fail when RShare doesnt belong to Bitgo', async function() {
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

  });
});
