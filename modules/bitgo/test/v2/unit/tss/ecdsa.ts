import {
  Ecdsa,
  ECDSA,
  ECDSAMethodTypes,
  Wallet,
  SignatureShareRecord,
  getTxRequest,
  ECDSAMethods,
  RequestType,
  SignatureShareType,
  hexToBigInt,
} from '@bitgo/sdk-core';
import { EcdsaTypes, EcdsaPaillierProof } from '@bitgo/sdk-lib-mpc';
import * as openpgp from 'openpgp';
import * as should from 'should';
import { mockSerializedChallengeWithProofs, TestBitGo } from '@bitgo/sdk-test';
import { BitGo } from '../../../../src';
import { nockGetTxRequest, nockSendSignatureShare } from './helpers';
import {
  gammaAndMuShareCreationParams,
  omicronAndDeltaShareCreationParams,
  keyShares,
  createUserSignatureParams,
  mockSignRT,
  mockAShare,
  mockMuShare,
  mockDShare,
  mockSShareFromUser,
  mockDShareToBitgo,
  mockedBitgoBShare,
  mockedBitgoOAndDShare,
  mockSShare,
  mockSignWithPaillierChallengeRT,
} from '../../fixtures/tss/ecdsaFixtures';

import nock = require('nock');

type KeyShare = ECDSA.KeyShare;
const encryptNShare = ECDSAMethods.encryptNShare;
const createCombinedKey = ECDSAMethods.createCombinedKey;
type GpgKeypair = {
  publicKey: string;
  privateKey: string;
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
    ].map(async (user) => {
      return openpgp.generateKey({
        userIDs: [
          {
            name: user.name,
            email: user.email,
          },
        ],
        curve: 'secp256k1',
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
        const encryptedNShare = await ECDSAMethods.encryptNShare(
          userKeyShare,
          i,
          bitgoGpgKeypair.publicKey,
          userGpgKeypair
        );
        const decryptedNShare = await ECDSAMethods.decryptNShare({
          nShare: encryptedNShare,
          senderPublicArmor: userGpgKeypair.publicKey,
          recipientPrivateArmor: bitgoGpgKeypair.privateKey,
        });
        decryptedNShare.u.should.equal(userKeyShare.nShares[i].u);
        const publicKey = userKeyShare.pShare.y + userKeyShare.pShare.chaincode;
        encryptedNShare.i.should.equal(i);
        encryptedNShare.vssProof!.should.equal(userKeyShare.nShares[3].v!);
        encryptedNShare.j.should.equal(1);
        encryptedNShare.publicShare.should.equal(publicKey);
      }
    });

    it('should error for invalid recipient', async function () {
      await encryptNShare(userKeyShare, 1, userGpgKeypair.privateKey, userGpgKeypair).should.be.rejectedWith(
        'Invalid recipient'
      );
      await encryptNShare(backupKeyShare, 2, userGpgKeypair.privateKey, userGpgKeypair).should.be.rejectedWith(
        'Invalid recipient'
      );
      await encryptNShare(bitgoKeyShare, 3, userGpgKeypair.privateKey, userGpgKeypair).should.be.rejectedWith(
        'Invalid recipient'
      );
    });

    it('should decrypt n share', async function () {
      const encryptedNShare = await ECDSAMethods.encryptNShare(
        userKeyShare,
        3,
        bitgoGpgKeypair.publicKey,
        userGpgKeypair
      );
      const decryptedNShare = await ECDSAMethods.decryptNShare({
        nShare: encryptedNShare,
        recipientPrivateArmor: bitgoGpgKeypair.privateKey,
        senderPublicArmor: userGpgKeypair.publicKey,
      });
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
      const bitgoToUserShare = await ECDSAMethods.encryptNShare(
        bitgoKeyShare,
        1,
        userGpgKeypair.publicKey,
        userGpgKeypair,
        false
      );
      const backupToUserShare = await ECDSAMethods.encryptNShare(
        backupKeyShare,
        1,
        userGpgKeypair.publicKey,
        userGpgKeypair,
        false
      );
      const combinedUserKey = await createCombinedKey(
        userKeyShare,
        [
          {
            nShare: bitgoToUserShare,
            recipientPrivateArmor: userGpgKeypair.privateKey,
            senderPublicArmor: bitgoGpgKeypair.publicKey,
            isbs58Encoded: false,
          },
          {
            nShare: backupToUserShare,
            recipientPrivateArmor: userGpgKeypair.privateKey,
            senderPublicArmor: backupGpgKeypair.publicKey,
            isbs58Encoded: false,
          },
        ],
        commonKeychain
      );

      combinedUserKey.commonKeychain.should.equal(commonKeychain);
      combinedUserKey.signingMaterial.pShare.should.deepEqual(userKeyShare.pShare);
      should.exist(combinedUserKey.signingMaterial.backupNShare);
      combinedUserKey.signingMaterial.backupNShare?.should.deepEqual(backupKeyShare.nShares[1]);
      combinedUserKey.signingMaterial.bitgoNShare.should.deepEqual(bitgoKeyShare.nShares[1]);
      should.not.exist(combinedUserKey.signingMaterial.userNShare);
    });

    it('should create combined backup key', async function () {
      const bitgoToBackupShare = await encryptNShare(bitgoKeyShare, 2, backupGpgKeypair.publicKey, userGpgKeypair);

      const userToBackupShare = await encryptNShare(userKeyShare, 2, backupGpgKeypair.publicKey, userGpgKeypair);

      const combinedBackupKey = await createCombinedKey(
        backupKeyShare,
        [
          {
            nShare: bitgoToBackupShare,
            recipientPrivateArmor: backupGpgKeypair.privateKey,
            senderPublicArmor: bitgoGpgKeypair.publicKey,
          },
          {
            nShare: userToBackupShare,
            recipientPrivateArmor: backupGpgKeypair.privateKey,
            senderPublicArmor: userGpgKeypair.publicKey,
          },
        ],
        commonKeychain
      );

      combinedBackupKey.commonKeychain.should.equal(commonKeychain);
      combinedBackupKey.signingMaterial.pShare.should.deepEqual(backupKeyShare.pShare);
      should.exist(combinedBackupKey.signingMaterial.userNShare);
      combinedBackupKey.signingMaterial.userNShare?.should.deepEqual(userKeyShare.nShares[2]);
      combinedBackupKey.signingMaterial.bitgoNShare.should.deepEqual(bitgoKeyShare.nShares[2]);
      should.not.exist(combinedBackupKey.signingMaterial.backupNShare);
    });

    it('should fail if common keychains do not match', async function () {
      const bitgoToUserShare = await encryptNShare(bitgoKeyShare, 1, userGpgKeypair.publicKey, userGpgKeypair);
      const backupToUserShare = await encryptNShare(backupKeyShare, 1, userGpgKeypair.publicKey, userGpgKeypair);

      // this should fail to combine the keys because we pass in invalid common key chain
      await createCombinedKey(
        userKeyShare,
        [
          {
            nShare: bitgoToUserShare,
            recipientPrivateArmor: userGpgKeypair.privateKey,
            senderPublicArmor: bitgoGpgKeypair.publicKey,
          },
          {
            nShare: backupToUserShare,
            recipientPrivateArmor: userGpgKeypair.privateKey,
            senderPublicArmor: backupGpgKeypair.publicKey,
          },
        ],
        'nottherightkeychain'
      ).should.be.rejectedWith('Common keychains do not match');
    });

    it('should fail if gpg keys are mismatched', async function () {
      const bitgoToUserShare = await encryptNShare(bitgoKeyShare, 1, userGpgKeypair.publicKey, userGpgKeypair);
      const backupToUserShare = await encryptNShare(backupKeyShare, 1, userGpgKeypair.publicKey, userGpgKeypair);

      await createCombinedKey(
        userKeyShare,
        [
          {
            nShare: bitgoToUserShare,
            recipientPrivateArmor: backupGpgKeypair.privateKey,
            senderPublicArmor: bitgoGpgKeypair.publicKey,
          },
          {
            nShare: backupToUserShare,
            recipientPrivateArmor: userGpgKeypair.privateKey,
            senderPublicArmor: backupGpgKeypair.publicKey,
          },
        ],
        'nottherightkeychain'
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
        },
      ],
    };
    const signablePayload = Buffer.from(txRequest.unsignedTxs[0].signableHex, 'hex');

    before('initializes', async function () {
      const baseCoin = bitgo.coin('hteth');
      const walletData = {
        id: '5b34252f1bf349930e34020a00000000',
        coin: 'hteth',
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
      let userToBitGoPaillierChallenge: EcdsaTypes.SerializedPaillierChallenge;
      let bitgoToUserPaillierChallenge: EcdsaTypes.SerializedPaillierChallenge;

      before(async function () {
        userToBitGoPaillierChallenge = EcdsaTypes.serializePaillierChallenge({
          p: await EcdsaPaillierProof.generateP(hexToBigInt(userKey.yShares[3].n)),
        });
        bitgoToUserPaillierChallenge = EcdsaTypes.serializePaillierChallenge({
          p: await EcdsaPaillierProof.generateP(hexToBigInt(userKey.xShare.n)),
        });
      });

      it('should succeed to create User SignShare', async function () {
        const xShare = mpc.appendChallenge(
          userKey.xShare,
          mockSerializedChallengeWithProofs,
          userToBitGoPaillierChallenge
        );
        const yShare = mpc.appendChallenge(
          userKey.yShares[3],
          { ntilde: xShare.ntilde, h1: xShare.h1, h2: xShare.h2 },
          bitgoToUserPaillierChallenge
        );
        const userSignShare = await ECDSAMethods.createUserSignShare(xShare, yShare);
        userSignShare.should.have.properties(['wShare', 'kShare']);
        const { wShare, kShare } = userSignShare;
        wShare.should.have.property('gamma').and.be.a.String();
        wShare.should.have.property('w').and.be.a.String();
        wShare.should.have.property('k').and.be.a.String();
        wShare.should.have.property('ck').and.be.a.String();
        wShare.should.have.property('h2').and.be.a.String();
        wShare.should.have.property('h1').and.be.a.String();
        wShare.should.have.property('ntilde').and.be.a.String();
        wShare.should.have.property('y').and.be.a.String();
        wShare.should.have.property('n').and.be.a.String();
        wShare.should.have.property('m').and.be.a.String();
        wShare.should.have.property('l').and.be.a.String();
        wShare.should.have.property('i').and.be.a.Number();
        kShare['i'].should.equal(3);
        kShare['j'].should.equal(1);
        kShare.should.have.property('n').and.be.a.String();
        kShare.should.have.property('k').and.be.a.String();
        kShare.should.have.property('ntilde').and.be.a.String();
        kShare.should.have.property('h1').and.be.a.String();
        kShare.should.have.property('h2').and.be.a.String();
      });

      it('should fail if the Xshare doesnt belong to the User', async function () {
        let xShare = mpc.appendChallenge(
          userKey.xShare,
          mockSerializedChallengeWithProofs,
          userToBitGoPaillierChallenge
        );
        xShare = { ...xShare, i: 3 };
        const yShare = mpc.appendChallenge(
          userKey.yShares[3],
          {
            ntilde: xShare.ntilde,
            h1: xShare.h1,
            h2: xShare.h2,
          },
          bitgoToUserPaillierChallenge
        );
        await ECDSAMethods.createUserSignShare(xShare, yShare).should.be.rejectedWith(
          `Invalid XShare, XShare doesn't belong to the User`
        );
      });
    });

    describe('createUserGammaAndMuShare:', async function () {
      it('should succeed to create User Gamma Share and MuShare', async function () {
        const userShare = await ECDSAMethods.createUserGammaAndMuShare(
          gammaAndMuShareCreationParams.wShare,
          gammaAndMuShareCreationParams.aShare
        );
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
        await ECDSAMethods.createUserGammaAndMuShare(
          invalidWShare,
          gammaAndMuShareCreationParams.aShare
        ).should.be.rejectedWith(`Invalid WShare, doesn't belong to the User`);
        await ECDSAMethods.createUserGammaAndMuShare(
          gammaAndMuShareCreationParams.wShare,
          invalidAShare
        ).should.be.rejectedWith(`Invalid AShare, is not from Bitgo to User`);
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
        await ECDSAMethods.createUserOmicronAndDeltaShare(invalidGShare).should.be.rejectedWith(
          `Invalid GShare, doesn't belong to the User`
        );
      });
    });

    describe('createUserSignatureShare:', async function () {
      afterEach(function () {
        nock.cleanAll();
      });

      it('should succeed to create User Signature Share', async function () {
        const userSignatureShare = await ECDSAMethods.createUserSignatureShare(
          createUserSignatureParams.oShare,
          createUserSignatureParams.dShare,
          signablePayload
        );
        const { R, s, y, i } = userSignatureShare;
        i.should.be.Number();
        R.should.be.a.String();
        s.should.be.a.String();
        y.should.be.a.String();
      });

      it(`should fail if the OShare / dShare doesn't belong to the User`, async function () {
        const invalidOShare = { ...createUserSignatureParams.oShare, i: 3 };
        await ECDSAMethods.createUserSignatureShare(
          invalidOShare,
          createUserSignatureParams.dShare,
          signablePayload
        ).should.be.rejectedWith(`Invalid OShare, doesn't belong to the User`);
        const invalidDShare = { ...createUserSignatureParams.dShare, i: 3 };
        await ECDSAMethods.createUserSignatureShare(
          createUserSignatureParams.oShare,
          invalidDShare,
          signablePayload
        ).should.be.rejectedWith(`Invalid DShare, doesn't seem to be from BitGo`);
      });
    });

    describe('sendSignatureShare Tests', async function () {
      afterEach(function () {
        nock.cleanAll();
      });

      const mockAShareString = ECDSAMethods.convertAShare(mockAShare).share;
      const mockDShareString = ECDSAMethods.convertDShare(mockDShare).share;
      const config = [
        {
          shareToSend: 'KShare',
          mockShareToSend: mockSignRT.kShare,
          mockShareToSendString: ECDSAMethods.convertKShare(mockSignRT.kShare).share,
          sendType: ECDSAMethodTypes.SendShareType.KShare,
          mockShareAsResponse: mockAShare,
          mockShareAsResponseString: mockAShareString,
          shareReceived: 'AShare',
          incorrectReceivedShareString: mockAShare.k,
          signerShare: 'a valid signer share',
        },
        {
          shareToSend: 'MUShare',
          mockShareToSend: { muShare: mockMuShare, dShare: mockDShareToBitgo, i: mockMuShare.i },
          mockShareToSendString: `${ECDSAMethods.convertMuShare(mockMuShare).share}${ECDSAMethods.secondaryDelimeter}${
            ECDSAMethods.convertDShare(mockDShareToBitgo).share
          }`,
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
            const mockSendReq = {
              from: 'user',
              to: 'bitgo',
              share: config[index].mockShareToSendString,
            } as SignatureShareRecord;
            const shareRecord = {
              from: 'bitgo',
              to: 'user',
              share: config[index].mockShareAsResponseString,
            } as SignatureShareRecord;
            await nockSendSignatureShare({
              walletId: wallet.id(),
              txRequestId: txRequest.txRequestId,
              signatureShare: mockSendReq,
              response: shareRecord,
              tssType: 'ecdsa',
              signerShare: config[index].signerShare,
            });
            txRequest.signatureShares = [shareRecord];
            const response = { txRequests: [{ transactions: [{ ...txRequest }] }] };
            await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
            const responseAShare = await ECDSAMethods.sendShareToBitgo(
              bitgo,
              wallet.id(),
              txRequest.txRequestId,
              RequestType.tx,
              config[index].sendType,
              config[index].mockShareToSend,
              config[index].signerShare
            );
            responseAShare.should.deepEqual(config[index].mockShareAsResponse);
          });

          it(`should fail if we get an invalid ${config[index].shareReceived} as response`, async function () {
            const mockSendReq = {
              from: 'user',
              to: 'bitgo',
              share: config[index].mockShareToSendString,
            } as SignatureShareRecord;
            const invalidSignatureShare = {
              from: 'bitgo',
              to: 'user',
              share: JSON.stringify(config[index].incorrectReceivedShareString),
            } as SignatureShareRecord;
            const nock = await nockSendSignatureShare(
              {
                walletId: wallet.id(),
                txRequestId: txRequest.txRequestId,
                signatureShare: mockSendReq,
                response: invalidSignatureShare,
                tssType: 'ecdsa',
                signerShare: config[index].signerShare,
              },
              200
            );
            txRequest.signatureShares = [invalidSignatureShare];
            const response = { txRequests: [{ transactions: [{ ...txRequest }] }] };
            await nockGetTxRequest({ walletId: wallet.id(), txRequestId: txRequest.txRequestId, response: response });
            await ECDSAMethods.sendShareToBitgo(
              bitgo,
              wallet.id(),
              txRequest.txRequestId,
              RequestType.tx,
              config[index].sendType,
              config[index].mockShareToSend,
              config[index].signerShare
            ).should.be.rejectedWith(/Invalid .* share/g); // `Invalid ${shareName} share`
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
        await getTxRequest(bitgo, wallet.id(), txRequest.txRequestId).should.be.rejectedWith(
          'Unable to find TxRequest with id randomId'
        );
        nock.isDone().should.equal(true);
      });
    });

    describe('signing share parsers and converters', function () {
      afterEach(function () {
        nock.cleanAll();
      });

      it('should successfully parse K share', function () {
        const bitgoKShare = mockSignWithPaillierChallengeRT.kShare;
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: ECDSAMethods.convertKShare(mockSignWithPaillierChallengeRT.kShare).share,
        } as SignatureShareRecord;
        const kShare = ECDSAMethods.parseKShare(share);
        kShare.should.deepEqual(bitgoKShare);
      });

      it('should successfully convert K share to signature share record', function () {
        const bitgoKShare = mockSignWithPaillierChallengeRT.kShare;
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: `${mockSignRT.kShare.k}${ECDSAMethods.delimeter}${mockSignRT.kShare.n}${ECDSAMethods.delimeter}${
            mockSignRT.kShare.ntilde
          }${ECDSAMethods.delimeter}${mockSignRT.kShare.h1}${ECDSAMethods.delimeter}${mockSignRT.kShare.h2}${
            ECDSAMethods.delimeter
          }${mockSignRT.kShare.proof?.z || ''}${ECDSAMethods.delimeter}${mockSignRT.kShare.proof?.u || ''}${
            ECDSAMethods.delimeter
          }${mockSignRT.kShare.proof?.w || ''}${ECDSAMethods.delimeter}${mockSignRT.kShare.proof?.s || ''}${
            ECDSAMethods.delimeter
          }${mockSignRT.kShare.proof?.s1 || ''}${ECDSAMethods.delimeter}${mockSignRT.kShare.proof?.s2 || ''}${
            ECDSAMethods.delimeter
          }${bitgoKShare.p.join(ECDSAMethods.delimeter)}${ECDSAMethods.delimeter}${bitgoKShare.sigma.join(
            ECDSAMethods.delimeter
          )}`,
        } as SignatureShareRecord;

        const kshare = ECDSAMethods.convertKShare(bitgoKShare);
        kshare.from.should.equal(share.from);
        kshare.to.should.equal(share.to);
        kshare.share.should.equal(share.share);
      });

      it('should successfully parse A share without paillier challenge', function () {
        const share = {
          to: SignatureShareType.USER,
          from: SignatureShareType.BITGO,
          share: ECDSAMethods.convertAShare(mockAShare).share,
        } as SignatureShareRecord;
        const aShare = ECDSAMethods.parseAShare(share);
        should.exist(aShare);
        aShare.should.deepEqual(mockAShare);
      });

      it('should successfully parse A share', function () {
        const share = {
          to: SignatureShareType.USER,
          from: SignatureShareType.BITGO,
          share: ECDSAMethods.convertAShare(mockAShare).share,
        } as SignatureShareRecord;
        const aShare = ECDSAMethods.parseAShare(share);
        should.exist(aShare);
        aShare.should.deepEqual(mockAShare);
      });

      it('should successfully convert A share to signature share record', function () {
        const mockShare = mockAShare;
        const share = {
          to: SignatureShareType.USER,
          from: SignatureShareType.BITGO,
          share: `${mockShare.k}${ECDSAMethods.delimeter}${mockShare.alpha}${ECDSAMethods.delimeter}${mockShare.mu}${
            ECDSAMethods.delimeter
          }${mockShare.n}${ECDSAMethods.delimeter}${mockShare.ntilde}${ECDSAMethods.delimeter}${mockShare.h1}${
            ECDSAMethods.delimeter
          }${mockShare.h2}${ECDSAMethods.delimeter}${mockShare.proof?.z || ''}${ECDSAMethods.delimeter}${
            mockShare.proof?.u || ''
          }${ECDSAMethods.delimeter}${mockShare.proof?.w || ''}${ECDSAMethods.delimeter}${mockShare.proof?.s || ''}${
            ECDSAMethods.delimeter
          }${mockShare.proof?.s1 || ''}${ECDSAMethods.delimeter}${mockShare.proof?.s2 || ''}${ECDSAMethods.delimeter}${
            mockShare.gammaProof?.z || ''
          }${ECDSAMethods.delimeter}${mockShare.gammaProof?.zprm || ''}${ECDSAMethods.delimeter}${
            mockShare.gammaProof?.t || ''
          }${ECDSAMethods.delimeter}${mockShare.gammaProof?.v || ''}${ECDSAMethods.delimeter}${
            mockShare.gammaProof?.w || ''
          }${ECDSAMethods.delimeter}${mockShare.gammaProof?.s || ''}${ECDSAMethods.delimeter}${
            mockShare.gammaProof?.s1 || ''
          }${ECDSAMethods.delimeter}${mockShare.gammaProof?.s2 || ''}${ECDSAMethods.delimeter}${
            mockShare.gammaProof?.t1 || ''
          }${ECDSAMethods.delimeter}${mockShare.gammaProof?.t2 || ''}${ECDSAMethods.delimeter}${
            mockShare.gammaProof?.u || ''
          }${ECDSAMethods.delimeter}${mockShare.gammaProof?.x || ''}${ECDSAMethods.delimeter}${
            mockShare.wProof?.z || ''
          }${ECDSAMethods.delimeter}${mockShare.wProof?.zprm || ''}${ECDSAMethods.delimeter}${
            mockShare.wProof?.t || ''
          }${ECDSAMethods.delimeter}${mockShare.wProof?.v || ''}${ECDSAMethods.delimeter}${mockShare.wProof?.w || ''}${
            ECDSAMethods.delimeter
          }${mockShare.wProof?.s || ''}${ECDSAMethods.delimeter}${mockShare.wProof?.s1 || ''}${ECDSAMethods.delimeter}${
            mockShare.wProof?.s2 || ''
          }${ECDSAMethods.delimeter}${mockShare.wProof?.t1 || ''}${ECDSAMethods.delimeter}${
            mockShare.wProof?.t2 || ''
          }${ECDSAMethods.delimeter}${mockShare.wProof?.u || ''}${ECDSAMethods.delimeter}${mockShare.wProof?.x || ''}${
            ECDSAMethods.delimeter
          }${mockShare.sigma!.join(ECDSAMethods.delimeter)}`,
        } as SignatureShareRecord;

        const aShare = ECDSAMethods.convertAShare(mockShare);
        aShare.from.should.equal(share.from);
        aShare.to.should.equal(share.to);
        aShare.share.should.equal(share.share);
      });

      it('should successfully parse Mu share', function () {
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: ECDSAMethods.convertMuShare(mockMuShare).share,
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
          share: `${mockMuShare.alpha}${ECDSAMethods.delimeter}${mockMuShare.mu}${ECDSAMethods.delimeter}${
            mockMuShare.gammaProof?.z || ''
          }${ECDSAMethods.delimeter}${mockMuShare.gammaProof?.zprm || ''}${ECDSAMethods.delimeter}${
            mockMuShare.gammaProof?.t || ''
          }${ECDSAMethods.delimeter}${mockMuShare.gammaProof?.v || ''}${ECDSAMethods.delimeter}${
            mockMuShare.gammaProof?.w || ''
          }${ECDSAMethods.delimeter}${mockMuShare.gammaProof?.s || ''}${ECDSAMethods.delimeter}${
            mockMuShare.gammaProof?.s1 || ''
          }${ECDSAMethods.delimeter}${mockMuShare.gammaProof?.s2 || ''}${ECDSAMethods.delimeter}${
            mockMuShare.gammaProof?.t1 || ''
          }${ECDSAMethods.delimeter}${mockMuShare.gammaProof?.t2 || ''}${ECDSAMethods.delimeter}${
            mockMuShare.gammaProof?.u || ''
          }${ECDSAMethods.delimeter}${mockMuShare.gammaProof?.x || ''}${ECDSAMethods.delimeter}${
            mockMuShare.wProof?.z || ''
          }${ECDSAMethods.delimeter}${mockMuShare.wProof?.zprm || ''}${ECDSAMethods.delimeter}${
            mockMuShare.wProof?.t || ''
          }${ECDSAMethods.delimeter}${mockMuShare.wProof?.v || ''}${ECDSAMethods.delimeter}${
            mockMuShare.wProof?.w || ''
          }${ECDSAMethods.delimeter}${mockMuShare.wProof?.s || ''}${ECDSAMethods.delimeter}${
            mockMuShare.wProof?.s1 || ''
          }${ECDSAMethods.delimeter}${mockMuShare.wProof?.s2 || ''}${ECDSAMethods.delimeter}${
            mockMuShare.wProof?.t1 || ''
          }${ECDSAMethods.delimeter}${mockMuShare.wProof?.t2 || ''}${ECDSAMethods.delimeter}${
            mockMuShare.wProof?.u || ''
          }${ECDSAMethods.delimeter}${mockMuShare.wProof?.x || ''}`,
        } as SignatureShareRecord;
        const muShare = ECDSAMethods.convertMuShare(mockMuShare);
        muShare.from.should.equal(share.from);
        muShare.to.should.equal(share.to);
        muShare.share.should.equal(share.share);
      });

      it('should successfully parse D share', function () {
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: ECDSAMethods.convertDShare(mockDShareToBitgo).share,
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

      it('should successfully parse S and D share', function () {
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

      it('should successfully parse signature share', function () {
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

      it('should succuesfully parse combined signature', function () {
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
          to: SignatureShareType.BITGO,
          from: SignatureShareType.USER,
          share: `${mockSShareFromUser.R}${ECDSAMethods.delimeter}${mockSShareFromUser.s}${ECDSAMethods.delimeter}${mockSShareFromUser.y}`,
        } as SignatureShareRecord;
        const signatureShare = ECDSAMethods.convertSignatureShare(
          mockSShareFromUser,
          ECDSAMethods.getParticipantIndex('user'),
          ECDSAMethods.getParticipantIndex('bitgo')
        );
        signatureShare.from.should.equal(share.from);
        signatureShare.to.should.equal(share.to);
        signatureShare.share.should.equal(share.share);
      });

      it('should successfully convert B share to signature share record', function () {
        const bShare = mockedBitgoBShare.bShare;
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.BITGO,
          share: `${bShare.beta}${ECDSAMethods.delimeter}${bShare.gamma}${ECDSAMethods.delimeter}${bShare.k}${
            ECDSAMethods.delimeter
          }${bShare.nu}${ECDSAMethods.delimeter}${bShare.w}${ECDSAMethods.delimeter}${bShare.y}${
            ECDSAMethods.delimeter
          }${bShare.l}${ECDSAMethods.delimeter}${bShare.m}${ECDSAMethods.delimeter}${bShare.n}${
            ECDSAMethods.delimeter
          }${bShare.ntilde}${ECDSAMethods.delimeter}${bShare.h1}${ECDSAMethods.delimeter}${bShare.h2}${
            ECDSAMethods.delimeter
          }${bShare.ck}${ECDSAMethods.delimeter}${bShare.p!.join(ECDSAMethods.delimeter)}`,
        } as SignatureShareRecord;
        const signatureShare = ECDSAMethods.convertBShare(bShare);
        signatureShare.from.should.equal(share.from);
        signatureShare.to.should.equal(share.to);
        signatureShare.share.should.equal(share.share);
      });

      it('should successfully parse B share', function () {
        const bShare = mockedBitgoBShare.bShare;
        const share = {
          to: SignatureShareType.BITGO,
          from: SignatureShareType.BITGO,
          share: ECDSAMethods.convertBShare(mockedBitgoBShare.bShare).share,
        } as SignatureShareRecord;
        const parsedBShare = ECDSAMethods.parseBShare(share);
        parsedBShare.should.deepEqual(bShare);
      });

      it('should successfully convert O share to signature share record', function () {
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

      it('should successfully parse O share', function () {
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
