import * as assert from 'assert';
import * as sinon from 'sinon';
import * as pgp from 'openpgp';
import * as crypto from 'crypto';
import { RedPallasMPSDkg, RedPallasMPSTypes, MPSComms } from '@bitgo/sdk-lib-mpc';
import { BitGoBase, IBaseCoin, RedpallasUtils, generateGPGKeyPair } from '../../../../../../src';
import { MPCv2PartiesEnum } from '../../../../../../src/bitgo/utils/tss/ecdsa/typesMPCv2';

const { RedpallasMPCv2Utils } = RedpallasUtils;
type RedpallasMPCv2Utils = InstanceType<typeof RedpallasUtils.RedpallasMPCv2Utils>;

describe('RedpallasMPCv2Utils', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('sendKeyGenerationRound1 / sendKeyGenerationRound2 dispatch', function () {
    let utils: RedpallasMPCv2Utils;

    beforeEach(function () {
      const mockBitGo = {} as unknown as BitGoBase;
      const mockCoin = {} as unknown as IBaseCoin;
      utils = new RedpallasMPCv2Utils(mockBitGo, mockCoin);
    });

    it('sendKeyGenerationRound1BySender invokes the sender with the MPCv2-R1 round', async function () {
      const senderFn = sinon.stub().resolves({ sessionId: 's1', bitgoMsg1: { message: 'm', signature: 'sig' } });
      const payload = {
        userGpgPublicKey: 'user-pub',
        backupGpgPublicKey: 'backup-pub',
        userMsg1: { message: 'u1', signature: 'usig' },
        backupMsg1: { message: 'b1', signature: 'bsig' },
      };

      const result = await utils.sendKeyGenerationRound1BySender(senderFn as never, payload as never);

      assert.ok(senderFn.calledOnceWith('MPCv2-R1', payload));
      assert.strictEqual(result.sessionId, 's1');
    });

    it('sendKeyGenerationRound2BySender invokes the sender with the MPCv2-R2 round', async function () {
      const senderFn = sinon.stub().resolves({
        sessionId: 's1',
        commonPublicKeychain: 'a'.repeat(64),
        bitgoMsg2: { message: 'm', signature: 'sig' },
      });
      const payload = {
        sessionId: 's1',
        userMsg2: { message: 'u2', signature: 'usig' },
        backupMsg2: { message: 'b2', signature: 'bsig' },
        derivationSeed: 'a'.repeat(64),
      };

      const result = await utils.sendKeyGenerationRound2BySender(senderFn as never, payload as never);

      assert.ok(senderFn.calledOnceWith('MPCv2-R2', payload));
      assert.strictEqual(result.commonPublicKeychain, 'a'.repeat(64));
    });
  });

  describe('createParticipantKeychain', function () {
    let utils: RedpallasMPCv2Utils;
    let keychainsStub: { add: sinon.SinonStub };
    let encryptStub: sinon.SinonStub;

    beforeEach(function () {
      encryptStub = sinon.stub().resolves('encrypted-value');
      const mockBitGo = { encrypt: encryptStub } as unknown as BitGoBase;
      keychainsStub = {
        add: sinon.stub().callsFake((params: Record<string, unknown>) => Promise.resolve({ id: 'key-id', ...params })),
      };
      const mockCoin = { keychains: sinon.stub().returns(keychainsStub) } as unknown as IBaseCoin;
      utils = new RedpallasMPCv2Utils(mockBitGo, mockCoin);
    });

    it('creates a user keychain with encrypted private material and reduced private material', async function () {
      const privateMaterial = Buffer.from('user-priv');
      const reducedPrivateMaterial = Buffer.from('user-reduced');

      const keychain = await utils.createParticipantKeychain(
        MPCv2PartiesEnum.USER,
        'a'.repeat(64),
        privateMaterial,
        reducedPrivateMaterial,
        'passphrase'
      );

      assert.strictEqual(keychain.id, 'key-id');
      assert.strictEqual(
        (keychain as unknown as { reducedEncryptedPrv: string }).reducedEncryptedPrv,
        'encrypted-value'
      );
      assert.ok(encryptStub.calledTwice);
      const addArgs = keychainsStub.add.firstCall.args[0];
      assert.strictEqual(addArgs.source, 'user');
      assert.strictEqual(addArgs.commonKeychain, 'a'.repeat(64));
      assert.strictEqual(addArgs.isMPCv2, true);
    });

    it('creates a backup keychain analogously', async function () {
      const keychain = await utils.createParticipantKeychain(
        MPCv2PartiesEnum.BACKUP,
        'b'.repeat(64),
        Buffer.from('backup-priv'),
        Buffer.from('backup-reduced'),
        'passphrase'
      );
      assert.strictEqual(keychain.id, 'key-id');
      assert.strictEqual(keychainsStub.add.firstCall.args[0].source, 'backup');
    });

    it('creates a BitGo keychain without private material or passphrase', async function () {
      const keychain = await utils.createParticipantKeychain(MPCv2PartiesEnum.BITGO, 'c'.repeat(64));
      assert.strictEqual(keychain.id, 'key-id');
      assert.strictEqual(keychainsStub.add.firstCall.args[0].source, 'bitgo');
      assert.strictEqual(keychainsStub.add.firstCall.args[0].encryptedPrv, undefined);
      assert.ok(encryptStub.notCalled);
    });

    it('throws when private material is missing for a user keychain', async function () {
      await assert.rejects(
        utils.createParticipantKeychain(MPCv2PartiesEnum.USER, 'a'.repeat(64), undefined, undefined, 'passphrase'),
        /Private material is required for user keychain/
      );
    });

    it('throws when passphrase is missing for a backup keychain', async function () {
      await assert.rejects(
        utils.createParticipantKeychain(
          MPCv2PartiesEnum.BACKUP,
          'a'.repeat(64),
          Buffer.from('x'),
          Buffer.from('y'),
          undefined
        ),
        /Passphrase is required for backup keychain/
      );
    });
  });

  describe('createKeychains (full DKG round-trip, using a real RedPallas WASM party as BitGo)', function () {
    it('produces consistent user/backup/bitgo keychains sharing a common RedPallas public keychain', async function () {
      // Simulates BitGo's side of the ceremony with a genuine RedPallasDKG party (index 2),
      // driven by intercepting sendKeyGenerationRound1/2 - exercising the real WASM DKG
      // end-to-end, the same way `EddsaMPCv2Utils`'s retrofit tests intercept round1.
      const bitgoGpgKeyPair = await generateGPGKeyPair('ed25519');
      const bitgoGpgPrivKey = await pgp.readPrivateKey({ armoredKey: bitgoGpgKeyPair.privateKey });
      const [, bitgoSk] = await MPSComms.extractEd25519KeyPair(bitgoGpgPrivKey);
      const bitgoDkg = new RedPallasMPSDkg.RedPallasDKG(3, 2, MPCv2PartiesEnum.BITGO);

      const mockBitGo = {
        getEnv: sinon.stub().returns('dev'),
        encrypt: sinon.stub().resolves('encrypted'),
      } as unknown as BitGoBase;
      const mockKeychains = {
        add: sinon.stub().callsFake((params: Record<string, unknown>) =>
          Promise.resolve({
            id: `${params.source}-key-id`,
            commonKeychain: params.commonKeychain,
            isMPCv2: true,
            source: params.source,
          })
        ),
      };
      const mockCoin = { keychains: sinon.stub().returns(mockKeychains) } as unknown as IBaseCoin;

      const utils = new RedpallasMPCv2Utils(mockBitGo, mockCoin);
      sinon.stub(utils, 'getBitgoGpgPubkeyBasedOnFeatureFlags').resolves({
        mpcv2PublicKey: undefined,
        eddsaMpcv2PublicKey: undefined,
      } as never);
      // Use a real armored GPG public key so pgp.readKey() succeeds inside createKeychains.
      (utils as unknown as { bitgoEddsaMpcv2PublicGpgKey: { armor: () => string } }).bitgoEddsaMpcv2PublicGpgKey = {
        armor: () => bitgoGpgKeyPair.publicKey,
      };

      let bitgoMsg1: RedPallasMPSTypes.DeserializedMessage;
      let userMsg1Captured: RedPallasMPSTypes.DeserializedMessage;
      let backupMsg1Captured: RedPallasMPSTypes.DeserializedMessage;
      let userGpgKeyObj: pgp.Key;
      let backupGpgKeyObj: pgp.Key;

      sinon.stub(utils, 'sendKeyGenerationRound1').callsFake(async (_enterprise, payload) => {
        userGpgKeyObj = await pgp.readKey({ armoredKey: payload.userGpgPublicKey });
        backupGpgKeyObj = await pgp.readKey({ armoredKey: payload.backupGpgPublicKey });
        const userPk = await MPSComms.extractEd25519PublicKey(userGpgKeyObj);
        const backupPk = await MPSComms.extractEd25519PublicKey(backupGpgKeyObj);

        await bitgoDkg.initDkg(bitgoSk, [userPk, backupPk]);
        bitgoMsg1 = bitgoDkg.getFirstMessage();

        const userRawMsg1 = await MPSComms.verifyMpsMessage(payload.userMsg1, userGpgKeyObj);
        const backupRawMsg1 = await MPSComms.verifyMpsMessage(payload.backupMsg1, backupGpgKeyObj);
        userMsg1Captured = { from: MPCv2PartiesEnum.USER, payload: new Uint8Array(userRawMsg1) };
        backupMsg1Captured = { from: MPCv2PartiesEnum.BACKUP, payload: new Uint8Array(backupRawMsg1) };

        const signedBitgoMsg1 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg1.payload), bitgoGpgPrivKey);
        return { sessionId: 'session-1', bitgoMsg1: signedBitgoMsg1 } as never;
      });

      sinon.stub(utils, 'sendKeyGenerationRound2').callsFake(async (_enterprise, payload) => {
        const round1Msgs: RedPallasMPSTypes.DeserializedMessages = [userMsg1Captured, backupMsg1Captured, bitgoMsg1];
        const [bitgoMsg2] = bitgoDkg.handleIncomingMessages(round1Msgs);

        const userRawMsg2 = await MPSComms.verifyMpsMessage(payload.userMsg2, userGpgKeyObj);
        const backupRawMsg2 = await MPSComms.verifyMpsMessage(payload.backupMsg2, backupGpgKeyObj);
        const userMsg2: RedPallasMPSTypes.DeserializedMessage = {
          from: MPCv2PartiesEnum.USER,
          payload: new Uint8Array(userRawMsg2),
        };
        const backupMsg2: RedPallasMPSTypes.DeserializedMessage = {
          from: MPCv2PartiesEnum.BACKUP,
          payload: new Uint8Array(backupRawMsg2),
        };

        const round2Msgs: RedPallasMPSTypes.DeserializedMessages = [userMsg2, backupMsg2, bitgoMsg2];
        const derivationSeed = Buffer.from(payload.derivationSeed, 'hex');
        bitgoDkg.handleIncomingMessages(round2Msgs, derivationSeed);

        const signedBitgoMsg2 = await MPSComms.detachSignMpsMessage(Buffer.from(bitgoMsg2.payload), bitgoGpgPrivKey);
        return {
          sessionId: payload.sessionId,
          commonPublicKeychain: bitgoDkg.getSharePublicKey().toString('hex'),
          bitgoMsg2: signedBitgoMsg2,
        } as never;
      });

      const derivationSeed = crypto.randomBytes(32);
      const result = await utils.createKeychains({
        passphrase: 'test-passphrase',
        enterprise: 'ent-id',
        derivationSeed,
      });

      assert.ok(result.userKeychain.commonKeychain);
      assert.strictEqual(result.userKeychain.commonKeychain, result.backupKeychain.commonKeychain);
      assert.strictEqual(result.userKeychain.commonKeychain, result.bitgoKeychain.commonKeychain);
      assert.strictEqual(result.userKeychain.commonKeychain?.length, 64);
      assert.strictEqual(result.userKeychain.source, 'user');
      assert.strictEqual(result.backupKeychain.source, 'backup');
      assert.strictEqual(result.bitgoKeychain.source, 'bitgo');
    });
  });
});
