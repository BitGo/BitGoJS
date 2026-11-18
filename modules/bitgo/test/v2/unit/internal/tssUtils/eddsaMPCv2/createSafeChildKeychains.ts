import * as assert from 'assert';
import nock = require('nock');
import * as openpgp from 'openpgp';

import { EddsaMPCv2DeriveRound1Request, EddsaMPCv2DeriveRound2Request } from '@bitgo/public-types';
import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { AddKeychainOptions, buildSafeBip44Path, common, ECDSAUtils, EDDSAUtils, Wallet } from '@bitgo/sdk-core';
import { MPSComms, MPSUtil, MpsDerive, MpsVrfUtils } from '@bitgo/sdk-lib-mpc';
import { BitGo, BitgoGPGPublicKey } from '../../../../../../src';

const MPCv2PartiesEnum = ECDSAUtils.MPCv2PartiesEnum;

const SAFE_ID = '6fa8537e3ef5a878fd3ae899f3ab7e5a';
const USER_ROOT_KEY_ID = 'root-user-key-id';
const BITGO_ROOT_KEY_ID = 'root-bitgo-key-id';
const BACKUP_ROOT_KEY_ID = 'root-backup-key-id';
const ACCOUNT = 0;
// sol: coinType 501, eddsaMpc slot 4.
const childPath = (account: number) => buildSafeBip44Path(501, 'eddsaMpc', account);

