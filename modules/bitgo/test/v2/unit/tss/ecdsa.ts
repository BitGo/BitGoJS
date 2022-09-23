import {
  readSignedMessage,
  Ecdsa,
  ECDSA,
  ECDSAMethodTypes,
  Wallet,
  SignatureShareRecord,
  getTxRequest,
  ECDSAMethods,
  RequestType,
  SignatureShareType,
} from '@bitgo/sdk-core';
import * as openpgp from 'openpgp';
import * as should from 'should';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src/bitgo';
import { nockGetTxRequest, nockSendSignatureShare } from './helpers';
import { gammaAndMuShareCreationParams, omicronAndDeltaShareCreationParams, keyShares, createUserSignatureParams, mockSignRT, mockAShare, mockMuShare, mockDShare, mockSShareFromUser, mockDShareToBitgo, mockedBitgoBShare, mockedBitgoOAndDShare, mockSShare } from '../../fixtures/tss/ecdsaFixtures';
import nock = require('nock');

type KeyShare = ECDSA.KeyShare;
const encryptNShare = ECDSAMethods.encryptNShare;
const createCombinedKey = ECDSAMethods.createCombinedKey;
type GpgKeypair = {
  publicKey: string,
  privateKey: string
};

describe('Ecdsa tss helper functions tests', function () {
  let mpc: Ecdsa;

  let userKeyShare: KeyShare;
  let backupKeyShare: KeyShare;
  let bitgoKeyShare: KeyShare;

  let userKey: ECDSA.KeyCombined;
  let backupKey: ECDSA.KeyCombined;
  let bitgoKey: ECDSA.KeyCombined;

  let userGpgKeypair: GpgKeypair;
  let backupGpgKeypair: GpgKeypair;
  let bitgoGpgKeypair: GpgKeypair;
  let commonKeychain: string;

  before(async function () {
    mpc = new Ecdsa();
    userKeyShare = keyShares.userKeyShare;
    backupKeyShare = keyShares.backupKeyShare;
    bitgoKeyShare = keyShares.bitgoKeyShare;

    userKey = mpc.keyCombine(userKeyShare.pShare, [backupKeyShare.nShares[1], bitgoKeyShare.nShares[1]]);
    backupKey = mpc.keyCombine(backupKeyShare.pShare, [userKeyShare.nShares[2], bitgoKeyShare.nShares[2]]);
    bitgoKey = mpc.keyCombine(bitgoKeyShare.pShare, [backupKeyShare.nShares[3], userKeyShare.nShares[3]]);

    (userKey.xShare.y + userKey.xShare.chaincode).should.equal(backupKey.xShare.y + backupKey.xShare.chaincode);
    (userKey.xShare.y + userKey.xShare.chaincode).should.equal(bitgoKey.xShare.y + bitgoKey.xShare.chaincode);
    commonKeychain = userKey.xShare.y + userKey.xShare.chaincode;
    const gpgKeypairPromises = [
      { name: 'user', email: 'user@bitgo.com' },
      { name: 'backup', email: 'backup@bitgo.com' },
      { name: 'bitgo', email: 'bitgo@bitgo.com' },
    ].map(async user => {
      return openpgp.generateKey({
        userIDs: [
          {
            name: user.name,
            email: user.email,
          },
        ],
      });
    });

    const gpgKeypairs = await Promise.all(gpgKeypairPromises);
    userGpgKeypair = gpgKeypairs[0];
    backupGpgKeypair = gpgKeypairs[1];
    bitgoGpgKeypair = gpgKeypairs[2];
  });

  after(function () {
    nock.cleanAll();
  });

  describe('encryptNShare and decryptNShare', function () {
    after(function () {
      nock.cleanAll();
    });

    it('should encrypt n shares foreach user', async function () {
      for (let i = 2; i <= 3; i++) {
        const encryptedNShare = await ECDSAMethods.encryptNShare(userKeyShare, i, bitgoGpgKeypair.publicKey, userGpgKeypair.privateKey);
        const decryptedMessage = await readSignedMessage(encryptedNShare.encryptedPrivateShare, userGpgKeypair.publicKey, bitgoGpgKeypair.privateKey);
        decryptedMessage.should.equal(userKeyShare.nShares[i].u);
        const publicKey = userKeyShare.pShare.y + userKeyShare.pShare.chaincode + userKeyShare.pShare.n;
        encryptedNShare.i.should.equal(i);
        encryptedNShare.j.should.equal(1);
        encryptedNShare.publicShare.should.equal(publicKey);
      }
    });

    it('should error for invalid recipient', async function () {
      await encryptNShare(userKeyShare, 1, userGpgKeypair.privateKey, bitgoGpgKeypair.publicKey).should.be.rejectedWith('Invalid recipient');
      await encryptNShare(backupKeyShare, 2, userGpgKeypair.privateKey, bitgoGpgKeypair.publicKey).should.be.rejectedWith('Invalid recipient');
      await encryptNShare(bitgoKeyShare, 3, userGpgKeypair.privateKey, bitgoGpgKeypair.publicKey).should.be.rejectedWith('Invalid recipient');
    });

    it('should decrypt n share', async function() {
      const encryptedNShare = await ECDSAMethods.encryptNShare(userKeyShare, 3, bitgoGpgKeypair.publicKey, userGpgKeypair.privateKey);
      const decryptedNShare = await ECDSAMethods.decryptNShare({ nShare: encryptedNShare, recipientPrivateArmor: bitgoGpgKeypair.privateKey, senderPublicArmor: userGpgKeypair.publicKey });
      decryptedNShare.i.should.equal(userKeyShare.nShares[3].i);
      decryptedNShare.j.should.equal(userKeyShare.nShares[3].j);
      decryptedNShare.n.should.equal(userKeyShare.nShares[3].n);
      decryptedNShare.u.should.equal(userKeyShare.nShares[3].u);
      decryptedNShare.y.should.equal(userKeyShare.nShares[3].y);
    });
  });

  describe('createCombinedKey', function () {
    after(function () {
      nock.cleanAll();
    });

    it('should create combined user key', async function () {
      const bitgoToUserShare = await encryptNShare(bitgoKeyShare, 1, userGpgKeypair.publicKey, bitgoGpgKeypair.privateKey,);
      const backupToUserShare = await encryptNShare(backupKeyShare, 1,
        userGpgKeypair.publicKey,
        backupGpgKeypair.privateKey,
      );
      const combinedUserKey = await createCombinedKey(
        userKeyShare,
        [{
          nShare: bitgoToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          nShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
        commonKeychain,
      );

      combinedUserKey.commonKeychain.should.equal(commonKeychain);
      combinedUserKey.signingMaterial.pShare.should.deepEqual(userKeyShare.pShare);
      should.exist(combinedUserKey.signingMaterial.backupNShare);
      combinedUserKey.signingMaterial.backupNShare?.should.deepEqual(backupKeyShare.nShares[1]);
      combinedUserKey.signingMaterial.bitgoNShare.should.deepEqual(bitgoKeyShare.nShares[1]);
      should.not.exist(combinedUserKey.signingMaterial.userNShare);
    });

    it('should create combined backup key', async function () {
      const bitgoToBackupShare = await encryptNShare(
        bitgoKeyShare,
        2,
        backupGpgKeypair.publicKey,
        bitgoGpgKeypair.privateKey,
      );

      const userToBackupShare = await encryptNShare(
        userKeyShare,
        2,
        backupGpgKeypair.publicKey,
        userGpgKeypair.privateKey,
      );

      const combinedBackupKey = await createCombinedKey(
        backupKeyShare,
        [{
          nShare: bitgoToBackupShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          nShare: userToBackupShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: userGpgKeypair.publicKey,
        }],
        commonKeychain,
      );

      combinedBackupKey.commonKeychain.should.equal(commonKeychain);
      combinedBackupKey.signingMaterial.pShare.should.deepEqual(backupKeyShare.pShare);
      should.exist(combinedBackupKey.signingMaterial.userNShare);
      combinedBackupKey.signingMaterial.userNShare?.should.deepEqual(userKeyShare.nShares[2]);
      combinedBackupKey.signingMaterial.bitgoNShare.should.deepEqual(bitgoKeyShare.nShares[2]);
      should.not.exist(combinedBackupKey.signingMaterial.backupNShare);
    });

    it('should fail if common keychains do not match', async function () {
      const bitgoToUserShare = await encryptNShare(
        bitgoKeyShare,
        1,
        userGpgKeypair.publicKey,
        bitgoGpgKeypair.privateKey,
      );
      const backupToUserShare = await encryptNShare(
        backupKeyShare,
        1,
        userGpgKeypair.publicKey,
        backupGpgKeypair.privateKey,
      );

      // this should fail to combine the keys because we pass in invalid common key chain
      await createCombinedKey(
        userKeyShare,
        [{
          nShare: bitgoToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          nShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
        'nottherightkeychain',
      ).should.be.rejectedWith('Common keychains do not match');
    });

    it('should fail if gpg keys are mismatched', async function () {
      const bitgoToUserShare = await encryptNShare(
        bitgoKeyShare,
        1,
        userGpgKeypair.publicKey,
        bitgoGpgKeypair.privateKey,
      );
      const backupToUserShare = await encryptNShare(
        backupKeyShare,
        1,
        userGpgKeypair.publicKey,
        backupGpgKeypair.privateKey,
      );

      await createCombinedKey(
        userKeyShare,
        [{
          nShare: bitgoToUserShare,
          recipientPrivateArmor: backupGpgKeypair.privateKey,
          senderPublicArmor: bitgoGpgKeypair.publicKey,
        }, {
          nShare: backupToUserShare,
          recipientPrivateArmor: userGpgKeypair.privateKey,
          senderPublicArmor: backupGpgKeypair.publicKey,
        }],
        'nottherightkeychain',
      ).should.be.rejectedWith('Error decrypting message: Session key decryption failed.');
    });
  });

  describe('tss signing helper function', async function () {
    const bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    let wallet: Wallet;
    const txRequest = {
      txRequestId: 'randomId',
      unsignedTxs: [{ signableHex: 'TOO MANY SECRETS', serializedTxHex: 'randomhex2' }],
      signatureShares: [
        {
          from: 'bitgo',
          to: 'user',
          share: '',
        }],
    };
    const signablePayload = Buffer.from(txRequest.unsignedTxs[0].signableHex, 'hex');

    before('initializes', async function () {

      const baseCoin = bitgo.coin('gteth');
      const walletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'gteth',
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
        const userSignShare = await ECDSAMethods.createUserSignShare(userKey.xShare, userKey.yShares[3]);
        userSignShare.should.have.properties(['wShare', 'kShare']);
        const { wShare, kShare } = userSignShare;
        wShare.should.have.property('gamma').and.be.a.String();
        wShare.should.have.property('w').and.be.a.String();
        wShare.should.have.property('k').and.be.a.String();
        kShare['i'].should.equal(3);
        kShare['j'].should.equal(1);
        kShare.should.have.property('n').and.be.a.String();
        kShare.should.have.property('k').and.be.a.String();
      });

      it('should fail if the Xshare doesnt belong to the User', async function () {
        const invalidUserSigningMaterial = { ...userKey, xShare: { ...userKey.xShare, i: 3 } };
        await ECDSAMethods.createUserSignShare(invalidUserSigningMaterial.xShare, invalidUserSigningMaterial.yShares[3]).should.be.rejectedWith(`Invalid XShare, XShare doesn't belong to the User`);
      });
    });

    describe('createUserGammaAndMuShare:', async function () {
      it('should succeed to create User Gamma Share and MuShare', async function () {
        const userShare = await ECDSAMethods.createUserGammaAndMuShare(gammaAndMuShareCreationParams.wShare, gammaAndMuShareCreationParams.aShare);
        userShare.should.have.properties(['muShare', 'gShare']);
        const { muShare, gShare } = userShare;
        muShare?.i?.should.equal(3);
        muShare?.j?.should.equal(1);
        muShare?.should.have.property('alpha').and.be.a.String();
        muShare?.should.have.property('mu').and.be.a.String();
        gShare?.should.have.property('beta').and.be.a.String();
        gShare?.should.have.property('nu').and.be.a.String();
      });

      it('should fail if the Wshare / AShare doesnt belong to the User', async function () {
        const invalidWShare = { ...gammaAndMuShareCreationParams.wShare, i: 3 };
        const invalidAShare = { ...gammaAndMuShareCreationParams.aShare, i: 3 };
        await ECDSAMethods.createUserGammaAndMuShare(invalidWShare, gammaAndMuShareCreationParams.aShare).should.be.rejectedWith(`Invalid WShare, doesn't belong to the User`);
        await ECDSAMethods.createUserGammaAndMuShare(gammaAndMuShareCreationParams.wShare, invalidAShare).should.be.rejectedWith(`Invalid AShare, is not from Bitgo to User`);
      });
    });

    describe('createUserOmicronAndDeltaShare:', async function () {
      it('should succeed to create User Omicron and Mu Shares', async function () {
        const userShare = await ECDSAMethods.createUserOmicronAndDeltaShare(omicronAndDeltaShareCreationParams.gShare);
        userShare.should.have.properties(['dShare', 'oShare']);
        const { dShare, oShare } = userShare;
        dShare?.i?.should.equal(3);
        dShare?.j?.should.equal(1);
        dShare?.should.have.property('delta').and.be.a.String();
        dShare?.should.have.property('Gamma').and.be.a.String();
        oShare?.should.have.property('omicron').and.be.a.String();
        oShare?.should.have.property('delta').and.be.a.String();
      });

      it(`should fail if the gShare doesn't belong to the User`, async function () {
        const invalidGShare = { ...omicronAndDeltaShareCreationParams.gShare, i: 3 };
        await ECDSAMethods.createUserOmicronAndDeltaShare(invalidGShare).should.be.rejectedWith(`Invalid GShare, doesn't belong to the User`);
      });
    });

    describe('createUserSignatureShare:', async function () {
      afterEach(function () {
        nock.cleanAll();
      });

      it('should succeed to create User Signature Share', async function () {
        const userSignatureShare = await ECDSAMethods.createUserSignatureShare(createUserSignatureParams.oShare, createUserSignatureParams.dShare, signablePayload);
        const { R, s, y, i } = userSignatureShare;
        i.should.be.Number();
        R.should.be.a.String();
        s.should.be.a.String();
        y.should.be.a.String();
      });

      it(`should fail if the OShare / dShare doesn't belong to the User`, async function () {
        const invalidOShare = { ...createUserSignatureParams.oShare, i: 3 };
        await ECDSAMethods.createUserSignatureShare(invalidOShare, createUserSignatureParams.dShare, signablePayload).should.be.rejectedWith(`Invalid OShare, doesn't belong to the User`);
        const invalidDShare = { ...createUserSignatureParams.dShare, i: 3 };
        await ECDSAMethods.createUserSignatureShare(createUserSignatureParams.oShare, invalidDShare, signablePayload).should.be.rejectedWith(`Invalid DShare, doesn't seem to be from BitGo`);
      });
    });

    describe('sendSignatureShare Tests', async function () {
      afterEach(function () {
        nock.cleanAll();
      });

      const mockAShareString = `${mockAShare.k}${ECDSAMethods.delimeter}${mockAShare.alpha}${ECDSAMethods.delimeter}${mockAShare.mu}${ECDSAMethods.delimeter}${mockAShare.n}`;
      const mockDShareString = `${mockDShare.delta}${ECDSAMethods.delimeter}${mockDShare.Gamma}`;
      const config = [
        {
          shareToSend: 'KShare',
          mockShareToSend: mockSignRT.kShare,
          mockShareToSendString: `${mockSignRT.kShare.k}${ECDSAMethods.delimeter}${mockSignRT.kShare.n}`,
          sendType: ECDSAMethodTypes.SendShareType.KShare,
          mockShareAsResponse: mockAShare,
          mockShareAsResponseString: mockAShareString,
          shareReceived: 'AShare',
          incorrectReceivedShareString: mockAShare.k,
          signerShare: 'a valid signer share',
        },
        {
          shareToSend: 'MUShare',
          mockShareToSend: { muShare: mockMuShare, dShare: mockDShare, i: mockMuShare.i },
          mockShareToSendString: `${ECDSAMethods.convertMuShare(mockMuShare).share}${ECDSAMethods.secondaryDelimeter}${ECDSAMethods.convertDShare(mockDShare).share}`,
          sendType: ECDSAMethodTypes.SendShareType.MUShare,
          mockShareAsResponse: mockDShare,
          mockShareAsResponseString: mockDShareString,
          shareReceived: 'DShare',
          incorrectReceivedShareString: mockDShare.Gamma,
        },
      ];

      for (let index = 0; index < config.length; index++) {
        describe(`sendSignatureShare: ${config[index].shareToSend}`, async function () {
          it(`should succeed to send ${config[index].shareToSend}`, async function () {
            const mockSendReq = { from: 'user', to: 'bitgo', share: config[index].mockShareToSendString } as SignatureShareRecord;
            const shareRecord = { from: 'bitgo', to: 'user', share: config[index].mockShareAsResponseString } as SignatureShareRecord;
            await nockSendSignatureShare({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, signatureShare: mockSendReq, response: shareRecord, tssType: 'ecdsa', signerShare: config[index].signerShare });
            txRequest.signatureShares = [shareRecord];
            const response = { txRequests: [{ transactions: [{ ...txRequest }] }] };
            await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
            const responseAShare = await ECDSAMethods.sendShareToBitgo(bitgo, wallet.id(), txRequest.txRequestId, RequestType.tx, config[index].sendType, config[index].mockShareToSend, config[index].signerShare);
            responseAShare.should.deepEqual(config[index].mockShareAsResponse);
          });

          it(`should fail if we get an invalid ${config[index].shareReceived} as response`, async function () {
            const mockSendReq = { from: 'user', to: 'bitgo', share: config[index].mockShareToSendString } as SignatureShareRecord;
            const invalidSignatureShare = { from: 'bitgo', to: 'user', share: JSON.stringify(config[index].incorrectReceivedShareString) } as SignatureShareRecord;
            const nock = await nockSendSignatureShare({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, signatureShare: mockSendReq, response: invalidSignatureShare, tssType: 'ecdsa', signerShare: config[index].signerShare }, 200);
            txRequest.signatureShares = [invalidSignatureShare];
            const response = { txRequests: [{ transactions: [{ ...txRequest }] }] };
            await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
            await ECDSAMethods.sendShareToBitgo(bitgo, wallet.id(), txRequest.txRequestId, RequestType.tx, config[index].sendType, config[index].mockShareToSend, config[index].signerShare).should.be.rejectedWith(/Invalid .* share/g); // `Invalid ${shareName} share`
            nock.isDone().should.equal(true);
          });
        });
      }
    });

    describe('getTxRequest:', async function () {
      afterEach(function () {
        nock.cleanAll();
      });

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

    describe('signing share parsers and converters', function() {
      afterEach(function () {
        nock.cleanAll();
      });

      it('should successfully parse K share', function () {
        const bitgoKShare = mockSignRT.kShare;
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: `${bitgoKShare.k}${ECDSAMethods.delimeter}${bitgoKShare.n}`,
        } as SignatureShareRecord;
        const kShare = ECDSAMethods.parseKShare(share);
        kShare.i.should.equal(bitgoKShare.i);
        kShare.j.should.equal(bitgoKShare.j);
        kShare.k.should.equal(bitgoKShare.k);
        kShare.n.should.equal(bitgoKShare.n);
      });

      it('should successfully convert K share to signature share record', function () {
        const bitgoKShare = mockSignRT.kShare;
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: `${bitgoKShare.k}${ECDSAMethods.delimeter}${bitgoKShare.n}`,
        } as SignatureShareRecord;

        const kshare = ECDSAMethods.convertKShare(bitgoKShare);
        kshare.from.should.equal(share.from);
        kshare.to.should.equal(share.to);
        kshare.share.should.equal(share.share);
      });

      it('should successfully parse A share', function() {
        const share = {
          to: SignatureShareType.USER,
          from: SignatureShareType.BITGO,
          share: `${mockAShare.k}${ECDSAMethods.delimeter}${mockAShare.alpha}${ECDSAMethods.delimeter}${mockAShare.mu}${ECDSAMethods.delimeter}${mockAShare.n}`,
        } as SignatureShareRecord;
        const aShare = ECDSAMethods.parseAShare(share);
        should.exist(aShare);
        aShare.i.should.equal(mockAShare.i);
        aShare.j.should.equal(mockAShare.j);
        aShare!.k!.should.equal(mockAShare.k);
        aShare!.alpha!.should.equal(mockAShare.alpha);
        aShare!.mu!.should.equal(mockAShare.mu);
        aShare!.n!.should.equal(mockAShare.n);
      });

      it('should successfully convert A share to signature share record', function () {
        const share = {
          to: SignatureShareType.USER,
          from: SignatureShareType.BITGO,
          share: `${mockAShare.k}${ECDSAMethods.delimeter}${mockAShare.alpha}${ECDSAMethods.delimeter}${mockAShare.mu}${ECDSAMethods.delimeter}${mockAShare.n}`,
        } as SignatureShareRecord;

        const aShare = ECDSAMethods.convertAShare(mockAShare);
        aShare.from.should.equal(share.from);
        aShare.to.should.equal(share.to);
        aShare.share.should.equal(share.share);
      });

      it('should successfully parse Mu share', function() {
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: `${mockMuShare.alpha}${ECDSAMethods.delimeter}${mockMuShare.mu}`,
        } as SignatureShareRecord;
        const muShare = ECDSAMethods.parseMuShare(share);
        muShare.i.should.equal(mockMuShare.i);
        muShare.j.should.equal(mockMuShare.j);
        muShare.alpha.should.equal(mockMuShare.alpha);
        muShare.mu.should.equal(mockMuShare.mu);
      });

      it('should successfully convert Mu share to signature share record', function () {
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: `${mockMuShare.alpha}${ECDSAMethods.delimeter}${mockMuShare.mu}`,
        } as SignatureShareRecord;
        const muShare = ECDSAMethods.convertMuShare(mockMuShare);
        muShare.from.should.equal(share.from);
        muShare.to.should.equal(share.to);
        muShare.share.should.equal(share.share);
      });

      it('should successfully parse D share', function() {
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: `${mockDShareToBitgo.delta}${ECDSAMethods.delimeter}${mockDShareToBitgo.Gamma}`,
        } as SignatureShareRecord;
        const dShare = ECDSAMethods.parseDShare(share);
        dShare.i.should.equal(mockDShareToBitgo.i);
        dShare.j.should.equal(mockDShareToBitgo.j);
        dShare.delta.should.equal(mockDShareToBitgo.delta);
        dShare.Gamma.should.equal(mockDShareToBitgo.Gamma);
      });

      it('should successfully convert D share to signature share record', function () {
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: `${mockDShareToBitgo.delta}${ECDSAMethods.delimeter}${mockDShareToBitgo.Gamma}`,
        } as SignatureShareRecord;
        const dShare = ECDSAMethods.convertDShare(mockDShareToBitgo);
        dShare.from.should.equal(share.from);
        dShare.to.should.equal(share.to);
        dShare.share.should.equal(share.share);
      });

      it('should successfully parse S and D share', function() {
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: `${mockSShareFromUser.R}${ECDSAMethods.delimeter}${mockSShareFromUser.s}${ECDSAMethods.delimeter}${mockSShareFromUser.y}${ECDSAMethods.secondaryDelimeter}${mockDShareToBitgo.delta}${ECDSAMethods.delimeter}${mockDShareToBitgo.Gamma}`,
        } as SignatureShareRecord;
        const { sShare, dShare } = ECDSAMethods.parseSDShare(share);
        sShare.i.should.equal(3);
        sShare.R.should.equal(mockSShareFromUser.R);
        sShare.s.should.equal(mockSShareFromUser.s);
        sShare.y.should.equal(mockSShareFromUser.y);
        dShare.i.should.equal(mockDShareToBitgo.i);
        dShare.j.should.equal(mockDShareToBitgo.j);
        dShare.delta.should.equal(mockDShareToBitgo.delta);
        dShare.Gamma.should.equal(mockDShareToBitgo.Gamma);
      });

      it('should successfully convert S and D share to signature share record', function () {
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: `${mockSShareFromUser.R}${ECDSAMethods.delimeter}${mockSShareFromUser.s}${ECDSAMethods.delimeter}${mockSShareFromUser.y}${ECDSAMethods.secondaryDelimeter}${mockDShareToBitgo.delta}${ECDSAMethods.delimeter}${mockDShareToBitgo.Gamma}`,
        } as SignatureShareRecord;
        const sdShare = ECDSAMethods.convertSDShare({ sShare: mockSShareFromUser, dShare: mockDShareToBitgo });
        sdShare.from.should.equal(share.from);
        sdShare.to.should.equal(share.to);
        sdShare.share.should.equal(share.share);
      });

      it('should successfully parse signature share', function() {
        const share = {
          to: SignatureShareType.USER,
          from: SignatureShareType.BITGO,
          share: `${mockSShareFromUser.R}${ECDSAMethods.delimeter}${mockSShareFromUser.s}${ECDSAMethods.delimeter}${mockSShareFromUser.y}`,
        } as SignatureShareRecord;
        const signature = ECDSAMethods.parseSignatureShare(share);
        signature.i.should.equal(1);
        signature.R.should.equal(mockSShareFromUser.R);
        signature.s.should.equal(mockSShareFromUser.s);
        signature.y.should.equal(mockSShareFromUser.y);
      });

      it('should succuesfully parse combined signature', function() {
        const mockCombinedSignature = mpc.constructSignature([mockSShareFromUser, mockSShare]);
        const share = {
          to: SignatureShareType.USER,
          from: SignatureShareType.BITGO,
          share: `${mockCombinedSignature.recid}${ECDSAMethods.delimeter}${mockCombinedSignature.r}${ECDSAMethods.delimeter}${mockCombinedSignature.s}${ECDSAMethods.delimeter}${mockCombinedSignature.y}`,
        } as SignatureShareRecord;
        const signature = ECDSAMethods.parseCombinedSignature(share);
        signature.recid.should.equal(mockCombinedSignature.recid);
        signature.r.should.equal(mockCombinedSignature.r);
        signature.s.should.equal(mockCombinedSignature.s);
        signature.y.should.equal(mockCombinedSignature.y);
      });

      it('should successfully convert signature share to signature share record', function () {
        const share = {
          to: SignatureShareType.USER,
          from: SignatureShareType.BITGO,
          share: `${mockSShareFromUser.R}${ECDSAMethods.delimeter}${mockSShareFromUser.s}${ECDSAMethods.delimeter}${mockSShareFromUser.y}`,
        } as SignatureShareRecord;
        const signatureShare = ECDSAMethods.convertSignatureShare(mockSShareFromUser, ECDSAMethods.getParticipantIndex('bitgo'));
        signatureShare.from.should.equal(share.from);
        signatureShare.to.should.equal(share.to);
        signatureShare.share.should.equal(share.share);
      });

      it('should successfully convert B share to signature share record', function() {
        const bShare = mockedBitgoBShare.bShare;
        const delimeter = ECDSAMethods.delimeter;
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.BITGO,
          share: `${bShare.beta}${delimeter}${bShare.gamma}${delimeter}${bShare.k}${delimeter}${bShare.nu}${delimeter}${bShare.w}${delimeter}${bShare.y}${delimeter}${bShare.l}${delimeter}${bShare.m}${delimeter}${bShare.n}`,
        } as SignatureShareRecord;
        const signatureShare = ECDSAMethods.convertBShare(bShare);
        signatureShare.from.should.equal(share.from);
        signatureShare.to.should.equal(share.to);
        signatureShare.share.should.equal(share.share);
      });

      it('should successfully parse B share', function() {
        const bShare = mockedBitgoBShare.bShare;
        const delimeter = ECDSAMethods.delimeter;
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.BITGO,
          share: `${bShare.beta}${delimeter}${bShare.gamma}${delimeter}${bShare.k}${delimeter}${bShare.nu}${delimeter}${bShare.w}${delimeter}${bShare.y}${delimeter}${bShare.l}${delimeter}${bShare.m}${delimeter}${bShare.n}`,
        } as SignatureShareRecord;
        const parsedBShare = ECDSAMethods.parseBShare(share);
        parsedBShare.i.should.equal(bShare.i);
        parsedBShare.l.should.equal(bShare.l);
        parsedBShare.m.should.equal(bShare.m);
        parsedBShare.n.should.equal(bShare.n);
        parsedBShare.y.should.equal(bShare.y);
        parsedBShare.k.should.equal(bShare.k);
        parsedBShare.w.should.equal(bShare.w);
        parsedBShare.gamma.should.equal(bShare.gamma);
        parsedBShare.beta.should.equal(bShare.beta);
        parsedBShare.nu.should.equal(bShare.nu);
      });

      it('should successfully convert O share to signature share record', function() {
        const oShare = mockedBitgoOAndDShare.oShare;
        const delimeter = ECDSAMethods.delimeter;
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.BITGO,
          share: `${oShare.Gamma}${delimeter}${oShare.delta}${delimeter}${oShare.k}${delimeter}${oShare.omicron}${delimeter}${oShare.y}`,
        } as SignatureShareRecord;
        const oShareSigRecord = ECDSAMethods.convertOShare(oShare);
        oShareSigRecord.from.should.equal(share.from);
        oShareSigRecord.to.should.equal(share.to);
        oShareSigRecord.share.should.equal(share.share);
      });

      it('should successfully parse B share', function() {
        const oShare = mockedBitgoOAndDShare.oShare;
        const delimeter = ECDSAMethods.delimeter;
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.BITGO,
          share: `${oShare.Gamma}${delimeter}${oShare.delta}${delimeter}${oShare.k}${delimeter}${oShare.omicron}${delimeter}${oShare.y}`,
        } as SignatureShareRecord;
        const parsedOShare = ECDSAMethods.parseOShare(share);
        parsedOShare.i.should.equal(oShare.i);
        parsedOShare.y.should.equal(oShare.y);
        parsedOShare.k.should.equal(oShare.k);
        parsedOShare.omicron.should.equal(oShare.omicron);
        parsedOShare.delta.should.equal(oShare.delta);
        parsedOShare.Gamma.should.equal(oShare.Gamma);
      });
    });
  });
});
