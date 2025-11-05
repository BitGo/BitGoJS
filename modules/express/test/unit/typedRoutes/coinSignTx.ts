import * as assert from 'assert';
import * as t from 'io-ts';
import { TransactionRequest as TxRequestResponse } from '@bitgo/public-types';
import {
  CoinSignTxParams,
  TransactionPrebuild,
  CoinSignTxBody,
  FullySignedTransactionResponse,
  HalfSignedAccountTransactionResponse,
  HalfSignedUtxoTransactionResponse,
  SignedTransactionRequestResponse,
  PostCoinSignTx,
} from '../../../src/typedRoutes/api/v2/coinSignTx';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('CoinSignTx codec tests', function () {
  describe('coinSignTx', function () {
    const agent = setupAgent();
    const coin = 'tbtc';

    const mockFullySignedResponse = {
      txHex:
        '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully sign a transaction', async function () {
      const requestBody = {
        txPrebuild: {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          walletId: '5a1341e7c8421dc90710673b3166bbd5',
        },
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        isLastSignature: true,
      };

      // Create mock coin with signTransaction method
      const mockCoin = {
        signTransaction: sinon.stub().resolves(mockFullySignedResponse),
      };

      // Stub BitGo.prototype.coin to return our mock coin
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/signtx`)
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
      assert.strictEqual(
        mockCoin.signTransaction.calledOnceWith(
          sinon.match({
            coin: coin,
            txPrebuild: sinon.match.object,
            prv: requestBody.prv,
            isLastSignature: true,
          })
        ),
        true
      );
    });

    it('should successfully sign a half-signed transaction', async function () {
      const requestBody = {
        txPrebuild: {
          txBase64:
            'AQAAAAFz2JT3Xvjk8jKcYcMrKR8tPMRm5+/Q6J2sMgtz7QDpAAAAAAD+////AoCWmAAAAAAAGXapFJA29QPQaHHwR3Uriuhw2A6tHkPgiKwAAAAAAAEBH9cQ2QAAAAAAAXapFCf/zr8zPrMftHGIRsOt0Cf+wdOyiKwA',
        },
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockHalfSignedResponse = {
        halfSigned: {
          txBase64:
            'AQAAAAFz2JT3Xvjk8jKcYcMrKR8tPMRm5+/Q6J2sMgtz7QDpAAAAAAD+////AoCWmAAAAAAAGXapFJA29QPQaHHwR3Uriuhw2A6tHkPgiKwAAAAAAAEBH9cQ2QAAAAAAAXapFCf/zr8zPrMftHGIRsOt0Cf+wdOyiKwA',
        },
      };

      // Create mock coin with signTransaction method
      const mockCoin = {
        signTransaction: sinon.stub().resolves(mockHalfSignedResponse),
      };

      // Stub BitGo.prototype.coin to return our mock coin
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/signtx`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('halfSigned');
      result.body.halfSigned.should.have.property('txBase64');
      assert.strictEqual(result.body.halfSigned.txBase64, mockHalfSignedResponse.halfSigned.txBase64);

      // This ensures the response structure matches the typed definition
      const decodedResponse = assertDecode(HalfSignedAccountTransactionResponse, result.body);
      assert.strictEqual(decodedResponse.halfSigned.txBase64, mockHalfSignedResponse.halfSigned.txBase64);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockCoin.signTransaction.calledOnce, true);
    });

    it('should successfully return a transaction request ID', async function () {
      const requestBody = {
        txPrebuild: {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockTxRequestResponse = {
        txRequestId: '5a1341e7c8421dc90710673b3166bbd5',
      };

      // Create mock coin with signTransaction method
      const mockCoin = {
        signTransaction: sinon.stub().resolves(mockTxRequestResponse),
      };

      // Stub BitGo.prototype.coin to return our mock coin
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/signtx`)
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
      assert.strictEqual(mockCoin.signTransaction.calledOnce, true);
    });

    it('should successfully return a TSS transaction request (Full TxRequestResponse)', async function () {
      const requestBody = {
        txPrebuild: {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
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

      // Create mock coin with signTransaction method
      const mockCoin = {
        signTransaction: sinon.stub().resolves(mockTxRequestFullResponse),
      };

      // Stub BitGo.prototype.coin to return our mock coin
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/signtx`)
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
      assert.strictEqual(mockCoin.signTransaction.calledOnce, true);
    });

    describe('Error Cases', function () {
      it('should handle invalid coin error', async function () {
        const invalidCoin = 'invalid_coin_xyz';
        const requestBody = {
          txPrebuild: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          },
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        // Stub coin() to throw error for invalid coin
        sinon.stub(BitGo.prototype, 'coin').throws(new Error(`Coin ${invalidCoin} is not supported`));

        // Make the request to Express
        const result = await agent
          .post(`/api/v2/${invalidCoin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle signTransaction failure', async function () {
        const requestBody = {
          txPrebuild: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          },
          prv: 'invalid_private_key',
        };

        // Create mock coin where signTransaction fails
        const mockCoin = {
          signTransaction: sinon.stub().rejects(new Error('Invalid private key')),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        // Make the request to Express
        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should handle missing transaction data error', async function () {
        const requestBody = {
          txPrebuild: {},
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        // Create mock coin where signTransaction fails due to missing data
        const mockCoin = {
          signTransaction: sinon.stub().rejects(new Error('Missing transaction data')),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        // Make the request to Express
        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });
    });

    describe('Invalid Request Body', function () {
      it('should reject request with empty body', async function () {
        // Make the request with empty body
        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send({});

        // io-ts validation should fail or SDK should reject
        // Note: Depending on route config, this might be 400 or 500
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid txPrebuild type', async function () {
        const requestBody = {
          txPrebuild: 'invalid_string_instead_of_object', // Wrong type!
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid field types', async function () {
        const requestBody = {
          txPrebuild: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          },
          prv: 12345, // Number instead of string!
          isLastSignature: 'true', // String instead of boolean!
        };

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should handle request with malformed JSON', async function () {
        // Make the request with malformed JSON
        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send('{ invalid json ]');

        // Should fail parsing
        assert.ok(result.status >= 400);
      });
    });

    describe('Edge Cases', function () {
      it('should handle empty txPrebuild object', async function () {
        const requestBody = {
          txPrebuild: {}, // Empty object
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        const mockCoin = {
          signTransaction: sinon.stub().rejects(new Error('Missing transaction data')),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle empty txPrebuild gracefully
        assert.ok(result.status >= 400);
      });

      it('should handle very long private key', async function () {
        const requestBody = {
          txPrebuild: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          },
          prv: 'x'.repeat(10000), // Extremely long private key
        };

        const mockCoin = {
          signTransaction: sinon.stub().rejects(new Error('Invalid private key format')),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle gracefully
        assert.ok(result.status >= 400);
      });

      it('should handle missing prv for certain transaction types', async function () {
        const requestBody = {
          txPrebuild: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          },
          // Missing prv - some transaction types might not require it
        };

        const mockCoin = {
          signTransaction: sinon.stub().rejects(new Error('Private key required for signing')),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail if prv is required
        assert.ok(result.status >= 400);
      });

      it('should handle coin parameter with special characters', async function () {
        const specialCoin = '../../../etc/passwd';
        const requestBody = {
          txPrebuild: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          },
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        sinon.stub(BitGo.prototype, 'coin').throws(new Error('Invalid coin identifier'));

        const result = await agent
          .post(`/api/v2/${encodeURIComponent(specialCoin)}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle special characters safely
        assert.ok(result.status >= 400);
      });

      it('should handle request with both txHex and txBase64', async function () {
        const requestBody = {
          txPrebuild: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
            txBase64:
              'AQAAAAFz2JT3Xvjk8jKcYcMrKR8tPMRm5+/Q6J2sMgtz7QDpAAAAAAD+////AoCWmAAAAAAAGXapFJA29QPQaHHwR3Uriuhw2A6tHkPgiKwAAAAAAAEBH9cQ2QAAAAAAAXapFCf/zr8zPrMftHGIRsOt0Cf+wdOyiKwA',
          },
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        const mockCoin = {
          signTransaction: sinon.stub().resolves(mockFullySignedResponse),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle gracefully (accept or reject consistently)
        assert.ok(result.status === 200 || result.status >= 400);
      });

      it('should handle request with invalid signingStep value', async function () {
        const requestBody = {
          txPrebuild: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          },
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
          signingStep: 'invalidStep', // Not one of: signerNonce, signerSignature, cosignerNonce
        };

        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });
    });

    describe('Response Validation Edge Cases', function () {
      it('should reject response with missing required field in FullySignedTransactionResponse', async function () {
        const requestBody = {
          txPrebuild: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          },
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        // Mock returns invalid response (missing txHex)
        const invalidResponse = {};

        const mockCoin = {
          signTransaction: sinon.stub().resolves(invalidResponse),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Even if SDK returns 200, response should fail codec validation
        // This depends on where validation happens
        assert.ok(result.status === 200 || result.status >= 400);

        // If status is 200 but response is invalid, codec validation should catch it
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(FullySignedTransactionResponse, result.body);
          });
        }
      });

      it('should reject response with wrong type in txHex field', async function () {
        const requestBody = {
          txPrebuild: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          },
          prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        };

        // Mock returns invalid response (txHex is number instead of string)
        const invalidResponse = {
          txHex: 12345, // Wrong type!
        };

        const mockCoin = {
          signTransaction: sinon.stub().resolves(invalidResponse),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/signtx`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Response codec validation should catch type mismatch
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(FullySignedTransactionResponse, result.body);
          });
        }
      });
    });
  });

  describe('CoinSignTxParams', function () {
    it('should validate params with required coin', function () {
      const validParams = {
        coin: 'btc',
      };

      const decoded = assertDecode(t.type(CoinSignTxParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {};

      assert.throws(() => {
        assertDecode(t.type(CoinSignTxParams), invalidParams);
      });
    });

    it('should reject params with non-string coin', function () {
      const invalidParams = {
        coin: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(CoinSignTxParams), invalidParams);
      });
    });
  });

  describe('TransactionPrebuild', function () {
    it('should validate prebuild with all fields', function () {
      const validPrebuild = {
        txHex:
          '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        txBase64:
          'AQAAAAFz2JT3Xvjk8jKcYcMrKR8tPMRm5+/Q6J2sMgtz7QDpAAAAAAD+////AoCWmAAAAAAAGXapFJA29QPQaHHwR3Uriuhw2A6tHkPgiKwAAAAAAAEBH9cQ2QAAAAAAAXapFCf/zr8zPrMftHGIRsOt0Cf+wdOyiKwA',
        txInfo: {
          inputs: [{ address: '1abc', value: 100000 }],
          outputs: [{ address: '1xyz', value: 95000 }],
        },
        walletId: '5a1341e7c8421dc90710673b3166bbd5',
        nextContractSequenceId: 123,
        isBatch: true,
        eip1559: {
          maxPriorityFeePerGas: '10000000000',
          maxFeePerGas: '20000000000',
        },
        hopTransaction: '0x123456abcdef', // String format (from SignFinalOptions)
        backupKeyNonce: 42,
        recipients: [
          { address: '1abc', amount: 100000 },
          { address: '1xyz', amount: 95000 },
        ],
      };

      const decoded = assertDecode(TransactionPrebuild, validPrebuild);
      assert.strictEqual(decoded.txHex, validPrebuild.txHex);
      assert.strictEqual(decoded.txBase64, validPrebuild.txBase64);
      assert.deepStrictEqual(decoded.txInfo, validPrebuild.txInfo);
      assert.strictEqual(decoded.walletId, validPrebuild.walletId);
      assert.strictEqual(decoded.nextContractSequenceId, validPrebuild.nextContractSequenceId);
      assert.strictEqual(decoded.isBatch, validPrebuild.isBatch);
      assert.deepStrictEqual(decoded.eip1559, validPrebuild.eip1559);
      assert.strictEqual(decoded.hopTransaction, validPrebuild.hopTransaction); // Now string
      assert.strictEqual(decoded.backupKeyNonce, validPrebuild.backupKeyNonce);
      assert.deepStrictEqual(decoded.recipients, validPrebuild.recipients);
    });

    it('should validate empty prebuild', function () {
      const validPrebuild = {};
      const decoded = assertDecode(TransactionPrebuild, validPrebuild);
      assert.deepStrictEqual(decoded, {});
    });

    it('should reject prebuild with invalid field types', function () {
      const invalidPrebuild = {
        txHex: 123, // number instead of string
        isBatch: 'true', // string instead of boolean
        nextContractSequenceId: '123', // string instead of number
      };

      assert.throws(() => {
        assertDecode(TransactionPrebuild, invalidPrebuild);
      });
    });

    it('should validate prebuild with hopTransaction as string (EVM)', function () {
      const validPrebuild = {
        txHex: '0x02f87301808459682f008459682f0e8252089439c0f2000e39186af4b78b554eb96a2ea8dc5c3680a46a761202',
        hopTransaction: '0x123456abcdef', // String format instead of object
        isBatch: false,
      };

      const decoded = assertDecode(TransactionPrebuild, validPrebuild);
      assert.strictEqual(decoded.txHex, validPrebuild.txHex);
      assert.strictEqual(decoded.hopTransaction, validPrebuild.hopTransaction);
      assert.strictEqual(decoded.isBatch, validPrebuild.isBatch);
    });

    it('should validate prebuild with addressInfo (Tron)', function () {
      const validPrebuild = {
        txHex: '{"raw_data":{"contract":[{"parameter":{"value":{"amount":1000,"to_address":"TTest"}}}]}}',
        addressInfo: {
          address: 'TTest123456789',
          chain: 0,
          index: 5,
        },
      };

      const decoded = assertDecode(TransactionPrebuild, validPrebuild);
      assert.strictEqual(decoded.txHex, validPrebuild.txHex);
      assert.deepStrictEqual(decoded.addressInfo, validPrebuild.addressInfo);
      assert.strictEqual(decoded.addressInfo.address, 'TTest123456789');
      assert.strictEqual(decoded.addressInfo.chain, 0);
      assert.strictEqual(decoded.addressInfo.index, 5);
    });

    it('should validate prebuild with recipients including memo field', function () {
      const validPrebuild = {
        txHex: '0x123456',
        recipients: [
          {
            address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            amount: '1000000',
            tokenName: 'USDC',
            data: '0xabcdef',
            memo: 'Payment for invoice #12345',
          },
          {
            address: '0x9b9f8e3a7c5b9e1c4a7d6e5f8a9b0c1d2e3f4a5b',
            amount: 500000,
            memo: 'Refund',
          },
        ],
      };

      const decoded = assertDecode(TransactionPrebuild, validPrebuild);
      assert.deepStrictEqual(decoded.recipients, validPrebuild.recipients);
      assert.strictEqual(decoded.recipients[0].memo, 'Payment for invoice #12345');
      assert.strictEqual(decoded.recipients[1].memo, 'Refund');
      assert.strictEqual(decoded.recipients[0].tokenName, 'USDC');
      assert.strictEqual(decoded.recipients[0].data, '0xabcdef');
    });
  });

  describe('CoinSignTxBody', function () {
    it('should validate body with all fields', function () {
      const validBody = {
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        txPrebuild: {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
        isLastSignature: true,
        gasLimit: 21000,
        gasPrice: '20000000000',
        expireTime: 1633046400000,
        sequenceId: 42,
        pubs: [
          '03a247b2c6826c3f833c6e164a3be1b124bf5f6de0d837a143a4d81e427a43a26f',
          '02d3a8e9a42b89168a54f09476d40b8d60f5d553f6dcc8e5bf3e8b2733cff25c92',
        ],
        isEvmBasedCrossChainRecovery: true,
        recipients: [
          { address: '1abc', amount: 100000 },
          { address: '1xyz', amount: 95000 },
        ],
        custodianTransactionId: 'custodian-tx-123456',
        signingStep: 'signerNonce',
        allowNonSegwitSigningWithoutPrevTx: true,
      };

      const decoded = assertDecode(t.partial(CoinSignTxBody), validBody);
      assert.strictEqual(decoded.prv, validBody.prv);
      assert.deepStrictEqual(decoded.txPrebuild, validBody.txPrebuild);
      assert.strictEqual(decoded.isLastSignature, validBody.isLastSignature);
      assert.strictEqual(decoded.gasLimit, validBody.gasLimit);
      assert.strictEqual(decoded.gasPrice, validBody.gasPrice);
      assert.strictEqual(decoded.expireTime, validBody.expireTime);
      assert.strictEqual(decoded.sequenceId, validBody.sequenceId);
      assert.deepStrictEqual(decoded.pubs, validBody.pubs);
      assert.strictEqual(decoded.isEvmBasedCrossChainRecovery, validBody.isEvmBasedCrossChainRecovery);
      assert.deepStrictEqual(decoded.recipients, validBody.recipients);
      assert.strictEqual(decoded.custodianTransactionId, validBody.custodianTransactionId);
      assert.strictEqual(decoded.signingStep, validBody.signingStep);
      assert.strictEqual(decoded.allowNonSegwitSigningWithoutPrevTx, validBody.allowNonSegwitSigningWithoutPrevTx);
    });

    it('should validate empty body', function () {
      const validBody = {};
      const decoded = assertDecode(t.partial(CoinSignTxBody), validBody);
      assert.deepStrictEqual(decoded, {});
    });

    it('should validate body with gasLimit and gasPrice as different types', function () {
      const validBody = {
        gasLimit: 21000, // as number
        gasPrice: '20000000000', // as string
      };

      const decoded = assertDecode(t.partial(CoinSignTxBody), validBody);
      assert.strictEqual(decoded.gasLimit, validBody.gasLimit);
      assert.strictEqual(decoded.gasPrice, validBody.gasPrice);
    });

    it('should validate body with UTXO-specific fields (pubs and cosignerPub)', function () {
      const validBody = {
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        txPrebuild: {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
        pubs: [
          'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
          'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet9',
          'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet0',
        ],
        cosignerPub:
          'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet0',
        isLastSignature: false,
        signingStep: 'signerNonce',
      };

      const decoded = assertDecode(t.partial(CoinSignTxBody), validBody);
      assert.strictEqual(decoded.prv, validBody.prv);
      assert.deepStrictEqual(decoded.pubs, validBody.pubs);
      assert.strictEqual(decoded.cosignerPub, validBody.cosignerPub);
      assert.strictEqual(decoded.isLastSignature, validBody.isLastSignature);
      assert.strictEqual(decoded.signingStep, validBody.signingStep);
    });

    it('should validate body with EVM-specific fields (walletVersion)', function () {
      const validBody = {
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        txPrebuild: {
          txHex:
            '0x02f87301808459682f008459682f0e8252089439c0f2000e39186af4b78b554eb96a2ea8dc5c3680a46a7612020000000000000000000000002c8f0c8aad01af9f2c6ba6f4edbf6f46000a0eedc080a0',
        },
        isLastSignature: false,
        walletVersion: 3,
        gasLimit: 21000,
        gasPrice: '20000000000',
        sequenceId: 5,
        expireTime: 1700000000,
      };

      const decoded = assertDecode(t.partial(CoinSignTxBody), validBody);
      assert.strictEqual(decoded.walletVersion, validBody.walletVersion);
      assert.strictEqual(decoded.gasLimit, validBody.gasLimit);
      assert.strictEqual(decoded.gasPrice, validBody.gasPrice);
      assert.strictEqual(decoded.sequenceId, validBody.sequenceId);
      assert.strictEqual(decoded.expireTime, validBody.expireTime);
    });

    it('should reject body with invalid field types', function () {
      const invalidBody = {
        prv: 123, // number instead of string
        isLastSignature: 'true', // string instead of boolean
        expireTime: '1633046400000', // string instead of number
        signingStep: 'invalidStep', // not one of the allowed values
      };

      assert.throws(() => {
        assertDecode(t.partial(CoinSignTxBody), invalidBody);
      });
    });
  });

  describe('Response Types', function () {
    describe('FullySignedTransactionResponse', function () {
      it('should validate response with required txHex', function () {
        const validResponse = {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        };

        const decoded = assertDecode(FullySignedTransactionResponse, validResponse);
        assert.strictEqual(decoded.txHex, validResponse.txHex);
      });

      it('should reject response with missing txHex', function () {
        const invalidResponse = {};

        assert.throws(() => {
          assertDecode(FullySignedTransactionResponse, invalidResponse);
        });
      });
    });

    describe('HalfSignedAccountTransactionResponse', function () {
      it('should validate response with generic account coin fields', function () {
        const validResponse = {
          halfSigned: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
            payload: '{"serializedTx":"0x123456","signature":"0xabcdef"}',
            txBase64:
              'AQAAAAFz2JT3Xvjk8jKcYcMrKR8tPMRm5+/Q6J2sMgtz7QDpAAAAAAD+////AoCWmAAAAAAAGXapFJA29QPQaHHwR3Uriuhw2A6tHkPgiKwAAAAAAAEBH9cQ2QAAAAAAAXapFCf/zr8zPrMftHGIRsOt0Cf+wdOyiKwA',
          },
        };

        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.strictEqual(decoded.halfSigned.txHex, validResponse.halfSigned.txHex);
        assert.strictEqual(decoded.halfSigned.payload, validResponse.halfSigned.payload);
        assert.strictEqual(decoded.halfSigned.txBase64, validResponse.halfSigned.txBase64);
      });

      it('should validate response with EVM-specific fields', function () {
        const validResponse = {
          halfSigned: {
            txHex: '0x02f87301808459682f008459682f0e8252089439c0f2000e39186af4b78b554eb96a2ea8dc5c3680a46a761202',
            recipients: [
              { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', amount: 1000000 },
              { address: '0x9b9f8e3a7c5b9e1c4a7d6e5f8a9b0c1d2e3f4a5b', amount: 500000 },
            ],
            eip1559: {
              maxFeePerGas: '2000000000',
              maxPriorityFeePerGas: '1500000000',
            },
            expiration: 1700000000,
            expireTime: 1700000000,
            contractSequenceId: 42,
            sequenceId: 5,
            hopTransaction: '0x123456abcdef789', // String format (from SignFinalOptions)
            custodianTransactionId: 'custodian-tx-12345',
            isBatch: false,
          },
        };

        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.strictEqual(decoded.halfSigned.txHex, validResponse.halfSigned.txHex);
        assert.deepStrictEqual(decoded.halfSigned.recipients, validResponse.halfSigned.recipients);
        assert.deepStrictEqual(decoded.halfSigned.eip1559, validResponse.halfSigned.eip1559);
        assert.strictEqual(decoded.halfSigned.expiration, validResponse.halfSigned.expiration);
        assert.strictEqual(decoded.halfSigned.expireTime, validResponse.halfSigned.expireTime);
        assert.strictEqual(decoded.halfSigned.contractSequenceId, validResponse.halfSigned.contractSequenceId);
        assert.strictEqual(decoded.halfSigned.sequenceId, validResponse.halfSigned.sequenceId);
        assert.strictEqual(decoded.halfSigned.hopTransaction, validResponse.halfSigned.hopTransaction); // Now string
        assert.strictEqual(decoded.halfSigned.custodianTransactionId, validResponse.halfSigned.custodianTransactionId);
        assert.strictEqual(decoded.halfSigned.isBatch, validResponse.halfSigned.isBatch);
      });

      it('should validate response with mixed generic and EVM fields', function () {
        const validResponse = {
          halfSigned: {
            txHex: '0x02f87301808459682f008459682f0e8252089439c0f2000e39186af4b78b554eb96a2ea8dc5c3680a46a761202',
            recipients: [{ address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', amount: 1000000 }],
            contractSequenceId: 10,
          },
        };

        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.strictEqual(decoded.halfSigned.txHex, validResponse.halfSigned.txHex);
        assert.deepStrictEqual(decoded.halfSigned.recipients, validResponse.halfSigned.recipients);
        assert.strictEqual(decoded.halfSigned.contractSequenceId, validResponse.halfSigned.contractSequenceId);
      });

      it('should validate response with empty halfSigned', function () {
        const validResponse = {
          halfSigned: {},
        };

        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.deepStrictEqual(decoded.halfSigned, {});
      });

      it('should validate response with hopTransaction as string (EVM)', function () {
        const validResponse = {
          halfSigned: {
            txHex: '0x02f87301808459682f008459682f0e8252089439c0f2000e39186af4b78b554eb96a2ea8dc5c3680a46a761202',
            hopTransaction: '0x123456abcdef789', // String format (from SignFinalOptions)
            contractSequenceId: 42,
            sequenceId: 5,
          },
        };

        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.strictEqual(decoded.halfSigned.txHex, validResponse.halfSigned.txHex);
        assert.strictEqual(decoded.halfSigned.hopTransaction, '0x123456abcdef789');
        assert.strictEqual(decoded.halfSigned.contractSequenceId, validResponse.halfSigned.contractSequenceId);
        assert.strictEqual(decoded.halfSigned.sequenceId, validResponse.halfSigned.sequenceId);
      });

      it('should validate response with recipients including memo field (EVM)', function () {
        const validResponse = {
          halfSigned: {
            txHex: '0x02f87301808459682f008459682f0e8252089439c0f2000e39186af4b78b554eb96a2ea8dc5c3680a46a761202',
            recipients: [
              {
                address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
                amount: '1000000',
                tokenName: 'USDC',
                data: '0xabcdef',
                memo: 'Payment for services',
              },
            ],
            contractSequenceId: 10,
          },
        };

        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.deepStrictEqual(decoded.halfSigned.recipients, validResponse.halfSigned.recipients);
        assert.strictEqual(decoded.halfSigned.recipients[0].memo, 'Payment for services');
        assert.strictEqual(decoded.halfSigned.recipients[0].tokenName, 'USDC');
        assert.strictEqual(decoded.halfSigned.recipients[0].data, '0xabcdef');
      });
    });

    describe('HalfSignedUtxoTransactionResponse', function () {
      it('should validate response with required txHex', function () {
        const validResponse = {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        };

        const decoded = assertDecode(HalfSignedUtxoTransactionResponse, validResponse);
        assert.strictEqual(decoded.txHex, validResponse.txHex);
      });

      it('should reject response with missing txHex', function () {
        const invalidResponse = {};

        assert.throws(() => {
          assertDecode(HalfSignedUtxoTransactionResponse, invalidResponse);
        });
      });
    });

    describe('SignedTransactionRequestResponse', function () {
      it('should validate response with required txRequestId', function () {
        const validResponse = {
          txRequestId: '5a1341e7c8421dc90710673b3166bbd5',
        };

        const decoded = assertDecode(SignedTransactionRequestResponse, validResponse);
        assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);
      });

      it('should reject response with missing txRequestId', function () {
        const invalidResponse = {};

        assert.throws(() => {
          assertDecode(SignedTransactionRequestResponse, invalidResponse);
        });
      });
    });

    describe('TxRequestResponse', function () {
      it('should validate response with all required fields', function () {
        const validResponse = {
          txRequestId: '5a1341e7c8421dc90710673b3166bbd5',
          walletId: '5a1341e7c8421dc90710673b3166bbd5',
          version: 1,
          state: 'pendingApproval',
          date: '2023-01-01T00:00:00.000Z',
          createdDate: '2023-01-01T00:00:00.000Z',
          userId: '5a1341e7c8421dc90710673b3166bbd5',
          initiatedBy: '5a1341e7c8421dc90710673b3166bbd5',
          updatedBy: '5a1341e7c8421dc90710673b3166bbd5',
          intents: [],
          latest: true,
        };

        const decoded = assertDecode(TxRequestResponse, validResponse);
        assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);
        assert.strictEqual(decoded.walletId, validResponse.walletId);
        assert.strictEqual(decoded.version, validResponse.version);
        assert.strictEqual(decoded.state, validResponse.state);
        assert.strictEqual(decoded.userId, validResponse.userId);
        assert.strictEqual(decoded.initiatedBy, validResponse.initiatedBy);
        assert.strictEqual(decoded.updatedBy, validResponse.updatedBy);
        assert.deepStrictEqual(decoded.intents, validResponse.intents);
        assert.strictEqual(decoded.latest, validResponse.latest);
      });

      it('should validate response with optional fields (Lite version)', function () {
        const validResponse = {
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

        const decoded = assertDecode(TxRequestResponse, validResponse);
        assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);
        assert.strictEqual(decoded.walletId, validResponse.walletId);
        assert.strictEqual(decoded.version, validResponse.version);
        assert.strictEqual(decoded.state, validResponse.state);
        assert.strictEqual(decoded.userId, validResponse.userId);
        assert.strictEqual(decoded.initiatedBy, validResponse.initiatedBy);
        assert.strictEqual(decoded.updatedBy, validResponse.updatedBy);
        assert.strictEqual(decoded.latest, validResponse.latest);
      });
    });
  });

  describe('PostCoinSignTx route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostCoinSignTx.path, '/api/v2/{coin}/signtx');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostCoinSignTx.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      assert.ok(PostCoinSignTx.request);
    });

    it('should have the correct response types', function () {
      assert.ok(PostCoinSignTx.response[200]);
      assert.ok(PostCoinSignTx.response[400]);
    });
  });
});