describe('TSS EdDSA safe child keychains (user/BitGo hard derive):', function () {
  const coinName = 'sol';
  const enterpriseId = '6449153a6f6bc20006d66771cdbe15d3';

  let bgUrl: string;
  let bitgo: TestableBG & BitGo;
  let tssUtils: EDDSAUtils.EddsaVrfMPCv2Utils;
  let bitgoGpgKeyPair: openpgp.SerializedKeyPair<string> & { revocationCertificate: string };
  let bitgoPrvKeyObj: openpgp.PrivateKey;
  let userGpgPubKeyObj: openpgp.Key;
  let constants: { mpc: { bitgoPublicKey: string; bitgoMPCv2PublicKey: string } };

  before(async function () {
    openpgp.config.rejectCurves = new Set();

    bitgoGpgKeyPair = await openpgp.generateKey({
      userIDs: [{ name: 'bitgo', email: 'bitgo@test.com' }],
      curve: 'ed25519',
      format: 'armored',
    });
    bitgoPrvKeyObj = await openpgp.readPrivateKey({ armoredKey: bitgoGpgKeyPair.privateKey });

    constants = {
      mpc: {
        bitgoPublicKey: bitgoGpgKeyPair.publicKey,
        bitgoMPCv2PublicKey: bitgoGpgKeyPair.publicKey,
      },
    };

    bitgo = TestBitGo.decorate(BitGo, { env: 'mock' });
    bitgo.initializeTestVars();
    const baseCoin = bitgo.coin(coinName);
    bgUrl = common.Environments[bitgo.getEnv()].uri;

    const wallet = new Wallet(bitgo, baseCoin, {
      id: '5b34252f1bf349930e34020a00000000',
      enterprise: enterpriseId,
      coin: coinName,
      coinSpecific: {},
      multisigType: 'tss',
    });
    tssUtils = new EDDSAUtils.EddsaVrfMPCv2Utils(bitgo, baseCoin, wallet);
  });

  beforeEach(async function () {
    nock.cleanAll();
    nock(bgUrl)
      .get(`/api/v2/${coinName}/tss/pubkey`)
      .query({ enterpriseId })
      .reply(200, {
        name: 'irrelevant',
        publicKey: bitgoGpgKeyPair.publicKey,
        mpcv2PublicKey: bitgoGpgKeyPair.publicKey,
        eddsaMpcv2PublicKey: bitgoGpgKeyPair.publicKey,
        enterpriseId,
      } satisfies BitgoGPGPublicKey);
    nock(bgUrl).get('/api/v1/client/constants').times(10).reply(200, { ttl: 3600, constants });
  });

  after(function () {
    nock.cleanAll();
  });

  /**
   * The mint-side user↔BitGo hard derive (party 0 vs 2) must land on the same child keychain that
   * offline recovery derives with user+backup (party 0 vs 1) at the same path — otherwise a Safe
   * slot-4 wallet minted by the service could never be recovered from the keycard.
   */
  it('lands on the same child key that offline recovery derives at the same path', async function () {
    const [userDkg, backupDkg, bitgoDkg] = await MPSUtil.generateEdDsaDKGKeyShares();
    const [vrfUser, vrfBackup, vrfBitgo] = await MpsVrfUtils.generateVrfDKGKeyShares();

    const bitgoPair = new MpsDerive.Derive(
      3,
      2,
      MPCv2PartiesEnum.BITGO,
      bitgoDkg.getKeyShare(),
      vrfBitgo.getKeyShare(),
      childPath(ACCOUNT)
    );
    let bitgoMsg2: Uint8Array | undefined;

    const round1Nock = nock(bgUrl)
      .post(
        '/api/v2/mpc/generatekey',
        (body) =>
          body.round === 'MPCv2Derive-R1' &&
          body.curveType === 'EdDSA' &&
          body.safeId === SAFE_ID &&
          body.coin === coinName &&
          body.payload?.parentKeyId === BITGO_ROOT_KEY_ID &&
          body.payload?.path === childPath(ACCOUNT) &&
          body.payload?.userGpgPublicKey &&
          body.payload?.userMsg1 &&
          body.payload?.backupMsg1 === undefined
      )
      .times(1)
      .reply(200, async (_uri, requestBody: { payload: EddsaMPCv2DeriveRound1Request }) => {
        const { userGpgPublicKey, userMsg1 } = requestBody.payload;
        userGpgPubKeyObj = await openpgp.readKey({ armoredKey: userGpgPublicKey });
        await MPSComms.verifyMpsMessage(userMsg1, userGpgPubKeyObj);

        const bitgoMsg1 = await bitgoPair.initDerive();
        const [nextMsg] = bitgoPair.handleIncomingMessages([
          { from: MPCv2PartiesEnum.USER, payload: new Uint8Array(Buffer.from(userMsg1.message, 'base64')) },
        ]);
        assert.ok(nextMsg, 'BitGo derive round 1 must produce a round-2 message');
        bitgoMsg2 = nextMsg.payload;

        return {
          sessionId: 'test-session-id',
          bitgoMsg1: await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg1.payload), bitgoPrvKeyObj),
        };
      });

    const round2Nock = nock(bgUrl)
      .post(
        '/api/v2/mpc/generatekey',
        (body) =>
          body.round === 'MPCv2Derive-R2' &&
          body.curveType === 'EdDSA' &&
          body.safeId === SAFE_ID &&
          body.payload?.sessionId === 'test-session-id' &&
          body.payload?.userMsg2
      )
      .times(1)
      .reply(200, async (_uri, requestBody: { payload: EddsaMPCv2DeriveRound2Request }) => {
        const { sessionId, userMsg2 } = requestBody.payload;
        await MPSComms.verifyMpsMessage(userMsg2, userGpgPubKeyObj);
        assert.deepStrictEqual(
          bitgoPair.handleIncomingMessages([
            { from: MPCv2PartiesEnum.USER, payload: new Uint8Array(Buffer.from(userMsg2.message, 'base64')) },
          ]),
          []
        );
        assert.ok(bitgoMsg2, 'staged BitGo round-2 message missing — round-1 nock must run first');
        assert.ok(bitgoPair.getCommonKeychain(), 'BitGo derive must have completed');

        return {
          sessionId,
          commonPublicKeychain: bitgoPair.getCommonKeychain(),
          bitgoMsg2: await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg2), bitgoPrvKeyObj),
        };
      });

    const addKeyNock = nock('https://bitgo.fakeurl')
      .post(
        `/api/v2/${coinName}/key`,
        (body: AddKeychainOptions & { derivedFromParentWithPath?: string }) =>
          body.keyType === 'tss' &&
          body.isMPCv2 === true &&
          body.safeId === SAFE_ID &&
          !!body.parent &&
          body.derivedFromParentWithPath === childPath(ACCOUNT)
      )
      .times(3)
      .reply(200, (uri, requestBody: AddKeychainOptions) => ({
        id: requestBody.source,
        source: requestBody.source,
        type: requestBody.keyType,
        commonKeychain: requestBody.commonKeychain,
        encryptedPrv: requestBody.encryptedPrv,
      }));

    const { userKeychain, backupKeychain, bitgoKeychain } = await tssUtils.createSafeChildKeychains({
      passphrase: 'test',
      enterprise: enterpriseId,
      safeId: SAFE_ID,
      parentKeyId: BITGO_ROOT_KEY_ID,
      path: childPath(ACCOUNT),
      userRootKeyId: USER_ROOT_KEY_ID,
      backupRootKeyId: BACKUP_ROOT_KEY_ID,
      userRootKeyShare: userDkg.getKeyShare(),
      userRootVrfKeyShare: vrfUser.getKeyShare(),
    });

    assert.ok(round1Nock.isDone());
    assert.ok(round2Nock.isDone());
    assert.ok(addKeyNock.isDone());
    assert.equal(userKeychain.commonKeychain, backupKeychain.commonKeychain);
    assert.equal(bitgoKeychain.commonKeychain, userKeychain.commonKeychain);

    const recovered = await MpsVrfUtils.deriveSafeEddsaMpcChild({
      userRoot: { signing: userDkg.getReducedKeyShare(), vrf: vrfUser.getKeyShare() },
      backupRoot: { signing: backupDkg.getReducedKeyShare(), vrf: vrfBackup.getKeyShare() },
      account: ACCOUNT,
      coinType: 501,
      safeSlotOrdinal: 4,
    });
    assert.equal(userKeychain.commonKeychain, recovered.commonKeychain);
  });
});
