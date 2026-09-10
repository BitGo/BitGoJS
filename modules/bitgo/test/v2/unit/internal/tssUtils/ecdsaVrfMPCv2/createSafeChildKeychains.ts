import * as assert from 'assert';
import nock = require('nock');
import * as openpgp from 'openpgp';
import { decode } from 'cbor-x';

import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { AddKeychainOptions, common, ECDSAUtils, Wallet } from '@bitgo/sdk-core';
import { DklsComms, DklsDrv, DklsTypes, DklsUtils, DklsVrfUtils } from '@bitgo/sdk-lib-mpc';
import { MPCv2DeriveRound1Request, MPCv2DeriveRound2Request, MPCv2DeriveRound3Request } from '@bitgo/public-types';
import { NonEmptyString } from 'io-ts-types';
import { BitGo, BitgoGPGPublicKey } from '../../../../../../src';

const SAFE_ID = '6fa8537e3ef5a878fd3ae899f3ab7e5a';
const USER_ROOT_KEY_ID = 'root-user-key-id';
const DERIVATION_INDEX = 0;
const BITGO_ROOT_KEY_ID = 'root-bitgo-key-id';
const BACKUP_ROOT_KEY_ID = 'root-backup-key-id';
const PATH_M0 = new Uint8Array([0x80, 0x00, 0x00, 0x00]);

