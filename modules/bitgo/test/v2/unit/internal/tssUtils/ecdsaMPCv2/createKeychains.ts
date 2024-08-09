import * as assert from 'assert';
import * as nock from 'nock';
import * as openpgp from 'openpgp';
import * as crypto from 'crypto';

import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { AddKeychainOptions, BaseCoin, common, ECDSAUtils, Keychain, Wallet } from '@bitgo/sdk-core';
import { bigIntToBufferBE, DklsComms, DklsDkg, DklsDsg, DklsTypes, DklsUtils } from '@bitgo/sdk-lib-mpc';
import {
  KeyCreationMPCv2StateEnum,
  MPCv2KeyGenRound1Request,
  MPCv2KeyGenRound1Response,
  MPCv2KeyGenRound2Request,
  MPCv2KeyGenRound2Response,
  MPCv2KeyGenRound3Request,
  MPCv2KeyGenRound3Response,
  OVC1ToBitgoRound3Payload,
  OVC1ToOVC2Round1Payload,
  OVC1ToOVC2Round2Payload,
  OVC1ToOVC2Round3Payload,
  OVC2ToBitgoRound1Payload,
  OVC2ToBitgoRound2Payload,
  OVC2ToOVC1Round3Payload,
  OVCIndexEnum,
  WalletTypeEnum,
} from '@bitgo/public-types';
import { NonEmptyString } from 'io-ts-types';
import { BitGo, BitgoGPGPublicKey } from '../../../../../../src';
import * as v1Fixtures from './fixtures/mpcv1KeyShares';

