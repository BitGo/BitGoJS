import * as assert from 'assert';
import * as sinon from 'sinon';
import { agent as supertest } from 'supertest';
import 'should';
import 'should-http';
import 'should-sinon';
import '../../lib/asserts';
import { IncorrectPasswordError, Safes } from '@bitgo/sdk-core';
import { PostGenerateSafe } from '../../../src/typedRoutes/api/v2/generateSafe';
import { PostGenerateSafeWallet } from '../../../src/typedRoutes/api/v2/generateSafeWallet';
import { PostGenerateSafeKeys } from '../../../src/typedRoutes/api/v2/generateSafeKeys';

const ENTERPRISE_ID = '6a217b164ae0ae10226a16569d3682ec';
const SAFE_ID = 'safe123';

function mockSafeJson(label: string) {
  return {
    id: SAFE_ID,
    enterpriseId: ENTERPRISE_ID,
    label,
    status: 'active' as const,
    creator: 'user1',
    users: [{ userId: 'user1', permissions: ['admin', 'spend'] }],
    createdAt: new Date('2026-07-07T00:00:00.000Z'),
  };
}

function stubSafe(partial: { toJSON?: () => unknown; createWallet?: sinon.SinonStub }) {
  return partial as unknown as Awaited<ReturnType<Safes['get']>>;
}

