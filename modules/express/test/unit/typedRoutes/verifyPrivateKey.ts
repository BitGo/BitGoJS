import * as assert from 'assert';
import * as t from 'io-ts';
import {
  VerifyPrivateKeyBody,
  VerifyPrivateKeyParams,
  VerifyPrivateKeyResponse,
  PostVerifyPrivateKey,
  VerifyPrivateKeyResponse200,
} from '../../../src/typedRoutes/api/v2/verifyPrivateKey';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('VerifyPrivateKey codec tests', function () {
  describe('VerifyPrivateKeyParams', function () {
    it('should validate params with coin and wallet id', function () {
      const validParams = { coin: 'tbtc', id: 'wallet123' };
      const decoded = assertDecode(t.type(VerifyPrivateKeyParams), validParams);
      assert.strictEqual(decoded.coin, 'tbtc');
      assert.strictEqual(decoded.id, 'wallet123');
    });

    it('should reject params with missing coin', function () {
      assert.throws(() => assertDecode(t.type(VerifyPrivateKeyParams), { id: 'wallet123' }));
    });

    it('should reject params with missing id', function () {
      assert.throws(() => assertDecode(t.type(VerifyPrivateKeyParams), { coin: 'tbtc' }));
    });
  });

  describe('VerifyPrivateKeyBody', function () {
    it('should validate body with prv only', function () {
      const body = { prv: 'xprv123...' };
      const decoded = assertDecode(t.type(VerifyPrivateKeyBody), body);
      assert.strictEqual(decoded.prv, 'xprv123...');
    });

    it('should validate body with encryptedPrv and walletPassphrase', function () {
      const body = { encryptedPrv: '{"ct":"..."}', walletPassphrase: 'mypassword' };
      const decoded = assertDecode(t.type(VerifyPrivateKeyBody), body);
      assert.strictEqual(decoded.encryptedPrv, '{"ct":"..."}');
      assert.strictEqual(decoded.walletPassphrase, 'mypassword');
    });

    it('should validate body with prv and multiSigType tss', function () {
      const body = { prv: 'xprv123...', multiSigType: 'tss' as const };
      const decoded = assertDecode(t.type(VerifyPrivateKeyBody), body);
      assert.strictEqual(decoded.multiSigType, 'tss');
    });

    it('should validate body with prv and explicit publicKey', function () {
      const body = { prv: 'xprv123...', publicKey: 'xpub...' };
      const decoded = assertDecode(t.type(VerifyPrivateKeyBody), body);
      assert.strictEqual(decoded.publicKey, 'xpub...');
    });

    it('should validate empty body (all fields optional)', function () {
      const body = {};
      const decoded = assertDecode(t.type(VerifyPrivateKeyBody), body);
      assert.strictEqual(decoded.prv, undefined);
    });

    it('should reject body with invalid multiSigType', function () {
      assert.throws(() => assertDecode(t.type(VerifyPrivateKeyBody), { prv: 'xprv...', multiSigType: 'invalid' }));
    });
  });

  describe('VerifyPrivateKeyResponse200', function () {
    it('should validate response with valid: true', function () {
      const decoded = assertDecode(VerifyPrivateKeyResponse200, { valid: true });
      assert.strictEqual(decoded.valid, true);
    });

    it('should validate response with valid: false', function () {
      const decoded = assertDecode(VerifyPrivateKeyResponse200, { valid: false });
      assert.strictEqual(decoded.valid, false);
    });

    it('should reject response missing valid field', function () {
      assert.throws(() => assertDecode(VerifyPrivateKeyResponse200, {}));
    });
  });

  describe('PostVerifyPrivateKey route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostVerifyPrivateKey.path, '/api/v2/{coin}/wallet/{id}/verifyPrivateKey');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostVerifyPrivateKey.method, 'POST');
    });

    it('should have 200 and 400 response types', function () {
      assert.ok(PostVerifyPrivateKey.response[200]);
      assert.ok(PostVerifyPrivateKey.response[400]);
    });
  });

  describe('Supertest integration tests', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    function mockCoinWithKeychain(opts: {
      assertIsValidKey?: (params: unknown) => Promise<void>;
      getKeysForSigning?: () => Promise<unknown[]>;
    }) {
      const assertIsValidKeyStub = sinon.stub().callsFake(opts.assertIsValidKey ?? (() => Promise.resolve()));
      const getKeysForSigningStub = sinon
        .stub()
        .callsFake(opts.getKeysForSigning ?? (() => Promise.resolve([{ pub: 'xpub...' }])));

      const mockWallet = {};
      const walletsGetStub = sinon.stub().resolves(mockWallet);

      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
        keychains: sinon.stub().returns({ getKeysForSigning: getKeysForSigningStub }),
        assertIsValidKey: assertIsValidKeyStub,
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      return { assertIsValidKeyStub, getKeysForSigningStub, walletsGetStub };
    }

    it('should return valid:true for a matching prv with explicit publicKey', async function () {
      const { assertIsValidKeyStub } = mockCoinWithKeychain({});

      const result = await agent
        .post('/api/v2/tbtc/wallet/wallet123/verifyPrivateKey')
        .set('Authorization', 'Bearer test_access_token_12345')
        .send({ prv: 'xprv...', publicKey: 'xpub...' });

      assert.strictEqual(result.status, 200);
      assert.deepStrictEqual(result.body, { valid: true });
      sinon.assert.calledOnce(assertIsValidKeyStub);
    });

    it('should fetch public key from wallet keychains when publicKey is omitted', async function () {
      const { assertIsValidKeyStub, getKeysForSigningStub } = mockCoinWithKeychain({
        getKeysForSigning: () => Promise.resolve([{ pub: 'xpubFromWallet' }]),
      });

      const result = await agent
        .post('/api/v2/tbtc/wallet/wallet123/verifyPrivateKey')
        .set('Authorization', 'Bearer test_access_token_12345')
        .send({ prv: 'xprv...' });

      assert.strictEqual(result.status, 200);
      assert.deepStrictEqual(result.body, { valid: true });
      sinon.assert.calledOnce(getKeysForSigningStub);
      sinon.assert.calledOnce(assertIsValidKeyStub);
      const callArgs = assertIsValidKeyStub.firstCall.args[0];
      assert.strictEqual(callArgs.publicKey, 'xpubFromWallet');
    });

    it('should use commonKeychain over pub when keychain has both', async function () {
      const { assertIsValidKeyStub } = mockCoinWithKeychain({
        getKeysForSigning: () => Promise.resolve([{ pub: 'xpub', commonKeychain: 'commonKC' }]),
      });

      const result = await agent
        .post('/api/v2/tbtc/wallet/wallet123/verifyPrivateKey')
        .set('Authorization', 'Bearer test_access_token_12345')
        .send({ prv: 'xprv...' });

      assert.strictEqual(result.status, 200);
      const callArgs = assertIsValidKeyStub.firstCall.args[0];
      assert.strictEqual(callArgs.publicKey, 'commonKC');
    });

    it('should pass multiSigType tss to assertIsValidKey', async function () {
      const { assertIsValidKeyStub } = mockCoinWithKeychain({});

      await agent
        .post('/api/v2/tbtc/wallet/wallet123/verifyPrivateKey')
        .set('Authorization', 'Bearer test_access_token_12345')
        .send({ prv: 'xprv...', publicKey: 'xpub...', multiSigType: 'tss' });

      const callArgs = assertIsValidKeyStub.firstCall.args[0];
      assert.strictEqual(callArgs.multiSigType, 'tss');
    });

    it('should accept encryptedPrv with walletPassphrase', async function () {
      const { assertIsValidKeyStub } = mockCoinWithKeychain({});

      const result = await agent
        .post('/api/v2/tbtc/wallet/wallet123/verifyPrivateKey')
        .set('Authorization', 'Bearer test_access_token_12345')
        .send({ encryptedPrv: '{"ct":"..."}', walletPassphrase: 'pass', publicKey: 'xpub...' });

      assert.strictEqual(result.status, 200);
      const callArgs = assertIsValidKeyStub.firstCall.args[0];
      assert.strictEqual(callArgs.encryptedPrv, '{"ct":"..."}');
      assert.strictEqual(callArgs.walletPassphrase, 'pass');
    });

    it('should return 400 when neither prv nor encryptedPrv is provided', async function () {
      mockCoinWithKeychain({});

      const result = await agent
        .post('/api/v2/tbtc/wallet/wallet123/verifyPrivateKey')
        .set('Authorization', 'Bearer test_access_token_12345')
        .send({ publicKey: 'xpub...' });

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error);
    });

    it('should return 400 when encryptedPrv is provided without walletPassphrase', async function () {
      mockCoinWithKeychain({});

      const result = await agent
        .post('/api/v2/tbtc/wallet/wallet123/verifyPrivateKey')
        .set('Authorization', 'Bearer test_access_token_12345')
        .send({ encryptedPrv: '{"ct":"..."}' });

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error);
    });

    it('should propagate error when assertIsValidKey throws (key mismatch)', async function () {
      mockCoinWithKeychain({
        assertIsValidKey: () => Promise.reject(new Error('private key does not match public key')),
      });

      const result = await agent
        .post('/api/v2/tbtc/wallet/wallet123/verifyPrivateKey')
        .set('Authorization', 'Bearer test_access_token_12345')
        .send({ prv: 'xprv_wrong...', publicKey: 'xpub...' });

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should propagate error when wallet not found', async function () {
      const mockCoin = {
        wallets: sinon.stub().returns({ get: sinon.stub().rejects(new Error('wallet not found')) }),
        keychains: sinon.stub().returns({ getKeysForSigning: sinon.stub().resolves([]) }),
        assertIsValidKey: sinon.stub().resolves(),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/tbtc/wallet/nonexistent/verifyPrivateKey')
        .set('Authorization', 'Bearer test_access_token_12345')
        .send({ prv: 'xprv...' });

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });
});
