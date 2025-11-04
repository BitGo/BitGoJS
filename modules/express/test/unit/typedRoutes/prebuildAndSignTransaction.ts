import * as assert from 'assert';
import * as t from 'io-ts';
import { TransactionRequest as TxRequestResponse } from '@bitgo/public-types';
import {
  PrebuildAndSignTransactionParams,
  FullySignedTransactionResponse,
  HalfSignedAccountTransactionResponse,
  SignedTransactionRequestResponse,
} from '../../../src/typedRoutes/api/v2/prebuildAndSignTransaction';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('PrebuildAndSignTransaction codec tests', function () {
  describe('prebuildAndSignTransaction', function () {
    const agent = setupAgent();
    const coin = 'tbtc';
    const walletId = '5a1341e7c8421dc90710673b3166bbd5';

    const mockFullySignedResponse = {
      txHex:
        '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully prebuild and sign a transaction with basic parameters', async function () {
      const requestBody = {
        recipients: [
          {
            address: '2N9NhCaYwCEYdYwqqW4k2tCrF4s4Lf6pD3H',
            amount: 1000000,
          },
        ],
        walletPassphrase: 'test_wallet_passphrase_12345',
      };

      // Create mock wallet
      const mockWallet = {
        prebuildAndSignTransaction: sinon.stub().resolves(mockFullySignedResponse),
      };

      // Create mock coin
      const mockCoin = {
        wallets: () => ({
          get: sinon.stub().resolves(mockWallet),
        }),
      };

      // Stub BitGo.prototype.coin to return our mock coin
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txHex');
      assert.strictEqual(result.body.txHex, mockFullySignedResponse.txHex);

      // This ensures the response structure matches the typed definition
      const decodedResponse = assertDecode(FullySignedTransactionResponse, result.body);
      assert.strictEqual(decodedResponse.txHex, mockFullySignedResponse.txHex);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockWallet.prebuildAndSignTransaction.calledOnce, true);
    });

    it('should successfully return a half-signed account transaction', async function () {
      const requestBody = {
        recipients: [
          {
            address: '0xe514ee5028934565c3f839429ea3c091efe4c701',
            amount: 1000000,
          },
        ],
        walletPassphrase: 'test_wallet_passphrase_12345',
      };

      const mockHalfSignedResponse = {
        halfSigned: {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          payload: 'signed_payload_data',
          txBase64:
            'AQAAAAFz2JT3Xvjk8jKcYcMrKR8tPMRm5+/Q6J2sMgtz7QDpAAAAAAD+////AoCWmAAAAAAAGXapFJA29QPQaHHwR3Uriuhw2A6tHkPgiKwAAAAAAAEBH9cQ2QAAAAAAAXapFCf/zr8zPrMftHGIRsOt0Cf+wdOyiKwA',
        },
      };

      const mockWallet = {
        prebuildAndSignTransaction: sinon.stub().resolves(mockHalfSignedResponse),
      };

      const mockCoin = {
        wallets: () => ({
          get: sinon.stub().resolves(mockWallet),
        }),
      };

      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('halfSigned');
      result.body.halfSigned.should.have.property('txHex');
      assert.strictEqual(result.body.halfSigned.txHex, mockHalfSignedResponse.halfSigned.txHex);

      // This ensures the response structure matches the typed definition
      const decodedResponse = assertDecode(HalfSignedAccountTransactionResponse, result.body);
      assert.ok(decodedResponse.halfSigned);
      assert.strictEqual(decodedResponse.halfSigned?.txHex, mockHalfSignedResponse.halfSigned.txHex);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockWallet.prebuildAndSignTransaction.calledOnce, true);
    });

    it('should successfully return a transaction request ID', async function () {
      const requestBody = {
        recipients: [
          {
            address: '2N9NhCaYwCEYdYwqqW4k2tCrF4s4Lf6pD3H',
            amount: 1000000,
          },
        ],
        walletPassphrase: 'test_wallet_passphrase_12345',
      };

      const mockTxRequestResponse = {
        txRequestId: '5a1341e7c8421dc90710673b3166bbd5',
      };

      const mockWallet = {
        prebuildAndSignTransaction: sinon.stub().resolves(mockTxRequestResponse),
      };

      const mockCoin = {
        wallets: () => ({
          get: sinon.stub().resolves(mockWallet),
        }),
      };

      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txRequestId');
      assert.strictEqual(result.body.txRequestId, mockTxRequestResponse.txRequestId);

      // This ensures the response structure matches the typed definition
      const decodedResponse = assertDecode(SignedTransactionRequestResponse, result.body);
      assert.strictEqual(decodedResponse.txRequestId, mockTxRequestResponse.txRequestId);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockWallet.prebuildAndSignTransaction.calledOnce, true);
    });

    it('should successfully return a TSS transaction request (Full TxRequestResponse)', async function () {
      const requestBody = {
        recipients: [
          {
            address: '2N9NhCaYwCEYdYwqqW4k2tCrF4s4Lf6pD3H',
            amount: 1000000,
          },
        ],
        walletPassphrase: 'test_wallet_passphrase_12345',
        isTss: true,
      };

      const mockTxRequestFullResponse = {
        txRequestId: '5a1341e7c8421dc90710673b3166bbd5',
        walletId: '5a1341e7c8421dc90710673b3166bbd5',
        walletType: 'hot',
        version: 1,
        state: 'pendingApproval',
        date: '2023-01-01T00:00:00.000Z',
        createdDate: '2023-01-01T00:00:00.000Z',
        userId: '5a1341e7c8421dc90710673b3166bbd5',
        initiatedBy: '5a1341e7c8421dc90710673b3166bbd5',
        updatedBy: '5a1341e7c8421dc90710673b3166bbd5',
        intents: [],
        enterpriseId: '5a1341e7c8421dc90710673b3166bbd5',
        intent: {},
        pendingApprovalId: '5a1341e7c8421dc90710673b3166bbd5',
        policiesChecked: true,
        signatureShares: [
          {
            from: 'user',
            to: 'bitgo',
            share: 'abc123',
          },
        ],
        commitmentShares: [
          {
            from: 'user',
            to: 'bitgo',
            share: 'abc123',
            type: 'commitment',
          },
        ],
        txHashes: ['hash1', 'hash2'],
        unsignedTxs: [
          {
            serializedTxHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
            signableHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
            derivationPath: "m/44'/0'/0'/0/0",
          },
        ],
        apiVersion: 'lite',
        latest: true,
      };

      const mockWallet = {
        prebuildAndSignTransaction: sinon.stub().resolves(mockTxRequestFullResponse),
      };

      const mockCoin = {
        wallets: () => ({
          get: sinon.stub().resolves(mockWallet),
        }),
      };

      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txRequestId');
      result.body.should.have.property('walletId');
      result.body.should.have.property('version');
      result.body.should.have.property('state');
      result.body.should.have.property('intents');
      result.body.should.have.property('latest');
      assert.strictEqual(result.body.txRequestId, mockTxRequestFullResponse.txRequestId);
      assert.strictEqual(result.body.walletId, mockTxRequestFullResponse.walletId);
      assert.strictEqual(result.body.version, mockTxRequestFullResponse.version);
      assert.strictEqual(result.body.state, mockTxRequestFullResponse.state);
      assert.strictEqual(result.body.latest, mockTxRequestFullResponse.latest);

      // Verify TSS-specific fields
      result.body.should.have.property('signatureShares');
      result.body.should.have.property('commitmentShares');
      result.body.should.have.property('unsignedTxs');
      result.body.signatureShares.should.be.Array();
      result.body.signatureShares.should.have.length(1);
      result.body.commitmentShares.should.be.Array();
      result.body.commitmentShares.should.have.length(1);
      result.body.unsignedTxs.should.be.Array();
      result.body.unsignedTxs.should.have.length(1);

      // This ensures the TSS transaction request response structure matches the typed definition
      const decodedResponse = assertDecode(TxRequestResponse, result.body);
      assert.strictEqual(decodedResponse.txRequestId, mockTxRequestFullResponse.txRequestId);
      assert.strictEqual(decodedResponse.walletId, mockTxRequestFullResponse.walletId);
      assert.strictEqual(decodedResponse.version, mockTxRequestFullResponse.version);
      assert.strictEqual(decodedResponse.state, mockTxRequestFullResponse.state);
      assert.strictEqual(decodedResponse.latest, mockTxRequestFullResponse.latest);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockWallet.prebuildAndSignTransaction.calledOnce, true);
    });

    it('should successfully handle Ethereum transaction with EIP1559 parameters', async function () {
      const requestBody = {
        recipients: [
          {
            address: '0xe514ee5028934565c3f839429ea3c091efe4c701',
            amount: '1000000000000000000',
          },
        ],
        walletPassphrase: 'test_wallet_passphrase_12345',
        eip1559: {
          maxFeePerGas: '20000000000',
          maxPriorityFeePerGas: '10000000000',
        },
        gasLimit: 21000,
      };

      const mockWallet = {
        prebuildAndSignTransaction: sinon.stub().resolves(mockFullySignedResponse),
      };

      const mockCoin = {
        wallets: () => ({
          get: sinon.stub().resolves(mockWallet),
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/eth/wallet/${walletId}/prebuildAndSignTransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(mockWallet.prebuildAndSignTransaction.calledOnce, true);

      // Verify the request included EIP1559 parameters
      const callArgs = mockWallet.prebuildAndSignTransaction.firstCall.args[0];
      callArgs.should.have.property('eip1559');
      callArgs.eip1559.should.have.property('maxFeePerGas');
      callArgs.eip1559.should.have.property('maxPriorityFeePerGas');
    });

    it('should successfully handle transaction with memo (Stellar/EOS)', async function () {
      const requestBody = {
        recipients: [
          {
            address: 'GDSRV7ELPLQFDJWZKNPM3VVZSHQJLD2QKRS3QEVRMPOPNFV2FO5S7ZXZ',
            amount: '10000000',
          },
        ],
        walletPassphrase: 'test_wallet_passphrase_12345',
        memo: {
          value: 'test_memo_123',
          type: 'text',
        },
      };

      const mockWallet = {
        prebuildAndSignTransaction: sinon.stub().resolves(mockFullySignedResponse),
      };

      const mockCoin = {
        wallets: () => ({
          get: sinon.stub().resolves(mockWallet),
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/xlm/wallet/${walletId}/prebuildAndSignTransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(mockWallet.prebuildAndSignTransaction.calledOnce, true);

      // Verify the request included memo
      const callArgs = mockWallet.prebuildAndSignTransaction.firstCall.args[0];
      callArgs.should.have.property('memo');
      callArgs.memo.should.have.property('value', 'test_memo_123');
      callArgs.memo.should.have.property('type', 'text');
    });

    it('should successfully handle token transfer with enableTokens', async function () {
      const requestBody = {
        recipients: [
          {
            address: '0xe514ee5028934565c3f839429ea3c091efe4c701',
            amount: '1000000',
            tokenName: 'usdc',
          },
        ],
        walletPassphrase: 'test_wallet_passphrase_12345',
        enableTokens: [
          {
            name: 'usdc',
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          },
        ],
      };

      const mockWallet = {
        prebuildAndSignTransaction: sinon.stub().resolves(mockFullySignedResponse),
      };

      const mockCoin = {
        wallets: () => ({
          get: sinon.stub().resolves(mockWallet),
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/eth/wallet/${walletId}/prebuildAndSignTransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(mockWallet.prebuildAndSignTransaction.calledOnce, true);

      // Verify the request included enableTokens
      const callArgs = mockWallet.prebuildAndSignTransaction.firstCall.args[0];
      callArgs.should.have.property('enableTokens');
      callArgs.enableTokens.should.be.Array();
      callArgs.enableTokens.should.have.length(1);
      callArgs.enableTokens[0].should.have.property('name', 'usdc');
    });

    it('should successfully handle transaction with verification options', async function () {
      const requestBody = {
        recipients: [
          {
            address: '2N9NhCaYwCEYdYwqqW4k2tCrF4s4Lf6pD3H',
            amount: 1000000,
          },
        ],
        walletPassphrase: 'test_wallet_passphrase_12345',
        verification: {
          disableNetworking: true,
          allowPaygoOutput: false,
        },
      };

      const mockWallet = {
        prebuildAndSignTransaction: sinon.stub().resolves(mockFullySignedResponse),
      };

      const mockCoin = {
        wallets: () => ({
          get: sinon.stub().resolves(mockWallet),
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(mockWallet.prebuildAndSignTransaction.calledOnce, true);

      // Verify the request included verification options
      const callArgs = mockWallet.prebuildAndSignTransaction.firstCall.args[0];
      callArgs.should.have.property('verification');
      callArgs.verification.should.have.property('disableNetworking', true);
      callArgs.verification.should.have.property('allowPaygoOutput', false);
    });

    it('should successfully handle transaction with prebuildTx parameter', async function () {
      const requestBody = {
        walletPassphrase: 'test_wallet_passphrase_12345',
        prebuildTx: {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          walletId: walletId,
        },
      };

      const mockWallet = {
        prebuildAndSignTransaction: sinon.stub().resolves(mockFullySignedResponse),
      };

      const mockCoin = {
        wallets: () => ({
          get: sinon.stub().resolves(mockWallet),
        }),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(mockWallet.prebuildAndSignTransaction.calledOnce, true);

      // Verify the request included prebuildTx
      const callArgs = mockWallet.prebuildAndSignTransaction.firstCall.args[0];
      callArgs.should.have.property('prebuildTx');
      callArgs.prebuildTx.should.have.property('txHex');
      callArgs.prebuildTx.should.have.property('walletId', walletId);
    });

    describe('Error Cases', function () {
      it('should handle invalid coin error', async function () {
        const invalidCoin = 'invalid_coin_xyz';
        const requestBody = {
          recipients: [
            {
              address: '2N9NhCaYwCEYdYwqqW4k2tCrF4s4Lf6pD3H',
              amount: 1000000,
            },
          ],
          walletPassphrase: 'test_wallet_passphrase_12345',
        };

        // Stub coin() to throw error for invalid coin
        sinon.stub(BitGo.prototype, 'coin').throws(new Error(`Coin ${invalidCoin} is not supported`));

        // Make the request to Express
        const result = await agent
          .post(`/api/v2/${invalidCoin}/wallet/${walletId}/prebuildAndSignTransaction`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle wallet not found error', async function () {
        const requestBody = {
          recipients: [
            {
              address: '2N9NhCaYwCEYdYwqqW4k2tCrF4s4Lf6pD3H',
              amount: 1000000,
            },
          ],
          walletPassphrase: 'test_wallet_passphrase_12345',
        };

        const mockCoin = {
          wallets: () => ({
            get: sinon.stub().rejects(new Error('Wallet not found')),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/invalid_wallet_id/prebuildAndSignTransaction`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle prebuildAndSignTransaction failure', async function () {
        const requestBody = {
          recipients: [
            {
              address: '2N9NhCaYwCEYdYwqqW4k2tCrF4s4Lf6pD3H',
              amount: 1000000,
            },
          ],
          walletPassphrase: 'wrong_passphrase',
        };

        const mockWallet = {
          prebuildAndSignTransaction: sinon.stub().rejects(new Error('Invalid wallet passphrase')),
        };

        const mockCoin = {
          wallets: () => ({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.strictEqual(result.status, 400);
        result.body.should.have.property('error');
      });
    });

    describe('Invalid Request Body', function () {
      it('should accept request with empty body (all fields are optional)', async function () {
        const mockWallet = {
          prebuildAndSignTransaction: sinon.stub().rejects(new Error('Missing required parameters')),
        };

        const mockCoin = {
          wallets: () => ({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        // Make the request with empty body
        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send({});

        // Should reach the handler (body is valid), but SDK rejects it
        assert.strictEqual(result.status, 400);
      });

      it('should reject request with invalid field types', async function () {
        const requestBody = {
          recipients: [
            {
              address: '2N9NhCaYwCEYdYwqqW4k2tCrF4s4Lf6pD3H',
              amount: 'invalid_amount', // Should be number or string representing number
            },
          ],
          walletPassphrase: 12345, // Number instead of string!
          numBlocks: 'five', // String instead of number!
        };

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should handle request with malformed JSON', async function () {
        // Make the request with malformed JSON
        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send('{ invalid json ]');

        // Should fail parsing
        assert.ok(result.status >= 400);
      });
    });

    describe('Edge Cases', function () {
      it('should handle multiple recipients', async function () {
        const requestBody = {
          recipients: [
            {
              address: '2N9NhCaYwCEYdYwqqW4k2tCrF4s4Lf6pD3H',
              amount: 1000000,
            },
            {
              address: '2MsFW8ywUv3xRPZnwHe4gNAkKcjxE4vxUsy',
              amount: 2000000,
            },
            {
              address: '2N1234567890abcdef1234567890abcdef',
              amount: 3000000,
            },
          ],
          walletPassphrase: 'test_wallet_passphrase_12345',
        };

        const mockWallet = {
          prebuildAndSignTransaction: sinon.stub().resolves(mockFullySignedResponse),
        };

        const mockCoin = {
          wallets: () => ({
            get: sinon.stub().resolves(mockWallet),
          }),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/wallet/${walletId}/prebuildAndSignTransaction`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(mockWallet.prebuildAndSignTransaction.calledOnce, true);

        // Verify all recipients are included
        const callArgs = mockWallet.prebuildAndSignTransaction.firstCall.args[0];
        callArgs.should.have.property('recipients');
        callArgs.recipients.should.be.Array();
        callArgs.recipients.should.have.length(3);
      });
    });
  });

  describe('PrebuildAndSignTransactionParams codec validation', function () {
    it('should validate params with required coin and id', function () {
      const validParams = {
        coin: 'btc',
        id: '5a1341e7c8421dc90710673b3166bbd5',
      };

      const decoded = assertDecode(t.type(PrebuildAndSignTransactionParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with invalid types', function () {
      const invalidParams = {
        coin: 123, // number instead of string
        id: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(PrebuildAndSignTransactionParams), invalidParams);
      });
    });
  });

  describe('Response codec validation', function () {
    it('should validate FullySignedTransactionResponse', function () {
      const validResponse = {
        txHex:
          '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      const decoded = assertDecode(FullySignedTransactionResponse, validResponse);
      assert.strictEqual(decoded.txHex, validResponse.txHex);
    });

    it('should validate SignedTransactionRequestResponse', function () {
      const validResponse = {
        txRequestId: '5a1341e7c8421dc90710673b3166bbd5',
      };

      const decoded = assertDecode(SignedTransactionRequestResponse, validResponse);
      assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);
    });

    it('should reject response with invalid structure', function () {
      const invalidResponse = {};

      assert.throws(() => {
        assertDecode(FullySignedTransactionResponse, invalidResponse);
      });
    });
  });
});