describe('Generate Safe Typed Routes Tests', function () {
  let agent: ReturnType<typeof supertest>;

  before(function () {
    const { app } = require('../../../src/expressApp');
    const config = require('../../../src/config').DefaultConfig;
    const testApp = app(config);
    agent = supertest(testApp);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('express.v2.safes.generate', function () {
    it('should generate a safe and return SafeData', async function () {
      const label = 'Test Safe';
      const passphrase = 'mySecurePassphrase123';
      const safeJson = mockSafeJson(label);
      const generateSafeStub = sinon.stub(Safes.prototype, 'generateSafe').resolves(
        stubSafe({
          toJSON: () => safeJson,
        })
      );

      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/generate`).send({
        label,
        passphrase,
      });

      res.status.should.equal(200);
      res.body.should.have.property('id', SAFE_ID);
      res.body.should.have.property('label', label);
      res.body.should.have.property('status', 'active');
      generateSafeStub.should.have.been.calledOnce();
      generateSafeStub.firstCall.args[0].should.deepEqual({ label, passphrase });
    });

    it('should return 400 when label is missing', async function () {
      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/generate`).send({
        passphrase: 'password',
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
    });

    it('should return 400 when passphrase is missing', async function () {
      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/generate`).send({
        label: 'Test Safe',
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
    });

    it('should propagate ceremony-failure errors unwrapped', async function () {
      sinon
        .stub(Safes.prototype, 'generateSafe')
        .rejects(
          new Error(
            'Safe key generation failed for 1 root ceremony/ies [ecdsaMpc: boom]. The safe (safe123) has been archived; create a new safe and retry.'
          )
        );

      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/generate`).send({
        label: 'Test Safe',
        passphrase: 'password',
      });

      res.status.should.equal(500);
      res.body.should.have.property('error');
      res.body.error.should.match(/has been archived/);
    });

    it('should have correct route metadata', function () {
      assert.strictEqual(PostGenerateSafe.method, 'POST');
      assert.strictEqual(PostGenerateSafe.path, '/api/v2/enterprise/{enterpriseId}/safes/generate');
      assert.ok(PostGenerateSafe.response[200]);
      assert.ok(PostGenerateSafe.response[400]);
    });
  });

  describe('express.v2.safes.wallet.generate', function () {
    it('should mint a child wallet from a safe', async function () {
      const label = 'Safe Child';
      const passphrase = 'mySecurePassphrase123';
      const coin = 'tsol';
      const walletJson = {
        id: 'wallet123',
        coin,
        label,
        keys: ['userKey123', 'backupKey123', 'bitgoKey123'],
        multisigType: 'tss' as const,
      };
      const createWalletStub = sinon.stub().resolves({
        toJSON: () => walletJson,
      });
      sinon.stub(Safes.prototype, 'get').resolves(
        stubSafe({
          createWallet: createWalletStub,
        })
      );

      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/wallets/generate`).send({
        coin,
        label,
        passphrase,
        multisigType: 'tss',
      });

      res.status.should.equal(200);
      res.body.should.have.property('id', 'wallet123');
      res.body.should.have.property('label', label);
      res.body.should.have.property('multisigType', 'tss');
      createWalletStub.should.have.been.calledOnce();
      createWalletStub.firstCall.args[0].should.deepEqual({
        coin,
        label,
        passphrase,
        multisigType: 'tss',
      });
    });

    it('should return 400 when coin is missing', async function () {
      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/wallets/generate`).send({
        label: 'Safe Child',
        passphrase: 'password',
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
    });

    it('should return 400 when passphrase is missing', async function () {
      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/wallets/generate`).send({
        coin: 'tbtc',
        label: 'Safe Child',
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
    });

    it('should return 400 when multisigType is invalid', async function () {
      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/wallets/generate`).send({
        coin: 'tbtc',
        label: 'Safe Child',
        passphrase: 'password',
        multisigType: 'cold',
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
      res.body.error.should.match(/multisigType/);
    });

    it('should propagate IncorrectPasswordError', async function () {
      sinon.stub(Safes.prototype, 'get').resolves(
        stubSafe({
          createWallet: sinon.stub().rejects(new IncorrectPasswordError()),
        })
      );

      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/wallets/generate`).send({
        coin: 'tbtc',
        label: 'Safe Child',
        passphrase: 'wrong',
      });

      res.status.should.equal(401);
      res.body.should.have.property('error');
      String(res.body.error || res.body.message).should.match(/passphrase/i);
    });

    it('should have correct route metadata', function () {
      assert.strictEqual(PostGenerateSafeWallet.method, 'POST');
      assert.strictEqual(
        PostGenerateSafeWallet.path,
        '/api/v2/enterprise/{enterpriseId}/safes/{safeId}/wallets/generate'
      );
      assert.ok(PostGenerateSafeWallet.response[200]);
      assert.ok(PostGenerateSafeWallet.response[400]);
    });
  });

  describe('express.v2.safes.keys.generate', function () {
    const rootKeys = {
      rootKeys: {
        hot: {
          secp256k1Multisig: ['user-1', 'backup-1', 'bitgo-1'] as [string, string, string],
        },
      },
    };

    it('should run phase-2 ceremonies and return root key ids', async function () {
      const passphrase = 'mySecurePassphrase123';
      const createSafeKeysStub = sinon.stub(Safes.prototype, 'createSafeKeys').resolves(rootKeys);

      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/keys/generate`).send({
        passphrase,
        enabledRootSlots: ['secp256k1Multisig'],
      });

      res.status.should.equal(200);
      res.body.should.have.property('rootKeys');
      res.body.rootKeys.hot.secp256k1Multisig.should.deepEqual(['user-1', 'backup-1', 'bitgo-1']);
      createSafeKeysStub.should.have.been.calledOnce();
      createSafeKeysStub.firstCall.args[0].should.have.property('passphrase', passphrase);
      createSafeKeysStub.firstCall.args[0].should.have.property('safeId', SAFE_ID);
      const enabledRootSlots = createSafeKeysStub.firstCall.args[0].enabledRootSlots;
      if (enabledRootSlots === undefined) {
        throw new Error('expected enabledRootSlots');
      }
      enabledRootSlots.should.deepEqual(['secp256k1Multisig']);
    });

    it('should return 400 when passphrase is missing', async function () {
      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/keys/generate`).send({});

      res.status.should.equal(400);
      res.body.should.have.property('error');
    });

    it('should return 400 when enabledRootSlots contains an unknown slot', async function () {
      const res = await agent.post(`/api/v2/enterprise/${ENTERPRISE_ID}/safes/${SAFE_ID}/keys/generate`).send({
        passphrase: 'password',
        enabledRootSlots: ['notASlot'],
      });

      res.status.should.equal(400);
      res.body.should.have.property('error');
    });

    it('should have correct route metadata', function () {
      assert.strictEqual(PostGenerateSafeKeys.method, 'POST');
      assert.strictEqual(PostGenerateSafeKeys.path, '/api/v2/enterprise/{enterpriseId}/safes/{safeId}/keys/generate');
      assert.ok(PostGenerateSafeKeys.response[200]);
      assert.ok(PostGenerateSafeKeys.response[400]);
    });
  });
});
