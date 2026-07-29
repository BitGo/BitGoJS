import * as assert from 'assert';
import * as t from 'io-ts';
import {
  AccelerateTxParams,
  AccelerateTxRequestBody,
  AccelerateTxResponse,
  PostWalletAccelerateTx,
} from '../../../src/typedRoutes/api/v2/walletAccelerateTx';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('WalletAccelerateTx codec tests', function () {
  describe('walletAccelerateTx', function () {
    const agent = setupAgent();
    const coin = 'tbtc';
    const walletId = '68c02f96aa757d9212bd1a536f123456';

    const mockAccelerateTransactionResponse = {
      tx: '02000000000101abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678900000000000ffffffff0100e1f505000000001600148888888888888888888888888888888888888888024730440220abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678900220abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890012102abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789000000000',
      txid: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'signed',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully accelerate transaction using CPFP', async function () {
      const requestBody = {
        cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        cpfpFeeRate: 50000,
        maxFee: 100000,
        walletPassphrase: 'test_passphrase_12345',
      };

      const mockWallet = {
        accelerateTransaction: sinon.stub().resolves(mockAccelerateTransactionResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txid');
      assert.strictEqual(result.body.txid, mockAccelerateTransactionResponse.txid);

      const decodedResponse = assertDecode(AccelerateTxResponse, result.body);
      assert.ok(decodedResponse);

      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockCoin.wallets.calledOnce, true);
      assert.strictEqual(walletsGetStub.calledOnceWith({ id: walletId }), true);
      assert.strictEqual(mockWallet.accelerateTransaction.calledOnce, true);
    });

    it('should successfully accelerate transaction using CPFP with noCpfpFeeRate', async function () {
      const requestBody = {
        cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        noCpfpFeeRate: true,
        maxFee: 100000,
        walletPassphrase: 'test_passphrase',
      };

      const mockWallet = {
        accelerateTransaction: sinon.stub().resolves(mockAccelerateTransactionResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
    });

    it('should successfully accelerate transaction using CPFP with noMaxFee', async function () {
      const requestBody = {
        cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        cpfpFeeRate: 50000,
        noMaxFee: true,
        walletPassphrase: 'test_passphrase',
      };

      const mockWallet = {
        accelerateTransaction: sinon.stub().resolves(mockAccelerateTransactionResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
    });

    it('should successfully accelerate transaction using RBF', async function () {
      const requestBody = {
        rbfTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        feeMultiplier: 1.5,
        walletPassphrase: 'test_passphrase',
      };

      const mockWallet = {
        accelerateTransaction: sinon.stub().resolves(mockAccelerateTransactionResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txid');
    });

    it('should successfully accelerate transaction with prv instead of walletPassphrase', async function () {
      const requestBody = {
        cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        cpfpFeeRate: 50000,
        maxFee: 100000,
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockWallet = {
        accelerateTransaction: sinon.stub().resolves(mockAccelerateTransactionResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
    });

    it('should successfully accelerate transaction with xprv', async function () {
      const requestBody = {
        cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        cpfpFeeRate: 50000,
        maxFee: 100000,
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockWallet = {
        accelerateTransaction: sinon.stub().resolves(mockAccelerateTransactionResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
    });

    it('should successfully accelerate transaction with additional parameters', async function () {
      const requestBody = {
        cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        cpfpFeeRate: 50000,
        maxFee: 100000,
        walletPassphrase: 'test_passphrase',
        feeRate: 45000,
        gasPrice: 20000000000,
        comment: 'Accelerating slow transaction',
        otp: '123456',
      };

      const mockWallet = {
        accelerateTransaction: sinon.stub().resolves(mockAccelerateTransactionResponse),
      };

      const walletsGetStub = sinon.stub().resolves(mockWallet);
      const mockWallets = { get: walletsGetStub };
      const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);

      // Verify all parameters were passed to SDK
      assert.strictEqual(mockWallet.accelerateTransaction.calledOnce, true);
      const callArgs = mockWallet.accelerateTransaction.firstCall.args[0];
      assert.strictEqual(callArgs.cpfpTxIds[0], requestBody.cpfpTxIds[0]);
      assert.strictEqual(callArgs.cpfpFeeRate, requestBody.cpfpFeeRate);
      assert.strictEqual(callArgs.maxFee, requestBody.maxFee);
      assert.strictEqual(callArgs.comment, requestBody.comment);
    });

    describe('Validation Errors', function () {
      it('should reject request without cpfpTxIds or rbfTxIds', async function () {
        const requestBody = {
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('must pass cpfpTxIds or rbfTxIds')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with both cpfpTxIds and rbfTxIds', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          rbfTxIds: ['1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          feeMultiplier: 1.5,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('cannot specify both cpfpTxIds and rbfTxIds')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject CPFP request with empty cpfpTxIds array', async function () {
        const requestBody = {
          cpfpTxIds: [],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('expecting cpfpTxIds to be an array of length 1')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject CPFP request with multiple cpfpTxIds', async function () {
        const requestBody = {
          cpfpTxIds: [
            'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          ],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('expecting cpfpTxIds to be an array of length 1')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject CPFP request without cpfpFeeRate or noCpfpFeeRate', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('cpfpFeeRate must be set unless noCpfpFeeRate is set')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject CPFP request without maxFee or noMaxFee', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('maxFee must be set unless noMaxFee is set')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject RBF request with empty rbfTxIds array', async function () {
        const requestBody = {
          rbfTxIds: [],
          feeMultiplier: 1.5,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('expecting rbfTxIds to be an array of length 1')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject RBF request without feeMultiplier', async function () {
        const requestBody = {
          rbfTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('feeMultiplier must be set')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject RBF request with feeMultiplier <= 1', async function () {
        const requestBody = {
          rbfTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          feeMultiplier: 0.5,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('feeMultiplier must be a greater than 1')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });
    });

    describe('SDK and System Errors', function () {
      it('should handle wallet not found error', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Wallet not found'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle invalid passphrase error', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'wrong_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('Invalid passphrase')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle transaction not found error', async function () {
        const requestBody = {
          cpfpTxIds: ['0000000000000000000000000000000000000000000000000000000000000000'],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('Transaction not found')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle transaction already confirmed error', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('Transaction already confirmed')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle insufficient funds error', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('Insufficient funds')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle RBF not enabled error', async function () {
        const requestBody = {
          rbfTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          feeMultiplier: 1.5,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('Transaction does not support RBF')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle unsupported coin error', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        sinon.stub(BitGo.prototype, 'coin').throws(new Error('Unsupported coin: eth'));

        const result = await agent
          .post(`/api/v2/eth/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });

    describe('Invalid Request Body Types', function () {
      it('should reject request with invalid cpfpTxIds type', async function () {
        const requestBody = {
          cpfpTxIds: 'not_an_array', // string instead of array
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid rbfTxIds type', async function () {
        const requestBody = {
          rbfTxIds: 'not_an_array', // string instead of array
          feeMultiplier: 1.5,
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid cpfpFeeRate type', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 'not_a_number', // string instead of number
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid maxFee type', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          maxFee: 'not_a_number', // string instead of number
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid feeMultiplier type', async function () {
        const requestBody = {
          rbfTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          feeMultiplier: 'not_a_number', // string instead of number
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid walletPassphrase type', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 123, // number instead of string
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid noCpfpFeeRate type', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          noCpfpFeeRate: 'true', // string instead of boolean
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid noMaxFee type', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          noMaxFee: 'true', // string instead of boolean
          walletPassphrase: 'test_passphrase',
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });
    });

    describe('Edge Cases', function () {
      it('should handle empty body', async function () {
        const requestBody = {};

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('must pass cpfpTxIds or rbfTxIds')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle very long wallet ID', async function () {
        const veryLongWalletId = 'a'.repeat(1000);
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Invalid wallet ID'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${veryLongWalletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle wallet ID with special characters', async function () {
        const specialCharWalletId = '../../../etc/passwd';
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const walletsGetStub = sinon.stub().rejects(new Error('Invalid wallet ID'));
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${encodeURIComponent(specialCharWalletId)}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle negative cpfpFeeRate', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: -50000,
          maxFee: 100000,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('cpfpFeeRate must be a non-negative integer')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should handle negative maxFee', async function () {
        const requestBody = {
          cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
          cpfpFeeRate: 50000,
          maxFee: -100000,
          walletPassphrase: 'test_passphrase',
        };

        const mockWallet = {
          accelerateTransaction: sinon.stub().rejects(new Error('maxFee must be a non-negative integer')),
        };

        const walletsGetStub = sinon.stub().resolves(mockWallet);
        const mockWallets = { get: walletsGetStub };
        const mockCoin = { wallets: sinon.stub().returns(mockWallets) };
        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/acceleratetx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });
    });
  });

  describe('AccelerateTxParams', function () {
    it('should validate params with required coin and id', function () {
      const validParams = {
        coin: 'tbtc',
        id: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(AccelerateTxParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(AccelerateTxParams), invalidParams);
      });
    });

    it('should reject params with missing id', function () {
      const invalidParams = {
        coin: 'tbtc',
      };

      assert.throws(() => {
        assertDecode(t.type(AccelerateTxParams), invalidParams);
      });
    });

    it('should reject params with non-string coin', function () {
      const invalidParams = {
        coin: 123, // number instead of string
        id: '123456789abcdef',
      };

      assert.throws(() => {
        assertDecode(t.type(AccelerateTxParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        coin: 'tbtc',
        id: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(AccelerateTxParams), invalidParams);
      });
    });
  });

  describe('AccelerateTxRequestBody', function () {
    it('should validate body with CPFP fields', function () {
      const validBody = {
        cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        cpfpFeeRate: 50000,
        maxFee: 100000,
        walletPassphrase: 'test_passphrase',
      };

      const decoded = assertDecode(t.type(AccelerateTxRequestBody), validBody);
      assert.deepStrictEqual(decoded.cpfpTxIds, validBody.cpfpTxIds);
      assert.strictEqual(decoded.cpfpFeeRate, validBody.cpfpFeeRate);
      assert.strictEqual(decoded.maxFee, validBody.maxFee);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with RBF fields', function () {
      const validBody = {
        rbfTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        feeMultiplier: 1.5,
        walletPassphrase: 'test_passphrase',
      };

      const decoded = assertDecode(t.type(AccelerateTxRequestBody), validBody);
      assert.deepStrictEqual(decoded.rbfTxIds, validBody.rbfTxIds);
      assert.strictEqual(decoded.feeMultiplier, validBody.feeMultiplier);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
    });

    it('should validate body with optional prv field', function () {
      const validBody = {
        cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        cpfpFeeRate: 50000,
        maxFee: 100000,
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(AccelerateTxRequestBody), validBody);
      assert.strictEqual(decoded.prv, validBody.prv);
    });

    it('should validate body with optional xprv field', function () {
      const validBody = {
        cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        cpfpFeeRate: 50000,
        maxFee: 100000,
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(AccelerateTxRequestBody), validBody);
      assert.strictEqual(decoded.xprv, validBody.xprv);
    });

    it('should validate body with additional transaction parameters', function () {
      const validBody = {
        cpfpTxIds: ['abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'],
        cpfpFeeRate: 50000,
        maxFee: 100000,
        walletPassphrase: 'test_passphrase',
        feeRate: 45000,
        gasPrice: 20000000000,
        gasLimit: 21000,
        comment: 'Test acceleration',
        otp: '123456',
      };

      const decoded = assertDecode(t.type(AccelerateTxRequestBody), validBody);
      assert.strictEqual(decoded.feeRate, validBody.feeRate);
      assert.strictEqual(decoded.gasPrice, validBody.gasPrice);
      assert.strictEqual(decoded.gasLimit, validBody.gasLimit);
      assert.strictEqual(decoded.comment, validBody.comment);
      assert.strictEqual(decoded.otp, validBody.otp);
    });

    it('should validate empty body (all fields are optional)', function () {
      const validBody = {};

      // All fields are optional, so empty body should be valid
      const decoded = assertDecode(t.type(AccelerateTxRequestBody), validBody);
      assert.ok(decoded);
    });

    it('should reject body with non-array cpfpTxIds', function () {
      const invalidBody = {
        cpfpTxIds: 'not_an_array',
      };

      assert.throws(() => {
        assertDecode(t.type(AccelerateTxRequestBody), invalidBody);
      });
    });

    it('should reject body with non-number cpfpFeeRate', function () {
      const invalidBody = {
        cpfpFeeRate: 'not_a_number',
      };

      assert.throws(() => {
        assertDecode(t.type(AccelerateTxRequestBody), invalidBody);
      });
    });

    it('should reject body with non-boolean noCpfpFeeRate', function () {
      const invalidBody = {
        noCpfpFeeRate: 'not_a_boolean',
      };

      assert.throws(() => {
        assertDecode(t.type(AccelerateTxRequestBody), invalidBody);
      });
    });
  });

  describe('AccelerateTxResponse', function () {
    it('should accept any valid response structure', function () {
      const validResponse = {
        tx: '02000000...',
        txid: '1234567890abcdef',
        status: 'signed',
      };

      const decoded = assertDecode(AccelerateTxResponse, validResponse);
      assert.ok(decoded);
    });

    it('should accept response with pendingApproval', function () {
      const validResponse = {
        pendingApproval: {
          id: 'approval123',
          state: 'pending',
        },
      };

      const decoded = assertDecode(AccelerateTxResponse, validResponse);
      assert.ok(decoded);
    });

    it('should accept response with transfer object', function () {
      const validResponse = {
        transfer: {
          id: 'transfer123',
          coin: 'tbtc',
          wallet: '68c02f96aa757d9212bd1a536f123456',
        },
        txid: '1234567890abcdef',
      };

      const decoded = assertDecode(AccelerateTxResponse, validResponse);
      assert.ok(decoded);
    });

    it('should accept empty response', function () {
      const validResponse = {};

      // t.unknown accepts any value
      const decoded = assertDecode(AccelerateTxResponse, validResponse);
      assert.ok(decoded !== null);
    });
  });

  describe('PostWalletAccelerateTx route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostWalletAccelerateTx.path, '/api/v2/{coin}/wallet/{id}/acceleratetx');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostWalletAccelerateTx.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostWalletAccelerateTx.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostWalletAccelerateTx.response[200]);
      assert.ok(PostWalletAccelerateTx.response[400]);
      assert.ok(PostWalletAccelerateTx.response[500]);
    });
  });
});