describe('TSS ECDSA safe child keychains (user/BitGo hard derive):', async function () {
  const coinName = 'hteth';
  const enterpriseId = '6449153a6f6bc20006d66771cdbe15d3';
  let bgUrl: string;
  let bitgo: TestableBG & BitGo;
  let tssUtils: ECDSAUtils.EcdsaVrfMPCv2Utils;
  let wallet: Wallet;
  let bitGoGpgKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let constants: { mpc: { bitgoPublicKey: string; bitgoMPCv2PublicKey: string } };
  let bitgoGpgPrvKey: { partyId: number; gpgKey: string };
  let userGpgPubKey: { partyId: number; gpgKey: string };
  let stagedBitgoMsg2: { message: string; signature: string } | undefined;

  before(async function () {
    openpgp.config.rejectCurves = new Set();
    bitGoGpgKey = await openpgp.generateKey({
      userIDs: [{ name: 'bitgo', email: 'bitgo@test.com' }],
      curve: 'secp256k1',
    });
    constants = {
      mpc: {
        bitgoPublicKey: bitGoGpgKey.publicKey,
        bitgoMPCv2PublicKey: bitGoGpgKey.publicKey,
      },
    };
    bitgoGpgPrvKey = { partyId: 2, gpgKey: bitGoGpgKey.privateKey };

    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
    bgUrl = common.Environments[bitgo.getEnv()].uri;

    const baseCoin = bitgo.coin(coinName);
    wallet = new Wallet(bitgo, baseCoin, {
      id: '5b34252f1bf349930e34020a00000000',
      enterprise: enterpriseId,
      coin: coinName,
      coinSpecific: {},
      multisigType: 'tss',
    });
    tssUtils = new ECDSAUtils.EcdsaVrfMPCv2Utils(bitgo, baseCoin, wallet);
  });

  beforeEach(async function () {
    nock.cleanAll();
    stagedBitgoMsg2 = undefined;
    await nockGetBitgoPublicKeyBasedOnFeatureFlags(coinName, enterpriseId, bitGoGpgKey);
    nock(bgUrl).get('/api/v1/client/constants').times(32).reply(200, { ttl: 3600, constants });
  });

  after(function () {
    nock.cleanAll();
  });

  it('should derive the user child and register the backup without encryptedPrv', async function () {
    const [userRoot, , bitgoRoot] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, , vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const bitgoPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);

    const round1Nock = await nockDeriveRound1(bitgoPair);
    const round2Nock = await nockDeriveRound2(bitgoPair);
    const round3Nock = await nockDeriveRound3(bitgoPair);
    const addKeyNock = await nockAddChildKey(coinName, 2);

    const { userKeychain, backupKeychain } = await tssUtils.createSafeChildKeychains({
      passphrase: 'test',
      enterprise: enterpriseId,
      safeId: SAFE_ID,
      parentKeyId: BITGO_ROOT_KEY_ID,
      derivationIndex: DERIVATION_INDEX,
      userRootKeyId: USER_ROOT_KEY_ID,
      backupRootKeyId: BACKUP_ROOT_KEY_ID,
      userRootKeyShare: userRoot.getKeyShare(),
      userRootVrfKeyShare: vrfUser.getKeyShare(),
    });

    assert.ok(round1Nock.isDone());
    assert.ok(round2Nock.isDone());
    assert.ok(round3Nock.isDone());
    assert.ok(addKeyNock.isDone());
    assert.equal(userKeychain.commonKeychain, backupKeychain.commonKeychain);
    assert.equal(userKeychain.commonKeychain, DklsTypes.getCommonKeychain(bitgoPair.getKeyShare()));

    const encryptedUserPrv = userKeychain.encryptedPrv;
    assert.ok(encryptedUserPrv);
    assert.equal(backupKeychain.encryptedPrv, undefined);
    const decryptedUserPrv = await bitgo.decrypt({ input: encryptedUserPrv, password: 'test' });
    const userChildShare = decode(Buffer.from(decryptedUserPrv, 'base64'));
    assert.equal(userChildShare.version, undefined);
    assert.equal(userChildShare.vrf, undefined);
    assert.equal(userChildShare.party_id, 0);
    assert.ok(userChildShare.s_i);
  });

  it('should derive at a non-zero hardened index and agree with the server', async function () {
    const idx = 7;
    const path = new Uint8Array([0x80 | (idx >>> 24), 0, 0, idx]);
    const [userRoot, , bitgoRoot] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, , vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const bitgoPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), path);

    const round1Nock = await nockDeriveRound1(bitgoPair, 1, idx);
    const round2Nock = await nockDeriveRound2(bitgoPair);
    const round3Nock = await nockDeriveRound3(bitgoPair);
    const addKeyNock = await nockAddChildKey(coinName, 2, idx);

    const { userKeychain, backupKeychain } = await tssUtils.createSafeChildKeychains({
      passphrase: 'test',
      enterprise: enterpriseId,
      safeId: SAFE_ID,
      parentKeyId: BITGO_ROOT_KEY_ID,
      derivationIndex: idx,
      userRootKeyId: USER_ROOT_KEY_ID,
      backupRootKeyId: BACKUP_ROOT_KEY_ID,
      userRootKeyShare: userRoot.getKeyShare(),
      userRootVrfKeyShare: vrfUser.getKeyShare(),
    });

    assert.ok(round1Nock.isDone());
    assert.ok(round2Nock.isDone());
    assert.ok(round3Nock.isDone());
    assert.ok(addKeyNock.isDone());
    assert.equal(userKeychain.commonKeychain, backupKeychain.commonKeychain);
  });

  it('should reject root key material that is not a valid VRF envelope', async function () {
    const [, , bitgoRoot] = await DklsUtils.generateDKGKeyShares();
    const [, , vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const bitgoPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);
    const round1Nock = await nockDeriveRound1(bitgoPair);
    const round2Nock = await nockDeriveRound2(bitgoPair);
    const round3Nock = await nockDeriveRound3(bitgoPair);

    await assert.rejects(
      () =>
        tssUtils.createSafeChildKeychains({
          passphrase: 'test',
          enterprise: enterpriseId,
          safeId: SAFE_ID,
          parentKeyId: BITGO_ROOT_KEY_ID,
          derivationIndex: DERIVATION_INDEX,
          userRootKeyId: USER_ROOT_KEY_ID,
          backupRootKeyId: BACKUP_ROOT_KEY_ID,
          userRootKeyShare: Buffer.from('garbage'),
          userRootVrfKeyShare: vrfBitgo.getKeyShare(),
        }),
      /CBOR decode|does not match root key share partyId|VRF keyshare/i
    );
    assert.ok(!round1Nock.isDone(), 'round 1 must not be sent for invalid root material');
    assert.ok(!round2Nock.isDone(), 'round 2 must not be sent for invalid root material');
    assert.ok(!round3Nock.isDone(), 'round 3 must not be sent for invalid root material');
  });

  it('should reject a root blob with a VRF partyId mismatch', async function () {
    const [userRoot, , bitgoRoot] = await DklsUtils.generateDKGKeyShares();
    const [, vrfBackup, vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const bitgoPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);
    const round1Nock = await nockDeriveRound1(bitgoPair);
    const round2Nock = await nockDeriveRound2(bitgoPair);
    const round3Nock = await nockDeriveRound3(bitgoPair);

    await assert.rejects(
      () =>
        tssUtils.createSafeChildKeychains({
          passphrase: 'test',
          enterprise: enterpriseId,
          safeId: SAFE_ID,
          parentKeyId: BITGO_ROOT_KEY_ID,
          derivationIndex: DERIVATION_INDEX,
          userRootKeyId: USER_ROOT_KEY_ID,
          backupRootKeyId: BACKUP_ROOT_KEY_ID,
          userRootKeyShare: userRoot.getKeyShare(),
          userRootVrfKeyShare: vrfBackup.getKeyShare(),
        }),
      /does not match VRF key share partyId/
    );
    assert.ok(!round1Nock.isDone(), 'round 1 must not be sent for mismatched VRF material');
    assert.ok(!round2Nock.isDone(), 'round 2 must not be sent for mismatched VRF material');
    assert.ok(!round3Nock.isDone(), 'round 3 must not be sent for mismatched VRF material');
  });

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

  async function nockDeriveRound1(bitgoPair: DklsDrv.Derive, times = 1, index = DERIVATION_INDEX) {
    return nock(bgUrl)
      .post(
        '/api/v2/mpc/generatekey',
        (body) =>
          body.round === 'MPCv2Derive-R1' &&
          body.safeId === SAFE_ID &&
          body.payload?.parentKeyId === BITGO_ROOT_KEY_ID &&
          body.payload?.derivationIndex === index &&
          body.payload?.userGpgPublicKey &&
          body.payload?.userMsg1 &&
          body.payload?.backupGpgPublicKey === undefined &&
          body.payload?.backupMsg1 === undefined
      )
      .times(times)
      .reply(200, async (uri, requestBody: { payload: MPCv2DeriveRound1Request }) => {
        const { userGpgPublicKey, userMsg1 } = requestBody.payload;
        userGpgPubKey = { partyId: 0, gpgKey: userGpgPublicKey };
        await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [],
            broadcastMessages: [{ from: 0, payload: { message: userMsg1.message, signature: userMsg1.signature } }],
          },
          [userGpgPubKey],
          []
        );

        const bitgoMsg1Unsigned = await bitgoPair.initDerive();
        const bitgoMsg2 = bitgoPair.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: [{ payload: Buffer.from(userMsg1.message, 'base64'), from: 0 }],
        });
        const signedStagedMessages = await DklsComms.encryptAndAuthOutgoingMessages(
          {
            broadcastMessages: [DklsTypes.serializeBroadcastMessage(bitgoMsg2.broadcastMessages[0])],
            p2pMessages: [],
          },
          [],
          [bitgoGpgPrvKey]
        );
        stagedBitgoMsg2 = signedStagedMessages.broadcastMessages[0].payload;

        const signedMessages = await DklsComms.encryptAndAuthOutgoingMessages(
          {
            broadcastMessages: [DklsTypes.serializeBroadcastMessage(bitgoMsg1Unsigned)],
            p2pMessages: [],
          },
          [],
          [bitgoGpgPrvKey]
        );
        const bitgoMsg1 = signedMessages.broadcastMessages[0];
        assert.ok(bitgoMsg1, 'bitgoMsg1 not found');
        return {
          sessionId: 'testid' as NonEmptyString,
          bitgoMsg1: { from: 2, ...bitgoMsg1.payload },
        };
      });
  }

  async function nockDeriveRound2(bitgoPair: DklsDrv.Derive, times = 1) {
    return nock(bgUrl)
      .post(
        '/api/v2/mpc/generatekey',
        (body) =>
          body.round === 'MPCv2Derive-R2' &&
          body.safeId === SAFE_ID &&
          body.payload?.sessionId === 'testid' &&
          body.payload?.userMsg2 &&
          body.payload?.backupMsg2 === undefined
      )
      .times(times)
      .reply(200, async (uri, requestBody: { payload: MPCv2DeriveRound2Request }) => {
        const { sessionId, userMsg2 } = requestBody.payload;
        await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [],
            broadcastMessages: [{ from: 0, payload: { message: userMsg2.message, signature: userMsg2.signature } }],
          },
          [userGpgPubKey],
          []
        );
        bitgoPair.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: [{ payload: Buffer.from(userMsg2.message, 'base64'), from: 0 }],
        });
        assert.ok(stagedBitgoMsg2, 'staged BitGo msg2 missing');
        return { sessionId, bitgoMsg2: { from: 2, ...stagedBitgoMsg2 } };
      });
  }

  async function nockDeriveRound3(bitgoPair: DklsDrv.Derive, times = 1) {
    return nock(bgUrl)
      .post(
        '/api/v2/mpc/generatekey',
        (body) => body.round === 'MPCv2Derive-R3' && body.safeId === SAFE_ID && body.payload?.sessionId === 'testid'
      )
      .times(times)
      .reply(200, async (uri, requestBody: { payload: MPCv2DeriveRound3Request }) => {
        const { sessionId } = requestBody.payload;
        return {
          sessionId,
          commonKeychain: DklsTypes.getCommonKeychain(bitgoPair.getKeyShare()) as NonEmptyString,
        };
      });
  }

  async function nockAddChildKey(coin: string, times = 2, index = DERIVATION_INDEX) {
    return nock('https://bitgo.fakeurl')
      .post(
        `/api/v2/${coin}/key`,
        (body: AddKeychainOptions & { derivedFromParentWithPath?: string }) =>
          body.keyType === 'tss' &&
          body.isMPCv2 === true &&
          body.safeId === SAFE_ID &&
          !!body.parent &&
          body.derivedFromParentWithPath === `m/${index}'`
      )
      .times(times)
      .reply(200, (uri, requestBody: AddKeychainOptions) => ({
        id: requestBody.source,
        source: requestBody.source,
        type: requestBody.keyType,
        commonKeychain: requestBody.commonKeychain,
        encryptedPrv: requestBody.encryptedPrv,
      }));
  }
});
