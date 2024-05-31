import * as assert from 'assert';
import * as nock from 'nock';
import * as openpgp from 'openpgp';
import * as sinon from 'sinon';

import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { AddKeychainOptions, BaseCoin, common, ECDSAUtils, Keychain, Wallet } from '@bitgo/sdk-core';
import { DklsComms, DklsDkg, DklsTypes } from '@bitgo/sdk-lib-mpc';
import {
  MPCv2KeyGenRound1Request,
  MPCv2KeyGenRound1Response,
  MPCv2KeyGenRound2Request,
  MPCv2KeyGenRound2Response,
  MPCv2KeyGenRound3Request,
  MPCv2KeyGenRound3Response,
} from '@bitgo/public-types';
import { NonEmptyString } from 'io-ts-types';
import { BitGo, BitgoGPGPublicKey } from '../../../../../../src';

describe('TSS Ecdsa MPCv2 Utils:', async function () {
  const coinName = 'hteth';
  const walletId = '5b34252f1bf349930e34020a00000000';
  const enterpriseId = '6449153a6f6bc20006d66771cdbe15d3';
  let storedUserCommitment2: string;
  let storedBackupCommitment2: string;
  let storedBitgoCommitment2: string;

  let sandbox: sinon.SinonSandbox;
  let bgUrl: string;
  let tssUtils: ECDSAUtils.EcdsaMPCv2Utils;
  let wallet: Wallet;
  let bitgo: TestableBG & BitGo;
  let baseCoin: BaseCoin;
  let bitGoGgpKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let bitgoGpgPrvKey, userGpgPubKey, backupGpgPubKey: { partyId: number; gpgKey: string };

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  before(async function () {
    nock.cleanAll();
    bitGoGgpKey = await openpgp.generateKey({
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
        bitgoPublicKey: bitGoGgpKey.publicKey,
        bitgoMPCv2PublicKey: bitGoGgpKey.publicKey,
      },
    };

    bitgoGpgPrvKey = {
      partyId: 2,
      gpgKey: bitGoGgpKey.privateKey,
    };

    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    baseCoin = bitgo.coin(coinName);

    bgUrl = common.Environments[bitgo.getEnv()].uri;

    await nockGetBitgoPublicKeyBasedOnFeatureFlags(coinName, enterpriseId, bitGoGgpKey);
    nock(bgUrl).get('/api/v1/client/constants').times(16).reply(200, { ttl: 3600, constants });

    const walletData = {
      id: walletId,
      enterprise: enterpriseId,
      coin: coinName,
      coinSpecific: {},
      multisigType: 'tss',
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new ECDSAUtils.EcdsaMPCv2Utils(bitgo, baseCoin, wallet);
  });

  after(function () {
    nock.cleanAll();
  });

  describe('TSS key chains', async function () {
    it('should generate TSS MPCv2 keys', async function () {
      const bitgoSession = new DklsDkg.Dkg(3, 2, 2);

      const round1Nock = await nockKeyGenRound1(bitgoSession, 1);
      const round2Nock = await nockKeyGenRound2(bitgoSession, 1);
      const round3Nock = await nockKeyGenRound3(bitgoSession, 1);
      const addKeyNock = await nockAddKeyChain(coinName, 3);
      const params = {
        passphrase: 'test',
        enterprise: enterpriseId,
        originalPasscodeEncryptionCode: '123456',
      };
      const { userKeychain, backupKeychain, bitgoKeychain } = await tssUtils.createKeychains(params);
      assert.ok(round1Nock.isDone());
      assert.ok(round2Nock.isDone());
      assert.ok(round3Nock.isDone());
      assert.ok(addKeyNock.isDone());

      assert.ok(userKeychain);
      assert.equal(userKeychain.source, 'user');
      assert.ok(userKeychain.commonKeychain);
      assert.ok(ECDSAUtils.EcdsaMPCv2Utils.validateCommonKeychainPublicKey(userKeychain.commonKeychain));
      assert.ok(userKeychain.encryptedPrv);
      assert.ok(bitgo.decrypt({ input: userKeychain.encryptedPrv, password: params.passphrase }));

      assert.ok(backupKeychain);
      assert.equal(backupKeychain.source, 'backup');
      assert.ok(backupKeychain.commonKeychain);
      assert.ok(ECDSAUtils.EcdsaMPCv2Utils.validateCommonKeychainPublicKey(backupKeychain.commonKeychain));
      assert.ok(backupKeychain.encryptedPrv);
      assert.ok(bitgo.decrypt({ input: backupKeychain.encryptedPrv, password: params.passphrase }));

      assert.ok(bitgoKeychain);
      assert.equal(bitgoKeychain.source, 'bitgo');
    });

    it('should create TSS key chains', async function () {
      const nockPromises = [
        nockKeychain({
          coin: coinName,
          keyChain: { id: '1', pub: '1', type: 'tss', reducedEncryptedPrv: '' },
          source: 'user',
        }),
        nockKeychain({
          coin: coinName,
          keyChain: { id: '2', pub: '2', type: 'tss', reducedEncryptedPrv: '' },
          source: 'backup',
        }),
        nockKeychain({
          coin: coinName,
          keyChain: { id: '3', pub: '3', type: 'tss', reducedEncryptedPrv: '' },
          source: 'bitgo',
        }),
      ];
      const [nockedUserKeychain, nockedBackupKeychain, nockedBitGoKeychain] = await Promise.all(nockPromises);

      const bitgoKeychainPromise = tssUtils.createParticipantKeychain(ECDSAUtils.MPCv2PartiesEnum.BITGO, 'test');
      const usersKeychainPromise = tssUtils.createParticipantKeychain(
        ECDSAUtils.MPCv2PartiesEnum.USER,
        'test',
        Buffer.from('test'),
        Buffer.from('test'),
        'passphrase',
        'test'
      );
      const backupKeychainPromise = tssUtils.createParticipantKeychain(
        ECDSAUtils.MPCv2PartiesEnum.BACKUP,
        'test',
        Buffer.from('test'),
        Buffer.from('test'),
        'passphrase',
        'test'
      );

      const [userKeychain, backupKeychain, bitgoKeychain] = await Promise.all([
        usersKeychainPromise,
        backupKeychainPromise,
        bitgoKeychainPromise,
      ]);

      ({ ...userKeychain, reducedEncryptedPrv: '' }).should.deepEqual(nockedUserKeychain);
      ({ ...backupKeychain, reducedEncryptedPrv: '' }).should.deepEqual(nockedBackupKeychain);
      ({ ...bitgoKeychain, reducedEncryptedPrv: '' }).should.deepEqual(nockedBitGoKeychain);
    });
  });

  async function nockKeychain(
    params: {
      coin: string;
      keyChain: Keychain;
      source: 'user' | 'backup' | 'bitgo';
    },
    times = 1
  ): Promise<Keychain> {
    nock(bgUrl)
      .post(`/api/v2/${params.coin}/key`, (body) => {
        return body.keyType === 'tss' && body.source === params.source;
      })
      .times(times)
      .reply(200, params.keyChain);

    return params.keyChain;
  }

  async function nockGetBitgoPublicKeyBasedOnFeatureFlags(
    coin: string,
    enterpriseId: string,
    bitgoGpgKeyPair: openpgp.SerializedKeyPair<string>
  ): Promise<BitgoGPGPublicKey> {
    const bitgoGPGPublicKeyResponse: BitgoGPGPublicKey = {
      name: 'irrelevant',
      publicKey: bitgoGpgKeyPair.publicKey,
      mpcv2PublicKey: bitgoGpgKeyPair.publicKey,
      enterpriseId,
    };
    nock(bgUrl).get(`/api/v2/${coin}/tss/pubkey`).query({ enterpriseId }).reply(200, bitgoGPGPublicKeyResponse);

    return bitgoGPGPublicKeyResponse;
  }

  async function nockKeyGenRound1(bitgoSession: DklsDkg.Dkg, times = 1) {
    return nock(bgUrl)
      .post(`/api/v2/mpc/generatekey`, (body) => body.round === 'MPCv2-R1')
      .times(times)
      .reply(
        200,
        async (uri, { payload }: { payload: MPCv2KeyGenRound1Request }): Promise<MPCv2KeyGenRound1Response> => {
          const { userGpgPublicKey, backupGpgPublicKey, userMsg1, backupMsg1 } = payload;
          userGpgPubKey = {
            partyId: 0,
            gpgKey: userGpgPublicKey,
          };
          backupGpgPubKey = {
            partyId: 1,
            gpgKey: backupGpgPublicKey,
          };

          const bitgoBroadcastMsg1Unsigned = await bitgoSession.initDkg();
          const bitgoMsgs1Signed = await DklsComms.encryptAndAuthOutgoingMessages(
            { broadcastMessages: [DklsTypes.serializeBroadcastMessage(bitgoBroadcastMsg1Unsigned)], p2pMessages: [] },
            [],
            [bitgoGpgPrvKey]
          );
          const bitgoMsg1 = bitgoMsgs1Signed.broadcastMessages.find((m) => m.from === 2);
          assert(bitgoMsg1, 'bitgoMsg1 not found');

          const round1IncomingMsgs = await DklsComms.decryptAndVerifyIncomingMessages(
            {
              p2pMessages: [],
              broadcastMessages: [
                { from: 0, payload: userMsg1 },
                { from: 1, payload: backupMsg1 },
              ],
            },
            [userGpgPubKey, backupGpgPubKey],
            [bitgoGpgPrvKey]
          );

          const round2Messages = DklsTypes.serializeMessages(
            bitgoSession.handleIncomingMessages(DklsTypes.deserializeMessages(round1IncomingMsgs))
          );

          const round2SignedMessages = await DklsComms.encryptAndAuthOutgoingMessages(
            round2Messages,
            [userGpgPubKey, backupGpgPubKey],
            [bitgoGpgPrvKey]
          );

          const bitgoToUserMsg2 = round2SignedMessages.p2pMessages.find((m) => m.to === 0);
          const bitgoToBackupMsg2 = round2SignedMessages.p2pMessages.find((m) => m.to === 1);
          assert(bitgoToUserMsg2, 'bitgoToUserMsg2 not found');
          assert(bitgoToBackupMsg2, 'bitgoToBackupMsg2 not found');
          assert(bitgoToUserMsg2.commitment, 'bitgoToUserMsg2.commitment not found');

          storedBitgoCommitment2 = bitgoToUserMsg2?.commitment;
          return {
            sessionId: 'testid' as any, // NonEmptyString,
            bitgoMsg1: { from: 2, ...bitgoMsg1.payload },
            bitgoToBackupMsg2: {
              from: 2,
              to: 1,
              encryptedMessage: bitgoToBackupMsg2.payload.encryptedMessage,
              signature: bitgoToBackupMsg2.payload.signature,
            },
            bitgoToUserMsg2: {
              from: 2,
              to: 0,
              encryptedMessage: bitgoToUserMsg2.payload.encryptedMessage,
              signature: bitgoToUserMsg2.payload.signature,
            },
            walletGpgPubKeySigs: 'something' as NonEmptyString,
          };
        }
      );
  }

  async function nockKeyGenRound2(bitgoSession: DklsDkg.Dkg, times = 1) {
    return nock(bgUrl)
      .post(`/api/v2/mpc/generatekey`, (body) => body.round === 'MPCv2-R2')
      .times(times)
      .reply(
        200,
        async (uri, { payload }: { payload: MPCv2KeyGenRound2Request }): Promise<MPCv2KeyGenRound2Response> => {
          const { sessionId, userMsg2, backupMsg2, userCommitment2, backupCommitment2 } = payload;
          storedUserCommitment2 = userCommitment2;
          storedBackupCommitment2 = backupCommitment2;
          const round2IncomingMsgs = await DklsComms.decryptAndVerifyIncomingMessages(
            {
              p2pMessages: [
                {
                  from: userMsg2.from,
                  to: userMsg2.to,
                  payload: { signature: userMsg2.signature, encryptedMessage: userMsg2.encryptedMessage },
                },
                {
                  from: backupMsg2.from,
                  to: backupMsg2.to,
                  payload: { signature: backupMsg2.signature, encryptedMessage: backupMsg2.encryptedMessage },
                },
              ],
              broadcastMessages: [],
            },
            [userGpgPubKey, backupGpgPubKey],
            [bitgoGpgPrvKey]
          );

          const round3Messages = DklsTypes.serializeMessages(
            bitgoSession.handleIncomingMessages(DklsTypes.deserializeMessages(round2IncomingMsgs))
          );

          const round3SignedMessages = await DklsComms.encryptAndAuthOutgoingMessages(
            round3Messages,
            [userGpgPubKey, backupGpgPubKey],
            [bitgoGpgPrvKey]
          );

          const bitgoToUserMsg3 = round3SignedMessages.p2pMessages.find((m) => m.to === 0);
          const bitgoToBackupMsg3 = round3SignedMessages.p2pMessages.find((m) => m.to === 1);
          assert(bitgoToUserMsg3, 'bitgoToUserMsg3 not found');
          assert(bitgoToBackupMsg3, 'bitgoToBackupMsg3 not found');

          return {
            sessionId,
            bitgoCommitment2: storedBitgoCommitment2 as any, // NonEmptyString,
            bitgoToUserMsg3: {
              from: 2,
              to: 0,
              encryptedMessage: bitgoToUserMsg3.payload.encryptedMessage,
              signature: bitgoToUserMsg3.payload.signature,
            },
            bitgoToBackupMsg3: {
              from: 2,
              to: 1,
              encryptedMessage: bitgoToBackupMsg3.payload.encryptedMessage,
              signature: bitgoToBackupMsg3.payload.signature,
            },
          };
        }
      );
  }

  async function nockKeyGenRound3(bitgoSession: DklsDkg.Dkg, times = 1) {
    return nock(bgUrl)
      .post(`/api/v2/mpc/generatekey`, (body) => body.round === 'MPCv2-R3')
      .times(times)
      .reply(
        200,
        async (uri, { payload }: { payload: MPCv2KeyGenRound3Request }): Promise<MPCv2KeyGenRound3Response> => {
          const { sessionId, userMsg3, userMsg4, backupMsg3, backupMsg4 } = payload;

          const round3IncomingMsgs = await DklsComms.decryptAndVerifyIncomingMessages(
            {
              p2pMessages: [
                {
                  from: userMsg3.from,
                  to: userMsg3.to,
                  payload: { signature: userMsg3.signature, encryptedMessage: userMsg3.encryptedMessage },
                  commitment: storedUserCommitment2,
                },
                {
                  from: backupMsg3.from,
                  to: backupMsg3.to,
                  payload: { signature: backupMsg3.signature, encryptedMessage: backupMsg3.encryptedMessage },
                  commitment: storedBackupCommitment2,
                },
              ],
              broadcastMessages: [],
            },
            [userGpgPubKey, backupGpgPubKey],
            [bitgoGpgPrvKey]
          );

          const round4Messages = DklsTypes.serializeMessages(
            bitgoSession.handleIncomingMessages(DklsTypes.deserializeMessages(round3IncomingMsgs))
          );
          const round4SignedMessages = await DklsComms.encryptAndAuthOutgoingMessages(
            round4Messages,
            [],
            [bitgoGpgPrvKey]
          );
          const bitgoMsg4 = round4SignedMessages.broadcastMessages.find((m) => m.from === 2);
          assert(bitgoMsg4, 'bitgoMsg4 not found');

          const round4IncomingMsgs = await DklsComms.decryptAndVerifyIncomingMessages(
            {
              p2pMessages: [],
              broadcastMessages: [
                {
                  from: userMsg4.from,

                  payload: { signature: userMsg4.signature, message: userMsg4.message },
                },
                {
                  from: backupMsg4.from,

                  payload: { signature: backupMsg4.signature, message: backupMsg4.message },
                },
              ],
            },
            [userGpgPubKey, backupGpgPubKey],
            []
          );
          bitgoSession.handleIncomingMessages(DklsTypes.deserializeMessages(round4IncomingMsgs));
          const keyShare = bitgoSession.getKeyShare();
          const commonKeychain = DklsTypes.getCommonKeychain(keyShare);

          return {
            sessionId,
            commonKeychain: commonKeychain as any, // NonEmptyString
            bitgoMsg4: { from: 2, ...bitgoMsg4.payload },
          };
        }
      );
  }

  async function nockAddKeyChain(coin: string, times = 1) {
    return nock('https://bitgo.fakeurl')
      .post(`/api/v2/${coin}/key`, (body) => body.keyType === 'tss' && body.isMPCv2)
      .times(times)
      .reply(200, async (uri, requestBody: AddKeychainOptions) => {
        return {
          id: requestBody.source,
          source: requestBody.source,
          keyType: requestBody.keyType,
          commonKeychain: requestBody.commonKeychain,
          encryptedPrv: requestBody.encryptedPrv,
        };
      });
  }
});
