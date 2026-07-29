import * as assert from 'assert';
import * as t from 'io-ts';
import {
  EnableTokensParams,
  EnableTokensRequestBody,
  EnableTokensResponse,
  PostWalletEnableTokens,
  TokenEnablement,
} from '../../../src/typedRoutes/api/v2/walletEnableTokens';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('WalletEnableTokens codec tests', function () {
  describe('walletEnableTokens', function () {
    const agent = setupAgent();
    const coin = 'algo';
    const walletId = '68c02f96aa757d9212bd1a536f123456';

    const mockEnableTokensResponse = {
      success: [
        {
          tx: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          txid: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          status: 'signed',
          transfer: {
            id: 'transfer123',
            coin: coin,
            wallet: walletId,
            txid: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          },
        },
      ],
      failure: [],
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully enable tokens with walletPassphrase', async function () {
      const requestBody = {
        enableTokens: [{ name: 'USDC' }, { name: 'USDT' }],
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        sendTokenEnablements: sinon.stub().resolves(mockEnableTokensResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('success');
      result.body.should.have.property('failure');
      assert.ok(Array.isArray(result.body.success));
      assert.ok(Array.isArray(result.body.failure));
      assert.strictEqual(result.body.success.length, 1);
      assert.strictEqual(result.body.failure.length, 0);

      const decodedResponse = assertDecode(EnableTokensResponse, result.body);
      assert.strictEqual(decodedResponse.success.length, 1);
      assert.strictEqual(decodedResponse.failure.length, 0);

      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockCoin.wallets.calledOnce, true);
      assert.strictEqual(walletsGetStub.calledOnce, true);
      // Verify the get method was called with the wallet ID (reqId is added by handler)
      const getCallArgs = walletsGetStub.firstCall.args[0];
      assert.strictEqual(getCallArgs.id, walletId);
      assert.strictEqual(mockWallet.sendTokenEnablements.calledOnce, true);
    });

    it('should successfully enable single token with prv', async function () {
      const requestBody = {
        enableTokens: [{ name: 'USDC' }],
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockWallet = {
        sendTokenEnablements: sinon.stub().resolves(mockEnableTokensResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(EnableTokensResponse, result.body);
      assert.strictEqual(decodedResponse.success.length, 1);
      assert.strictEqual(decodedResponse.failure.length, 0);
    });

    it('should successfully enable token with xprv', async function () {
      const requestBody = {
        enableTokens: [{ name: 'USDC' }],
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockWallet = {
        sendTokenEnablements: sinon.stub().resolves(mockEnableTokensResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(EnableTokensResponse, result.body);
      assert.ok(decodedResponse.success);
    });

    it('should successfully enable tokens with address field (Solana)', async function () {
      const requestBody = {
        enableTokens: [{ name: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }, { name: 'USDT' }],
        walletPassphrase: 'test_passphrase',
      };

      const mockWallet = {
        sendTokenEnablements: sinon.stub().resolves(mockEnableTokensResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(EnableTokensResponse, result.body);
      assert.ok(decodedResponse.success);

      // Verify the parameters were passed correctly
      const callArgs = mockWallet.sendTokenEnablements.firstCall.args[0];
      assert.strictEqual(callArgs.enableTokens.length, 2);
      assert.strictEqual(callArgs.enableTokens[0].name, 'USDC');
      assert.strictEqual(callArgs.enableTokens[0].address, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      assert.strictEqual(callArgs.enableTokens[1].name, 'USDT');
    });

    it('should successfully enable tokens with optional fee parameters', async function () {
      const requestBody = {
        enableTokens: [{ name: 'USDC' }],
        walletPassphrase: 'test_passphrase',
        gasPrice: 20000000000,
        gasLimit: 100000,
        maxFeeRate: 50000,
      };

      const mockWallet = {
        sendTokenEnablements: sinon.stub().resolves(mockEnableTokensResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify all parameters were passed to SDK
      const callArgs = mockWallet.sendTokenEnablements.firstCall.args[0];
      assert.strictEqual(callArgs.gasPrice, requestBody.gasPrice);
      assert.strictEqual(callArgs.gasLimit, requestBody.gasLimit);
      assert.strictEqual(callArgs.maxFeeRate, requestBody.maxFeeRate);
    });

    it('should successfully enable tokens with EIP-1559 parameters', async function () {
      const requestBody = {
        enableTokens: [{ name: 'USDC' }],
        walletPassphrase: 'test_passphrase',
        eip1559: {
          maxFeePerGas: '30000000000',
          maxPriorityFeePerGas: '1500000000',
        },
      };

      const mockWallet = {
        sendTokenEnablements: sinon.stub().resolves(mockEnableTokensResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify EIP-1559 parameters were passed
      const callArgs = mockWallet.sendTokenEnablements.firstCall.args[0];
      assert.deepStrictEqual(callArgs.eip1559, requestBody.eip1559);
    });

    it('should handle partial success (some tokens succeed, some fail)', async function () {
      const requestBody = {
        enableTokens: [{ name: 'USDC' }, { name: 'INVALID_TOKEN' }],
        walletPassphrase: 'test_passphrase',
      };

      const partialSuccessResponse = {
        success: [
          {
            tx: '0xabc123',
            txid: '0xabc123',
            status: 'signed',
          },
        ],
        failure: [
          {
            message: 'Token not supported',
            name: 'TokenNotSupportedError',
          },
        ],
      };

      const mockWallet = {
        sendTokenEnablements: sinon.stub().resolves(partialSuccessResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(EnableTokensResponse, result.body);
      assert.strictEqual(decodedResponse.success.length, 1);
      assert.strictEqual(decodedResponse.failure.length, 1);
    });

    describe('Error Cases', function () {
      it('should handle wallet not found error', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Wallet not found'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle sendTokenEnablements failure', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'wrong_passphrase',
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().rejects(new Error('Invalid passphrase')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle no tokens specified error', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().rejects(new Error('No tokens are being specified')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle coin does not require token enablement error', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().rejects(new Error('Bitcoin does not require token enablements')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/btc/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle unsupported coin error', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
        };

        sinon.stub(BitGo.prototype, 'coin').throws(new Error('Unsupported coin: invalidcoin'));

        const result = await agent
          .post(`/api/v2/invalidcoin/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle insufficient funds for gas error', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().rejects(new Error('Insufficient funds for gas')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle recipients field rejection error', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          recipients: [{ address: '0xabc', amount: '1000' }],
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendTokenEnablements: sinon
            .stub()
            .rejects(new Error('Can not specify recipients for token enablement transactions')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // SDK should reject recipients field
        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });

    describe('Invalid Request Body', function () {
      it('should reject request without enableTokens field', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation because enableTokens is required
        assert.ok(result.status >= 400);
      });

      it('should reject request with empty enableTokens array', async function () {
        const requestBody = {
          enableTokens: [],
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().rejects(new Error('No tokens are being specified')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // SDK should reject empty array
        assert.strictEqual(result.status, 500);
      });

      it('should reject request with invalid enableTokens type', async function () {
        const requestBody = {
          enableTokens: 'USDC', // string instead of array
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid token object (missing name)', async function () {
        const requestBody = {
          enableTokens: [{ address: 'someaddress' }], // missing name field
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation because name is required in TokenEnablement
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid token name type', async function () {
        const requestBody = {
          enableTokens: [{ name: 123 }], // number instead of string
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid token address type', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC', address: 123 }], // number instead of string
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid walletPassphrase type', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 123, // number instead of string
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid prv type', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          prv: 123, // number instead of string
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid gasPrice type', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
          gasPrice: '20000000000', // string instead of number
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid eip1559 structure', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
          eip1559: {
            maxFeePerGas: '30000000000',
            // missing maxPriorityFeePerGas - both fields required when eip1559 is present
          },
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle request with malformed JSON', async function () {
        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send('{ invalid json ]');

        assert.ok(result.status >= 400);
      });
    });

    describe('Edge Cases', function () {
      it('should handle very long wallet ID', async function () {
        const veryLongWalletId = 'a'.repeat(1000);
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Invalid wallet ID'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${veryLongWalletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle wallet ID with special characters', async function () {
        const specialCharWalletId = '../../../etc/passwd';
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Invalid wallet ID'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${encodeURIComponent(specialCharWalletId)}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle multiple auth methods provided (walletPassphrase and prv)', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().resolves(mockEnableTokensResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed - SDK handles priority of auth methods
        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(EnableTokensResponse, result.body);
        assert.ok(decodedResponse.success);
      });

      it('should handle enabling large number of tokens', async function () {
        const tokens: { name: string }[] = [];
        for (let i = 0; i < 50; i++) {
          tokens.push({ name: `TOKEN${i}` });
        }

        const requestBody = {
          enableTokens: tokens,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().resolves(mockEnableTokensResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed with many tokens
        assert.strictEqual(result.status, 200);
        const callArgs = mockWallet.sendTokenEnablements.firstCall.args[0];
        assert.strictEqual(callArgs.enableTokens.length, 50);
      });

      it('should handle token names with special characters', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USD-Coin' }, { name: 'TOKEN_V2' }, { name: 'TOKEN.NEW' }],
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().resolves(mockEnableTokensResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should succeed with special characters in token names
        assert.strictEqual(result.status, 200);
      });
    });

    describe('Response Validation Edge Cases', function () {
      it('should accept response with all successes', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }, { name: 'USDT' }],
          walletPassphrase: 'test_passphrase',
        };

        const allSuccessResponse = {
          success: [
            { tx: '0xabc123', txid: '0xabc123', status: 'signed' },
            { tx: '0xdef456', txid: '0xdef456', status: 'signed' },
          ],
          failure: [],
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().resolves(allSuccessResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(EnableTokensResponse, result.body);
        assert.strictEqual(decodedResponse.success.length, 2);
        assert.strictEqual(decodedResponse.failure.length, 0);
      });

      it('should accept response with all failures', async function () {
        const requestBody = {
          enableTokens: [{ name: 'INVALID1' }, { name: 'INVALID2' }],
          walletPassphrase: 'test_passphrase',
        };

        const allFailureResponse = {
          success: [],
          failure: [
            { message: 'Token not supported', name: 'TokenError' },
            { message: 'Token not supported', name: 'TokenError' },
          ],
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().resolves(allFailureResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(EnableTokensResponse, result.body);
        assert.strictEqual(decodedResponse.success.length, 0);
        assert.strictEqual(decodedResponse.failure.length, 2);
      });

      it('should accept response with varying transaction structures (TSS wallet)', async function () {
        const requestBody = {
          enableTokens: [{ name: 'USDC' }],
          walletPassphrase: 'test_passphrase',
        };

        const tssResponse = {
          success: [
            {
              txRequest: { txRequestId: 'req123', state: 'pending' },
              pendingApproval: { id: 'approval123' },
              status: 'pendingApproval',
            },
          ],
          failure: [],
        };

        const mockWallet = {
          sendTokenEnablements: sinon.stub().resolves(tssResponse),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/enableTokens`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(EnableTokensResponse, result.body);
        assert.strictEqual(decodedResponse.success.length, 1);
      });
    });
  });

  // ==========================================
  // CODEC VALIDATION TESTS
  // ==========================================

  describe('EnableTokensParams', function () {
    it('should validate params with required coin and id', function () {
      const validParams = {
        coin: 'algo',
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(EnableTokensParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(EnableTokensParams), invalidParams);
      });
    });

    it('should reject params with missing id', function () {
      const invalidParams = {
        coin: 'algo',
      };

      assert.throws(() => {
        assertDecode(t.type(EnableTokensParams), invalidParams);
      });
    });

    it('should reject params with non-string coin', function () {
      const invalidParams = {
        coin: 123,
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(EnableTokensParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        coin: 'algo',
        id: 123,
      };

      assert.throws(() => {
        assertDecode(t.type(EnableTokensParams), invalidParams);
      });
    });
  });

  describe('TokenEnablement', function () {
    it('should validate token with name only', function () {
      const validToken = {
        name: 'USDC',
      };

      const decoded = assertDecode(TokenEnablement, validToken);
      assert.strictEqual(decoded.name, 'USDC');
      assert.strictEqual(decoded.address, undefined);
    });

    it('should validate token with name and address', function () {
      const validToken = {
        name: 'USDC',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      };

      const decoded = assertDecode(TokenEnablement, validToken);
      assert.strictEqual(decoded.name, 'USDC');
      assert.strictEqual(decoded.address, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    });

    it('should reject token without name', function () {
      const invalidToken = {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      };

      assert.throws(() => {
        assertDecode(TokenEnablement, invalidToken);
      });
    });

    it('should reject token with non-string name', function () {
      const invalidToken = {
        name: 123,
      };

      assert.throws(() => {
        assertDecode(TokenEnablement, invalidToken);
      });
    });

    it('should reject token with non-string address', function () {
      const invalidToken = {
        name: 'USDC',
        address: 123,
      };

      assert.throws(() => {
        assertDecode(TokenEnablement, invalidToken);
      });
    });
  });

  describe('EnableTokensRequestBody', function () {
    it('should reject empty body (enableTokens required)', function () {
      const invalidBody = {};

      // Should fail because enableTokens is required
      assert.throws(() => {
        assertDecode(t.type(EnableTokensRequestBody), invalidBody);
      });
    });

    it('should validate body with enableTokens only', function () {
      const validBody = {
        enableTokens: [{ name: 'USDC' }],
      };

      const decoded = assertDecode(t.type(EnableTokensRequestBody), validBody);
      assert.strictEqual(decoded.enableTokens.length, 1);
      assert.strictEqual(decoded.enableTokens[0].name, 'USDC');
    });

    it('should validate body with enableTokens and walletPassphrase', function () {
      const validBody = {
        enableTokens: [{ name: 'USDC' }],
        walletPassphrase: 'mySecurePassphrase',
      };

      const decoded = assertDecode(t.type(EnableTokensRequestBody), validBody);
      assert.strictEqual(decoded.enableTokens.length, 1);
      assert.strictEqual(decoded.walletPassphrase, 'mySecurePassphrase');
    });

    it('should validate body with multiple tokens', function () {
      const validBody = {
        enableTokens: [{ name: 'USDC' }, { name: 'USDT', address: '0x123' }, { name: 'DAI' }],
      };

      const decoded = assertDecode(t.type(EnableTokensRequestBody), validBody);
      assert.strictEqual(decoded.enableTokens.length, 3);
      assert.strictEqual(decoded.enableTokens[0].name, 'USDC');
      assert.strictEqual(decoded.enableTokens[1].name, 'USDT');
      assert.strictEqual(decoded.enableTokens[1].address, '0x123');
    });

    it('should validate body with fee parameters', function () {
      const validBody = {
        enableTokens: [{ name: 'USDC' }],
        gasPrice: 20000000000,
        gasLimit: 100000,
        maxFeeRate: 50000,
      };

      const decoded = assertDecode(t.type(EnableTokensRequestBody), validBody);
      assert.strictEqual(decoded.gasPrice, 20000000000);
      assert.strictEqual(decoded.gasLimit, 100000);
      assert.strictEqual(decoded.maxFeeRate, 50000);
    });

    it('should reject body with non-array enableTokens', function () {
      const invalidBody = {
        enableTokens: 'USDC',
      };

      assert.throws(() => {
        assertDecode(t.type(EnableTokensRequestBody), invalidBody);
      });
    });

    it('should reject body with invalid token in array', function () {
      const invalidBody = {
        enableTokens: [{ name: 'USDC' }, { address: '0x123' }], // second token missing name
      };

      assert.throws(() => {
        assertDecode(t.type(EnableTokensRequestBody), invalidBody);
      });
    });
  });

  describe('EnableTokensResponse', function () {
    it('should validate response with success and failure arrays', function () {
      const validResponse = {
        success: [{ tx: '0xabc', status: 'signed' }],
        failure: [],
      };

      const decoded = assertDecode(EnableTokensResponse, validResponse);
      assert.strictEqual(decoded.success.length, 1);
      assert.strictEqual(decoded.failure.length, 0);
    });

    it('should validate response with empty success array', function () {
      const validResponse = {
        success: [],
        failure: [{ message: 'Error occurred' }],
      };

      const decoded = assertDecode(EnableTokensResponse, validResponse);
      assert.strictEqual(decoded.success.length, 0);
      assert.strictEqual(decoded.failure.length, 1);
    });

    it('should validate response with both arrays populated', function () {
      const validResponse = {
        success: [
          { tx: '0xabc', status: 'signed' },
          { txid: '0xdef', status: 'accepted' },
        ],
        failure: [{ message: 'Token not supported' }],
      };

      const decoded = assertDecode(EnableTokensResponse, validResponse);
      assert.strictEqual(decoded.success.length, 2);
      assert.strictEqual(decoded.failure.length, 1);
    });

    it('should reject response with missing success array', function () {
      const invalidResponse = {
        failure: [],
      };

      assert.throws(() => {
        assertDecode(EnableTokensResponse, invalidResponse);
      });
    });

    it('should reject response with missing failure array', function () {
      const invalidResponse = {
        success: [],
      };

      assert.throws(() => {
        assertDecode(EnableTokensResponse, invalidResponse);
      });
    });

    it('should reject response with non-array success', function () {
      const invalidResponse = {
        success: 'success',
        failure: [],
      };

      assert.throws(() => {
        assertDecode(EnableTokensResponse, invalidResponse);
      });
    });

    it('should reject response with non-array failure', function () {
      const invalidResponse = {
        success: [],
        failure: 'failure',
      };

      assert.throws(() => {
        assertDecode(EnableTokensResponse, invalidResponse);
      });
    });
  });

  describe('PostWalletEnableTokens route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostWalletEnableTokens.path, '/api/v2/{coin}/wallet/{id}/enableTokens');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostWalletEnableTokens.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostWalletEnableTokens.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostWalletEnableTokens.response[200]);
      assert.ok(PostWalletEnableTokens.response[400]);
    });
  });
});