describe('TSS Ecdsa MPCv2 Utils:', async function () {
  const coinName = 'hteth';
  const walletId = '5b34252f1bf349930e34020a00000000';
  const enterpriseId = '6449153a6f6bc20006d66771cdbe15d3';
  let storedUserCommitment2: string;
  let storedBackupCommitment2: string;
  let storedBitgoCommitment2: string;

  let bgUrl: string;
  let tssUtils: ECDSAUtils.EcdsaMPCv2Utils;
  let wallet: Wallet;
  let bitgo: TestableBG & BitGo;
  let baseCoin: BaseCoin;
  let bitGoGgpKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let constants: { mpc: { bitgoPublicKey: string; bitgoMPCv2PublicKey: string } };
  let bitgoGpgPrvKey: { partyId: number; gpgKey: string };
  let userGpgPubKey: { partyId: number; gpgKey: string };
  let backupGpgPubKey: { partyId: number; gpgKey: string };
  let bitgoGpgPubKey: { partyId: number; gpgKey: string };

  beforeEach(async function () {
    nock.cleanAll();
    await nockGetBitgoPublicKeyBasedOnFeatureFlags(coinName, enterpriseId, bitGoGgpKey);
    nock(bgUrl).get('/api/v1/client/constants').times(16).reply(200, { ttl: 3600, constants });
  });

  before(async function () {
    bitGoGgpKey = await openpgp.generateKey({
      userIDs: [
        {
          name: 'bitgo',
          email: 'bitgo@test.com',
        },
      ],
      curve: 'secp256k1',
    });
    constants = {
      mpc: {
        bitgoPublicKey: bitGoGgpKey.publicKey,
        bitgoMPCv2PublicKey: bitGoGgpKey.publicKey,
      },
    };

    bitgoGpgPubKey = {
      partyId: 2,
      gpgKey: bitGoGgpKey.publicKey,
    };

    bitgoGpgPrvKey = {
      partyId: 2,
      gpgKey: bitGoGgpKey.privateKey,
    };

    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();

    baseCoin = bitgo.coin(coinName);

    bgUrl = common.Environments[bitgo.getEnv()].uri;

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

  describe('Retrofit MPCv1 to MPCv2 keys', async function () {
    it('should generate TSS MPCv2 keys from MPCv1 keys and sign a message', async function () {
      const retrofitData = tssUtils.getMpcV2RetrofitDataFromMpcV1Keys({
        mpcv1UserKeyShare: JSON.stringify(v1Fixtures.mockUserSigningMaterial),
        mpcv1BackupKeyShare: JSON.stringify(v1Fixtures.mockBackupSigningMaterial),
      });
      const bitgoRetrofitData: DklsTypes.RetrofitData = {
        xiList: retrofitData.mpcv2UserKeyShare.xiList,
        xShare: v1Fixtures.mockBitGoShareSigningMaterial.xShare,
      };
      const [user, backup, bitgo] = await DklsUtils.generateDKGKeyShares(
        retrofitData.mpcv2UserKeyShare,
        retrofitData.mpcv2BackupKeyShare,
        bitgoRetrofitData
      );
      assert.ok(bitgo.getKeyShare());
      const messageToSign = crypto.createHash('sha256').update(Buffer.from('ffff', 'hex')).digest();
      const derivationPath = 'm/999/988/0/0';
      const signature = await DklsUtils.executeTillRound(
        5,
        new DklsDsg.Dsg(user.getKeyShare(), 0, derivationPath, messageToSign),
        new DklsDsg.Dsg(backup.getKeyShare(), 1, derivationPath, messageToSign)
      );
      const convertedSignature = DklsUtils.verifyAndConvertDklsSignature(
        Buffer.from('ffff', 'hex'),
        signature as DklsTypes.DeserializedDklsSignature,
        v1Fixtures.mockBitGoShareSigningMaterial.xShare.y + v1Fixtures.mockBitGoShareSigningMaterial.xShare.chaincode,
        derivationPath
      );
      assert.ok(convertedSignature);
      convertedSignature.split(':').length.should.equal(4);
    });
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

    it('should generate TSS MPCv2 keys for retrofit', async function () {
      const xiList = [
        Array.from(bigIntToBufferBE(BigInt(1), 32)),
        Array.from(bigIntToBufferBE(BigInt(2), 32)),
        Array.from(bigIntToBufferBE(BigInt(3), 32)),
      ];
      const bitgoRetrofitData: DklsTypes.RetrofitData = {
        xiList,
        xShare: v1Fixtures.mockBitGoShareSigningMaterial.xShare,
      };
      const bitgoSession = new DklsDkg.Dkg(3, 2, ECDSAUtils.MPCv2PartiesEnum.BITGO, undefined, bitgoRetrofitData);

      const round1Nock = await nockKeyGenRound1(bitgoSession, 1);
      const round2Nock = await nockKeyGenRound2(bitgoSession, 1);
      const round3Nock = await nockKeyGenRound3(bitgoSession, 1);
      const addKeyNock = await nockAddKeyChain(coinName, 3);
      const params: Parameters<typeof tssUtils.createKeychains>[0] = {
        passphrase: 'test',
        enterprise: enterpriseId,
        originalPasscodeEncryptionCode: '123456',
        retrofit: {
          decryptedUserKey: JSON.stringify(v1Fixtures.mockUserSigningMaterial),
          decryptedBackupKey: JSON.stringify(v1Fixtures.mockBackupSigningMaterial),
          walletId: '123',
        },
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

    it('should create TSS MPCv2 key chains with OVCs', async function () {
      const MPCv2SMCUtils = new ECDSAUtils.MPCv2SMCUtils(bitgo, baseCoin);
      const bitgoSession = new DklsDkg.Dkg(3, 2, 2);

      const round1Nock = await nockKeyGenRound1(bitgoSession, 1);
      const round2Nock = await nockKeyGenRound2(bitgoSession, 1);
      const round3Nock = await nockKeyGenRound3(bitgoSession, 1);
      const addKeyNock = await nockAddKeyChain(coinName, 3);

      // OVC 1 - User GPG key
      const userGgpKey = await openpgp.generateKey({
        userIDs: [
          {
            name: 'user',
            email: 'user@test.com',
          },
        ],
        curve: 'secp256k1',
      });
      const userGpgPrvKey = {
        partyId: 0,
        gpgKey: userGgpKey.privateKey,
      };

      // Round 1 User
      const userSession = new DklsDkg.Dkg(3, 2, 0);
      let OVC1ToOVC2Round1Payload: OVC1ToOVC2Round1Payload;
      {
        const userBroadcastMsg1Unsigned = await userSession.initDkg();
        const userMsgs1Signed = await DklsComms.encryptAndAuthOutgoingMessages(
          { broadcastMessages: [DklsTypes.serializeBroadcastMessage(userBroadcastMsg1Unsigned)], p2pMessages: [] },
          [],
          [userGpgPrvKey]
        );
        const userMsg1 = userMsgs1Signed.broadcastMessages.find((m) => m.from === 0);
        assert(userMsg1, 'userMsg1 not found');

        OVC1ToOVC2Round1Payload = {
          tssVersion: '0.0.1' as NonEmptyString,
          walletType: WalletTypeEnum.tss,
          coin: 'eth' as NonEmptyString,
          state: KeyCreationMPCv2StateEnum.WaitingForOVC2Round1Data,
          ovc: {
            [OVCIndexEnum.ONE]: {
              gpgPubKey: userGgpKey.publicKey as NonEmptyString,
              ovcMsg1: userMsg1 as any,
            },
          },
        };
      }

      // OVC 2 - Backup GPG key
      const backupGgpKey = await openpgp.generateKey({
        userIDs: [
          {
            name: 'backup',
            email: 'backup@test.com',
          },
        ],
        curve: 'secp256k1',
      });

      const backupGpgPrvKey = {
        partyId: 1,
        gpgKey: backupGgpKey.privateKey,
      };
      // Round 1 Backup
      const backupSession = new DklsDkg.Dkg(3, 2, 1);
      let OVC2ToBitgoRound1Payload: OVC2ToBitgoRound1Payload;
      {
        assert(OVC1ToOVC2Round1Payload.state === 0, 'OVC1ToOVC2Round1Payload.state should be 0');
        const backupBroadcastMsg1Unsigned = await backupSession.initDkg();
        const backupMsgs1Signed = await DklsComms.encryptAndAuthOutgoingMessages(
          { broadcastMessages: [DklsTypes.serializeBroadcastMessage(backupBroadcastMsg1Unsigned)], p2pMessages: [] },
          [],
          [backupGpgPrvKey]
        );
        const backupMsg1 = backupMsgs1Signed.broadcastMessages.find((m) => m.from === 1);
        assert(backupMsg1, 'backupMsg1 not found');

        OVC2ToBitgoRound1Payload = {
          ...OVC1ToOVC2Round1Payload,
          state: KeyCreationMPCv2StateEnum.WaitingForBitgoRound1Data,
          ovc: {
            ...OVC1ToOVC2Round1Payload.ovc,
            [OVCIndexEnum.TWO]: {
              gpgPubKey: backupGgpKey.publicKey as NonEmptyString,
              ovcMsg1: backupMsg1 as any,
            },
          },
        };
      }

      // Round 1 BitGo
      const bitgoToOVC1Round1Payload = await MPCv2SMCUtils.keyGenRound1('testId', OVC2ToBitgoRound1Payload);

      // Round 2 User
      let OVC1ToOVC2Round2Payload: OVC1ToOVC2Round2Payload;
      {
        assert(bitgoToOVC1Round1Payload.state === 2, 'bitgoToOVC1Round1Payload.state should be 2');
        const toUserRound1BroadcastMessages = await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [],
            broadcastMessages: [
              bitgoToOVC1Round1Payload.ovc[OVCIndexEnum.TWO].ovcMsg1,
              bitgoToOVC1Round1Payload.platform.bitgoMsg1,
            ],
          },
          [bitgoGpgPubKey, { partyId: 1, gpgKey: bitgoToOVC1Round1Payload.ovc[OVCIndexEnum.TWO].gpgPubKey }],
          [userGpgPrvKey]
        );

        const userRound2P2PMessages = userSession.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: toUserRound1BroadcastMessages.broadcastMessages.map(DklsTypes.deserializeBroadcastMessage),
        });
        const userRound2Messages = await DklsComms.encryptAndAuthOutgoingMessages(
          DklsTypes.serializeMessages(userRound2P2PMessages),
          [{ partyId: 1, gpgKey: bitgoToOVC1Round1Payload.ovc[OVCIndexEnum.TWO].gpgPubKey }, bitgoGpgPubKey],
          [userGpgPrvKey]
        );
        const userToBackupMsg2 = userRound2Messages.p2pMessages.find(
          (m) => m.from === ECDSAUtils.MPCv2PartiesEnum.USER && m.to === ECDSAUtils.MPCv2PartiesEnum.BACKUP
        );
        assert(userToBackupMsg2, 'userToBackupMsg2 not found');
        const userToBitgoMsg2 = userRound2Messages.p2pMessages.find(
          (m) => m.from === ECDSAUtils.MPCv2PartiesEnum.USER && m.to === ECDSAUtils.MPCv2PartiesEnum.BITGO
        );
        assert(userToBitgoMsg2, 'userToBitgoMsg2 not found');

        OVC1ToOVC2Round2Payload = {
          ...bitgoToOVC1Round1Payload,
          state: KeyCreationMPCv2StateEnum.WaitingForOVC2Round2Data,
          ovc: {
            ...bitgoToOVC1Round1Payload.ovc,
            [OVCIndexEnum.ONE]: Object.assign(bitgoToOVC1Round1Payload.ovc[OVCIndexEnum.ONE], {
              ovcToBitgoMsg2: userToBitgoMsg2,
              ovcToOvcMsg2: userToBackupMsg2,
            }) as any,
          },
        };
      }

      // Round 2 Backup
      let OVC2ToBitgoRound2Payload: OVC2ToBitgoRound2Payload;

      {
        assert(OVC1ToOVC2Round2Payload.state === 3, 'bitgoToOVC1Round1Payload.state should be 3');
        const toBackupRound1BroadcastMessages = await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [],
            broadcastMessages: [
              bitgoToOVC1Round1Payload.ovc[OVCIndexEnum.ONE].ovcMsg1,
              bitgoToOVC1Round1Payload.platform.bitgoMsg1,
            ],
          },
          [bitgoGpgPubKey, { partyId: 0, gpgKey: OVC1ToOVC2Round2Payload.ovc[OVCIndexEnum.ONE].gpgPubKey }],
          [backupGpgPrvKey]
        );

        const backupRound2P2PMessages = backupSession.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: toBackupRound1BroadcastMessages.broadcastMessages.map(
            DklsTypes.deserializeBroadcastMessage
          ),
        });
        const backupRound2Messages = await DklsComms.encryptAndAuthOutgoingMessages(
          DklsTypes.serializeMessages(backupRound2P2PMessages),
          [{ partyId: 0, gpgKey: bitgoToOVC1Round1Payload.ovc[OVCIndexEnum.ONE].gpgPubKey }, bitgoGpgPubKey],
          [backupGpgPrvKey]
        );
        const backupToUserMsg2 = backupRound2Messages.p2pMessages.find(
          (m) => m.from === ECDSAUtils.MPCv2PartiesEnum.BACKUP && m.to === ECDSAUtils.MPCv2PartiesEnum.USER
        );
        assert(backupToUserMsg2, 'backupToUserMsg2 not found');
        const backupToBitgoMsg2 = backupRound2Messages.p2pMessages.find(
          (m) => m.from === ECDSAUtils.MPCv2PartiesEnum.BACKUP && m.to === ECDSAUtils.MPCv2PartiesEnum.BITGO
        );
        assert(backupToBitgoMsg2, 'backupToBitgoMsg2 not found');

        OVC2ToBitgoRound2Payload = {
          ...OVC1ToOVC2Round2Payload,
          state: KeyCreationMPCv2StateEnum.WaitingForBitgoRound2Data,
          ovc: {
            ...OVC1ToOVC2Round2Payload.ovc,
            [OVCIndexEnum.TWO]: Object.assign(OVC1ToOVC2Round2Payload.ovc[OVCIndexEnum.TWO], {
              ovcToBitgoMsg2: backupToBitgoMsg2,
              ovcToOvcMsg2: backupToUserMsg2,
            }) as any,
          },
        };
      }

      // Round 2 BitGo
      // call bitgo round 2
      const bitgoToOVC1Round2Payload = await MPCv2SMCUtils.keyGenRound2('testId', OVC2ToBitgoRound2Payload);

      // Round 3A User
      let OVC1ToOVC2Round3Payload: OVC1ToOVC2Round3Payload;
      {
        assert(bitgoToOVC1Round2Payload.state === 5, 'bitgoToOVC1Round2Payload.state should be 5');
        const toUserRound2P2PMessages = await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [
              bitgoToOVC1Round2Payload.ovc[OVCIndexEnum.TWO].ovcToOvcMsg2,
              bitgoToOVC1Round2Payload.platform.ovc[OVCIndexEnum.ONE].bitgoToOvcMsg2,
            ],
            broadcastMessages: [],
          },
          [bitgoGpgPubKey, { partyId: 1, gpgKey: bitgoToOVC1Round2Payload.ovc[OVCIndexEnum.TWO].gpgPubKey }],
          [userGpgPrvKey]
        );
        const userRound3AP2PMessages = userSession.handleIncomingMessages({
          p2pMessages: toUserRound2P2PMessages.p2pMessages.map(DklsTypes.deserializeP2PMessage),
          broadcastMessages: [],
        }).p2pMessages;

        const userRound3AMessages = await DklsComms.encryptAndAuthOutgoingMessages(
          DklsTypes.serializeMessages({
            p2pMessages: userRound3AP2PMessages,
            broadcastMessages: [],
          }),
          [{ partyId: 1, gpgKey: bitgoToOVC1Round2Payload.ovc[OVCIndexEnum.TWO].gpgPubKey }, bitgoGpgPubKey],
          [userGpgPrvKey]
        );

        const userToBitgoMsg3 = userRound3AMessages.p2pMessages.find(
          (m) => m.from === ECDSAUtils.MPCv2PartiesEnum.USER && m.to === ECDSAUtils.MPCv2PartiesEnum.BITGO
        );
        assert(userToBitgoMsg3, 'userToBitgoMsg3 not found');
        const userToBackupMsg3 = userRound3AMessages.p2pMessages.find(
          (m) => m.from === ECDSAUtils.MPCv2PartiesEnum.USER && m.to === ECDSAUtils.MPCv2PartiesEnum.BACKUP
        );
        assert(userToBackupMsg3, 'userToBackupMsg3 not found');

        OVC1ToOVC2Round3Payload = {
          ...bitgoToOVC1Round2Payload,
          state: KeyCreationMPCv2StateEnum.WaitingForOVC2Round3Data,
          ovc: {
            ...bitgoToOVC1Round2Payload.ovc,
            [OVCIndexEnum.ONE]: Object.assign(bitgoToOVC1Round2Payload.ovc[OVCIndexEnum.ONE], {
              ovcToBitgoMsg3: userToBitgoMsg3,
              ovcToOvcMsg3: userToBackupMsg3,
            }) as any,
          },
        };
      }

      // Round 3 Backup
      let OVC2ToOVC1Round3Payload: OVC2ToOVC1Round3Payload;
      {
        assert(OVC1ToOVC2Round3Payload.state === 6, 'OVC1ToOVC2Round3Payload.state should be 6');
        const toBackupRound3P2PMessages = await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [
              OVC1ToOVC2Round3Payload.ovc[OVCIndexEnum.ONE].ovcToOvcMsg2,
              OVC1ToOVC2Round3Payload.platform.ovc[OVCIndexEnum.TWO].bitgoToOvcMsg2,
            ],
            broadcastMessages: [],
          },
          [bitgoGpgPubKey, { partyId: 0, gpgKey: OVC1ToOVC2Round3Payload.ovc[OVCIndexEnum.ONE].gpgPubKey }],
          [backupGpgPrvKey]
        );

        const backupRound3P2PMessages = backupSession.handleIncomingMessages({
          p2pMessages: toBackupRound3P2PMessages.p2pMessages.map(DklsTypes.deserializeP2PMessage),
          broadcastMessages: [],
        });

        const backupRound3Messages = await DklsComms.encryptAndAuthOutgoingMessages(
          DklsTypes.serializeMessages(backupRound3P2PMessages),
          [{ partyId: 0, gpgKey: OVC1ToOVC2Round3Payload.ovc[OVCIndexEnum.ONE].gpgPubKey }, bitgoGpgPubKey],
          [backupGpgPrvKey]
        );

        const backupToBitgoMsg3 = backupRound3Messages.p2pMessages.find(
          (m) => m.from === ECDSAUtils.MPCv2PartiesEnum.BACKUP && m.to === ECDSAUtils.MPCv2PartiesEnum.BITGO
        );
        assert(backupToBitgoMsg3, 'backupToBitgoMsg3 not found');
        const backupToUserMsg3 = backupRound3Messages.p2pMessages.find(
          (m) => m.from === ECDSAUtils.MPCv2PartiesEnum.BACKUP && m.to === ECDSAUtils.MPCv2PartiesEnum.USER
        );
        assert(backupToUserMsg3, 'backupToUserMsg3 not found');

        const toBackupRound3Messages = await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [
              {
                ...OVC1ToOVC2Round3Payload.ovc[OVCIndexEnum.ONE].ovcToOvcMsg3,
                commitment: OVC1ToOVC2Round3Payload.ovc[OVCIndexEnum.ONE].ovcToOvcMsg2.commitment,
              },
              {
                ...OVC1ToOVC2Round3Payload.platform.ovc[OVCIndexEnum.TWO].bitgoToOvcMsg3,
                commitment: OVC1ToOVC2Round3Payload.platform.bitgoCommitment2,
              },
            ],
            broadcastMessages: [],
          },
          [bitgoGpgPubKey, { partyId: 0, gpgKey: OVC1ToOVC2Round3Payload.ovc[OVCIndexEnum.ONE].gpgPubKey }],
          [backupGpgPrvKey]
        );

        const backupRound4Messages = backupSession.handleIncomingMessages({
          p2pMessages: toBackupRound3Messages.p2pMessages.map(DklsTypes.deserializeP2PMessage),
          broadcastMessages: [],
        }).broadcastMessages;

        const backupRound4BroadcastMessages = await DklsComms.encryptAndAuthOutgoingMessages(
          DklsTypes.serializeMessages({
            p2pMessages: [],
            broadcastMessages: backupRound4Messages,
          }),
          [],
          [backupGpgPrvKey]
        );

        const backupMsg4 = backupRound4BroadcastMessages.broadcastMessages.find(
          (m) => m.from === ECDSAUtils.MPCv2PartiesEnum.BACKUP
        );
        assert(backupMsg4, 'backupMsg4 not found');

        OVC2ToOVC1Round3Payload = {
          ...OVC1ToOVC2Round3Payload,
          state: KeyCreationMPCv2StateEnum.WaitingForOVC1Round3bData,
          ovc: {
            ...OVC1ToOVC2Round3Payload.ovc,
            [OVCIndexEnum.TWO]: Object.assign(OVC1ToOVC2Round3Payload.ovc[OVCIndexEnum.TWO], {
              ovcToOvcMsg3: backupToUserMsg3,
              ovcToBitgoMsg3: backupToBitgoMsg3,
              ovcMsg4: backupMsg4,
            }) as any,
          },
        };
      }

      // Round 3B User
      let OVC1ToBitgoRound3BPayload: OVC1ToBitgoRound3Payload;
      {
        assert(OVC2ToOVC1Round3Payload.state === 7, 'OVC2ToOVC1Round3Payload.state should be 7');
        const toUserRound4Messages = await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [
              {
                ...OVC2ToOVC1Round3Payload.ovc[OVCIndexEnum.TWO].ovcToOvcMsg3,
                commitment: OVC2ToOVC1Round3Payload.ovc[OVCIndexEnum.TWO].ovcToOvcMsg2.commitment,
              },
              {
                ...OVC2ToOVC1Round3Payload.platform.ovc[OVCIndexEnum.ONE].bitgoToOvcMsg3,
                commitment: OVC2ToOVC1Round3Payload.platform.bitgoCommitment2,
              },
            ],
            broadcastMessages: [],
          },
          [bitgoGpgPubKey, { partyId: 1, gpgKey: OVC2ToOVC1Round3Payload.ovc[OVCIndexEnum.TWO].gpgPubKey }],
          [userGpgPrvKey]
        );

        const userRound4BroadcastMessages = userSession.handleIncomingMessages({
          p2pMessages: toUserRound4Messages.p2pMessages.map(DklsTypes.deserializeP2PMessage),
          broadcastMessages: [],
        }).broadcastMessages;
        assert(userRound4BroadcastMessages.length === 1, 'userRound4BroadcastMessages length should be 1');

        const userRound4Messages = await DklsComms.encryptAndAuthOutgoingMessages(
          DklsTypes.serializeMessages({
            p2pMessages: [],
            broadcastMessages: userRound4BroadcastMessages,
          }),
          [],
          [userGpgPrvKey]
        );

        const userMsg4 = userRound4Messages.broadcastMessages.find((m) => m.from === ECDSAUtils.MPCv2PartiesEnum.USER);
        assert(userMsg4, 'userMsg4 not found');

        OVC1ToBitgoRound3BPayload = {
          ...OVC2ToOVC1Round3Payload,
          state: KeyCreationMPCv2StateEnum.WaitingForBitgoRound3Data,
          ovc: {
            ...OVC2ToOVC1Round3Payload.ovc,
            [OVCIndexEnum.ONE]: Object.assign(OVC2ToOVC1Round3Payload.ovc[OVCIndexEnum.ONE], {
              ovcMsg4: userMsg4,
            }) as any,
          },
        };
      }

      // Round 3 BitGo
      // creates bitgo keychain
      const bitgoToOVC1Round3Payload = await MPCv2SMCUtils.keyGenRound3('testId', OVC1ToBitgoRound3BPayload);

      // Round 4 User
      let userCommonKeychain: string;
      let OVC1ToOVC2Round4Payload;
      {
        assert(bitgoToOVC1Round3Payload.state === 9, 'bitgoToOVC1Round3Payload.state should be 9');
        assert(bitgoToOVC1Round3Payload.bitGoKeyId, 'bitgoToOVC1Round3Payload.bitGoKeyId not found');
        const toUserBitgoRound3Msg = await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [],
            broadcastMessages: [
              bitgoToOVC1Round3Payload.ovc[OVCIndexEnum.TWO].ovcMsg4,
              bitgoToOVC1Round3Payload.platform.bitgoMsg4,
            ],
          },
          [bitgoGpgPubKey, { partyId: 1, gpgKey: bitgoToOVC1Round3Payload.ovc[OVCIndexEnum.TWO].gpgPubKey }],
          [userGpgPrvKey]
        );

        userSession.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: toUserBitgoRound3Msg.broadcastMessages.map(DklsTypes.deserializeBroadcastMessage),
        });

        const userPrivateMaterial = userSession.getKeyShare();
        userCommonKeychain = DklsTypes.getCommonKeychain(userPrivateMaterial);
        assert.equal(
          bitgoToOVC1Round3Payload.platform.commonKeychain,
          userCommonKeychain,
          'User and Bitgo Common keychains do not match'
        );
        const userPrv = userPrivateMaterial.toString('base64');
        assert(userPrv, 'userPrv not found');

        OVC1ToOVC2Round4Payload = {
          bitgoKeyId: bitgoToOVC1Round3Payload.bitGoKeyId,
          ...bitgoToOVC1Round3Payload,
          state: KeyCreationMPCv2StateEnum.WaitingForOVC2GenerateKey,
        };
      }

      // Round 4 Backup
      let backupCommonKeychain: string;
      {
        assert(OVC1ToOVC2Round4Payload.state === 10, 'OVC1ToOVC2Round4Payload.state should be 10');
        assert(OVC1ToOVC2Round4Payload.bitgoKeyId, 'OVC1ToOVC2Round4Payload.bitGoKeyId not found');

        const toBackupBitgoRound3Msg = await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [],
            broadcastMessages: [
              OVC1ToOVC2Round4Payload.ovc[OVCIndexEnum.ONE].ovcMsg4,
              OVC1ToOVC2Round4Payload.platform.bitgoMsg4,
            ],
          },
          [bitgoGpgPubKey, { partyId: 0, gpgKey: OVC1ToOVC2Round4Payload.ovc[OVCIndexEnum.ONE].gpgPubKey }],
          [backupGpgPrvKey]
        );

        backupSession.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: toBackupBitgoRound3Msg.broadcastMessages.map(DklsTypes.deserializeBroadcastMessage),
        });

        const backupPrivateMaterial = backupSession.getKeyShare();
        backupCommonKeychain = DklsTypes.getCommonKeychain(backupPrivateMaterial);
        assert.equal(
          OVC1ToOVC2Round4Payload.platform.commonKeychain,
          backupCommonKeychain,
          'Backup and Bitgo Common keychains do not match'
        );
        const backupPrv = backupPrivateMaterial.toString('base64');
        assert(backupPrv, 'backupPrv not found');
      }

      // Round 4 BitGo
      // creates user and backup keychain
      const keychains = await MPCv2SMCUtils.uploadClientKeys(
        bitgoToOVC1Round3Payload.bitGoKeyId,
        userCommonKeychain,
        backupCommonKeychain
      );
      assert.deepEqual(keychains.userKeychain, {
        commonKeychain: userCommonKeychain,
        type: 'tss',
        source: 'user',
        id: 'user',
      });
      assert.deepEqual(keychains.backupKeychain, {
        commonKeychain: backupCommonKeychain,
        type: 'tss',
        source: 'backup',
        id: 'backup',
      });
      assert.ok(round1Nock.isDone());
      assert.ok(round2Nock.isDone());
      assert.ok(round3Nock.isDone());
      assert.ok(addKeyNock.isDone());
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
            sessionId: 'testid' as NonEmptyString,
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
            bitgoCommitment2: storedBitgoCommitment2 as NonEmptyString,
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
            commonKeychain: commonKeychain as NonEmptyString,
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
        const key = {
          id: requestBody.source,
          source: requestBody.source,
          type: requestBody.keyType,
          commonKeychain: requestBody.commonKeychain,
          encryptedPrv: requestBody.encryptedPrv,
        };
        // nock gets
        nock('https://bitgo.fakeurl').get(`/api/v2/${coin}/key/${requestBody.source}`).reply(200, key);
        return key;
      });
  }
});
