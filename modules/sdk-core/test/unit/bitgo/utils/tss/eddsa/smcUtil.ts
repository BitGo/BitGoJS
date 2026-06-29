import * as assert from 'assert';
import * as sinon from 'sinon';
import { NonEmptyString } from 'io-ts-types';
import {
  EddsaBitgoToOVC1Round1Response,
  EddsaBitgoToOVC1Round2Response,
  EddsaKeyCreationMPCv2StateEnum,
  EddsaMPCv2KeyGenRound1Response,
  EddsaMPCv2KeyGenRound2Response,
  EddsaOVC1ToBitgoRound1Payload,
  EddsaOVC2ToBitgoRound2Payload,
  OVCIndexEnum,
  WalletTypeEnum,
} from '@bitgo/public-types';
import { BitGoBase, IBaseCoin } from '../../../../../../src';
import { MPCv2SMCUtils } from '../../../../../../src/bitgo/utils/tss/eddsa/SMC/utils';

describe('EdDSA MPCv2 SMC Utils:', function () {
  const enterpriseId = '6449153a6f6bc20006d66771cdbe15d3';
  const coinName = 'sol';

  let smcUtils: MPCv2SMCUtils;
  let mockBitgo: BitGoBase;
  let mockBaseCoin: IBaseCoin;
  let keychainsStub: { get: sinon.SinonStub; add: sinon.SinonStub };
  let postChain: { send: sinon.SinonStub; result: sinon.SinonStub };

  const fakeSignedMessage = (suffix: string) => ({
    message: Buffer.from(`message-${suffix}`).toString('base64'),
    signature: `signature-${suffix}`,
  });

  const buildRound1Payload = (
    state: EddsaKeyCreationMPCv2StateEnum = EddsaKeyCreationMPCv2StateEnum.WaitingForBitgoRound1Data
  ): EddsaOVC1ToBitgoRound1Payload =>
    ({
      state,
      tssVersion: '0.0.1' as NonEmptyString,
      walletType: WalletTypeEnum.tss,
      coin: coinName as NonEmptyString,
      ovc: {
        [OVCIndexEnum.ONE]: {
          gpgPubKey: 'user-gpg-pubkey' as NonEmptyString,
          ovcMsg1: fakeSignedMessage('user-1'),
        },
        [OVCIndexEnum.TWO]: {
          gpgPubKey: 'backup-gpg-pubkey' as NonEmptyString,
          ovcMsg1: fakeSignedMessage('backup-1'),
        },
      },
    } as EddsaOVC1ToBitgoRound1Payload);

  const buildRound2Payload = (
    sessionId = 'test-session-id',
    state: EddsaKeyCreationMPCv2StateEnum = EddsaKeyCreationMPCv2StateEnum.WaitingForBitgoRound2Data
  ): EddsaOVC2ToBitgoRound2Payload =>
    ({
      state,
      tssVersion: '0.0.1' as NonEmptyString,
      walletType: WalletTypeEnum.tss,
      coin: coinName as NonEmptyString,
      ovc: {
        [OVCIndexEnum.ONE]: {
          gpgPubKey: 'user-gpg-pubkey' as NonEmptyString,
          ovcMsg1: fakeSignedMessage('user-1'),
          ovcMsg2: fakeSignedMessage('user-2'),
        },
        [OVCIndexEnum.TWO]: {
          gpgPubKey: 'backup-gpg-pubkey' as NonEmptyString,
          ovcMsg1: fakeSignedMessage('backup-1'),
          ovcMsg2: fakeSignedMessage('backup-2'),
        },
      },
      platform: {
        sessionId: sessionId as NonEmptyString,
        bitgoMsg1: fakeSignedMessage('bitgo-1'),
      },
    } as EddsaOVC2ToBitgoRound2Payload);

  beforeEach(function () {
    postChain = {
      send: sinon.stub().returnsThis(),
      result: sinon.stub(),
    };
    mockBitgo = {
      post: sinon.stub().returns(postChain),
      url: sinon.stub().callsFake((path: string) => `/api/v2${path}`),
    } as unknown as BitGoBase;

    keychainsStub = {
      get: sinon.stub(),
      add: sinon.stub(),
    };
    mockBaseCoin = {
      keychains: sinon.stub().returns(keychainsStub),
    } as unknown as IBaseCoin;

    smcUtils = new MPCv2SMCUtils(mockBitgo, mockBaseCoin);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('keyGenRound1BySender', function () {
    it('returns a well-formed BitGo→OVC1 round 1 response on success', async function () {
      const payload = buildRound1Payload();
      const senderFn = sinon.stub().resolves({
        sessionId: 'session-abc' as NonEmptyString,
        bitgoMsg1: fakeSignedMessage('bitgo-r1'),
      } as EddsaMPCv2KeyGenRound1Response);

      const response = (await smcUtils.keyGenRound1BySender(
        senderFn as never,
        payload
      )) as EddsaBitgoToOVC1Round1Response;

      assert.strictEqual(response.state, EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1Round2Data);
      assert.strictEqual(response.tssVersion, payload.tssVersion);
      assert.strictEqual(response.walletType, payload.walletType);
      assert.strictEqual(response.coin, payload.coin);
      assert.deepStrictEqual(response.ovc, payload.ovc);
      assert.strictEqual(response.platform.sessionId, 'session-abc');
      assert.deepStrictEqual(response.platform.bitgoMsg1, fakeSignedMessage('bitgo-r1'));
      assert.ok(senderFn.calledOnce);

      const [, senderPayload] = senderFn.firstCall.args as [unknown, Record<string, unknown>];
      assert.strictEqual(senderPayload.userGpgPublicKey, payload.ovc[OVCIndexEnum.ONE].gpgPubKey);
      assert.strictEqual(senderPayload.backupGpgPublicKey, payload.ovc[OVCIndexEnum.TWO].gpgPubKey);
      assert.deepStrictEqual(senderPayload.userMsg1, payload.ovc[OVCIndexEnum.ONE].ovcMsg1);
      assert.deepStrictEqual(senderPayload.backupMsg1, payload.ovc[OVCIndexEnum.TWO].ovcMsg1);
    });

    it('rejects when the payload state is not WaitingForBitgoRound1Data', async function () {
      const payload = buildRound1Payload(EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1Round2Data);
      const senderFn = sinon.stub().rejects(new Error('sender should not be invoked'));

      await assert.rejects(smcUtils.keyGenRound1BySender(senderFn as never, payload), {
        message: `Invalid state for round 1, expected: ${EddsaKeyCreationMPCv2StateEnum.WaitingForBitgoRound1Data}, got: ${EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1Round2Data}`,
      });
      assert.ok(senderFn.notCalled);
    });

    it('rejects when the response is malformed (sessionId empty)', async function () {
      const payload = buildRound1Payload();
      const senderFn = sinon.stub().resolves({
        sessionId: '' as unknown as NonEmptyString,
        bitgoMsg1: fakeSignedMessage('bitgo-r1'),
      });

      await assert.rejects(smcUtils.keyGenRound1BySender(senderFn as never, payload), /error\(s\) parsing response/);
    });
  });

  describe('keyGenRound2BySender', function () {
    beforeEach(function () {
      const fakeKeychain = {
        id: 'bitgo-keychain-id',
        source: 'bitgo',
        type: 'tss' as const,
        commonKeychain: 'a'.repeat(64),
      };
      keychainsStub.add.resolves(fakeKeychain);
    });

    it('returns a well-formed BitGo→OVC1 round 2 response and adds the BitGo keychain', async function () {
      const payload = buildRound2Payload('session-xyz');
      const senderFn = sinon.stub().resolves({
        sessionId: 'session-xyz' as NonEmptyString,
        commonPublicKeychain: 'a'.repeat(64) as NonEmptyString,
        bitgoMsg2: fakeSignedMessage('bitgo-r2'),
      } as EddsaMPCv2KeyGenRound2Response);

      const response = (await smcUtils.keyGenRound2BySender(
        senderFn as never,
        payload
      )) as EddsaBitgoToOVC1Round2Response;

      assert.strictEqual(response.state, EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1GenerateKey);
      assert.strictEqual(response.bitGoKeyId, 'bitgo-keychain-id');
      assert.strictEqual(response.tssVersion, payload.tssVersion);
      assert.strictEqual(response.walletType, payload.walletType);
      assert.strictEqual(response.coin, payload.coin);
      assert.deepStrictEqual(response.ovc, payload.ovc);
      assert.strictEqual(response.platform.sessionId, 'session-xyz');
      assert.strictEqual(response.platform.commonPublicKeychain, 'a'.repeat(64));
      assert.deepStrictEqual(response.platform.bitgoMsg1, payload.platform.bitgoMsg1);
      assert.deepStrictEqual(response.platform.bitgoMsg2, fakeSignedMessage('bitgo-r2'));

      const [, senderPayload] = senderFn.firstCall.args as [unknown, Record<string, unknown>];
      assert.strictEqual(senderPayload.sessionId, 'session-xyz');
      assert.deepStrictEqual(senderPayload.userMsg2, payload.ovc[OVCIndexEnum.ONE].ovcMsg2);
      assert.deepStrictEqual(senderPayload.backupMsg2, payload.ovc[OVCIndexEnum.TWO].ovcMsg2);

      // BitGo keychain is added with the keychain from the round-2 response
      assert.ok(keychainsStub.add.calledOnce);
      assert.deepStrictEqual(keychainsStub.add.firstCall.args[0], {
        source: 'bitgo',
        keyType: 'tss',
        commonKeychain: 'a'.repeat(64),
        isMPCv2: true,
      });
    });

    it('rejects when the payload state is not WaitingForBitgoRound2Data', async function () {
      const payload = buildRound2Payload('session-xyz', EddsaKeyCreationMPCv2StateEnum.WaitingForOVC2Round2Data);
      const senderFn = sinon.stub().rejects(new Error('sender should not be invoked'));

      await assert.rejects(smcUtils.keyGenRound2BySender(senderFn as never, payload), {
        message: `Invalid state for round 2, expected: ${EddsaKeyCreationMPCv2StateEnum.WaitingForBitgoRound2Data}, got: ${EddsaKeyCreationMPCv2StateEnum.WaitingForOVC2Round2Data}`,
      });
      assert.ok(senderFn.notCalled);
      assert.ok(keychainsStub.add.notCalled);
    });

    it('rejects when session IDs returned by BitGo do not match the payload', async function () {
      const payload = buildRound2Payload('session-xyz');
      const senderFn = sinon.stub().resolves({
        sessionId: 'different-session-id' as NonEmptyString,
        commonPublicKeychain: 'a'.repeat(64) as NonEmptyString,
        bitgoMsg2: fakeSignedMessage('bitgo-r2'),
      } as EddsaMPCv2KeyGenRound2Response);

      await assert.rejects(
        smcUtils.keyGenRound2BySender(senderFn as never, payload),
        /Round 1 and round 2 session IDs do not match/
      );
      assert.ok(keychainsStub.add.notCalled);
    });
  });

  describe('keyGenRound1 (enterprise)', function () {
    it('rejects for an invalid payload state without calling the API', async function () {
      const invalidPayload = {
        state: EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1Round2Data,
      } as unknown as EddsaOVC1ToBitgoRound1Payload;

      await assert.rejects(smcUtils.keyGenRound1(enterpriseId, invalidPayload), {
        message: `Invalid state for round 1, expected: ${EddsaKeyCreationMPCv2StateEnum.WaitingForBitgoRound1Data}, got: ${EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1Round2Data}`,
      });
      assert.ok((mockBitgo.post as sinon.SinonStub).notCalled);
    });

    it('POSTs to the MPCv2 generatekey endpoint and returns a parsed round 1 response', async function () {
      const payload = buildRound1Payload();
      postChain.result.resolves({
        sessionId: 'enterprise-session',
        bitgoMsg1: fakeSignedMessage('bitgo-r1'),
      });

      const response = await smcUtils.keyGenRound1(enterpriseId, payload);

      assert.ok((mockBitgo.post as sinon.SinonStub).calledOnce);
      assert.strictEqual((mockBitgo.post as sinon.SinonStub).firstCall.args[0], '/api/v2/mpc/generatekey');
      const sentBody = postChain.send.firstCall.args[0] as {
        enterprise: string;
        round: string;
        payload: { userGpgPublicKey: string; backupGpgPublicKey: string };
      };
      assert.strictEqual(sentBody.enterprise, enterpriseId);
      assert.strictEqual(sentBody.round, 'MPCv2-R1');
      assert.strictEqual(sentBody.payload.userGpgPublicKey, payload.ovc[OVCIndexEnum.ONE].gpgPubKey);
      assert.strictEqual(sentBody.payload.backupGpgPublicKey, payload.ovc[OVCIndexEnum.TWO].gpgPubKey);

      assert.strictEqual(response.state, EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1Round2Data);
      assert.strictEqual(response.platform.sessionId, 'enterprise-session');
    });
  });

  describe('keyGenRound2 (enterprise)', function () {
    it('rejects for an invalid payload state without calling the API', async function () {
      const invalidPayload = {
        state: EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1Round2Data,
      } as unknown as EddsaOVC2ToBitgoRound2Payload;

      await assert.rejects(smcUtils.keyGenRound2(enterpriseId, invalidPayload), {
        message: `Invalid state for round 2, expected: ${EddsaKeyCreationMPCv2StateEnum.WaitingForBitgoRound2Data}, got: ${EddsaKeyCreationMPCv2StateEnum.WaitingForOVC1Round2Data}`,
      });
      assert.ok((mockBitgo.post as sinon.SinonStub).notCalled);
    });
  });

  describe('uploadClientKeys', function () {
    const bitgoKeyId = 'bitgo-key-id';
    const commonKeychain = 'a'.repeat(64);

    it('uploads user/backup keychains and returns the triplet on the happy path', async function () {
      const bitgoKeychain = { id: bitgoKeyId, type: 'tss', source: 'bitgo', commonKeychain };
      const userKeychain = { id: 'user-id', type: 'tss', source: 'user', commonKeychain };
      const backupKeychain = { id: 'backup-id', type: 'tss', source: 'backup', commonKeychain };

      keychainsStub.get.resolves(bitgoKeychain);
      keychainsStub.add.withArgs(sinon.match({ source: 'user' })).resolves(userKeychain);
      keychainsStub.add.withArgs(sinon.match({ source: 'backup' })).resolves(backupKeychain);

      const result = await smcUtils.uploadClientKeys(bitgoKeyId, commonKeychain, commonKeychain);

      assert.deepStrictEqual(result.userKeychain, userKeychain);
      assert.deepStrictEqual(result.backupKeychain, backupKeychain);
      assert.deepStrictEqual(result.bitgoKeychain, bitgoKeychain);

      assert.ok(keychainsStub.get.calledOnceWithExactly({ id: bitgoKeyId }));
      assert.strictEqual(keychainsStub.add.callCount, 2);
      assert.deepStrictEqual(keychainsStub.add.firstCall.args[0], {
        source: 'user',
        keyType: 'tss',
        commonKeychain,
        isMPCv2: true,
      });
      assert.deepStrictEqual(keychainsStub.add.secondCall.args[0], {
        source: 'backup',
        keyType: 'tss',
        commonKeychain,
        isMPCv2: true,
      });
    });

    it('rejects when user and backup common keychains differ', async function () {
      await assert.rejects(
        smcUtils.uploadClientKeys(bitgoKeyId, 'a'.repeat(64), 'b'.repeat(64)),
        /Common keychain mismatch between the user and backup keychains/
      );
      assert.ok(keychainsStub.get.notCalled);
      assert.ok(keychainsStub.add.notCalled);
    });

    it('rejects when the BitGo keychain cannot be found', async function () {
      keychainsStub.get.resolves(undefined);

      await assert.rejects(smcUtils.uploadClientKeys(bitgoKeyId, commonKeychain, commonKeychain), /Keychain not found/);
      assert.ok(keychainsStub.add.notCalled);
    });

    it('rejects when the fetched keychain is not a BitGo-source keychain', async function () {
      keychainsStub.get.resolves({ id: bitgoKeyId, type: 'tss', source: 'user', commonKeychain });

      await assert.rejects(
        smcUtils.uploadClientKeys(bitgoKeyId, commonKeychain, commonKeychain),
        /The keychain is not a BitGo keychain/
      );
      assert.ok(keychainsStub.add.notCalled);
    });

    it('rejects when the fetched keychain is not a TSS keychain', async function () {
      keychainsStub.get.resolves({ id: bitgoKeyId, type: 'independent', source: 'bitgo', commonKeychain });

      await assert.rejects(
        smcUtils.uploadClientKeys(bitgoKeyId, commonKeychain, commonKeychain),
        /BitGo keychain is not a TSS keychain/
      );
      assert.ok(keychainsStub.add.notCalled);
    });

    it('rejects when the BitGo keychain has no commonKeychain', async function () {
      keychainsStub.get.resolves({ id: bitgoKeyId, type: 'tss', source: 'bitgo' });

      await assert.rejects(
        smcUtils.uploadClientKeys(bitgoKeyId, commonKeychain, commonKeychain),
        /BitGo keychain does not have a common keychain/
      );
      assert.ok(keychainsStub.add.notCalled);
    });

    it('rejects when OVC-supplied common keychain does not match BitGo', async function () {
      keychainsStub.get.resolves({ id: bitgoKeyId, type: 'tss', source: 'bitgo', commonKeychain: 'c'.repeat(64) });

      await assert.rejects(
        smcUtils.uploadClientKeys(bitgoKeyId, commonKeychain, commonKeychain),
        /Common keychain mismatch between the OVCs and BitGo/
      );
      assert.ok(keychainsStub.add.notCalled);
    });
  });
});
