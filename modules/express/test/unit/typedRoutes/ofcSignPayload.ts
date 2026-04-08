import * as assert from 'assert';
import * as t from 'io-ts';
import {
  OfcSignPayloadBody,
  OfcSignPayloadResponse200,
  PostOfcSignPayload,
} from '../../../src/typedRoutes/api/v2/ofcSignPayload';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('OfcSignPayload codec tests', function () {
  describe('ofcSignPayload', function () {
    const agent = setupAgent();

    const mockSignPayloadResponse = {
      payload: '{"amount":"1000000","currency":"USD","recipient":"0xabcdefabcdef"}',
      signature:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully sign payload with walletPassphrase', async function () {
      const requestBody = {
        walletId: 'ofc-wallet-id-123',
        payload: { amount: '1000000', currency: 'USD', recipient: '0xabcdefabcdef' },
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockTradingAccount = {
        signPayload: sinon.stub().resolves(mockSignPayloadResponse.signature),
      };

      const mockWallet = {
        id: () => requestBody.walletId,
        toTradingAccount: sinon.stub().returns(mockTradingAccount),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('payload');
      result.body.should.have.property('signature');
      assert.strictEqual(result.body.signature, mockSignPayloadResponse.signature);

      const decodedResponse = assertDecode(OfcSignPayloadResponse200, result.body);
      assert.strictEqual(decodedResponse.signature, mockSignPayloadResponse.signature);
      assert.strictEqual(typeof decodedResponse.payload, 'string');

      assert.strictEqual(coinStub.calledOnceWith('ofc'), true);
      assert.strictEqual(mockCoin.wallets.calledOnce, true);
      assert.strictEqual(walletsGetStub.calledOnceWith({ id: requestBody.walletId }), true);
      assert.strictEqual(mockTradingAccount.signPayload.calledOnce, true);
    });

    it('should successfully sign payload with JSON object payload', async function () {
      const requestBody = {
        walletId: 'ofc-wallet-id-123',
        payload: { transaction: 'data', amount: 1000 },
        walletPassphrase: 'test_passphrase',
      };

      const mockTradingAccount = {
        signPayload: sinon.stub().resolves(mockSignPayloadResponse.signature),
      };

      const mockWallet = {
        id: () => requestBody.walletId,
        toTradingAccount: sinon.stub().returns(mockTradingAccount),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(OfcSignPayloadResponse200, result.body);
      assert.strictEqual(decodedResponse.signature, mockSignPayloadResponse.signature);
    });

    it('should successfully sign payload with stringified JSON payload', async function () {
      const requestBody = {
        walletId: 'ofc-wallet-id-123',
        payload: '{"transaction":"data","amount":1000}',
        walletPassphrase: 'test_passphrase',
      };

      const mockTradingAccount = {
        signPayload: sinon.stub().resolves(mockSignPayloadResponse.signature),
      };

      const mockWallet = {
        id: () => requestBody.walletId,
        toTradingAccount: sinon.stub().returns(mockTradingAccount),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('payload');
      result.body.should.have.property('signature');

      const decodedResponse = assertDecode(OfcSignPayloadResponse200, result.body);
      assert.ok(decodedResponse);
    });

    it('should successfully sign payload without walletPassphrase (uses env)', async function () {
      const requestBody = {
        walletId: 'ofc-wallet-id-123',
        payload: { amount: '1000000', currency: 'USD' },
      };

      // Set environment variable for wallet passphrase
      process.env['WALLET_ofc-wallet-id-123_PASSPHRASE'] = 'env_passphrase';

      const mockTradingAccount = {
        signPayload: sinon.stub().resolves(mockSignPayloadResponse.signature),
      };

      const mockWallet = {
        id: () => requestBody.walletId,
        toTradingAccount: sinon.stub().returns(mockTradingAccount),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(OfcSignPayloadResponse200, result.body);
      assert.strictEqual(decodedResponse.signature, mockSignPayloadResponse.signature);

      // Cleanup environment variable
      delete process.env['WALLET_ofc-wallet-id-123_PASSPHRASE'];
    });

    it('should successfully sign complex nested JSON payload', async function () {
      const requestBody = {
        walletId: 'ofc-wallet-id-123',
        payload: {
          transaction: {
            from: '0xabc',
            to: '0xdef',
            amount: 1000,
            metadata: {
              timestamp: 1234567890,
              nonce: 1,
            },
          },
        },
        walletPassphrase: 'test_passphrase',
      };

      const mockTradingAccount = {
        signPayload: sinon.stub().resolves(mockSignPayloadResponse.signature),
      };

      const mockWallet = {
        id: () => requestBody.walletId,
        toTradingAccount: sinon.stub().returns(mockTradingAccount),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('payload');
      result.body.should.have.property('signature');

      const decodedResponse = assertDecode(OfcSignPayloadResponse200, result.body);
      assert.ok(decodedResponse);
    });

    // ==========================================
    // ERROR HANDLING TESTS
    // ==========================================

    describe('Error Cases', function () {
      it('should handle wallet not found error', async function () {
        const requestBody = {
          walletId: 'non-existent-wallet-id',
          payload: { amount: '1000000' },
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().resolves(undefined);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 404);
        result.body.should.have.property('error');
      });

      it('should handle signPayload failure', async function () {
        const requestBody = {
          walletId: 'ofc-wallet-id-123',
          payload: { amount: '1000000' },
          walletPassphrase: 'wrong_passphrase',
        };

        const mockTradingAccount = {
          signPayload: sinon.stub().rejects(new Error('Invalid passphrase')),
        };

        const mockWallet = {
          id: () => requestBody.walletId,
          toTradingAccount: sinon.stub().returns(mockTradingAccount),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle coin() method error', async function () {
        const requestBody = {
          walletId: 'ofc-wallet-id-123',
          payload: { amount: '1000000' },
          walletPassphrase: 'test_passphrase',
        };

        sinon.stub(BitGo.prototype, 'coin').throws(new Error('OFC coin not available'));

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle wallets.get() failure', async function () {
        const requestBody = {
          walletId: 'ofc-wallet-id-123',
          payload: { amount: '1000000' },
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Failed to fetch wallet'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle toTradingAccount() failure', async function () {
        const requestBody = {
          walletId: 'ofc-wallet-id-123',
          payload: { amount: '1000000' },
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          id: () => requestBody.walletId,
          toTradingAccount: sinon.stub().throws(new Error('Wallet is not a trading account')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });

    describe('Invalid Request Body', function () {
      it('should reject request with missing walletId', async function () {
        const requestBody = {
          payload: { amount: '1000000' },
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with missing payload', async function () {
        const requestBody = {
          walletId: 'ofc-wallet-id-123',
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with empty walletId', async function () {
        const requestBody = {
          walletId: '',
          payload: { amount: '1000000' },
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid walletId type', async function () {
        const requestBody = {
          walletId: 123, // number instead of string
          payload: { amount: '1000000' },
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid walletPassphrase type', async function () {
        const requestBody = {
          walletId: 'ofc-wallet-id-123',
          payload: { amount: '1000000' },
          walletPassphrase: 123, // number instead of string
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid payload type', async function () {
        const requestBody = {
          walletId: 'ofc-wallet-id-123',
          payload: 123, // number instead of string or JSON
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle request with malformed JSON', async function () {
        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send('{ invalid json ]');

        assert.ok(result.status >= 400);
      });
    });

    describe('Response Validation Edge Cases', function () {
      it('should reject response with missing payload field', async function () {
        const requestBody = {
          walletId: 'ofc-wallet-id-123',
          payload: { amount: '1000000' },
          walletPassphrase: 'test_passphrase',
        };

        const invalidResponse = {
          signature: '0x1234567890abcdef',
        };

        const mockTradingAccount = {
          signPayload: sinon.stub().resolves(invalidResponse.signature),
        };

        const mockWallet = {
          id: () => requestBody.walletId,
          toTradingAccount: sinon.stub().returns(mockTradingAccount),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        if (result.status === 200) {
          // The handler should always return payload, but let's test if response is missing it
          assert.throws(() => {
            assertDecode(OfcSignPayloadResponse200, { signature: invalidResponse.signature });
          });
        }
      });

      it('should reject response with missing signature field', async function () {
        const invalidResponse = {
          payload: '{"amount":"1000000"}',
        };

        assert.throws(() => {
          assertDecode(OfcSignPayloadResponse200, invalidResponse);
        });
      });

      it('should reject response with wrong type for payload', async function () {
        const invalidResponse = {
          payload: 123, // number instead of string
          signature: '0x1234567890abcdef',
        };

        assert.throws(() => {
          assertDecode(OfcSignPayloadResponse200, invalidResponse);
        });
      });

      it('should reject response with wrong type for signature', async function () {
        const invalidResponse = {
          payload: '{"amount":"1000000"}',
          signature: 123, // number instead of string
        };

        assert.throws(() => {
          assertDecode(OfcSignPayloadResponse200, invalidResponse);
        });
      });

      it('should reject response with empty object', async function () {
        const invalidResponse = {};

        assert.throws(() => {
          assertDecode(OfcSignPayloadResponse200, invalidResponse);
        });
      });
    });
  });

  describe('OfcSignPayloadBody', function () {
    it('should validate body with required fields', function () {
      const validBody = {
        walletId: 'ofc-wallet-id-123',
        payload: { amount: '1000000' },
      };

      const decoded = assertDecode(t.type(OfcSignPayloadBody), validBody);
      assert.strictEqual(decoded.walletId, validBody.walletId);
      assert.deepStrictEqual(decoded.payload, validBody.payload);
      assert.strictEqual(decoded.walletPassphrase, undefined);
    });

    it('should validate body with walletPassphrase', function () {
      const validBody = {
        walletId: 'ofc-wallet-id-123',
        payload: { amount: '1000000' },
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(OfcSignPayloadBody), validBody);
      assert.strictEqual(decoded.walletId, validBody.walletId);
      assert.deepStrictEqual(decoded.payload, validBody.payload);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with stringified JSON payload', function () {
      const validBody = {
        walletId: 'ofc-wallet-id-123',
        payload: '{"amount":"1000000","currency":"USD"}',
      };

      const decoded = assertDecode(t.type(OfcSignPayloadBody), validBody);
      assert.strictEqual(decoded.walletId, validBody.walletId);
      // JsonFromString codec accepts both string and parsed JSON,
      // io-ts union tries them in order, so string will be kept as string if valid JSON
      assert.ok(decoded.payload);
    });

    it('should validate body with JSON object payload', function () {
      const validBody = {
        walletId: 'ofc-wallet-id-123',
        payload: { amount: '1000000', currency: 'USD', nested: { data: 'value' } },
      };

      const decoded = assertDecode(t.type(OfcSignPayloadBody), validBody);
      assert.strictEqual(decoded.walletId, validBody.walletId);
      assert.deepStrictEqual(decoded.payload, validBody.payload);
    });

    it('should reject body with missing walletId', function () {
      const invalidBody = {
        payload: { amount: '1000000' },
      };

      assert.throws(() => {
        assertDecode(t.type(OfcSignPayloadBody), invalidBody);
      });
    });

    it('should reject body with missing payload', function () {
      const invalidBody = {
        walletId: 'ofc-wallet-id-123',
      };

      assert.throws(() => {
        assertDecode(t.type(OfcSignPayloadBody), invalidBody);
      });
    });

    it('should reject body with empty walletId', function () {
      const invalidBody = {
        walletId: '',
        payload: { amount: '1000000' },
      };

      assert.throws(() => {
        assertDecode(t.type(OfcSignPayloadBody), invalidBody);
      });
    });

    it('should reject body with non-string walletId', function () {
      const invalidBody = {
        walletId: 123, // number instead of string
        payload: { amount: '1000000' },
      };

      assert.throws(() => {
        assertDecode(t.type(OfcSignPayloadBody), invalidBody);
      });
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        walletId: 'ofc-wallet-id-123',
        payload: { amount: '1000000' },
        walletPassphrase: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(OfcSignPayloadBody), invalidBody);
      });
    });

    it('should validate body with numeric payload (valid JSON)', function () {
      const validBody = {
        walletId: 'ofc-wallet-id-123',
        payload: 123, // numbers are valid JSON
      };

      const decoded = assertDecode(t.type(OfcSignPayloadBody), validBody);
      assert.strictEqual(decoded.walletId, validBody.walletId);
      assert.strictEqual(decoded.payload, 123);
    });
  });

  describe('OfcSignPayloadResponse200', function () {
    it('should validate response with required fields', function () {
      const validResponse = {
        payload: '{"amount":"1000000","currency":"USD"}',
        signature:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      };

      const decoded = assertDecode(OfcSignPayloadResponse200, validResponse);
      assert.strictEqual(decoded.payload, validResponse.payload);
      assert.strictEqual(decoded.signature, validResponse.signature);
    });

    it('should reject response with missing payload', function () {
      const invalidResponse = {
        signature: '0x1234567890abcdef',
      };

      assert.throws(() => {
        assertDecode(OfcSignPayloadResponse200, invalidResponse);
      });
    });

    it('should reject response with missing signature', function () {
      const invalidResponse = {
        payload: '{"amount":"1000000"}',
      };

      assert.throws(() => {
        assertDecode(OfcSignPayloadResponse200, invalidResponse);
      });
    });

    it('should reject response with non-string payload', function () {
      const invalidResponse = {
        payload: 123, // number instead of string
        signature: '0x1234567890abcdef',
      };

      assert.throws(() => {
        assertDecode(OfcSignPayloadResponse200, invalidResponse);
      });
    });

    it('should reject response with non-string signature', function () {
      const invalidResponse = {
        payload: '{"amount":"1000000"}',
        signature: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(OfcSignPayloadResponse200, invalidResponse);
      });
    });

    it('should validate response with empty string payload', function () {
      const validResponse = {
        payload: '',
        signature: '0x1234567890abcdef',
      };

      const decoded = assertDecode(OfcSignPayloadResponse200, validResponse);
      assert.strictEqual(decoded.payload, '');
    });

    it('should validate response with empty string signature', function () {
      const validResponse = {
        payload: '{"amount":"1000000"}',
        signature: '',
      };

      const decoded = assertDecode(OfcSignPayloadResponse200, validResponse);
      assert.strictEqual(decoded.signature, '');
    });
  });

  describe('PostOfcSignPayload route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostOfcSignPayload.path, '/api/v2/ofc/signPayload');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostOfcSignPayload.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostOfcSignPayload.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostOfcSignPayload.response[200]);
      assert.ok(PostOfcSignPayload.response[400]);
    });
  });
});
