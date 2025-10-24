import * as assert from 'assert';
import * as t from 'io-ts';
import {
  FanoutUnspentsRequestParams,
  FanoutUnspentsRequestBody,
  FanoutUnspentsResponse,
  PutFanoutUnspents,
} from '../../../src/typedRoutes/api/v1/fanoutUnspents';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('FanoutUnspents codec tests', function () {
  describe('fanoutUnspents', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';

    const mockFanoutResponse = {
      status: 'accepted',
      tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      instant: false,
      fee: 10000,
      feeRate: 20000,
      travelInfos: [],
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully fanout unspents', async function () {
      const requestBody = {
        target: 10,
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock wallet with fanOutUnspents method (note: capital O)
      const mockWallet = {
        fanOutUnspents: sinon.stub().resolves(mockFanoutResponse),
      };

      // Stub the wallets().get() chain
      const walletsGetStub = sinon.stub().resolves(mockWallet);

      const mockWallets = {
        get: walletsGetStub,
      };

      // For V1, bitgo.wallets() is called directly (no coin parameter)
      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      // Make the request to Express
      const result = await agent
        .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('status');
      result.body.should.have.property('tx');
      result.body.should.have.property('hash');
      assert.strictEqual(result.body.status, mockFanoutResponse.status);
      assert.strictEqual(result.body.tx, mockFanoutResponse.tx);
      assert.strictEqual(result.body.hash, mockFanoutResponse.hash);

      // This ensures the response structure matches the typed definition
      const decodedResponse = assertDecode(FanoutUnspentsResponse, result.body);
      assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
      assert.strictEqual(decodedResponse.tx, mockFanoutResponse.tx);
      assert.strictEqual(decodedResponse.hash, mockFanoutResponse.hash);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(walletsGetStub.calledOnceWith({ id: walletId }), true);
      assert.strictEqual(mockWallet.fanOutUnspents.calledOnce, true);
    });

    it('should successfully fanout unspents with xprv', async function () {
      const requestBody = {
        target: 20,
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockWallet = {
        fanOutUnspents: sinon.stub().resolves(mockFanoutResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertDecode(FanoutUnspentsResponse, result.body);
      assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
    });

    it('should successfully fanout unspents with all optional fields', async function () {
      const requestBody = {
        target: 15,
        walletPassphrase: 'test_passphrase',
        validate: false,
        minConfirms: 2,
      };

      const mockWallet = {
        fanOutUnspents: sinon.stub().resolves(mockFanoutResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertDecode(FanoutUnspentsResponse, result.body);
      assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
    });

    it('should return instant transaction response', async function () {
      const requestBody = {
        target: 10,
        walletPassphrase: 'test_passphrase',
      };

      const mockInstantResponse = {
        ...mockFanoutResponse,
        instant: true,
        instantId: 'inst-123456',
      };

      const mockWallet = {
        fanOutUnspents: sinon.stub().resolves(mockInstantResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('instant');
      result.body.should.have.property('instantId');
      assert.strictEqual(result.body.instant, true);
      assert.strictEqual(result.body.instantId, 'inst-123456');

      const decodedResponse = assertDecode(FanoutUnspentsResponse, result.body);
      assert.strictEqual(decodedResponse.instant, true);
      assert.strictEqual(decodedResponse.instantId, 'inst-123456');
    });

    // ==========================================
    // ERROR AND EDGE CASE TESTS
    // ==========================================

    describe('Error Cases', function () {
      it('should handle wallet not found error', async function () {
        const requestBody = {
          target: 10,
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Wallet not found'));
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle fanoutUnspents failure', async function () {
        const requestBody = {
          target: 10,
          walletPassphrase: 'wrong_passphrase',
        };

        const mockWallet = {
          fanOutUnspents: sinon.stub().rejects(new Error('Invalid passphrase')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle insufficient unspents error', async function () {
        const requestBody = {
          target: 100,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          fanOutUnspents: sinon.stub().rejects(new Error('Insufficient unspents to fanout')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle wallets() method error', async function () {
        const requestBody = {
          target: 10,
          walletPassphrase: 'test_passphrase',
        };

        sinon.stub(BitGo.prototype, 'wallets').throws(new Error('Wallets service unavailable'));

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });

    describe('Invalid Request Body', function () {
      it('should reject request with empty body', async function () {
        // Make the request with empty body (missing required 'target')
        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send({});

        // io-ts validation should fail
        assert.ok(result.status >= 400);
      });

      it('should reject request with missing target', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid target type', async function () {
        const requestBody = {
          target: '10', // string instead of number
          walletPassphrase: 'test_passphrase',
        };

        // Make the request
        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid walletPassphrase type', async function () {
        const requestBody = {
          target: 10,
          walletPassphrase: 123, // number instead of string
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid validate type', async function () {
        const requestBody = {
          target: 10,
          validate: 'true', // string instead of boolean
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid minConfirms type', async function () {
        const requestBody = {
          target: 10,
          minConfirms: '2', // string instead of number
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle request with malformed JSON', async function () {
        // Make the request with malformed JSON
        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send('{ invalid json ]');

        // Should fail parsing
        assert.ok(result.status >= 400);
      });
    });

    describe('Edge Cases', function () {
      it('should handle target value at minimum boundary (2)', async function () {
        const requestBody = {
          target: 2,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          fanOutUnspents: sinon.stub().resolves(mockFanoutResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed with minimum valid target value
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(FanoutUnspentsResponse, result.body);
        assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
      });

      it('should handle target value at maximum boundary (300)', async function () {
        const requestBody = {
          target: 300,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          fanOutUnspents: sinon.stub().resolves(mockFanoutResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed with maximum valid target value
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(FanoutUnspentsResponse, result.body);
        assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
      });

      it('should handle very long wallet ID', async function () {
        const veryLongWalletId = 'a'.repeat(1000);
        const requestBody = {
          target: 10,
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Invalid wallet ID'));
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${veryLongWalletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle wallet ID with special characters', async function () {
        const specialCharWalletId = '../../../etc/passwd';
        const requestBody = {
          target: 10,
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Invalid wallet ID'));
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${encodeURIComponent(specialCharWalletId)}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle both walletPassphrase and xprv provided', async function () {
        const requestBody = {
          target: 10,
          walletPassphrase: 'test_passphrase',
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        const mockWallet = {
          fanOutUnspents: sinon.stub().resolves(mockFanoutResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed - SDK handles priority of auth methods
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(FanoutUnspentsResponse, result.body);
        assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
      });

      it('should handle zero minConfirms', async function () {
        const requestBody = {
          target: 10,
          walletPassphrase: 'test_passphrase',
          minConfirms: 0,
        };

        const mockWallet = {
          fanOutUnspents: sinon.stub().resolves(mockFanoutResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed - zero minConfirms is valid (includes unconfirmed)
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(FanoutUnspentsResponse, result.body);
        assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
      });

      it('should handle negative target value', async function () {
        const requestBody = {
          target: -5,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          fanOutUnspents: sinon.stub().rejects(new Error('Invalid target value')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });
    });

    describe('Response Validation Edge Cases', function () {
      it('should reject response with missing required field in FanoutUnspentsResponse', async function () {
        const requestBody = {
          target: 10,
          walletPassphrase: 'test_passphrase',
        };

        // Mock returns invalid response (missing required fields)
        const invalidResponse = {
          status: 'accepted',
          tx: '0x123...',
          // missing other required fields
        };

        const mockWallet = {
          fanOutUnspents: sinon.stub().resolves(invalidResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Even if SDK returns 200, response should fail codec validation
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(FanoutUnspentsResponse, result.body);
          });
        }
      });

      it('should reject response with wrong type in field', async function () {
        const requestBody = {
          target: 10,
          walletPassphrase: 'test_passphrase',
        };

        // Mock returns invalid response (wrong field type)
        const invalidResponse = {
          status: 123, // Wrong type! Should be string
          tx: '0x123...',
          hash: 'abc123',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        };

        const mockWallet = {
          fanOutUnspents: sinon.stub().resolves(invalidResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Response codec validation should catch type mismatch
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(FanoutUnspentsResponse, result.body);
          });
        }
      });
    });
  });

  describe('FanoutUnspentsRequestParams', function () {
    it('should validate params with required id', function () {
      const validParams = {
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestParams), validParams);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing id', function () {
      const invalidParams = {};

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        id: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestParams), invalidParams);
      });
    });
  });

  describe('FanoutUnspentsRequestBody', function () {
    it('should validate body with required target', function () {
      const validBody = {
        target: 10,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.validate, undefined);
      assert.strictEqual(decoded.minConfirms, undefined);
    });

    it('should reject body without target', function () {
      const invalidBody = {};

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should validate body with walletPassphrase', function () {
      const validBody = {
        target: 10,
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with xprv', function () {
      const validBody = {
        target: 10,
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.xprv, validBody.xprv);
    });

    it('should validate body with validate flag', function () {
      const validBody = {
        target: 10,
        validate: false,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.validate, validBody.validate);
    });

    it('should validate body with minConfirms', function () {
      const validBody = {
        target: 10,
        minConfirms: 2,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.minConfirms, validBody.minConfirms);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        target: 10,
        walletPassphrase: 'mySecurePassphrase',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        validate: true,
        minConfirms: 2,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.validate, validBody.validate);
      assert.strictEqual(decoded.minConfirms, validBody.minConfirms);
    });

    it('should reject body with non-number target', function () {
      const invalidBody = {
        target: '10', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        target: 10,
        walletPassphrase: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xprv', function () {
      const invalidBody = {
        target: 10,
        xprv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean validate', function () {
      const invalidBody = {
        target: 10,
        validate: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number minConfirms', function () {
      const invalidBody = {
        target: 10,
        minConfirms: '2', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });
  });

  describe('FanoutUnspentsResponse', function () {
    it('should validate response with required fields', function () {
      const validResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      const decoded = assertDecode(FanoutUnspentsResponse, validResponse);
      assert.strictEqual(decoded.status, validResponse.status);
      assert.strictEqual(decoded.tx, validResponse.tx);
      assert.strictEqual(decoded.hash, validResponse.hash);
      assert.strictEqual(decoded.instant, validResponse.instant);
      assert.strictEqual(decoded.fee, validResponse.fee);
      assert.strictEqual(decoded.feeRate, validResponse.feeRate);
      assert.deepStrictEqual(decoded.travelInfos, validResponse.travelInfos);
      assert.strictEqual(decoded.instantId, undefined); // Optional field
      assert.strictEqual(decoded.bitgoFee, undefined); // Optional field
      assert.strictEqual(decoded.travelResult, undefined); // Optional field
    });

    it('should validate response with all fields including optional ones', function () {
      const validResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: true,
        instantId: 'inst-123456',
        fee: 10000,
        feeRate: 20000,
        travelInfos: [{ fromAddress: '1From...', toAddress: '1To...', amount: 1000000 }],
        bitgoFee: { amount: 5000, address: '1BitGo...' },
        travelResult: { compliance: 'pass' },
      };

      const decoded = assertDecode(FanoutUnspentsResponse, validResponse);
      assert.strictEqual(decoded.status, validResponse.status);
      assert.strictEqual(decoded.tx, validResponse.tx);
      assert.strictEqual(decoded.hash, validResponse.hash);
      assert.strictEqual(decoded.instant, validResponse.instant);
      assert.strictEqual(decoded.instantId, validResponse.instantId);
      assert.strictEqual(decoded.fee, validResponse.fee);
      assert.strictEqual(decoded.feeRate, validResponse.feeRate);
      assert.deepStrictEqual(decoded.travelInfos, validResponse.travelInfos);
      assert.deepStrictEqual(decoded.bitgoFee, validResponse.bitgoFee);
      assert.deepStrictEqual(decoded.travelResult, validResponse.travelResult);
    });

    it('should reject response with missing status', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing tx', function () {
      const invalidResponse = {
        status: 'accepted',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing hash', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing instant', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing fee', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing feeRate', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing travelInfos', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
      };

      try {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
        assert.fail('Expected decode to fail but it succeeded');
      } catch (e) {
        // Expected to fail
        assert.ok(e instanceof Error);
      }
    });

    it('should reject response with non-string status', function () {
      const invalidResponse = {
        status: 123, // number instead of string
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-string instantId when present', function () {
      const invalidResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: true,
        instantId: 123, // number instead of string
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });
  });

  describe('PutFanoutUnspents route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PutFanoutUnspents.path, '/api/v1/wallet/{id}/fanoutunspents');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PutFanoutUnspents.method, 'PUT');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PutFanoutUnspents.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PutFanoutUnspents.response[200]);
      assert.ok(PutFanoutUnspents.response[400]);
    });
  });
});
