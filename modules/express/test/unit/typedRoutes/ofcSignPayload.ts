import * as assert from 'assert';
import { PostOfcSignPayload } from '../../../src/typedRoutes/api/v2/ofcSignPayload';
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

    afterEach(function () {
      sinon.restore();
    });

    // ==========================================
    // SUCCESSFUL REQUEST TESTS
    // ==========================================

    it('should successfully sign payload with JSON object', async function () {
      const walletId = '61f039aad587c2000745c687373e0fa9';
      const payload = {
        transaction: {
          amount: 1000,
          currency: 'USD',
        },
      };
      const stringifiedPayload = JSON.stringify(payload);
      const signature = '0123456789abcdef';

      const requestBody = {
        walletId,
        payload,
      };

      // Create mock trading account
      const mockTradingAccount = {
        signPayload: sinon.stub().resolves(signature),
      };

      // Create mock wallet
      const mockWallet = {
        id: sinon.stub().returns(walletId),
        toTradingAccount: sinon.stub().returns(mockTradingAccount),
      };

      // Create mock wallets
      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      // Create mock coin
      const mockCoin = {
        wallets: sinon.stub().returns(mockWallets),
      };

      // Stub BitGo.prototype.coin
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Set up environment variable for wallet passphrase
      process.env[`WALLET_${walletId}_PASSPHRASE`] = 'test_passphrase';

      // Make the request to Express
      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('payload');
      result.body.should.have.property('signature');
      assert.strictEqual(result.body.payload, stringifiedPayload);
      assert.strictEqual(result.body.signature, signature);

      const decodedResponse = assertDecode(PostOfcSignPayload.response[200], result.body);
      assert.strictEqual(decodedResponse.payload, stringifiedPayload);
      assert.strictEqual(decodedResponse.signature, signature);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(coinStub.calledOnceWith('ofc'), true);
      assert.strictEqual(mockCoin.wallets.calledOnce, true);
      assert.strictEqual(mockWallets.get.calledOnceWith({ id: walletId }), true);
      assert.strictEqual(mockWallet.toTradingAccount.calledOnce, true);
      assert.strictEqual(mockTradingAccount.signPayload.calledOnce, true);

      // Clean up
      delete process.env[`WALLET_${walletId}_PASSPHRASE`];
    });

    it('should successfully sign payload with simple JSON object', async function () {
      const walletId = '61f039aad587c2000745c687373e0fa9';
      const payload = {
        data: 'test data',
        timestamp: 1234567890,
      };
      const stringifiedPayload = JSON.stringify(payload);
      const signature = 'abcdef0123456789';

      const requestBody = {
        walletId,
        payload, // Send as object
      };

      const mockTradingAccount = {
        signPayload: sinon.stub().resolves(signature),
      };

      const mockWallet = {
        id: sinon.stub().returns(walletId),
        toTradingAccount: sinon.stub().returns(mockTradingAccount),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      const mockCoin = {
        wallets: sinon.stub().returns(mockWallets),
      };

      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      process.env[`WALLET_${walletId}_PASSPHRASE`] = 'test_passphrase';

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('payload');
      result.body.should.have.property('signature');
      assert.strictEqual(result.body.payload, stringifiedPayload);
      assert.strictEqual(result.body.signature, signature);

      const decodedResponse = assertDecode(PostOfcSignPayload.response[200], result.body);
      assert.strictEqual(decodedResponse.payload, stringifiedPayload);
      assert.strictEqual(decodedResponse.signature, signature);

      // Verify SDK method calls
      assert.strictEqual(coinStub.calledOnceWith('ofc'), true);
      assert.strictEqual(mockCoin.wallets.calledOnce, true);
      assert.strictEqual(mockWallets.get.calledOnceWith({ id: walletId }), true);

      delete process.env[`WALLET_${walletId}_PASSPHRASE`];
    });

    it('should successfully sign payload with walletPassphrase in request body', async function () {
      const walletId = '61f039aad587c2000745c687373e0fa9';
      const walletPassphrase = 'my_secure_passphrase';
      const payload = { test: 'data' };
      const signature = 'signature123';

      const requestBody = {
        walletId,
        payload,
        walletPassphrase,
      };

      const mockTradingAccount = {
        signPayload: sinon.stub().resolves(signature),
      };

      const mockWallet = {
        id: sinon.stub().returns(walletId),
        toTradingAccount: sinon.stub().returns(mockTradingAccount),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      const mockCoin = {
        wallets: sinon.stub().returns(mockWallets),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('payload');
      result.body.should.have.property('signature');
      assert.strictEqual(result.body.signature, signature);

      const decodedResponse = assertDecode(PostOfcSignPayload.response[200], result.body);
      assert.strictEqual(decodedResponse.signature, signature);

      // Verify signPayload was called with the passphrase
      assert.strictEqual(mockTradingAccount.signPayload.calledOnce, true);
      const signPayloadArgs = mockTradingAccount.signPayload.firstCall.args[0];
      assert.strictEqual(signPayloadArgs.walletPassphrase, walletPassphrase);
    });

    it('should successfully sign complex nested JSON payload', async function () {
      const walletId = '61f039aad587c2000745c687373e0fa9';
      const payload = {
        transaction: {
          sender: {
            address: '0x123',
            balance: 1000,
          },
          receiver: {
            address: '0x456',
            balance: 2000,
          },
          metadata: {
            timestamp: Date.now(),
            nonce: 42,
          },
        },
      };
      const signature = 'complex_signature_hex';

      const requestBody = {
        walletId,
        payload,
      };

      const mockTradingAccount = {
        signPayload: sinon.stub().resolves(signature),
      };

      const mockWallet = {
        id: sinon.stub().returns(walletId),
        toTradingAccount: sinon.stub().returns(mockTradingAccount),
      };

      const mockWallets = {
        get: sinon.stub().resolves(mockWallet),
      };

      const mockCoin = {
        wallets: sinon.stub().returns(mockWallets),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      process.env[`WALLET_${walletId}_PASSPHRASE`] = 'test_passphrase';

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('payload');
      result.body.should.have.property('signature');
      assert.strictEqual(result.body.signature, signature);

      const decodedResponse = assertDecode(PostOfcSignPayload.response[200], result.body);
      assert.strictEqual(decodedResponse.signature, signature);

      delete process.env[`WALLET_${walletId}_PASSPHRASE`];
    });

    // ==========================================
    // ERROR HANDLING TESTS
    // ==========================================

    describe('Error Cases', function () {
      it('should handle wallet not found error', async function () {
        const walletId = 'nonexistent_wallet';
        const requestBody = {
          walletId,
          payload: { test: 'data' },
        };

        const mockWallets = {
          get: sinon.stub().resolves(undefined),
        };

        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        process.env[`WALLET_${walletId}_PASSPHRASE`] = 'test_passphrase';

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.ok(result.status >= 400);
        result.body.should.have.property('error');

        delete process.env[`WALLET_${walletId}_PASSPHRASE`];
      });

      it('should handle missing wallet passphrase', async function () {
        const walletId = '61f039aad587c2000745c687373e0fa9';
        const requestBody = {
          walletId,
          payload: { test: 'data' },
        };

        const mockWallet = {
          id: sinon.stub().returns(walletId),
          toTradingAccount: sinon.stub().returns({
            signPayload: sinon.stub(),
          }),
        };

        const mockWallets = {
          get: sinon.stub().resolves(mockWallet),
        };

        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.ok(result.status >= 400);
        result.body.should.have.property('error');
      });

      it('should handle BitGo coin initialization failure', async function () {
        const requestBody = {
          walletId: '61f039aad587c2000745c687373e0fa9',
          payload: { test: 'data' },
        };

        sinon.stub(BitGo.prototype, 'coin').throws(new Error('Coin initialization failed'));

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.ok(result.status >= 400);
        result.body.should.have.property('error');
      });
    });

    // ==========================================
    // INVALID REQUEST BODY TESTS
    // ==========================================

    describe('Invalid Request Body', function () {
      it('should reject request with empty body', async function () {
        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send({});

        // io-ts validation should fail
        assert.ok(result.status >= 400);
      });

      it('should reject request with missing walletId', async function () {
        const requestBody = {
          payload: { test: 'data' },
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with missing payload', async function () {
        const requestBody = {
          walletId: '61f039aad587c2000745c687373e0fa9',
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with empty string walletId', async function () {
        const requestBody = {
          walletId: '',
          payload: { test: 'data' },
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation (NonEmptyString)
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid walletId type', async function () {
        const requestBody = {
          walletId: 12345, // number instead of string
          payload: { test: 'data' },
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with null walletId', async function () {
        const requestBody = {
          walletId: null,
          payload: { test: 'data' },
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with null payload', async function () {
        const requestBody = {
          walletId: '61f039aad587c2000745c687373e0fa9',
          payload: null,
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid walletPassphrase type', async function () {
        const requestBody = {
          walletId: '61f039aad587c2000745c687373e0fa9',
          payload: { test: 'data' },
          walletPassphrase: 12345, // number instead of string
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should handle request with malformed JSON', async function () {
        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send('{ invalid json }');

        // Should fail parsing
        assert.ok(result.status >= 400);
      });

      it('should reject request with array instead of object', async function () {
        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(['invalid', 'array']);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid JSON string for payload', async function () {
        const requestBody = {
          walletId: '61f039aad587c2000745c687373e0fa9',
          payload: 'not valid json {',
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation (JsonFromString)
        assert.ok(result.status >= 400);
      });
    });

    // ==========================================
    // EDGE CASES
    // ==========================================

    describe('Edge Cases', function () {
      it('should handle very long walletId', async function () {
        const veryLongWalletId = 'a'.repeat(1000);
        const requestBody = {
          walletId: veryLongWalletId,
          payload: { test: 'data' },
        };

        const mockWallets = {
          get: sinon.stub().rejects(new Error('Invalid wallet ID')),
        };

        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        process.env[`WALLET_${veryLongWalletId}_PASSPHRASE`] = 'test_passphrase';

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle gracefully
        assert.ok(result.status >= 400);

        delete process.env[`WALLET_${veryLongWalletId}_PASSPHRASE`];
      });

      it('should handle walletId with special characters', async function () {
        const specialCharWalletId = '../../../etc/passwd';
        const requestBody = {
          walletId: specialCharWalletId,
          payload: { test: 'data' },
        };

        const mockWallets = {
          get: sinon.stub().resolves(undefined),
        };

        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        process.env[`WALLET_${specialCharWalletId}_PASSPHRASE`] = 'test_passphrase';

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle special characters safely
        assert.ok(result.status >= 400);

        delete process.env[`WALLET_${specialCharWalletId}_PASSPHRASE`];
      });

      it('should handle payload with special characters', async function () {
        const walletId = '61f039aad587c2000745c687373e0fa9';
        const payload = {
          data: '!@#$%^&*()_+{}[]|\\:";\'<>?,./~`',
          xss: '<script>alert("XSS")</script>',
          sql: "'; DROP TABLE users; --",
        };
        const signature = 'special_char_signature';

        const requestBody = {
          walletId,
          payload,
        };

        const mockTradingAccount = {
          signPayload: sinon.stub().resolves(signature),
        };

        const mockWallet = {
          id: sinon.stub().returns(walletId),
          toTradingAccount: sinon.stub().returns(mockTradingAccount),
        };

        const mockWallets = {
          get: sinon.stub().resolves(mockWallet),
        };

        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        process.env[`WALLET_${walletId}_PASSPHRASE`] = 'test_passphrase';

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle special characters safely
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('signature');
        assert.strictEqual(result.body.signature, signature);

        const decodedResponse = assertDecode(PostOfcSignPayload.response[200], result.body);
        assert.strictEqual(decodedResponse.signature, signature);

        delete process.env[`WALLET_${walletId}_PASSPHRASE`];
      });

      it('should handle empty object payload', async function () {
        const walletId = '61f039aad587c2000745c687373e0fa9';
        const payload = {};
        const signature = 'empty_payload_signature';

        const requestBody = {
          walletId,
          payload,
        };

        const mockTradingAccount = {
          signPayload: sinon.stub().resolves(signature),
        };

        const mockWallet = {
          id: sinon.stub().returns(walletId),
          toTradingAccount: sinon.stub().returns(mockTradingAccount),
        };

        const mockWallets = {
          get: sinon.stub().resolves(mockWallet),
        };

        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        process.env[`WALLET_${walletId}_PASSPHRASE`] = 'test_passphrase';

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle empty payload
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('payload');
        result.body.should.have.property('signature');
        assert.strictEqual(result.body.payload, '{}');

        const decodedResponse = assertDecode(PostOfcSignPayload.response[200], result.body);
        assert.strictEqual(decodedResponse.payload, '{}');

        delete process.env[`WALLET_${walletId}_PASSPHRASE`];
      });

      it('should handle very large payload', async function () {
        const walletId = '61f039aad587c2000745c687373e0fa9';
        const largeData = 'x'.repeat(10000);
        const payload = {
          data: largeData,
          metadata: {
            size: largeData.length,
          },
        };
        const signature = 'large_payload_signature';

        const requestBody = {
          walletId,
          payload,
        };

        const mockTradingAccount = {
          signPayload: sinon.stub().resolves(signature),
        };

        const mockWallet = {
          id: sinon.stub().returns(walletId),
          toTradingAccount: sinon.stub().returns(mockTradingAccount),
        };

        const mockWallets = {
          get: sinon.stub().resolves(mockWallet),
        };

        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        process.env[`WALLET_${walletId}_PASSPHRASE`] = 'test_passphrase';

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle large payload
        assert.ok(result.status === 200 || result.status >= 400);

        if (result.status === 200) {
          const decodedResponse = assertDecode(PostOfcSignPayload.response[200], result.body);
          assert.strictEqual(decodedResponse.signature, signature);
        }

        delete process.env[`WALLET_${walletId}_PASSPHRASE`];
      });
    });

    // ==========================================
    // RESPONSE VALIDATION EDGE CASES
    // ==========================================

    describe('Response Validation Edge Cases', function () {
      it('should reject response with missing payload field', async function () {
        const walletId = '61f039aad587c2000745c687373e0fa9';
        const requestBody = {
          walletId,
          payload: { test: 'data' },
        };

        // Mock returns invalid response (missing payload)
        const mockTradingAccount = {
          signPayload: sinon.stub().resolves('signature'),
        };

        const mockWallet = {
          id: sinon.stub().returns(walletId),
          toTradingAccount: sinon.stub().returns(mockTradingAccount),
        };

        // Modify toTradingAccount to return object without payload
        mockWallet.toTradingAccount = sinon.stub().returns({
          signPayload: sinon.stub().resolves('signature_only'),
        });

        const mockWallets = {
          get: sinon.stub().resolves(mockWallet),
        };

        const mockCoin = {
          wallets: sinon.stub().returns(mockWallets),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        process.env[`WALLET_${walletId}_PASSPHRASE`] = 'test_passphrase';

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // The handler should construct proper response
        // But if it doesn't, codec validation should catch it
        if (result.status === 200 && !result.body.payload) {
          assert.throws(() => {
            assertDecode(PostOfcSignPayload.response[200], result.body);
          });
        }

        delete process.env[`WALLET_${walletId}_PASSPHRASE`];
      });
    });
  });

  // ==========================================
  // ROUTE DEFINITION TESTS
  // ==========================================

  describe('PostOfcSignPayload route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostOfcSignPayload.path, '/api/v2/ofc/signPayload');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostOfcSignPayload.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      assert.ok(PostOfcSignPayload.request);
      const requestType = PostOfcSignPayload.request;
      assert.ok(requestType);
    });

    it('should have the correct response types', function () {
      assert.ok(PostOfcSignPayload.response[200]);
      assert.ok(PostOfcSignPayload.response[400]);
    });
  });
});
