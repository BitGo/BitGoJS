import * as assert from 'assert';
import * as t from 'io-ts';
import {
  ConsolidateUnspentsRequestParams,
  ConsolidateUnspentsRequestBody,
  ConsolidateUnspentsResponse,
  PutConsolidateUnspents,
} from '../../../src/typedRoutes/api/v1/consolidateUnspents';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('ConsolidateUnspents codec tests', function () {
  describe('consolidateUnspents', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';

    const mockConsolidateResponse = [
      {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        instant: false,
        fee: 10000,
        feeRate: 20000,
        travelInfos: [],
      },
    ];

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully consolidate unspents with walletPassphrase', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.be.an.Array();
      result.body.should.have.length(1);
      result.body[0].should.have.property('status');
      result.body[0].should.have.property('tx');
      result.body[0].should.have.property('hash');
      assert.strictEqual(result.body[0].status, mockConsolidateResponse[0].status);
      assert.strictEqual(result.body[0].tx, mockConsolidateResponse[0].tx);
      assert.strictEqual(result.body[0].hash, mockConsolidateResponse[0].hash);

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      assert.strictEqual(decodedResponse[0].status, mockConsolidateResponse[0].status);
      assert.strictEqual(decodedResponse[0].tx, mockConsolidateResponse[0].tx);
      assert.strictEqual(decodedResponse[0].hash, mockConsolidateResponse[0].hash);

      assert.strictEqual(walletsGetStub.calledOnceWith({ id: walletId }), true);
      assert.strictEqual(mockWallet.consolidateUnspents.calledOnce, true);
    });

    it('should successfully consolidate unspents with xprv', async function () {
      const requestBody = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      assert.strictEqual(decodedResponse[0].status, mockConsolidateResponse[0].status);
    });

    it('should successfully consolidate unspents with all optional fields', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
        validate: false,
        target: 3,
        minSize: 10000,
        maxSize: 50000,
        maxInputCountPerConsolidation: 150,
        maxIterationCount: 3,
        minConfirms: 2,
        feeRate: 20000,
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      assert.strictEqual(decodedResponse[0].status, mockConsolidateResponse[0].status);

      // Verify all parameters were passed to SDK
      assert.strictEqual(mockWallet.consolidateUnspents.calledOnce, true);
      const callArgs = mockWallet.consolidateUnspents.firstCall.args[0];
      assert.strictEqual(callArgs.walletPassphrase, requestBody.walletPassphrase);
      assert.strictEqual(callArgs.validate, requestBody.validate);
      assert.strictEqual(callArgs.target, requestBody.target);
    });

    it('should return instant transaction response', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
      };

      const mockInstantResponse = [
        {
          ...mockConsolidateResponse[0],
          instant: true,
          instantId: 'inst-123456',
        },
      ];

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockInstantResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body[0].should.have.property('instant');
      result.body[0].should.have.property('instantId');
      assert.strictEqual(result.body[0].instant, true);
      assert.strictEqual(result.body[0].instantId, 'inst-123456');

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      assert.strictEqual(decodedResponse[0].instant, true);
      assert.strictEqual(decodedResponse[0].instantId, 'inst-123456');
    });

    it('should return multiple consolidation transactions', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
        maxIterationCount: 3,
      };

      const mockMultipleConsolidations = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
        {
          status: 'accepted',
          tx: '0200000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          instant: false,
          fee: 12000,
          feeRate: 22000,
          travelInfos: [],
        },
        {
          status: 'accepted',
          tx: '0300000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
          instant: false,
          fee: 11000,
          feeRate: 21000,
          travelInfos: [],
        },
      ];

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockMultipleConsolidations),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.length(3);

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      assert.strictEqual(decodedResponse.length, 3);
      assert.strictEqual(decodedResponse[0].hash, mockMultipleConsolidations[0].hash);
      assert.strictEqual(decodedResponse[1].hash, mockMultipleConsolidations[1].hash);
      assert.strictEqual(decodedResponse[2].hash, mockMultipleConsolidations[2].hash);
    });

    it('should successfully consolidate with minSize and maxSize as strings', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
        minSize: '10000',
        maxSize: '50000',
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      assert.strictEqual(decodedResponse[0].status, mockConsolidateResponse[0].status);
    });

    // ==========================================
    // ERROR AND EDGE CASE TESTS
    // ==========================================

    describe('Error Cases', function () {
      it('should handle wallet not found error', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Wallet not found'));
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle consolidateUnspents failure', async function () {
        const requestBody = {
          walletPassphrase: 'wrong_passphrase',
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().rejects(new Error('Invalid passphrase')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle insufficient unspents error', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().rejects(new Error('Insufficient unspents to consolidate')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle wallets() method error', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        sinon.stub(BitGo.prototype, 'wallets').throws(new Error('Wallets service unavailable'));

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle insufficient funds error', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          feeRate: 100000,
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().rejects(new Error('Insufficient funds')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle minSize greater than maxSize error', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          minSize: 50000,
          maxSize: 10000,
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().rejects(new Error('minSize cannot be greater than maxSize')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });

    describe('Invalid Request Body', function () {
      it('should reject request with empty body (valid but no auth)', async function () {
        const mockWallet = {
          consolidateUnspents: sinon.stub().rejects(new Error('Missing authentication')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send({});

        // Empty body is valid per codec, but SDK should reject without auth
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid walletPassphrase type', async function () {
        const requestBody = {
          walletPassphrase: 123, // number instead of string
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid validate type', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          validate: 'true', // string instead of boolean
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid target type', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          target: '5', // string instead of number
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid minConfirms type', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          minConfirms: '2', // string instead of number
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid feeRate type', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          feeRate: '20000', // string instead of number
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid maxInputCountPerConsolidation type', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          maxInputCountPerConsolidation: '150', // string instead of number
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid maxIterationCount type', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          maxIterationCount: '3', // string instead of number
        };

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle request with malformed JSON', async function () {
        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send('{ invalid json ]');

        assert.ok(result.status >= 400);
      });
    });

    describe('Edge Cases', function () {
      it('should handle target value at boundary (1)', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          target: 1,
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
        assert.strictEqual(decodedResponse[0].status, mockConsolidateResponse[0].status);
      });

      it('should handle maxInputCountPerConsolidation at minimum boundary (2)', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          maxInputCountPerConsolidation: 2,
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
        assert.strictEqual(decodedResponse[0].status, mockConsolidateResponse[0].status);
      });

      it('should handle very long wallet ID', async function () {
        const veryLongWalletId = 'a'.repeat(1000);
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Invalid wallet ID'));
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${veryLongWalletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle wallet ID with special characters', async function () {
        const specialCharWalletId = '../../../etc/passwd';
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Invalid wallet ID'));
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${encodeURIComponent(specialCharWalletId)}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle both walletPassphrase and xprv provided', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed - SDK handles priority of auth methods
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
        assert.strictEqual(decodedResponse[0].status, mockConsolidateResponse[0].status);
      });

      it('should handle zero minConfirms', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          minConfirms: 0,
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed - zero minConfirms is valid (includes unconfirmed)
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
        assert.strictEqual(decodedResponse[0].status, mockConsolidateResponse[0].status);
      });

      it('should handle negative target value', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          target: -5,
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().rejects(new Error('Invalid target value')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle negative maxIterationCount (unlimited iterations)', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          maxIterationCount: -1,
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed - -1 means unlimited iterations
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
        assert.strictEqual(decodedResponse[0].status, mockConsolidateResponse[0].status);
      });

      it('should handle empty response array (no consolidation needed)', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const emptyResponse: any[] = [];

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(emptyResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        result.body.should.be.an.Array();
        result.body.should.have.length(0);

        const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
        assert.strictEqual(decodedResponse.length, 0);
      });
    });

    describe('Response Validation Edge Cases', function () {
      it('should reject response with missing required field', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        // Mock returns invalid response (missing required fields)
        const invalidResponse = [
          {
            status: 'accepted',
            tx: '0x123...',
            // missing other required fields
          },
        ];

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(invalidResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Even if SDK returns 200, response should fail codec validation
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(ConsolidateUnspentsResponse, result.body);
          });
        }
      });

      it('should reject response with wrong type in field', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        // Mock returns invalid response (wrong field type)
        const invalidResponse = [
          {
            status: 123, // Wrong type! Should be string
            tx: '0x123...',
            hash: 'abc123',
            instant: false,
            fee: 10000,
            feeRate: 20000,
            travelInfos: [],
          },
        ];

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(invalidResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

        const result = await agent
          .put(`/api/v1/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Response codec validation should catch type mismatch
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(ConsolidateUnspentsResponse, result.body);
          });
        }
      });
    });
  });

  describe('ConsolidateUnspentsRequestParams', function () {
    it('should validate params with required id', function () {
      const validParams = {
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestParams), validParams);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing id', function () {
      const invalidParams = {};

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        id: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestParams), invalidParams);
      });
    });
  });

  describe('ConsolidateUnspentsRequestBody', function () {
    it('should validate empty body', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.validate, undefined);
      assert.strictEqual(decoded.target, undefined);
      assert.strictEqual(decoded.minSize, undefined);
      assert.strictEqual(decoded.maxSize, undefined);
      assert.strictEqual(decoded.maxInputCountPerConsolidation, undefined);
      assert.strictEqual(decoded.maxIterationCount, undefined);
      assert.strictEqual(decoded.minConfirms, undefined);
      assert.strictEqual(decoded.feeRate, undefined);
    });

    it('should validate body with walletPassphrase', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with xprv', function () {
      const validBody = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.xprv, validBody.xprv);
    });

    it('should validate body with validate flag', function () {
      const validBody = {
        validate: false,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.validate, validBody.validate);
    });

    it('should validate body with target', function () {
      const validBody = {
        target: 5,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.target, validBody.target);
    });

    it('should validate body with minSize as number', function () {
      const validBody = {
        minSize: 10000,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.minSize, validBody.minSize);
    });

    it('should validate body with minSize as string', function () {
      const validBody = {
        minSize: '10000',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.minSize, validBody.minSize);
    });

    it('should validate body with maxSize as number', function () {
      const validBody = {
        maxSize: 50000,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.maxSize, validBody.maxSize);
    });

    it('should validate body with maxSize as string', function () {
      const validBody = {
        maxSize: '50000',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.maxSize, validBody.maxSize);
    });

    it('should validate body with maxInputCountPerConsolidation', function () {
      const validBody = {
        maxInputCountPerConsolidation: 150,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.maxInputCountPerConsolidation, validBody.maxInputCountPerConsolidation);
    });

    it('should validate body with maxIterationCount', function () {
      const validBody = {
        maxIterationCount: 3,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.maxIterationCount, validBody.maxIterationCount);
    });

    it('should validate body with minConfirms', function () {
      const validBody = {
        minConfirms: 2,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.minConfirms, validBody.minConfirms);
    });

    it('should validate body with feeRate', function () {
      const validBody = {
        feeRate: 20000,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.feeRate, validBody.feeRate);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        validate: true,
        target: 3,
        minSize: 10000,
        maxSize: 50000,
        maxInputCountPerConsolidation: 150,
        maxIterationCount: 3,
        minConfirms: 2,
        feeRate: 20000,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.validate, validBody.validate);
      assert.strictEqual(decoded.target, validBody.target);
      assert.strictEqual(decoded.minSize, validBody.minSize);
      assert.strictEqual(decoded.maxSize, validBody.maxSize);
      assert.strictEqual(decoded.maxInputCountPerConsolidation, validBody.maxInputCountPerConsolidation);
      assert.strictEqual(decoded.maxIterationCount, validBody.maxIterationCount);
      assert.strictEqual(decoded.minConfirms, validBody.minConfirms);
      assert.strictEqual(decoded.feeRate, validBody.feeRate);
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        walletPassphrase: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xprv', function () {
      const invalidBody = {
        xprv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean validate', function () {
      const invalidBody = {
        validate: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number target', function () {
      const invalidBody = {
        target: '5', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with invalid minSize type', function () {
      const invalidBody = {
        minSize: true, // boolean instead of number or string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with invalid maxSize type', function () {
      const invalidBody = {
        maxSize: true, // boolean instead of number or string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number maxInputCountPerConsolidation', function () {
      const invalidBody = {
        maxInputCountPerConsolidation: '150', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number maxIterationCount', function () {
      const invalidBody = {
        maxIterationCount: '3', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number minConfirms', function () {
      const invalidBody = {
        minConfirms: '2', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number feeRate', function () {
      const invalidBody = {
        feeRate: '20000', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });
  });

  describe('ConsolidateUnspentsResponse', function () {
    it('should validate response with required fields', function () {
      const validResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      assert.strictEqual(decoded[0].status, validResponse[0].status);
      assert.strictEqual(decoded[0].tx, validResponse[0].tx);
      assert.strictEqual(decoded[0].hash, validResponse[0].hash);
      assert.strictEqual(decoded[0].instant, validResponse[0].instant);
      assert.strictEqual(decoded[0].fee, validResponse[0].fee);
      assert.strictEqual(decoded[0].feeRate, validResponse[0].feeRate);
      assert.deepStrictEqual(decoded[0].travelInfos, validResponse[0].travelInfos);
      assert.strictEqual(decoded[0].instantId, undefined); // Optional field
      assert.strictEqual(decoded[0].bitgoFee, undefined); // Optional field
      assert.strictEqual(decoded[0].travelResult, undefined); // Optional field
    });

    it('should validate response with all fields including optional ones', function () {
      const validResponse = [
        {
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
        },
      ];

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      assert.strictEqual(decoded[0].status, validResponse[0].status);
      assert.strictEqual(decoded[0].tx, validResponse[0].tx);
      assert.strictEqual(decoded[0].hash, validResponse[0].hash);
      assert.strictEqual(decoded[0].instant, validResponse[0].instant);
      assert.strictEqual(decoded[0].instantId, validResponse[0].instantId);
      assert.strictEqual(decoded[0].fee, validResponse[0].fee);
      assert.strictEqual(decoded[0].feeRate, validResponse[0].feeRate);
      assert.deepStrictEqual(decoded[0].travelInfos, validResponse[0].travelInfos);
      assert.deepStrictEqual(decoded[0].bitgoFee, validResponse[0].bitgoFee);
      assert.deepStrictEqual(decoded[0].travelResult, validResponse[0].travelResult);
    });

    it('should validate response with multiple consolidation transactions', function () {
      const validResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
        {
          status: 'accepted',
          tx: '0200000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          instant: false,
          fee: 12000,
          feeRate: 22000,
          travelInfos: [],
        },
      ];

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      assert.strictEqual(decoded.length, 2);
      assert.strictEqual(decoded[0].status, validResponse[0].status);
      assert.strictEqual(decoded[0].tx, validResponse[0].tx);
      assert.strictEqual(decoded[0].hash, validResponse[0].hash);
      assert.strictEqual(decoded[0].instant, validResponse[0].instant);
      assert.strictEqual(decoded[0].fee, validResponse[0].fee);
      assert.strictEqual(decoded[0].feeRate, validResponse[0].feeRate);
      assert.deepStrictEqual(decoded[0].travelInfos, validResponse[0].travelInfos);
      assert.strictEqual(decoded[1].status, validResponse[1].status);
      assert.strictEqual(decoded[1].tx, validResponse[1].tx);
      assert.strictEqual(decoded[1].hash, validResponse[1].hash);
      assert.strictEqual(decoded[1].instant, validResponse[1].instant);
      assert.strictEqual(decoded[1].fee, validResponse[1].fee);
      assert.strictEqual(decoded[1].feeRate, validResponse[1].feeRate);
      assert.deepStrictEqual(decoded[1].travelInfos, validResponse[1].travelInfos);
    });

    it('should reject response with missing status', function () {
      const invalidResponse = [
        {
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing tx', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing hash', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing instant', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing fee', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing feeRate', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing travelInfos', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
        },
      ];

      try {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
        assert.fail('Expected decode to fail but it succeeded');
      } catch (e) {
        // Expected to fail
        assert.ok(e instanceof Error);
      }
    });

    it('should reject response with non-string status', function () {
      const invalidResponse = [
        {
          status: 123, // number instead of string
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-string tx', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: 123, // number instead of string
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-string hash', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: 123, // number instead of string
          instant: false,
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-boolean instant', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: 'false', // string instead of boolean
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-number fee', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: '10000', // string instead of number
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-number feeRate', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: false,
          fee: 10000,
          feeRate: '20000', // string instead of number
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-string instantId when present', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          instant: true,
          instantId: 123, // number instead of string
          fee: 10000,
          feeRate: 20000,
          travelInfos: [],
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });
  });

  describe('PutConsolidateUnspents route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PutConsolidateUnspents.path, '/api/v1/wallet/{id}/consolidateunspents');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PutConsolidateUnspents.method, 'PUT');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PutConsolidateUnspents.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PutConsolidateUnspents.response[200]);
      assert.ok(PutConsolidateUnspents.response[400]);
    });
  });
});
