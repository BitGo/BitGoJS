import * as assert from 'assert';
import * as t from 'io-ts';
import {
  FanoutUnspentsRequestParams,
  FanoutUnspentsRequestBody,
  FanoutUnspentsResponse,
  PostFanoutUnspents,
} from '../../../src/typedRoutes/api/v2/fanoutUnspents';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('FanoutUnspents V2 codec tests', function () {
  // Helper to assert and extract single transaction response
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

  describe('fanoutUnspents v2', function () {
    const agent = setupAgent();
    const walletId = '68c02f96aa757d9212bd1a536f123456';
    const coin = 'tbtc';

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

    it('should successfully fanout unspents with numUnspentsToMake', async function () {
      const requestBody = {
        numUnspentsToMake: 10,
        walletPassphrase: 'test_passphrase_12345',
      };

      // Create mock wallet with fanoutUnspents method (lowercase 'o' for SDK v2)
      const mockWallet = {
        fanoutUnspents: sinon.stub().resolves(mockFanoutResponse),
      };

      // Stub the wallets().get() chain
      const walletsGetStub = sinon.stub().resolves(mockWallet);

      // Create mock coin object
      const mockCoin = {
        wallets: sinon.stub().returns({
          get: walletsGetStub,
        }),
      };

      // For V2, bitgo.coin() is called with the coin parameter
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('status');
      result.body.should.have.property('tx');
      assert.strictEqual(result.body.status, mockFanoutResponse.status);
      assert.strictEqual(result.body.tx, mockFanoutResponse.tx);

      // This ensures the response structure matches the typed definition
      const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
      assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
      assert.strictEqual(decodedResponse.tx, mockFanoutResponse.tx);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(walletsGetStub.calledOnceWith({ id: walletId }), true);
      assert.strictEqual(mockWallet.fanoutUnspents.calledOnce, true);
    });

    it('should successfully fanout unspents with xprv', async function () {
      const requestBody = {
        numUnspentsToMake: 20,
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockWallet = {
        fanoutUnspents: sinon.stub().resolves(mockFanoutResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
      assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
    });

    it('should successfully fanout unspents with advanced parameters', async function () {
      const requestBody = {
        numUnspentsToMake: 15,
        walletPassphrase: 'test_passphrase',
        minConfirms: 2,
        maxNumInputsToUse: 50,
        feeRate: 10000,
        maxFeeRate: 50000,
        maxFeePercentage: 0.1,
        minValue: 100000,
        maxValue: 1000000,
        feeTxConfirmTarget: 3,
      };

      const mockWallet = {
        fanoutUnspents: sinon.stub().resolves(mockFanoutResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
      assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);

      // Verify fanoutUnspents was called with the correct parameters
      assert.strictEqual(mockWallet.fanoutUnspents.calledOnce, true);
      const callArgs = mockWallet.fanoutUnspents.firstCall.args[0];
      assert.strictEqual(callArgs.numUnspentsToMake, 15);
      assert.strictEqual(callArgs.minConfirms, 2);
      assert.strictEqual(callArgs.maxNumInputsToUse, 50);
    });

    it('should successfully fanout unspents with specific unspents array', async function () {
      const requestBody = {
        numUnspentsToMake: 10,
        walletPassphrase: 'test_passphrase',
        unspents: [
          '0000000000000000000000000000000000000000000000000000000000000000:0',
          '1111111111111111111111111111111111111111111111111111111111111111:1',
        ],
      };

      const mockWallet = {
        fanoutUnspents: sinon.stub().resolves(mockFanoutResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
      assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);

      // Verify unspents array was passed through
      const callArgs = mockWallet.fanoutUnspents.firstCall.args[0];
      assert.deepStrictEqual(callArgs.unspents, requestBody.unspents);
    });

    it('should successfully fanout unspents with txFormat parameter', async function () {
      const requestBody = {
        numUnspentsToMake: 10,
        walletPassphrase: 'test_passphrase',
        txFormat: 'psbt' as const,
      };

      const mockWallet = {
        fanoutUnspents: sinon.stub().resolves(mockFanoutResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
      assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);

      // Verify txFormat was passed through to SDK
      const callArgs = mockWallet.fanoutUnspents.firstCall.args[0];
      assert.strictEqual(callArgs.txFormat, 'psbt');
    });

    it('should return instant transaction response', async function () {
      const requestBody = {
        numUnspentsToMake: 10,
        walletPassphrase: 'test_passphrase',
      };

      const mockInstantResponse = {
        ...mockFanoutResponse,
        instant: true,
        instantId: 'inst-123456',
      };

      const mockWallet = {
        fanoutUnspents: sinon.stub().resolves(mockInstantResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('instant');
      result.body.should.have.property('instantId');
      assert.strictEqual(result.body.instant, true);
      assert.strictEqual(result.body.instantId, 'inst-123456');

      const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
      assert.strictEqual(decodedResponse.instant, true);
      assert.strictEqual(decodedResponse.instantId, 'inst-123456');
    });

    it('should handle response with txid instead of hash', async function () {
      const requestBody = {
        numUnspentsToMake: 10,
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
        fanoutUnspents: sinon.stub().resolves(mockResponseWithTxid),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txid');

      const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
      assert.strictEqual(decodedResponse.status, 'signed');
      assert.strictEqual(decodedResponse.txid, mockResponseWithTxid.txid);
    });

    describe('Error Cases', function () {
      it('should handle wallet not found error', async function () {
        const requestBody = {
          numUnspentsToMake: 10,
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Wallet not found'));
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle fanoutUnspents failure', async function () {
        const requestBody = {
          numUnspentsToMake: 10,
          walletPassphrase: 'wrong_passphrase',
        };

        const mockWallet = {
          fanoutUnspents: sinon.stub().rejects(new Error('Invalid passphrase')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle insufficient unspents error', async function () {
        const requestBody = {
          numUnspentsToMake: 100,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          fanoutUnspents: sinon.stub().rejects(new Error('Insufficient unspents to fanout')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });

    describe('Edge Cases', function () {
      it('should handle both walletPassphrase and xprv provided', async function () {
        const requestBody = {
          numUnspentsToMake: 10,
          walletPassphrase: 'test_passphrase',
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        const mockWallet = {
          fanoutUnspents: sinon.stub().resolves(mockFanoutResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed - SDK handles priority of auth methods
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
        assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
      });

      it('should handle zero minConfirms', async function () {
        const requestBody = {
          numUnspentsToMake: 10,
          walletPassphrase: 'test_passphrase',
          minConfirms: 0,
        };

        const mockWallet = {
          fanoutUnspents: sinon.stub().resolves(mockFanoutResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed - zero minConfirms is valid (includes unconfirmed)
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
        assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
      });

      it('should handle minValue and maxValue as strings', async function () {
        const requestBody = {
          numUnspentsToMake: 10,
          walletPassphrase: 'test_passphrase',
          minValue: '100000',
          maxValue: '1000000',
        };

        const mockWallet = {
          fanoutUnspents: sinon.stub().resolves(mockFanoutResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed - string values are allowed for large numbers
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
        assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);
      });

      it('should handle bulk fanout mode with single transaction response', async function () {
        const requestBody = {
          numUnspentsToMake: 10,
          walletPassphrase: 'test_passphrase',
          bulk: false,
        };

        const mockWallet = {
          fanoutUnspents: sinon.stub().resolves(mockFanoutResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed with single transaction
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
        assert.strictEqual(decodedResponse.status, mockFanoutResponse.status);

        // Verify bulk parameter was passed
        const callArgs = mockWallet.fanoutUnspents.firstCall.args[0];
        assert.strictEqual(callArgs.bulk, false);
      });

      it('should handle bulk fanout mode with array response', async function () {
        const requestBody = {
          numUnspentsToMake: 100,
          walletPassphrase: 'test_passphrase',
          bulk: true,
        };

        // Mock response as an array of transactions for bulk mode
        const mockBulkResponse = [
          {
            status: 'accepted',
            tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
            hash: '1111111111111111111111111111111111111111111111111111111111111111',
            fee: 10000,
            feeRate: 20000,
          },
          {
            status: 'accepted',
            tx: '0200000001d8ebe3e9810a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d1f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
            hash: '2222222222222222222222222222222222222222222222222222222222222222',
            fee: 11000,
            feeRate: 21000,
          },
          {
            status: 'accepted',
            tx: '0300000001e9fcf4fa920b34d56b7d2d6be8cdf13bf0082b1032fc5b83b6ae1d1f2a503e2f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
            hash: '3333333333333333333333333333333333333333333333333333333333333333',
            fee: 12000,
            feeRate: 22000,
          },
        ];

        const mockWallet = {
          fanoutUnspents: sinon.stub().resolves(mockBulkResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockCoin = {
          wallets: sinon.stub().returns({ get: walletsGetStub }),
        };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed with array of transactions
        assert.strictEqual(result.status, 200);
        assert.ok(Array.isArray(result.body), 'Response should be an array');
        assert.strictEqual(result.body.length, 3);

        // Validate the array response against codec
        const decodedResponse = assertDecode(FanoutUnspentsResponse, result.body);
        assert.ok(Array.isArray(decodedResponse));
        assert.strictEqual(decodedResponse[0].status, 'accepted');
        assert.strictEqual(decodedResponse[0].hash, mockBulkResponse[0].hash);
        assert.strictEqual(decodedResponse[1].hash, mockBulkResponse[1].hash);
        assert.strictEqual(decodedResponse[2].hash, mockBulkResponse[2].hash);

        // Verify bulk parameter was passed
        const callArgs = mockWallet.fanoutUnspents.firstCall.args[0];
        assert.strictEqual(callArgs.bulk, true);
      });
    });
  });

  describe('FanoutUnspentsRequestParams V2', function () {
    it('should validate params with required coin and id', function () {
      const validParams = {
        coin: 'tbtc',
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestParams), invalidParams);
      });
    });

    it('should reject params with missing id', function () {
      const invalidParams = {
        coin: 'tbtc',
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string coin', function () {
      const invalidParams = {
        coin: 123, // number instead of string
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestParams), invalidParams);
      });
    });
  });

  describe('FanoutUnspentsRequestBody V2', function () {
    it('should validate body with all optional fields', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, undefined);
      assert.strictEqual(decoded.numUnspentsToMake, undefined);
    });

    it('should validate body with walletPassphrase', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with numUnspentsToMake', function () {
      const validBody = {
        numUnspentsToMake: 10,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.numUnspentsToMake, validBody.numUnspentsToMake);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        walletPassphrase: 'mySecurePassphrase',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        numUnspentsToMake: 10,
        minConfirms: 2,
        maxNumInputsToUse: 50,
        feeRate: 10000,
        maxFeeRate: 50000,
        maxFeePercentage: 0.1,
        minValue: 100000,
        maxValue: '1000000',
        minHeight: 500000,
        feeTxConfirmTarget: 3,
        enforceMinConfirmsForChange: true,
        comment: 'Test fanout',
        otp: '123456',
        targetAddress: '2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF',
        txFormat: 'psbt' as const,
        unspents: ['abc:0', 'def:1'],
        bulk: true,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.numUnspentsToMake, validBody.numUnspentsToMake);
      assert.strictEqual(decoded.minConfirms, validBody.minConfirms);
      assert.strictEqual(decoded.maxNumInputsToUse, validBody.maxNumInputsToUse);
      assert.strictEqual(decoded.txFormat, 'psbt');
      assert.deepStrictEqual(decoded.unspents, validBody.unspents);
      assert.strictEqual(decoded.bulk, true);
    });

    it('should validate body with bulk parameter', function () {
      const validBodyWithBulkTrue = {
        numUnspentsToMake: 100,
        walletPassphrase: 'test_passphrase',
        bulk: true,
      };

      const decodedTrue = assertDecode(t.type(FanoutUnspentsRequestBody), validBodyWithBulkTrue);
      assert.strictEqual(decodedTrue.bulk, true);

      const validBodyWithBulkFalse = {
        numUnspentsToMake: 10,
        walletPassphrase: 'test_passphrase',
        bulk: false,
      };

      const decodedFalse = assertDecode(t.type(FanoutUnspentsRequestBody), validBodyWithBulkFalse);
      assert.strictEqual(decodedFalse.bulk, false);
    });

    it('should reject body with non-number numUnspentsToMake', function () {
      const invalidBody = {
        numUnspentsToMake: '10', // string instead of number
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string walletPassphrase', function () {
      const invalidBody = {
        walletPassphrase: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should accept minValue as number or string', function () {
      const validBodyNumber = {
        minValue: 100000,
      };
      const validBodyString = {
        minValue: '100000',
      };

      const decodedNumber = assertDecode(t.type(FanoutUnspentsRequestBody), validBodyNumber);
      assert.strictEqual(decodedNumber.minValue, 100000);

      const decodedString = assertDecode(t.type(FanoutUnspentsRequestBody), validBodyString);
      assert.strictEqual(decodedString.minValue, '100000');
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

      const decodedLegacy = assertDecode(t.type(FanoutUnspentsRequestBody), validBodyLegacy);
      assert.strictEqual(decodedLegacy.txFormat, 'legacy');

      const decodedPsbt = assertDecode(t.type(FanoutUnspentsRequestBody), validBodyPsbt);
      assert.strictEqual(decodedPsbt.txFormat, 'psbt');

      const decodedPsbtLite = assertDecode(t.type(FanoutUnspentsRequestBody), validBodyPsbtLite);
      assert.strictEqual(decodedPsbtLite.txFormat, 'psbt-lite');
    });

    it('should allow txFormat to be undefined', function () {
      const validBody = {
        numUnspentsToMake: 10,
      };

      const decoded = assertDecode(t.type(FanoutUnspentsRequestBody), validBody);
      assert.strictEqual(decoded.txFormat, undefined);
    });

    it('should reject invalid txFormat values', function () {
      const invalidBody = {
        txFormat: 'invalid-format',
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });

    it('should reject non-string txFormat', function () {
      const invalidBody = {
        txFormat: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(FanoutUnspentsRequestBody), invalidBody);
      });
    });
  });

  describe('FanoutUnspentsResponse V2', function () {
    it('should validate response with minimal required fields', function () {
      const validResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      const decoded = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, validResponse));
      assert.strictEqual(decoded.status, validResponse.status);
      assert.strictEqual(decoded.tx, validResponse.tx);
    });

    it('should validate response with all fields', function () {
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

      const decoded = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, validResponse));
      assert.strictEqual(decoded.status, validResponse.status);
      assert.strictEqual(decoded.tx, validResponse.tx);
      assert.strictEqual(decoded.hash, validResponse.hash);
      assert.strictEqual(decoded.instant, validResponse.instant);
      assert.strictEqual(decoded.instantId, validResponse.instantId);
    });

    it('should validate response with txid instead of hash', function () {
      const validResponse = {
        status: 'signed',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        fee: 10000,
      };

      const decoded = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, validResponse));
      assert.strictEqual(decoded.status, validResponse.status);
      assert.strictEqual(decoded.txid, validResponse.txid);
    });

    it('should reject response with missing status', function () {
      const invalidResponse = {
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with missing tx', function () {
      const invalidResponse = {
        status: 'accepted',
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should reject response with non-string status', function () {
      const invalidResponse = {
        status: 123, // number instead of string
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidResponse);
      });
    });

    it('should validate array response for bulk mode', function () {
      const validArrayResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '1111111111111111111111111111111111111111111111111111111111111111',
          fee: 10000,
          feeRate: 20000,
        },
        {
          status: 'accepted',
          tx: '0200000001d8ebe3e9810a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d1f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          hash: '2222222222222222222222222222222222222222222222222222222222222222',
          fee: 11000,
          feeRate: 21000,
        },
      ];

      const decoded = assertDecode(FanoutUnspentsResponse, validArrayResponse);
      assert.ok(Array.isArray(decoded));
      assert.strictEqual(decoded.length, 2);
      assert.strictEqual(decoded[0].status, 'accepted');
      assert.strictEqual(decoded[0].hash, validArrayResponse[0].hash);
      assert.strictEqual(decoded[1].status, 'accepted');
      assert.strictEqual(decoded[1].hash, validArrayResponse[1].hash);
    });

    it('should validate empty array response for bulk mode', function () {
      const validEmptyArrayResponse: any[] = [];

      const decoded = assertDecode(FanoutUnspentsResponse, validEmptyArrayResponse);
      assert.ok(Array.isArray(decoded));
      assert.strictEqual(decoded.length, 0);
    });

    it('should reject array with invalid transaction objects', function () {
      const invalidArrayResponse = [
        {
          status: 'accepted',
          tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
        {
          status: 'accepted',
          // Missing 'tx' field - should fail
        },
      ];

      assert.throws(() => {
        assertDecode(FanoutUnspentsResponse, invalidArrayResponse);
      });
    });
  });

  describe('PostFanoutUnspents route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostFanoutUnspents.path, '/api/v2/{coin}/wallet/{id}/fanoutunspents');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostFanoutUnspents.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostFanoutUnspents.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostFanoutUnspents.response[200]);
      assert.ok(PostFanoutUnspents.response[400]);
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
        numUnspentsToMake: 10,
        walletPassphrase: 'test_passphrase',
      };

      // Mock response with extra fields not in codec
      const mockResponseWithExtras = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        fee: 10000,
        // Extra fields not in codec - should be passed through
        estimatedBlockTime: 600,
        networkCongestion: 'low',
        coinSpecificData: {
          segwit: true,
          bech32: true,
        },
        newFeatureFlag: true,
      };

      const mockWallet = {
        fanoutUnspents: sinon.stub().resolves(mockResponseWithExtras),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .send(requestBody);

      // Should succeed
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
        numUnspentsToMake: 10,
        walletPassphrase: 'test_passphrase',
      };

      // Valid response with extras
      const mockResponse = {
        status: 'accepted',
        tx: '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        extraField1: 'value1',
        extraField2: { nested: 'data' },
      };

      const mockWallet = {
        fanoutUnspents: sinon.stub().resolves(mockResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockCoin = {
        wallets: sinon.stub().returns({ get: walletsGetStub }),
      };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/fanoutunspents`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .send(requestBody);

      // Should validate and pass
      assert.strictEqual(result.status, 200);
      const decodedResponse = assertSingleTxResponse(assertDecode(FanoutUnspentsResponse, result.body));
      assert.strictEqual(decodedResponse.status, 'accepted');
      assert.strictEqual(decodedResponse.tx, mockResponse.tx);

      // Extra fields are in the raw response (not in decoded type, but in actual response)
      assert.strictEqual(result.body.extraField1, 'value1');
      assert.deepStrictEqual(result.body.extraField2, { nested: 'data' });
    });
  });
});
