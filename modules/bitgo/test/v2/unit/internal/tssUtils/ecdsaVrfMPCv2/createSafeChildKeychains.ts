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
const BACKUP_ROOT_KEY_ID = 'root-backup-key-id';
const DERIVATION_INDEX = 0;
const BITGO_ROOT_KEY_ID = 'root-bitgo-key-id';
// Hardened path `m/0'` as a single big-endian u32 with the hardened bit set.
const PATH_M0 = new Uint8Array([0x80, 0x00, 0x00, 0x00]);

describe('TSS ECDSA safe child keychains (hard derive):', async function () {
  const coinName = 'hteth';
  const enterpriseId = '6449153a6f6bc20006d66771cdbe15d3';
  let bgUrl: string;
  let bitgo: TestableBG & BitGo;
  let tssUtils: ECDSAUtils.EcdsaVrfMPCv2Utils;
  let wallet: Wallet;
  let bitGoGgpKey: openpgp.SerializedKeyPair<string> & {
    revocationCertificate: string;
  };
  let constants: { mpc: { bitgoPublicKey: string; bitgoMPCv2PublicKey: string } };
  let bitgoGpgPrvKey: { partyId: number; gpgKey: string };
  let userGpgPubKey: { partyId: number; gpgKey: string };
  let backupGpgPubKey: { partyId: number; gpgKey: string };

  before(async function () {
    // Allow secp256k1 GPG keys used by these fixtures (the full suite enables this
    // globally via sibling test files; set it here so this file also runs in isolation).
    openpgp.config.rejectCurves = new Set();
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
    bitgoGpgPrvKey = {
      partyId: 2,
      gpgKey: bitGoGgpKey.privateKey,
    };

    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
    bgUrl = common.Environments[bitgo.getEnv()].uri;

    const baseCoin = bitgo.coin(coinName);
    const walletData = {
      id: '5b34252f1bf349930e34020a00000000',
      enterprise: enterpriseId,
      coin: coinName,
      coinSpecific: {},
      multisigType: 'tss',
    };
    wallet = new Wallet(bitgo, baseCoin, walletData);
    tssUtils = new ECDSAUtils.EcdsaVrfMPCv2Utils(bitgo, baseCoin, wallet);
  });

  beforeEach(async function () {
    nock.cleanAll();
    await nockGetBitgoPublicKeyBasedOnFeatureFlags(coinName, enterpriseId, bitGoGgpKey);
    nock(bgUrl).get('/api/v1/client/constants').times(32).reply(200, { ttl: 3600, constants });
  });

  after(function () {
    nock.cleanAll();
  });

  it('should derive safe child keychains and register the signing share only', async function () {
    const [userRoot, backupRoot, bitgoRoot] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup, vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    // The server-side BitGo party runs one hard-derive session per SDK party.
    const bitgoUserPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);
    const bitgoBackupPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);

    const round1Nock = await nockDeriveRound1(bitgoUserPair, bitgoBackupPair);
    const round2Nock = await nockDeriveRound2(bitgoUserPair, bitgoBackupPair);
    const round3Nock = await nockDeriveRound3(bitgoUserPair, bitgoBackupPair);
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
      backupRootKeyShare: backupRoot.getKeyShare(),
      backupRootVrfKeyShare: vrfBackup.getKeyShare(),
    });

    assert.ok(round1Nock.isDone());
    assert.ok(round2Nock.isDone());
    assert.ok(round3Nock.isDone());
    assert.ok(addKeyNock.isDone());

    // User and backup children agree on the child common keychain — before any mint.
    assert.ok(userKeychain.commonKeychain);
    assert.equal(userKeychain.commonKeychain, backupKeychain.commonKeychain);
    assert.equal(
      userKeychain.commonKeychain,
      DklsTypes.getCommonKeychain(bitgoUserPair.getKeyShare()),
      'User and BitGo child common keychains do not match'
    );
    assert.equal(
      backupKeychain.commonKeychain,
      DklsTypes.getCommonKeychain(bitgoBackupPair.getKeyShare()),
      'Backup and BitGo child common keychains do not match'
    );

    // encryptedPrv carries the derived DKLS signing share ONLY — never a VRF
    // share. The decrypted content is a plain DKLS Keyshare, not a VRF envelope.
    assert.ok(userKeychain.encryptedPrv);
    const decryptedUserPrv = await bitgo.decrypt({ input: userKeychain.encryptedPrv, password: 'test' });
    const userChildShare = decode(Buffer.from(decryptedUserPrv, 'base64'));
    assert.equal(userChildShare.version, undefined);
    assert.equal(userChildShare.vrf, undefined);
    assert.equal(userChildShare.party_id, 0);
    assert.ok(userChildShare.s_i);
    assert.equal(DklsTypes.getCommonKeychain(Buffer.from(decryptedUserPrv, 'base64')), userKeychain.commonKeychain);
    assert.equal(Buffer.from(userChildShare.public_key).toString('hex'), userKeychain.commonKeychain.slice(0, 66));

    assert.ok(backupKeychain.encryptedPrv);
    const decryptedBackupPrv = await bitgo.decrypt({ input: backupKeychain.encryptedPrv, password: 'test' });
    const backupChildShare = decode(Buffer.from(decryptedBackupPrv, 'base64'));
    assert.equal(backupChildShare.version, undefined);
    assert.equal(backupChildShare.vrf, undefined);
    assert.equal(backupChildShare.party_id, 1);
    assert.ok(backupChildShare.s_i);
    assert.notDeepStrictEqual(backupChildShare.s_i, userChildShare.s_i);
  });

  it('should derive at a non-zero hardened index and agree with the server', async function () {
    const idx = 7;
    const path = new Uint8Array([0x80 | (idx >>> 24), 0, 0, idx]);
    const [userRoot, backupRoot, bitgoRoot] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup, vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const bitgoUserPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), path);
    const bitgoBackupPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), path);

    const round1Nock = await nockDeriveRound1(bitgoUserPair, bitgoBackupPair, 1, idx);
    const round2Nock = await nockDeriveRound2(bitgoUserPair, bitgoBackupPair);
    const round3Nock = await nockDeriveRound3(bitgoUserPair, bitgoBackupPair);
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
      backupRootKeyShare: backupRoot.getKeyShare(),
      backupRootVrfKeyShare: vrfBackup.getKeyShare(),
    });

    assert.ok(round1Nock.isDone());
    assert.ok(round2Nock.isDone());
    assert.ok(round3Nock.isDone());
    assert.ok(addKeyNock.isDone());
    assert.equal(userKeychain.commonKeychain, backupKeychain.commonKeychain);
    assert.equal(
      userKeychain.commonKeychain,
      DklsTypes.getCommonKeychain(bitgoUserPair.getKeyShare()),
      'User and BitGo child common keychains do not match at non-zero index'
    );
  });

  it('should reject root key material that is not a valid VRF envelope', async function () {
    const [, backupRoot, bitgoRoot] = await DklsUtils.generateDKGKeyShares();
    const [, vrfBackup, vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const bitgoUserPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);
    const bitgoBackupPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);
    const round1Nock = await nockDeriveRound1(bitgoUserPair, bitgoBackupPair);
    const round2Nock = await nockDeriveRound2(bitgoUserPair, bitgoBackupPair);
    const round3Nock = await nockDeriveRound3(bitgoUserPair, bitgoBackupPair);
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
          userRootVrfKeyShare: vrfBackup.getKeyShare(),
          backupRootKeyShare: backupRoot.getKeyShare(),
          backupRootVrfKeyShare: vrfBackup.getKeyShare(),
        }),
      /CBOR decode|does not match root key share partyId|VRF keyshare/i
    );
    assert.ok(!round1Nock.isDone(), 'round 1 must not be sent for invalid root material');
    assert.ok(!round2Nock.isDone(), 'round 2 must not be sent for invalid root material');
    assert.ok(!round3Nock.isDone(), 'round 3 must not be sent for invalid root material');
  });

  it('should reject a root blob with a VRF partyId mismatch', async function () {
    const [userRoot, backupRoot, bitgoRoot] = await DklsUtils.generateDKGKeyShares();
    // backup VRF keyshare party (1) fed as the USER's VRF share — must be rejected.
    const [, vrfBackup, vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const bitgoUserPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);
    const bitgoBackupPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);
    const round1Nock = await nockDeriveRound1(bitgoUserPair, bitgoBackupPair);
    const round2Nock = await nockDeriveRound2(bitgoUserPair, bitgoBackupPair);
    const round3Nock = await nockDeriveRound3(bitgoUserPair, bitgoBackupPair);
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
          backupRootKeyShare: backupRoot.getKeyShare(),
          backupRootVrfKeyShare: vrfBackup.getKeyShare(),
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

  /**
   * Server-side derive rounds: the BitGo party runs one hard-derive session per SDK
   * party. R1 consumes the SDK's first messages and returns each BitGo pair's first
   * message; the pairs' second messages (emitted during that round) are staged and
   * returned on R2 alongside the finalization; R3 returns the child common keychain
   * from the finalized BitGo sessions.
   */
  let stagedBitgoUserMsg2: { message: string; signature: string } | undefined;
  let stagedBitgoBackupMsg2: { message: string; signature: string } | undefined;

  async function nockDeriveRound1(
    bitgoUserPair: DklsDrv.Derive,
    bitgoBackupPair: DklsDrv.Derive,
    times = 1,
    index = DERIVATION_INDEX
  ) {
    return nock(bgUrl)
      .post(
        '/api/v2/mpc/generatekey',
        (body) =>
          body.round === 'MPCv2Derive-R1' &&
          body.safeId === SAFE_ID &&
          body.parentKeyId === undefined &&
          body.derivationIndex === undefined &&
          body.payload?.parentKeyId === BITGO_ROOT_KEY_ID &&
          body.payload?.derivationIndex === index
      )
      .times(times)
      .reply(200, async (uri, requestBody: { payload: MPCv2DeriveRound1Request }) => {
        const { userGpgPublicKey, backupGpgPublicKey, userMsg1, backupMsg1 } = requestBody.payload;
        userGpgPubKey = { partyId: 0, gpgKey: userGpgPublicKey };
        backupGpgPubKey = { partyId: 1, gpgKey: backupGpgPublicKey };

        await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [],
            broadcastMessages: [
              { from: 0, payload: { message: userMsg1.message, signature: userMsg1.signature } },
              { from: 1, payload: { message: backupMsg1.message, signature: backupMsg1.signature } },
            ],
          },
          [userGpgPubKey, backupGpgPubKey],
          []
        );

        const bitgoUserMsg1Unsigned = await bitgoUserPair.initDerive();
        const bitgoBackupMsg1Unsigned = await bitgoBackupPair.initDerive();
        // Consume the SDK's first messages now: each BitGo pair session emits its
        // own second message. Stage those for the R2 response.
        const bitgoUserPairMsg2 = bitgoUserPair.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: [{ payload: Buffer.from(userMsg1.message, 'base64'), from: 0 }],
        });
        const bitgoBackupPairMsg2 = bitgoBackupPair.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: [{ payload: Buffer.from(backupMsg1.message, 'base64'), from: 1 }],
        });
        const signedStagedMessages = await DklsComms.encryptAndAuthOutgoingMessages(
          {
            broadcastMessages: [
              DklsTypes.serializeBroadcastMessage(bitgoUserPairMsg2.broadcastMessages[0]),
              DklsTypes.serializeBroadcastMessage(bitgoBackupPairMsg2.broadcastMessages[0]),
            ],
            p2pMessages: [],
          },
          [],
          [bitgoGpgPrvKey]
        );
        stagedBitgoUserMsg2 = signedStagedMessages.broadcastMessages[0].payload;
        stagedBitgoBackupMsg2 = signedStagedMessages.broadcastMessages[1].payload;

        const signedMessages = await DklsComms.encryptAndAuthOutgoingMessages(
          {
            broadcastMessages: [
              DklsTypes.serializeBroadcastMessage(bitgoUserMsg1Unsigned),
              DklsTypes.serializeBroadcastMessage(bitgoBackupMsg1Unsigned),
            ],
            p2pMessages: [],
          },
          [],
          [bitgoGpgPrvKey]
        );
        const bitgoUserMsg1 = signedMessages.broadcastMessages[0];
        const bitgoBackupMsg1 = signedMessages.broadcastMessages[1];
        assert.ok(bitgoUserMsg1, 'bitgoUserMsg1 not found');
        assert.ok(bitgoBackupMsg1, 'bitgoBackupMsg1 not found');

        return {
          sessionId: 'testid' as NonEmptyString,
          bitgoUserMsg1: { from: 2, ...bitgoUserMsg1.payload },
          bitgoBackupMsg1: { from: 2, ...bitgoBackupMsg1.payload },
        };
      });
  }

  async function nockDeriveRound2(bitgoUserPair: DklsDrv.Derive, bitgoBackupPair: DklsDrv.Derive, times = 1) {
    return nock(bgUrl)
      .post(
        '/api/v2/mpc/generatekey',
        (body) =>
          body.round === 'MPCv2Derive-R2' &&
          body.safeId === SAFE_ID &&
          body.parentKeyId === undefined &&
          body.derivationIndex === undefined &&
          body.payload?.parentKeyId === undefined &&
          body.payload?.derivationIndex === undefined
      )
      .times(times)
      .reply(200, async (uri, requestBody: { payload: MPCv2DeriveRound2Request }) => {
        const { sessionId, userMsg2, backupMsg2 } = requestBody.payload;
        await DklsComms.decryptAndVerifyIncomingMessages(
          {
            p2pMessages: [],
            broadcastMessages: [
              { from: 0, payload: { message: userMsg2.message, signature: userMsg2.signature } },
              { from: 1, payload: { message: backupMsg2.message, signature: backupMsg2.signature } },
            ],
          },
          [userGpgPubKey, backupGpgPubKey],
          []
        );
        // Each pair session consumes its own msg2 (auto-fed) plus the SDK party's msg2.
        bitgoUserPair.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: [{ payload: Buffer.from(userMsg2.message, 'base64'), from: 0 }],
        });
        bitgoBackupPair.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: [{ payload: Buffer.from(backupMsg2.message, 'base64'), from: 1 }],
        });
        assert.ok(stagedBitgoUserMsg2, 'staged BitGo user msg2 missing');
        assert.ok(stagedBitgoBackupMsg2, 'staged BitGo backup msg2 missing');
        return {
          sessionId,
          bitgoUserMsg2: { from: 2, ...stagedBitgoUserMsg2 },
          bitgoBackupMsg2: { from: 2, ...stagedBitgoBackupMsg2 },
        };
      });
  }

  async function nockDeriveRound3(bitgoUserPair: DklsDrv.Derive, bitgoBackupPair: DklsDrv.Derive, times = 1) {
    return nock(bgUrl)
      .post(
        '/api/v2/mpc/generatekey',
        (body) =>
          body.round === 'MPCv2Derive-R3' &&
          body.safeId === SAFE_ID &&
          body.parentKeyId === undefined &&
          body.derivationIndex === undefined &&
          body.payload?.parentKeyId === undefined &&
          body.payload?.derivationIndex === undefined
      )
      .times(times)
      .reply(200, async (uri, requestBody: { payload: MPCv2DeriveRound3Request }) => {
        const { sessionId } = requestBody.payload;
        const commonKeychain = DklsTypes.getCommonKeychain(bitgoUserPair.getKeyShare());
        assert.equal(
          commonKeychain,
          DklsTypes.getCommonKeychain(bitgoBackupPair.getKeyShare()),
          'BitGo pair sessions must agree on the child common keychain'
        );
        return { sessionId, commonKeychain: commonKeychain as NonEmptyString };
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
