import * as assert from 'assert';
import * as t from 'io-ts';
import { TransactionRequest as TxRequestResponse } from '@bitgo/public-types';
import {
  WalletTxSignTSSParams,
  WalletTxSignTSSTransactionPrebuild,
  WalletTxSignTSSBody,
  FullySignedTransactionResponse,
  HalfSignedAccountTransactionResponse,
  HalfSignedUtxoTransactionResponse,
  SignedTransactionRequestResponse,
  PostWalletTxSignTSS,
} from '../../../src/typedRoutes/api/v2/walletTxSignTSS';
import { assertDecode } from './common';

describe('WalletTxSignTSS codec tests', function () {
  describe('WalletTxSignTSSParams', function () {
    it('should validate params with required coin and id', function () {
      const validParams = {
        coin: 'btc',
        id: '5a1341e7c8421dc90710673b3166bbd5',
      };

      const decoded = assertDecode(t.type(WalletTxSignTSSParams), validParams);
      assert.strictEqual(decoded.coin, validParams.coin);
      assert.strictEqual(decoded.id, validParams.id);
    });

    it('should reject params with missing coin', function () {
      const invalidParams = {
        id: '5a1341e7c8421dc90710673b3166bbd5',
      };

      assert.throws(() => {
        assertDecode(t.type(WalletTxSignTSSParams), invalidParams);
      });
    });

    it('should reject params with missing id', function () {
      const invalidParams = {
        coin: 'btc',
      };

      assert.throws(() => {
        assertDecode(t.type(WalletTxSignTSSParams), invalidParams);
      });
    });

    it('should reject params with non-string coin', function () {
      const invalidParams = {
        coin: 123, // number instead of string
        id: '5a1341e7c8421dc90710673b3166bbd5',
      };

      assert.throws(() => {
        assertDecode(t.type(WalletTxSignTSSParams), invalidParams);
      });
    });

    it('should reject params with non-string id', function () {
      const invalidParams = {
        coin: 'btc',
        id: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(WalletTxSignTSSParams), invalidParams);
      });
    });
  });

  describe('WalletTxSignTSSTransactionPrebuild', function () {
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
        txRequestId: 'tx-req-5a1341e7c8421dc90710673b3166bbd5',
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

      const decoded = assertDecode(WalletTxSignTSSTransactionPrebuild, validPrebuild);
      assert.strictEqual(decoded.txHex, validPrebuild.txHex);
      assert.strictEqual(decoded.txBase64, validPrebuild.txBase64);
      assert.deepStrictEqual(decoded.txInfo, validPrebuild.txInfo);
      assert.strictEqual(decoded.walletId, validPrebuild.walletId);
      assert.strictEqual(decoded.txRequestId, validPrebuild.txRequestId);
      assert.strictEqual(decoded.nextContractSequenceId, validPrebuild.nextContractSequenceId);
      assert.strictEqual(decoded.isBatch, validPrebuild.isBatch);
      assert.deepStrictEqual(decoded.eip1559, validPrebuild.eip1559);
      assert.deepStrictEqual(decoded.hopTransaction, validPrebuild.hopTransaction);
      assert.strictEqual(decoded.backupKeyNonce, validPrebuild.backupKeyNonce);
      assert.deepStrictEqual(decoded.recipients, validPrebuild.recipients);
    });

    it('should validate prebuild with txRequestId for TSS', function () {
      const validPrebuild = {
        txRequestId: 'tx-req-5a1341e7c8421dc90710673b3166bbd5',
        walletId: '5a1341e7c8421dc90710673b3166bbd5',
      };

      const decoded = assertDecode(WalletTxSignTSSTransactionPrebuild, validPrebuild);
      assert.strictEqual(decoded.txRequestId, validPrebuild.txRequestId);
      assert.strictEqual(decoded.walletId, validPrebuild.walletId);
    });

    it('should validate empty prebuild', function () {
      const validPrebuild = {};
      const decoded = assertDecode(WalletTxSignTSSTransactionPrebuild, validPrebuild);
      assert.deepStrictEqual(decoded, {});
    });

    it('should reject prebuild with invalid field types', function () {
      const invalidPrebuild = {
        txHex: 123, // number instead of string
        isBatch: 'true', // string instead of boolean
        nextContractSequenceId: '123', // string instead of number
      };

      assert.throws(() => {
        assertDecode(WalletTxSignTSSTransactionPrebuild, invalidPrebuild);
      });
    });
  });

  describe('WalletTxSignTSSBody', function () {
    it('should validate body with all fields', function () {
      const validBody = {
        txPrebuild: {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          txRequestId: 'tx-req-5a1341e7c8421dc90710673b3166bbd5',
        },
        txRequestId: 'tx-req-5a1341e7c8421dc90710673b3166bbd5',
        walletPassphrase: 'my-secure-passphrase',
        pubs: [
          '03a247b2c6826c3f833c6e164a3be1b124bf5f6de0d837a143a4d81e427a43a26f',
          '02d3a8e9a42b89168a54f09476d40b8d60f5d553f6dcc8e5bf3e8b2733cff25c92',
        ],
        prv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        cosignerPub: '03b8c1f8c0e8ad9f1e64b2c4ed71b8e1cb8c8e9d8f2e6b5a7c3d9e1f4a2b6c8d',
        isLastSignature: true,
        apiVersion: 'lite',
        multisigTypeVersion: 'MPCv2',
        gasLimit: 21000,
        gasPrice: '20000000000',
        expireTime: 1633046400000,
        sequenceId: 42,
        recipients: [
          { address: '1abc', amount: 100000 },
          { address: '1xyz', amount: 95000 },
        ],
        custodianTransactionId: 'custodian-tx-123456',
        signingStep: 'signerNonce',
        allowNonSegwitSigningWithoutPrevTx: true,
        isEvmBasedCrossChainRecovery: true,
        derivationSeed: 'derivation-seed-abc123',
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.deepStrictEqual(decoded.txPrebuild, validBody.txPrebuild);
      assert.strictEqual(decoded.txRequestId, validBody.txRequestId);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.deepStrictEqual(decoded.pubs, validBody.pubs);
      assert.strictEqual(decoded.prv, validBody.prv);
      assert.strictEqual(decoded.cosignerPub, validBody.cosignerPub);
      assert.strictEqual(decoded.isLastSignature, validBody.isLastSignature);
      assert.strictEqual(decoded.apiVersion, validBody.apiVersion);
      assert.strictEqual(decoded.multisigTypeVersion, validBody.multisigTypeVersion);
      assert.strictEqual(decoded.gasLimit, validBody.gasLimit);
      assert.strictEqual(decoded.gasPrice, validBody.gasPrice);
      assert.strictEqual(decoded.expireTime, validBody.expireTime);
      assert.strictEqual(decoded.sequenceId, validBody.sequenceId);
      assert.deepStrictEqual(decoded.recipients, validBody.recipients);
      assert.strictEqual(decoded.custodianTransactionId, validBody.custodianTransactionId);
      assert.strictEqual(decoded.signingStep, validBody.signingStep);
      assert.strictEqual(decoded.allowNonSegwitSigningWithoutPrevTx, validBody.allowNonSegwitSigningWithoutPrevTx);
      assert.strictEqual(decoded.isEvmBasedCrossChainRecovery, validBody.isEvmBasedCrossChainRecovery);
      assert.strictEqual(decoded.derivationSeed, validBody.derivationSeed);
    });

    it('should validate empty body', function () {
      const validBody = {};
      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.deepStrictEqual(decoded, {});
    });

    it('should validate body with TSS wallet parameters (minimal)', function () {
      const validBody = {
        walletPassphrase: 'my-secure-passphrase',
        txRequestId: 'tx-req-5a1341e7c8421dc90710673b3166bbd5',
        apiVersion: 'full',
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.txRequestId, validBody.txRequestId);
      assert.strictEqual(decoded.apiVersion, validBody.apiVersion);
    });

    it('should validate body with TSS wallet parameters and txPrebuild', function () {
      const validBody = {
        walletPassphrase: 'my-secure-passphrase',
        txPrebuild: {
          txRequestId: 'tx-req-5a1341e7c8421dc90710673b3166bbd5',
        },
        apiVersion: 'lite',
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.deepStrictEqual(decoded.txPrebuild, validBody.txPrebuild);
      assert.strictEqual(decoded.apiVersion, validBody.apiVersion);
    });

    it('should validate body with MPCv2 wallet parameters', function () {
      const validBody = {
        walletPassphrase: 'my-secure-passphrase',
        txRequestId: 'tx-req-5a1341e7c8421dc90710673b3166bbd5',
        multisigTypeVersion: 'MPCv2',
        apiVersion: 'full',
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.strictEqual(decoded.walletPassphrase, validBody.walletPassphrase);
      assert.strictEqual(decoded.txRequestId, validBody.txRequestId);
      assert.strictEqual(decoded.multisigTypeVersion, validBody.multisigTypeVersion);
      assert.strictEqual(decoded.apiVersion, validBody.apiVersion);
    });

    it('should validate body with ETH-specific parameters', function () {
      const validBody = {
        walletPassphrase: 'my-secure-passphrase',
        txPrebuild: {
          txHex: '0x...',
          eip1559: {
            maxFeePerGas: '20000000000',
          },
        },
        gasLimit: '21000',
        gasPrice: 20000000000,
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.strictEqual(decoded.gasLimit, validBody.gasLimit);
      assert.strictEqual(decoded.gasPrice, validBody.gasPrice);
    });

    it('should validate body with gasLimit and gasPrice as different types', function () {
      const validBody1 = {
        gasLimit: 21000, // as number
        gasPrice: '20000000000', // as string
      };

      const decoded1 = assertDecode(t.partial(WalletTxSignTSSBody), validBody1);
      assert.strictEqual(decoded1.gasLimit, validBody1.gasLimit);
      assert.strictEqual(decoded1.gasPrice, validBody1.gasPrice);

      const validBody2 = {
        gasLimit: '21000', // as string
        gasPrice: 20000000000, // as number
      };

      const decoded2 = assertDecode(t.partial(WalletTxSignTSSBody), validBody2);
      assert.strictEqual(decoded2.gasLimit, validBody2.gasLimit);
      assert.strictEqual(decoded2.gasPrice, validBody2.gasPrice);
    });

    it('should validate body with sequenceId as different types', function () {
      const validBody1 = {
        sequenceId: 42, // as number
      };

      const decoded1 = assertDecode(t.partial(WalletTxSignTSSBody), validBody1);
      assert.strictEqual(decoded1.sequenceId, validBody1.sequenceId);

      const validBody2 = {
        sequenceId: '42', // as string
      };

      const decoded2 = assertDecode(t.partial(WalletTxSignTSSBody), validBody2);
      assert.strictEqual(decoded2.sequenceId, validBody2.sequenceId);
    });

    it('should validate body with apiVersion lite', function () {
      const validBody = {
        walletPassphrase: 'my-passphrase',
        apiVersion: 'lite',
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.strictEqual(decoded.apiVersion, validBody.apiVersion);
    });

    it('should validate body with apiVersion full', function () {
      const validBody = {
        walletPassphrase: 'my-passphrase',
        apiVersion: 'full',
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.strictEqual(decoded.apiVersion, validBody.apiVersion);
    });

    it('should validate body with all signingStep values', function () {
      const signingSteps = ['signerNonce', 'signerSignature', 'cosignerNonce'];

      signingSteps.forEach((step) => {
        const validBody = {
          signingStep: step,
        };

        const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
        assert.strictEqual(decoded.signingStep, validBody.signingStep);
      });
    });

    it('should validate body with custodian parameters', function () {
      const validBody = {
        walletPassphrase: 'my-secure-passphrase',
        txPrebuild: {
          txHex: '0100000001...',
        },
        custodianTransactionId: 'custodian-abc-123456',
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.strictEqual(decoded.custodianTransactionId, validBody.custodianTransactionId);
    });

    it('should validate body with Bitcoin-specific parameters', function () {
      const validBody = {
        walletPassphrase: 'my-secure-passphrase',
        txPrebuild: {
          txHex: '0100000001...',
        },
        allowNonSegwitSigningWithoutPrevTx: true,
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.strictEqual(decoded.allowNonSegwitSigningWithoutPrevTx, validBody.allowNonSegwitSigningWithoutPrevTx);
    });

    it('should validate body with EVM cross-chain recovery parameters', function () {
      const validBody = {
        walletPassphrase: 'my-secure-passphrase',
        txPrebuild: {
          txHex: '0x...',
        },
        isEvmBasedCrossChainRecovery: true,
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.strictEqual(decoded.isEvmBasedCrossChainRecovery, validBody.isEvmBasedCrossChainRecovery);
    });

    it('should validate body with external signer parameters', function () {
      const validBody = {
        txPrebuild: {
          txHex: '0100000001...',
        },
        derivationSeed: 'my-derivation-seed-123',
      };

      const decoded = assertDecode(t.partial(WalletTxSignTSSBody), validBody);
      assert.strictEqual(decoded.derivationSeed, validBody.derivationSeed);
    });

    it('should reject body with invalid apiVersion', function () {
      const invalidBody = {
        apiVersion: 'invalid', // not 'lite' or 'full'
      };

      assert.throws(() => {
        assertDecode(t.partial(WalletTxSignTSSBody), invalidBody);
      });
    });

    it('should reject body with invalid multisigTypeVersion', function () {
      const invalidBody = {
        multisigTypeVersion: 'MPCv1', // not 'MPCv2'
      };

      assert.throws(() => {
        assertDecode(t.partial(WalletTxSignTSSBody), invalidBody);
      });
    });

    it('should reject body with invalid field types', function () {
      const invalidBody = {
        walletPassphrase: 123, // number instead of string
        isLastSignature: 'true', // string instead of boolean
        expireTime: '1633046400000', // string instead of number
        pubs: 'not-an-array', // string instead of array
        signingStep: 'invalidStep', // not one of the allowed values
      };

      assert.throws(() => {
        assertDecode(t.partial(WalletTxSignTSSBody), invalidBody);
      });
    });

    it('should reject body with invalid pubs array items', function () {
      const invalidBody = {
        pubs: [123, 456], // numbers instead of strings
      };

      assert.throws(() => {
        assertDecode(t.partial(WalletTxSignTSSBody), invalidBody);
      });
    });

    it('should reject body with invalid gasLimit type', function () {
      const invalidBody = {
        gasLimit: true, // boolean instead of string or number
      };

      assert.throws(() => {
        assertDecode(t.partial(WalletTxSignTSSBody), invalidBody);
      });
    });

    it('should reject body with invalid sequenceId type', function () {
      const invalidBody = {
        sequenceId: true, // boolean instead of string or number
      };

      assert.throws(() => {
        assertDecode(t.partial(WalletTxSignTSSBody), invalidBody);
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

      it('should reject response with non-string txHex', function () {
        const invalidResponse = {
          txHex: 123,
        };

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

      it('should validate response with only txHex in halfSigned', function () {
        const validResponse = {
          halfSigned: {
            txHex:
              '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
          },
        };

        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.strictEqual(decoded.halfSigned.txHex, validResponse.halfSigned.txHex);
      });

      it('should validate response with only payload in halfSigned', function () {
        const validResponse = {
          halfSigned: {
            payload: '{"serializedTx":"0x123456"}',
          },
        };

        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.strictEqual(decoded.halfSigned.payload, validResponse.halfSigned.payload);
      });

      it('should validate response with empty halfSigned', function () {
        const validResponse = {
          halfSigned: {},
        };

        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.deepStrictEqual(decoded.halfSigned, {});
      });

      it('should reject response with missing halfSigned', function () {
        const invalidResponse = {};

        assert.throws(() => {
          assertDecode(HalfSignedAccountTransactionResponse, invalidResponse);
        });
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

      it('should reject response with non-string txRequestId', function () {
        const invalidResponse = {
          txRequestId: 12345,
        };

        assert.throws(() => {
          assertDecode(SignedTransactionRequestResponse, invalidResponse);
        });
      });
    });

    describe('TxRequestResponse', function () {
      it('should validate response with all required fields for TSS (Lite version)', function () {
        const validResponse = {
          txRequestId: '5a1341e7c8421dc90710673b3166bbd5',
          walletId: '5a1341e7c8421dc90710673b3166bbd5',
          walletType: 'hot',
          version: 1,
          state: 'signed',
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
        assert.strictEqual(decoded.apiVersion, validResponse.apiVersion);
        assert.strictEqual(decoded.latest, validResponse.latest);
      });

      it('should validate response with minimal required fields', function () {
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
        assert.strictEqual(decoded.latest, validResponse.latest);
      });
    });
  });

  describe('PostWalletTxSignTSS route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostWalletTxSignTSS.path, '/api/v2/:coin/wallet/:id/signtxtss');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostWalletTxSignTSS.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      assert.ok(PostWalletTxSignTSS.request);
    });

    it('should have the correct response types', function () {
      assert.ok(PostWalletTxSignTSS.response[200]);
      assert.ok(PostWalletTxSignTSS.response[400]);
    });
  });
});
