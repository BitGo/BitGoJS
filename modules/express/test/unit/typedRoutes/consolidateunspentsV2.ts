import * as assert from 'assert';
import * as t from 'io-ts';
import {
  ConsolidateUnspentsRequestParams,
  ConsolidateUnspentsRequestBody,
  ConsolidateUnspentsResponse,
  PostConsolidateUnspents,
} from '../../../src/typedRoutes/api/v2/consolidateunspents';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

/**
 * Helper function to assert and narrow single transaction response
 */
function assertSingleTxResponse(response: any) {
  assert.ok(!Array.isArray(response), 'Expected single transaction response, got array');
  return response as {
    status: string;
    tx: string;
    hash?: string;
    txid?: string;
    fee?: number;
    feeRate?: number;
    instant?: boolean;
    instantId?: string;
    travelInfos?: unknown;
    bitgoFee?: unknown;
    travelResult?: unknown;
  };
}

describe('ConsolidateUnspents V2 codec tests', function () {
  describe('consolidateUnspents v2', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tbtc';

    const mockConsolidateResponse = {
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

    it('should successfully consolidate unspents with walletPassphrase', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('status');
      result.body.should.have.property('tx');
      assert.strictEqual(result.body.status, mockConsolidateResponse.status);
      assert.strictEqual(result.body.tx, mockConsolidateResponse.tx);

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      const singleResponse = assertSingleTxResponse(decodedResponse);
      assert.strictEqual(singleResponse.status, mockConsolidateResponse.status);
      assert.strictEqual(singleResponse.tx, mockConsolidateResponse.tx);

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
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      const singleResponse = assertSingleTxResponse(decodedResponse);
      assert.strictEqual(singleResponse.status, mockConsolidateResponse.status);
    });

    it('should successfully consolidate unspents with advanced parameters', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
        minValue: 100000,
        maxValue: 1000000,
        minHeight: 500000,
        numUnspentsToMake: 5,
        feeTxConfirmTarget: 3,
        limit: 100,
        minConfirms: 2,
        enforceMinConfirmsForChange: true,
        feeRate: 10000,
        maxFeeRate: 50000,
        maxFeePercentage: 0.1,
        comment: 'Test consolidation',
        otp: '123456',
        targetAddress: '2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF',
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      const singleResponse = assertSingleTxResponse(decodedResponse);
      assert.strictEqual(singleResponse.status, mockConsolidateResponse.status);

      // Verify consolidateUnspents was called with the correct parameters
      assert.strictEqual(mockWallet.consolidateUnspents.calledOnce, true);
      const callArgs = mockWallet.consolidateUnspents.firstCall.args[0];
      assert.strictEqual(callArgs.walletPassphrase, 'test_passphrase');
      assert.strictEqual(callArgs.minValue, 100000);
      assert.strictEqual(callArgs.maxValue, 1000000);
      assert.strictEqual(callArgs.numUnspentsToMake, 5);
      assert.strictEqual(callArgs.minConfirms, 2);
      assert.strictEqual(callArgs.limit, 100);
    });

    it('should successfully consolidate unspents with txFormat parameter', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
        txFormat: 'psbt' as const,
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      const singleResponse = assertSingleTxResponse(decodedResponse);
      assert.strictEqual(singleResponse.status, mockConsolidateResponse.status);

      // Verify txFormat was passed through to SDK
      const callArgs = mockWallet.consolidateUnspents.firstCall.args[0];
      assert.strictEqual(callArgs.txFormat, 'psbt');
    });

    it('should return instant transaction response', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
      };

      const mockInstantResponse = {
        ...mockConsolidateResponse,
        instant: true,
        instantId: 'inst-123456',
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockInstantResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('instant');
      result.body.should.have.property('instantId');
      assert.strictEqual(result.body.instant, true);
      assert.strictEqual(result.body.instantId, 'inst-123456');

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      const singleResponse = assertSingleTxResponse(decodedResponse);
      assert.strictEqual(singleResponse.instant, true);
      assert.strictEqual(singleResponse.instantId, 'inst-123456');
    });

    it('should handle response with txid instead of hash', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
      };

      const mockResponseWithTxid = {
        status: 'signed',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        fee: 10000,
        feeRate: 20000,
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockResponseWithTxid),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txid');

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      const singleResponse = assertSingleTxResponse(decodedResponse);
      assert.strictEqual(singleResponse.status, 'signed');
      assert.strictEqual(singleResponse.txid, mockResponseWithTxid.txid);
    });

    it('should handle single consolidate mode with bulk=false', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
        bulk: false,
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.ok(!Array.isArray(result.body), 'Response should be a single object');

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      const singleResponse = assertSingleTxResponse(decodedResponse);
      assert.strictEqual(singleResponse.status, mockConsolidateResponse.status);

      // Verify bulk parameter was passed
      const callArgs = mockWallet.consolidateUnspents.firstCall.args[0];
      assert.strictEqual(callArgs.bulk, false);
    });

    it('should handle bulk consolidate mode with array response', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
        bulk: true,
      };

      const mockBulkResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          fee: 10000,
          feeRate: 20000,
        },
        {
          status: 'accepted',
          tx: '0200000001d8ebe4d9718b34c56b7d2c6be8cdf13bfg82b1g32fc5b83b6ae1d1df2a513e100000000000ffffffff0190d21a00000000001976a914d029f1c47b48c8e3f4a5b7d2c8f689c8b68b542788ac00000000',
          hash: '2345678901bcdef02345678901bcdef02345678901bcdef02345678901bcdef0',
          fee: 11000,
          feeRate: 22000,
        },
        {
          status: 'accepted',
          tx: '0300000001e9fcf5ea829c45d67c8e3d7cf9def24cgh93c2h43gd6c94c7bf2e2eg3b624f200000000000ffffffff01a0e31b00000000001976a914e13ag2d58c59d9f4g5c8e3d9g7a9d9d9c68b542788ac00000000',
          hash: '3456789012cdef13456789012cdef13456789012cdef13456789012cdef123',
          fee: 12000,
          feeRate: 24000,
        },
      ];

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockBulkResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.ok(Array.isArray(result.body), 'Response should be an array');
      assert.strictEqual(result.body.length, 3);

      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      assert.ok(Array.isArray(decodedResponse));
      assert.strictEqual(decodedResponse[0].status, 'accepted');
      assert.strictEqual(decodedResponse[1].status, 'accepted');
      assert.strictEqual(decodedResponse[2].status, 'accepted');

      // Verify bulk parameter was passed
      const callArgs = mockWallet.consolidateUnspents.firstCall.args[0];
      assert.strictEqual(callArgs.bulk, true);
    });

    describe('Framework Integration Tests', function () {
      describe('URL Parameter Validation', function () {
        it('should reject request with empty coin parameter', async function () {
          const requestBody = {
            walletPassphrase: 'test_passphrase',
          };

          const result = await agent
            .post(`/api/v2/ /wallet/${walletId}/consolidateunspents`)
            .set('Authorization', 'Bearer test_access_token_12345')
            .set('Content-Type', 'application/json')
            .send(requestBody);

          // Framework should reject invalid path parameter
          assert.ok(result.status >= 400);
        });

        it('should reject request with invalid coin type', async function () {
          const invalidCoin = 'invalid_coin_12345';
          const requestBody = {
            walletPassphrase: 'test_passphrase',
          };

          sinon.stub(BitGo.prototype, 'coin').throws(new Error('Unsupported coin'));

          const result = await agent
            .post(`/api/v2/${invalidCoin}/wallet/${walletId}/consolidateunspents`)
            .set('Authorization', 'Bearer test_access_token_12345')
            .set('Content-Type', 'application/json')
            .send(requestBody);

          // Should fail when BitGo SDK doesn't support the coin
          assert.ok(result.status >= 400);
        });
      });

      describe('Authentication', function () {
        it('should reject request without Authorization header', async function () {
          const requestBody = {
            walletPassphrase: 'test_passphrase',
          };

          const result = await agent
            .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
            .set('Content-Type', 'application/json')
            .send(requestBody);

          // Auth middleware should reject unauthenticated requests
          assert.ok(result.status === 401 || result.status === 403);
        });
      });

      describe('Request Body Validation', function () {
        it('should reject request with invalid walletPassphrase type', async function () {
          const requestBody = {
            walletPassphrase: 123, // number instead of string
          };

          const result = await agent
            .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
            .set('Authorization', 'Bearer test_access_token_12345')
            .set('Content-Type', 'application/json')
            .send(requestBody);

          // io-ts codec should reject invalid types
          assert.ok(result.status >= 400);
        });

        it('should reject request with invalid bulk type', async function () {
          const requestBody = {
            bulk: 'true', // string instead of boolean
          };

          const result = await agent
            .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
            .set('Authorization', 'Bearer test_access_token_12345')
            .set('Content-Type', 'application/json')
            .send(requestBody);

          // io-ts codec should reject invalid types
          assert.ok(result.status >= 400);
        });

        it('should handle request with malformed JSON', async function () {
          const result = await agent
            .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
            .set('Authorization', 'Bearer test_access_token_12345')
            .set('Content-Type', 'application/json')
            .send('{ invalid json ]');

          // JSON parsing middleware should reject malformed JSON
          assert.ok(result.status >= 400);
        });
      });
    });

    describe('Error Cases', function () {
      it('should handle wallet not found error', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Wallet not found'));
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle consolidateUnspents failure with invalid passphrase', async function () {
        const requestBody = {
          walletPassphrase: 'wrong_passphrase',
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().rejects(new Error('Invalid passphrase')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
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
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle fee rate too high error', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          feeRate: 1000000, // Extremely high fee rate
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().rejects(new Error('Fee rate exceeds maximum')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });

    describe('Invalid Request Body', function () {
      it('should accept request with empty body (all params are optional)', async function () {
        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send({});

        assert.strictEqual(result.status, 200);
      });
    });

    describe('Edge Cases', function () {
      it('should handle both walletPassphrase and xprv provided', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
        const singleResponse = assertSingleTxResponse(decodedResponse);
        assert.strictEqual(singleResponse.status, mockConsolidateResponse.status);
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
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
        const singleResponse = assertSingleTxResponse(decodedResponse);
        assert.strictEqual(singleResponse.status, mockConsolidateResponse.status);
      });

      it('should handle minValue and maxValue as strings', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          minValue: '100000',
          maxValue: '1000000',
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
        const singleResponse = assertSingleTxResponse(decodedResponse);
        assert.strictEqual(singleResponse.status, mockConsolidateResponse.status);
      });

      it('should handle minValue and maxValue as numbers', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          minValue: 100000,
          maxValue: 1000000,
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
        const singleResponse = assertSingleTxResponse(decodedResponse);
        assert.strictEqual(singleResponse.status, mockConsolidateResponse.status);
      });

      it('should handle maxFeePercentage as decimal', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
          maxFeePercentage: 0.05, // 5%
        };

        const mockWallet = {
          consolidateUnspents: sinon.stub().resolves(mockConsolidateResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const callArgs = mockWallet.consolidateUnspents.firstCall.args[0];
        assert.strictEqual(callArgs.maxFeePercentage, 0.05);
      });
    });
  });

  describe('ConsolidateUnspentsRequestParams V2', function () {
    it('should validate params with required coin and id', function () {
      const validParams = {
        coin: 'tbtc',
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestParams), invalidParams);
      });
    });

    it('should reject params with missing id', function () {
      const invalidParams = {
        coin: 'tbtc',
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string coin', function () {
      const invalidParams = {
        coin: 123, // number instead of string
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        coin: 'tbtc',
        id: 123456, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestParams), invalidParams);
      });
    });
  });

  describe('ConsolidateUnspentsRequestBody V2', function () {
    it('should validate body with all optional fields empty', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.xprv, undefined);
      assert.strictEqual(decoded.bulk, undefined);
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

    it('should validate body with bulk parameter', function () {
      const validBodyTrue = {
        bulk: true,
      };
      const validBodyFalse = {
        bulk: false,
      };

      const decodedTrue = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBodyTrue);
      assert.strictEqual(decodedTrue.bulk, true);

      const decodedFalse = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBodyFalse);
      assert.strictEqual(decodedFalse.bulk, false);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        minValue: 100000,
        maxValue: '1000000',
        minHeight: 500000,
        numUnspentsToMake: 5,
        feeTxConfirmTarget: 3,
        limit: 100,
        minConfirms: 2,
        enforceMinConfirmsForChange: true,
        feeRate: 10000,
        maxFeeRate: 50000,
        maxFeePercentage: 0.1,
        comment: 'Test consolidation',
        otp: '123456',
        targetAddress: '2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF',
        txFormat: 'psbt' as const,
        bulk: true,
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.minValue, validBody.minValue);
      assert.strictEqual(decoded.maxValue, validBody.maxValue);
      assert.strictEqual(decoded.minHeight, validBody.minHeight);
      assert.strictEqual(decoded.numUnspentsToMake, validBody.numUnspentsToMake);
      assert.strictEqual(decoded.limit, validBody.limit);
      assert.strictEqual(decoded.minConfirms, validBody.minConfirms);
      assert.strictEqual(decoded.txFormat, 'psbt');
      assert.strictEqual(decoded.bulk, validBody.bulk);
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        walletPassphrase: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number numUnspentsToMake', function () {
      const invalidBody = {
        numUnspentsToMake: '5', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean bulk', function () {
      const invalidBody = {
        bulk: 'true', // string instead of boolean
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should accept minValue as number or string', function () {
      const validBodyNumber = {
        minValue: 100000,
      };
      const validBodyString = {
        minValue: '100000',
      };

      const decodedNumber = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBodyNumber);
      assert.strictEqual(decodedNumber.minValue, 100000);

      const decodedString = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBodyString);
      assert.strictEqual(decodedString.minValue, '100000');
    });

    it('should accept maxValue as number or string', function () {
      const validBodyNumber = {
        maxValue: 1000000,
      };
      const validBodyString = {
        maxValue: '1000000',
      };

      const decodedNumber = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBodyNumber);
      assert.strictEqual(decodedNumber.maxValue, 1000000);

      const decodedString = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBodyString);
      assert.strictEqual(decodedString.maxValue, '1000000');
    });

    it('should accept valid txFormat values', function () {
      const validBodyLegacy = {
        txFormat: 'legacy',
      };
      const validBodyPsbt = {
        txFormat: 'psbt',
      };
      const validBodyPsbtLite = {
        txFormat: 'psbt-lite',
      };

      const decodedLegacy = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBodyLegacy);
      assert.strictEqual(decodedLegacy.txFormat, 'legacy');

      const decodedPsbt = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBodyPsbt);
      assert.strictEqual(decodedPsbt.txFormat, 'psbt');

      const decodedPsbtLite = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBodyPsbtLite);
      assert.strictEqual(decodedPsbtLite.txFormat, 'psbt-lite');
    });

    it('should allow txFormat to be undefined', function () {
      const validBody = {
        walletPassphrase: 'test',
      };

      const decoded = assertDecode(t.type(ConsolidateUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.txFormat, undefined);
    });

    it('should reject invalid txFormat values', function () {
      const invalidBody = {
        txFormat: 'invalid-format',
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject non-string txFormat', function () {
      const invalidBody = {
        txFormat: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(ConsolidateUnspentsRequestBody), invalidBody);
      });
    });
  });

  describe('ConsolidateUnspentsResponse V2', function () {
    it('should validate single response with minimal required fields', function () {
      const validResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      const singleResponse = assertSingleTxResponse(decoded);
      assert.strictEqual(singleResponse.status, validResponse.status);
      assert.strictEqual(singleResponse.tx, validResponse.tx);
    });

    it('should validate single response with all fields', function () {
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

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      const singleResponse = assertSingleTxResponse(decoded);
      assert.strictEqual(singleResponse.status, validResponse.status);
      assert.strictEqual(singleResponse.tx, validResponse.tx);
      assert.strictEqual(singleResponse.hash, validResponse.hash);
      assert.strictEqual(singleResponse.instant, validResponse.instant);
      assert.strictEqual(singleResponse.instantId, validResponse.instantId);
    });

    it('should validate single response with txid instead of hash', function () {
      const validResponse = {
        status: 'signed',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        fee: 10000,
      };

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      const singleResponse = assertSingleTxResponse(decoded);
      assert.strictEqual(singleResponse.status, validResponse.status);
      assert.strictEqual(singleResponse.txid, validResponse.txid);
    });

    it('should validate array response with multiple transactions', function () {
      const validResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          fee: 10000,
        },
        {
          status: 'accepted',
          tx: '0200000001d8ebe4d9718b34c56b7d2c6be8cdf13bfg82b1g32fc5b83b6ae1d1df2a513e100000000000ffffffff0190d21a00000000001976a914d029f1c47b48c8e3f4a5b7d2c8f689c8b68b542788ac00000000',
          hash: '2345678901bcdef02345678901bcdef02345678901bcdef02345678901bcdef0',
          fee: 11000,
        },
      ];

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      assert.ok(Array.isArray(decoded));
      assert.strictEqual(decoded.length, 2);
      assert.strictEqual(decoded[0].status, 'accepted');
      assert.strictEqual(decoded[1].status, 'accepted');
    });

    it('should validate empty array response', function () {
      const validResponse: any[] = [];

      const decoded = assertDecode(ConsolidateUnspentsResponse, validResponse);
      assert.ok(Array.isArray(decoded));
      assert.strictEqual(decoded.length, 0);
    });

    it('should reject array response with invalid transaction', function () {
      const invalidResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
        {
          // Missing 'tx' field
          status: 'accepted',
          hash: '2345678901bcdef02345678901bcdef02345678901bcdef02345678901bcdef0',
        },
      ];

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing status', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing tx', function () {
      const invalidResponse = {
        status: 'accepted',
      };

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-string status', function () {
      const invalidResponse = {
        status: 123, // number instead of string
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      assert.throws(() => {
        assertDecode(ConsolidateUnspentsResponse, invalidResponse);
      });
    });
  });

  describe('PostConsolidateUnspents route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostConsolidateUnspents.path, '/api/v2/{coin}/wallet/{id}/consolidateunspents');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostConsolidateUnspents.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      assert.ok(PostConsolidateUnspents.request);
    });

    it('should have the correct response types', function () {
      assert.ok(PostConsolidateUnspents.response[200]);
      assert.ok(PostConsolidateUnspents.response[400]);
    });
  });

  describe('Response Passthrough Behavior', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tbtc';

    afterEach(function () {
      sinon.restore();
    });

    it('should pass through additional fields not defined in codec', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
      };

      const mockResponseWithExtras = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        fee: 10000,
        estimatedBlockTime: 600,
        networkCongestion: 'low',
        coinSpecificData: {
          segwit: true,
          bech32: true,
        },
        newFeatureFlag: true,
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockResponseWithExtras),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Documented fields should be present
      assert.strictEqual(result.body.status, 'accepted');
      assert.strictEqual(result.body.tx, mockResponseWithExtras.tx);
      assert.strictEqual(result.body.hash, mockResponseWithExtras.hash);
      assert.strictEqual(result.body.fee, 10000);

      // Extra fields should ALSO be present (passed through)
      assert.strictEqual(result.body.estimatedBlockTime, 600);
      assert.strictEqual(result.body.networkCongestion, 'low');
      assert.deepStrictEqual(result.body.coinSpecificData, {
        segwit: true,
        bech32: true,
      });
      assert.strictEqual(result.body.newFeatureFlag, true);
    });

    it('should validate defined fields even when extra fields present', async function () {
      const requestBody = {
        walletPassphrase: 'test_passphrase',
      };

      const mockResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        extraField1: 'value1',
        extraField2: { nested: 'data' },
      };

      const mockWallet = {
        consolidateUnspents: sinon.stub().resolves(mockResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/consolidateunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(ConsolidateUnspentsResponse, result.body);
      const singleResponse = assertSingleTxResponse(decodedResponse);
      assert.strictEqual(singleResponse.status, 'accepted');
      assert.strictEqual(singleResponse.tx, mockResponse.tx);

      // Extra fields are in the raw response
      assert.strictEqual(result.body.extraField1, 'value1');
      assert.deepStrictEqual(result.body.extraField2, { nested: 'data' });
    });
  });
});
