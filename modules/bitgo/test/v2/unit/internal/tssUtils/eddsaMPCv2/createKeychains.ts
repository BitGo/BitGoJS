import * as assert from 'assert';
import nock = require('nock');
import * as openpgp from 'openpgp';

import { EddsaMPCv2KeyGenRound1Request, EddsaMPCv2KeyGenRound2Request } from '@bitgo/public-types';
import { TestableBG, TestBitGo } from '@bitgo/sdk-test';
import { AddKeychainOptions, BaseCoin, common, ECDSAUtils, EDDSAUtils, Keychain, Wallet } from '@bitgo/sdk-core';
import { EddsaMPSDkg, MPSComms, MPSTypes } from '@bitgo/sdk-lib-mpc';
import { BitGo, BitgoGPGPublicKey } from '../../../../../../src';

const MPCv2PartiesEnum = ECDSAUtils.MPCv2PartiesEnum;

describe('TSS EdDSA MPCv2 Utils:', async function () {
  const coinName = 'sol';
  const walletId = '5b34252f1bf349930e34020a00000000';
  const enterpriseId = '6449153a6f6bc20006d66771cdbe15d3';

  let bgUrl: string;
  let tssUtils: EDDSAUtils.EddsaMPCv2Utils;
  let wallet: Wallet;
  let bitgo: TestableBG & BitGo;
  let baseCoin: BaseCoin;

  let bitgoGpgKeyPair: openpgp.SerializedKeyPair<string> & { revocationCertificate: string };
  let bitgoPrvKeyObj: openpgp.PrivateKey;
  let constants: { mpc: { bitgoPublicKey: string; bitgoMPCv2PublicKey: string } };

  beforeEach(async function () {
    nock.cleanAll();
    await nockGetBitgoPublicKeyBasedOnFeatureFlags(coinName, enterpriseId, bitgoGpgKeyPair);
    nock(bgUrl).get('/api/v1/client/constants').times(10).reply(200, { ttl: 3600, constants });
  });

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
    tssUtils = new EDDSAUtils.EddsaMPCv2Utils(bitgo, baseCoin, wallet);
  });

  after(function () {
    nock.cleanAll();
  });

  describe('TSS key chains', async function () {
    it('should generate TSS MPS keys', async function () {
      const bitgoSession = new EddsaMPSDkg.DKG(3, 2, 2);
      const bitgoState: { msg2?: MPSTypes.DeserializedMessage } = {};
      const round1Nock = await nockMPSKeyGenRound1(bitgoSession, bitgoState, 1);
      const round2Nock = await nockMPSKeyGenRound2(bitgoSession, bitgoState, 1);
      const addKeyNock = await nockAddKeyChain(coinName, 3);

      const params = {
        passphrase: 'test',
        enterprise: enterpriseId,
        originalPasscodeEncryptionCode: '123456',
      };

      const { userKeychain, backupKeychain, bitgoKeychain } = await tssUtils.createKeychains(params);

      assert.ok(round1Nock.isDone());
      assert.ok(round2Nock.isDone());
      assert.ok(addKeyNock.isDone());

      assert.ok(userKeychain);
      assert.equal(userKeychain.source, 'user');
      assert.ok(userKeychain.commonKeychain);
      assert.ok(userKeychain.encryptedPrv);
      assert.ok(bitgo.decrypt({ input: userKeychain.encryptedPrv, password: params.passphrase }));

      assert.ok(backupKeychain);
      assert.equal(backupKeychain.source, 'backup');
      assert.ok(backupKeychain.commonKeychain);
      assert.ok(backupKeychain.encryptedPrv);
      assert.ok(bitgo.decrypt({ input: backupKeychain.encryptedPrv, password: params.passphrase }));

      assert.ok(bitgoKeychain);
      assert.equal(bitgoKeychain.source, 'bitgo');
      assert.ok(bitgoKeychain.commonKeychain);

      assert.equal(userKeychain.commonKeychain, backupKeychain.commonKeychain);
      assert.equal(userKeychain.commonKeychain, bitgoKeychain.commonKeychain);
    });

    it('should create TSS key chains', async function () {
      const fakeCommonKeychain = 'a'.repeat(64);

      const nockPromises = [
        nockKeychain({
          coin: coinName,
          keyChain: { id: '1', pub: '1', type: 'tss', source: 'user', reducedEncryptedPrv: '' },
          source: 'user',
        }),
        nockKeychain({
          coin: coinName,
          keyChain: { id: '2', pub: '2', type: 'tss', source: 'backup', reducedEncryptedPrv: '' },
          source: 'backup',
        }),
        nockKeychain({
          coin: coinName,
          keyChain: { id: '3', pub: '3', type: 'tss', source: 'bitgo', reducedEncryptedPrv: '' },
          source: 'bitgo',
        }),
      ];
      const [nockedUserKeychain, nockedBackupKeychain, nockedBitGoKeychain] = await Promise.all(nockPromises);

      const [userKeychain, backupKeychain, bitgoKeychain] = await Promise.all([
        tssUtils.createParticipantKeychain(
          MPCv2PartiesEnum.USER,
          fakeCommonKeychain,
          Buffer.from('userPrivate'),
          Buffer.from('userReduced'),
          'passphrase'
        ),
        tssUtils.createParticipantKeychain(
          MPCv2PartiesEnum.BACKUP,
          fakeCommonKeychain,
          Buffer.from('backupPrivate'),
          Buffer.from('backupReduced'),
          'passphrase'
        ),
        tssUtils.createParticipantKeychain(MPCv2PartiesEnum.BITGO, fakeCommonKeychain),
      ]);

      assert.ok(userKeychain);
      assert.equal(bitgoKeychain.source, 'bitgo');

      assert.equal(userKeychain.id, nockedUserKeychain.id);
      assert.equal(backupKeychain.id, nockedBackupKeychain.id);
      assert.equal(bitgoKeychain.id, nockedBitGoKeychain.id);

      ({ ...userKeychain, reducedEncryptedPrv: '' }).should.deepEqual(nockedUserKeychain);
      ({ ...backupKeychain, reducedEncryptedPrv: '' }).should.deepEqual(nockedBackupKeychain);
      ({ ...bitgoKeychain, reducedEncryptedPrv: '' }).should.deepEqual(nockedBitGoKeychain);
    });

    it('should reject when BitGo PGP signature on round 1 response is invalid', async function () {
      nock(bgUrl)
        .post('/api/v2/mpc/generatekey', (body) => body.round === 'MPS-R1')
        .once()
        .reply(200, {
          sessionId: 'bad-session',
          bitgoMsg1: {
            message: Buffer.from('garbage').toString('base64'),
            signature: '-----BEGIN PGP SIGNATURE-----\nFAKE\n-----END PGP SIGNATURE-----',
          },
        });

      await assert.rejects(tssUtils.createKeychains({ passphrase: 'test', enterprise: enterpriseId }));
    });
  });

  // ---------------------------------------------------------------------------
  // Nock helpers
  // ---------------------------------------------------------------------------

  async function nockGetBitgoPublicKeyBasedOnFeatureFlags(
    coin: string,
    enterprise: string,
    bitgoKeyPair: openpgp.SerializedKeyPair<string>
  ): Promise<BitgoGPGPublicKey> {
    const response: BitgoGPGPublicKey = {
      name: 'irrelevant',
      publicKey: bitgoKeyPair.publicKey,
      mpcv2PublicKey: bitgoKeyPair.publicKey,
      enterpriseId: enterprise,
    };
    nock(bgUrl).get(`/api/v2/${coin}/tss/pubkey`).query({ enterpriseId: enterprise }).reply(200, response);
    return response;
  }

  async function nockMPSKeyGenRound1(
    bitgoSession: EddsaMPSDkg.DKG,
    bitgoState: { msg2?: MPSTypes.DeserializedMessage },
    times = 1
  ) {
    return nock(bgUrl)
      .post('/api/v2/mpc/generatekey', (body) => body.round === 'MPS-R1')
      .times(times)
      .reply(200, async (_uri, { payload }: { payload: EddsaMPCv2KeyGenRound1Request }) => {
        const { userGpgPublicKey, backupGpgPublicKey, userMsg1, backupMsg1 } = payload;

        openpgp.config.rejectCurves = new Set();
        const userPubKeyObj = await openpgp.readKey({ armoredKey: userGpgPublicKey });
        const backupPubKeyObj = await openpgp.readKey({ armoredKey: backupGpgPublicKey });

        const userPk = Buffer.from(
          ((await userPubKeyObj.getEncryptionKey()).keyPacket.publicParams as { Q: Uint8Array }).Q
        ).subarray(1);
        const backupPk = Buffer.from(
          ((await backupPubKeyObj.getEncryptionKey()).keyPacket.publicParams as { Q: Uint8Array }).Q
        ).subarray(1);
        const bitgoSk = Buffer.from(
          ((await bitgoPrvKeyObj.getDecryptionKeys())[0].keyPacket.privateParams as { d: Uint8Array }).d
        ).reverse();

        bitgoSession.initDkg(bitgoSk, [userPk, backupPk]);
        const bitgoRawMsg1 = bitgoSession.getFirstMessage();

        await MPSComms.verifyMpsMessage(userMsg1, userPubKeyObj);
        await MPSComms.verifyMpsMessage(backupMsg1, backupPubKeyObj);

        // Process all 3 round-1 messages (including BitGo's own) to advance state and produce bitgoMsg2
        const userDeserMsg1: MPSTypes.DeserializedMessage = {
          from: 0,
          payload: new Uint8Array(Buffer.from(userMsg1.message, 'base64')),
        };
        const backupDeserMsg1: MPSTypes.DeserializedMessage = {
          from: 1,
          payload: new Uint8Array(Buffer.from(backupMsg1.message, 'base64')),
        };
        const [bitgoRawMsg2] = bitgoSession.handleIncomingMessages([userDeserMsg1, backupDeserMsg1, bitgoRawMsg1]);
        bitgoState.msg2 = bitgoRawMsg2;

        return {
          sessionId: 'test-session-id',
          bitgoMsg1: await MPSComms.detachSignMpsMessage(Buffer.from(bitgoRawMsg1.payload), bitgoPrvKeyObj),
        };
      });
  }

  async function nockMPSKeyGenRound2(
    bitgoSession: EddsaMPSDkg.DKG,
    bitgoState: { msg2?: MPSTypes.DeserializedMessage },
    times = 1
  ) {
    return nock(bgUrl)
      .post('/api/v2/mpc/generatekey', (body) => body.round === 'MPS-R2')
      .times(times)
      .reply(200, async (_uri, { payload }: { payload: EddsaMPCv2KeyGenRound2Request }) => {
        const { sessionId, userMsg2, backupMsg2 } = payload;

        openpgp.config.rejectCurves = new Set();

        assert.ok(bitgoState.msg2, 'BitGo round-2 message missing — round-1 nock must run first');

        const userDeserMsg2: MPSTypes.DeserializedMessage = {
          from: 0,
          payload: new Uint8Array(Buffer.from(userMsg2.message, 'base64')),
        };
        const backupDeserMsg2: MPSTypes.DeserializedMessage = {
          from: 1,
          payload: new Uint8Array(Buffer.from(backupMsg2.message, 'base64')),
        };

        // Complete DKG with all 3 round-2 messages (user, backup, and BitGo's own msg2)
        bitgoSession.handleIncomingMessages([userDeserMsg2, backupDeserMsg2, bitgoState.msg2]);

        return {
          sessionId,
          commonPublicKey: bitgoSession.getSharePublicKey().toString('hex'),
          bitgoMsg2: await MPSComms.detachSignMpsMessage(Buffer.from(bitgoState.msg2.payload), bitgoPrvKeyObj),
        };
      });
  }

  async function nockKeychain(
    params: { coin: string; keyChain: Keychain; source: 'user' | 'backup' | 'bitgo' },
    times = 1
  ): Promise<Keychain> {
    nock(bgUrl)
      .post(`/api/v2/${params.coin}/key`, (body) => body.keyType === 'tss' && body.source === params.source)
      .times(times)
      .reply(200, params.keyChain);
    return params.keyChain;
  }

  async function nockAddKeyChain(coin: string, times = 1) {
    return nock(bgUrl)
      .post(`/api/v2/${coin}/key`, (body) => body.keyType === 'tss' && body.isMPCv2)
      .times(times)
      .reply(200, async (_uri, requestBody: AddKeychainOptions) => {
        const key = {
          id: requestBody.source,
          source: requestBody.source,
          type: requestBody.keyType,
          commonKeychain: requestBody.commonKeychain,
          encryptedPrv: requestBody.encryptedPrv,
        };
        nock(bgUrl).get(`/api/v2/${coin}/key/${requestBody.source}`).reply(200, key);
        return key;
      });
  }
});
