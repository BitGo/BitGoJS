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

/**
 * Helper function to extract path parameter names from a route path
 * Supports both Express-style (:param) and OpenAPI-style ({param}) notation
 */
function extractPathParams(path: string): string[] {
  const colonParams = path.match(/:(\w+)/g)?.map((p) => p.slice(1)) || [];
  const braceParams = path.match(/\{(\w+)\}/g)?.map((p) => p.slice(1, -1)) || [];
  return [...colonParams, ...braceParams];
}

/**
 * Helper function to get codec parameter names from a params object
 */
function getCodecParamNames(paramsCodec: Record<string, any>): string[] {
  return Object.keys(paramsCodec);
}

describe('CoinSignTx codec tests', function () {
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
        hopTransaction: {
          txHex: '0x123456',
          gasPrice: '20000000000',
        },
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
      assert.deepStrictEqual(decoded.hopTransaction, validPrebuild.hopTransaction);
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
        pubKeys: [
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
      assert.deepStrictEqual(decoded.pubKeys, validBody.pubKeys);
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
      it('should validate response with all halfSigned fields', function () {
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

      it('should validate response with empty halfSigned', function () {
        const validResponse = {
          halfSigned: {},
        };

        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.deepStrictEqual(decoded.halfSigned, {});
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
      assert.strictEqual(PostCoinSignTx.path, '/api/v2/:coin/signtx');
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

    /**
     * CRITICAL TEST: Validates that path parameter names match codec parameter names
     * to prevent runtime validation errors.
     */
    it('should have path parameter names matching codec parameter names', function () {
      const pathParams = extractPathParams(PostCoinSignTx.path);
      const codecParams = getCodecParamNames(CoinSignTxParams);

      pathParams.sort();
      codecParams.sort();

      assert.deepStrictEqual(
        pathParams,
        codecParams,
        `Path parameters ${JSON.stringify(pathParams)} do not match codec parameters ${JSON.stringify(codecParams)}. ` +
          `This will cause runtime validation errors! Path: ${PostCoinSignTx.path}`
      );
    });
  });
});
