import * as assert from 'assert';
import * as t from 'io-ts';
import {
  CoinSignParams,
  TransactionPrebuildForExternalSigning,
  CoinSignBody,
} from '../../../src/typedRoutes/api/v2/coinSign';
import {
  FullySignedTransactionResponse,
  HalfSignedAccountTransactionResponse,
  HalfSignedUtxoTransactionResponse,
  SignedTransactionRequestResponse,
} from '../../../src/typedRoutes/api/v2/coinSignTx';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import { setupAgent } from '../../lib/testutil';

describe('CoinSign codec tests (External Signer Mode)', function () {
  describe('coinSign', function () {
    const coin = 'tbtc';
    const walletId = '5a1341e7c8421dc90710673b3166bbd5';
    const encryptedPrivKey =
      'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2:encrypted';
    const decryptedPrivKey =
      'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';
    const walletPassphrase = 'test_wallet_passphrase';
    // Use the existing encryptedPrivKeys.json file in the project root
    const path = require('path');
    const signerFilePath = path.join(__dirname, '../../../encryptedPrivKeys.json');

    let fsReadFileStub: sinon.SinonStub;
    let agent: ReturnType<typeof setupAgent>;
    let originalFileContent: string;

    // Mock encrypted private keys JSON content
    const mockSignerFileContent = JSON.stringify({
      [walletId]: encryptedPrivKey,
    });

    // Setup the express app with signer mode before all tests
    before(function () {
      // Save the original content of encryptedPrivKeys.json
      try {
        originalFileContent = fsSync.readFileSync(signerFilePath, 'utf8');
      } catch (e) {
        originalFileContent = '{}';
      }

      // Temporarily write mock data to the existing file
      fsSync.writeFileSync(signerFilePath, mockSignerFileContent);

      // Create agent with signerMode enabled for external signing
      agent = setupAgent({
        signerMode: true,
        signerFileSystemPath: signerFilePath,
      });
    });

    // Restore the original file content after all tests
    after(function () {
      // Restore original content
      fsSync.writeFileSync(signerFilePath, originalFileContent);
    });

    beforeEach(function () {
      // Setup environment variable for wallet passphrase
      process.env[`WALLET_${walletId}_PASSPHRASE`] = walletPassphrase;
    });

    afterEach(function () {
      // Restore ALL sinon stubs to prevent conflicts between tests
      sinon.restore();
      // Clean up environment variables
      delete process.env[`WALLET_${walletId}_PASSPHRASE`];
    });

    const mockFullySignedResponse = {
      txHex:
        '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
    };

    it('should successfully sign a transaction in external signer mode', async function () {
      const requestBody = {
        txPrebuild: {
          walletId: walletId,
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
        isLastSignature: true,
      };

      // Mock filesystem read for encrypted private key
      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      // Create mock BitGo with decrypt method
      const mockBitGo = {
        decrypt: sinon.stub().returns(decryptedPrivKey),
        coin: sinon.stub(),
      };

      // Create mock coin with signTransaction method
      const mockCoin = {
        signTransaction: sinon.stub().resolves(mockFullySignedResponse),
      };

      mockBitGo.coin.returns(mockCoin);

      // Stub BitGo constructor
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      sinon.stub(BitGo.prototype, 'decrypt').callsFake(mockBitGo.decrypt);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
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

      // Verify filesystem was accessed
      assert.strictEqual(fsReadFileStub.calledOnce, true);

      // Verify private key was decrypted
      assert.strictEqual(mockBitGo.decrypt.calledOnce, true);
      assert.strictEqual(mockBitGo.decrypt.calledWith({ password: walletPassphrase, input: encryptedPrivKey }), true);

      // Verify signTransaction was called with decrypted key
      assert.strictEqual(mockCoin.signTransaction.calledOnce, true);
      const signTxCall = mockCoin.signTransaction.firstCall.args[0];
      assert.strictEqual(signTxCall.prv, decryptedPrivKey);
      assert.strictEqual(signTxCall.isLastSignature, true);
    });

    it('should successfully sign with derivationSeed', async function () {
      const derivationSeed = 'test-derivation-seed-123';
      const derivedKey =
        'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2:derived';

      const requestBody = {
        txPrebuild: {
          walletId: walletId,
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
        derivationSeed: derivationSeed,
      };

      // Mock filesystem read
      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      // Create mock coin with deriveKeyWithSeed
      const mockCoin = {
        signTransaction: sinon.stub().resolves(mockFullySignedResponse),
        deriveKeyWithSeed: sinon.stub().returns({
          key: derivedKey,
          derivationPath: "m/0'",
        }),
      };

      // Stub BitGo methods
      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txHex');

      // Verify key derivation was called
      assert.strictEqual(mockCoin.deriveKeyWithSeed.calledOnce, true);
      assert.strictEqual(
        mockCoin.deriveKeyWithSeed.calledWith({
          key: decryptedPrivKey,
          seed: derivationSeed,
        }),
        true
      );

      // Verify signTransaction was called with derived key
      const signTxCall = mockCoin.signTransaction.firstCall.args[0];
      assert.strictEqual(signTxCall.prv, derivedKey);
      assert.strictEqual(signTxCall.derivationSeed, derivationSeed);
    });

    it('should successfully sign a half-signed account transaction', async function () {
      const requestBody = {
        txPrebuild: {
          walletId: walletId,
          txBase64:
            'AQAAAAFz2JT3Xvjk8jKcYcMrKR8tPMRm5+/Q6J2sMgtz7QDpAAAAAAD+////AoCWmAAAAAAAGXapFJA29QPQaHHwR3Uriuhw2A6tHkPgiKwAAAAAAAEBH9cQ2QAAAAAAAXapFCf/zr8zPrMftHGIRsOt0Cf+wdOyiKwA',
        },
      };

      const mockHalfSignedResponse = {
        halfSigned: {
          txBase64:
            'AQAAAAFz2JT3Xvjk8jKcYcMrKR8tPMRm5+/Q6J2sMgtz7QDpAAAAAAD+////AoCWmAAAAAAAGXapFJA29QPQaHHwR3Uriuhw2A6tHkPgiKwAAAAAAAEBH9cQ2QAAAAAAAXapFCf/zr8zPrMftHGIRsOt0Cf+wdOyiKwA',
        },
      };

      // Mock filesystem and decryption
      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      const mockCoin = {
        signTransaction: sinon.stub().resolves(mockHalfSignedResponse),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('halfSigned');
      result.body.halfSigned.should.have.property('txBase64');
      assert.strictEqual(result.body.halfSigned.txBase64, mockHalfSignedResponse.halfSigned.txBase64);

      // Validate against type definition
      const decodedResponse = assertDecode(HalfSignedAccountTransactionResponse, result.body);
      assert.strictEqual(decodedResponse.halfSigned?.txBase64, mockHalfSignedResponse.halfSigned.txBase64);
    });

    it('should successfully sign a half-signed UTXO transaction', async function () {
      const requestBody = {
        txPrebuild: {
          walletId: walletId,
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
      };

      const mockHalfSignedUtxoResponse = {
        txHex:
          '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000049483045022100abc...ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
      };

      // Mock filesystem and decryption
      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      const mockCoin = {
        signTransaction: sinon.stub().resolves(mockHalfSignedUtxoResponse),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txHex');
      assert.strictEqual(result.body.txHex, mockHalfSignedUtxoResponse.txHex);

      // Validate against type definition
      const decodedResponse = assertDecode(HalfSignedUtxoTransactionResponse, result.body);
      assert.strictEqual(decodedResponse.txHex, mockHalfSignedUtxoResponse.txHex);
    });

    it('should successfully return a transaction request ID', async function () {
      const requestBody = {
        txPrebuild: {
          walletId: walletId,
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
      };

      const mockTxRequestResponse = {
        txRequestId: '5a1341e7c8421dc90710673b3166bbd5',
      };

      // Mock filesystem and decryption
      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      const mockCoin = {
        signTransaction: sinon.stub().resolves(mockTxRequestResponse),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txRequestId');
      assert.strictEqual(result.body.txRequestId, mockTxRequestResponse.txRequestId);

      // Validate against type definition
      const decodedResponse = assertDecode(SignedTransactionRequestResponse, result.body);
      assert.strictEqual(decodedResponse.txRequestId, mockTxRequestResponse.txRequestId);
    });

    it('should successfully return a TSS transaction request (Full TxRequestResponse)', async function () {
      const requestBody = {
        txPrebuild: {
          walletId: walletId,
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
      };

      const mockTxRequestFullResponse = {
        txRequestId: '5a1341e7c8421dc90710673b3166bbd5',
        walletId: walletId,
        walletType: 'hot',
        version: 1,
        state: 'signed',
        date: '2023-01-01T00:00:00.000Z',
        userId: '5a1341e7c8421dc90710673b3166bbd5',
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

      // Mock filesystem and decryption
      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      const mockCoin = {
        signTransaction: sinon.stub().resolves(mockTxRequestFullResponse),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('txRequestId');
      result.body.should.have.property('walletId');
      result.body.should.have.property('version');
      result.body.should.have.property('state');
      result.body.should.have.property('latest');
      assert.strictEqual(result.body.txRequestId, mockTxRequestFullResponse.txRequestId);
      assert.strictEqual(result.body.walletId, mockTxRequestFullResponse.walletId);
      assert.strictEqual(result.body.latest, mockTxRequestFullResponse.latest);

      // Verify TSS-specific fields
      result.body.should.have.property('signatureShares');
      result.body.should.have.property('unsignedTxs');
      result.body.signatureShares.should.be.Array();
      result.body.unsignedTxs.should.be.Array();

      // Validate against type definition
      const decodedResponse = assertDecode(SignedTransactionRequestResponse, result.body);
      assert.strictEqual(decodedResponse.txRequestId, mockTxRequestFullResponse.txRequestId);
    });

    it('should fail when walletId is missing from txPrebuild', async function () {
      const requestBody = {
        txPrebuild: {
          // Missing walletId
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
      };

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify error response - typed router returns validation errors with status 400
      assert.strictEqual(result.status, 400);
      // The error response contains a validation error message
      assert.ok(result.body);
    });

    it('should fail when txPrebuild is missing', async function () {
      const requestBody = {
        // Missing txPrebuild entirely
        isLastSignature: true,
      };

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify error response - typed router returns validation errors with status 400
      assert.strictEqual(result.status, 400);
      // The error response contains a validation error message
      assert.ok(result.body);
    });

    it('should fail when wallet passphrase environment variable is missing', async function () {
      // Remove the wallet passphrase from environment
      delete process.env[`WALLET_${walletId}_PASSPHRASE`];

      const requestBody = {
        txPrebuild: {
          walletId: walletId,
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
      };

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify error response - runtime errors return 500
      assert.strictEqual(result.status, 500);
      assert.ok(result.body);
    });

    it('should fail when encrypted private key file cannot be read', async function () {
      const requestBody = {
        txPrebuild: {
          walletId: walletId,
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
      };

      // Mock filesystem read to fail
      fsReadFileStub = sinon.stub(fs, 'readFile').rejects(new Error('ENOENT: File not found'));

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify error response - runtime errors return 500
      assert.strictEqual(result.status, 500);
      assert.ok(result.body);
    });

    it('should fail when walletId is not found in encrypted private keys file', async function () {
      const differentWalletId = 'different-wallet-id-123';

      const requestBody = {
        txPrebuild: {
          walletId: differentWalletId,
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
      };

      // Setup environment for different wallet
      process.env[`WALLET_${differentWalletId}_PASSPHRASE`] = 'test-pass';

      // Mock filesystem with different wallet IDs
      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey, // Different wallet ID
        })
      );

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify error response - runtime errors return 500
      assert.strictEqual(result.status, 500);
      assert.ok(result.body);

      // Cleanup
      delete process.env[`WALLET_${differentWalletId}_PASSPHRASE`];
    });

    it('should fail when private key decryption fails', async function () {
      const requestBody = {
        txPrebuild: {
          walletId: walletId,
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
      };

      // Mock filesystem read
      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      // Mock decrypt to throw error
      sinon.stub(BitGo.prototype, 'decrypt').throws(new Error('Invalid passphrase'));

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify error response - runtime errors return 500
      assert.strictEqual(result.status, 500);
      assert.ok(result.body);
    });

    it('should fail when coin.signTransaction throws an error', async function () {
      const requestBody = {
        txPrebuild: {
          walletId: walletId,
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        },
      };

      // Mock filesystem and decryption
      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      const mockCoin = {
        signTransaction: sinon.stub().rejects(new Error('Invalid transaction format')),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

      // Make the request
      const result = await agent
        .post(`/api/v2/${coin}/sign`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify error response - runtime errors return 500
      assert.strictEqual(result.status, 500);
      assert.ok(result.body);
    });
  });

  describe('CoinSignParams', function () {
    it('should validate params with required coin', function () {
      const validParams = {
        coin: 'tbtc',
      };
      const decoded = assertDecode(t.type(CoinSignParams), validParams);
      assert.strictEqual(decoded.coin, 'tbtc');
    });

    it('should fail validation when coin is missing', function () {
      const invalidParams = {};
      assert.throws(() => {
        assertDecode(t.type(CoinSignParams), invalidParams);
      });
    });
  });

  describe('TransactionPrebuildForExternalSigning', function () {
    const walletId = '5a1341e7c8421dc90710673b3166bbd5';

    it('should validate prebuild with required walletId', function () {
      const validPrebuild = {
        walletId: walletId,
      };
      const decoded = assertDecode(TransactionPrebuildForExternalSigning, validPrebuild);
      assert.strictEqual(decoded.walletId, walletId);
    });

    it('should validate prebuild with all optional fields', function () {
      const validPrebuild = {
        walletId: walletId,
        txHex: '0100000001...',
        txBase64: 'AQAAA...',
        txInfo: { memo: 'test' },
        nextContractSequenceId: 123,
        isBatch: true,
        eip1559: {
          maxFeePerGas: '50000000000',
          maxPriorityFeePerGas: '1500000000',
        },
        hopTransaction: '0x123456abcdef', // String format (valid alternative to full HopTransaction object)
        backupKeyNonce: 42, // Number (valid - can also be string)
        recipients: [{ address: '0x123', amount: 1000 }],
      };
      const decoded = assertDecode(TransactionPrebuildForExternalSigning, validPrebuild);
      assert.strictEqual(decoded.walletId, walletId);
      assert.strictEqual(decoded.txHex, '0100000001...');
      assert.strictEqual(decoded.isBatch, true);
      assert.strictEqual(decoded.backupKeyNonce, 42);
      assert.strictEqual(decoded.hopTransaction, '0x123456abcdef');
    });

    it('should fail validation when walletId is missing', function () {
      const invalidPrebuild = {
        txHex: '0100000001...',
      };
      assert.throws(() => {
        assertDecode(TransactionPrebuildForExternalSigning, invalidPrebuild);
      });
    });
  });

  describe('CoinSignBody', function () {
    const walletId = '5a1341e7c8421dc90710673b3166bbd5';

    it('should validate body with required txPrebuild', function () {
      const validBody = {
        txPrebuild: {
          walletId: walletId,
        },
      };
      const decoded = assertDecode(t.type(CoinSignBody), validBody);
      assert.strictEqual(decoded.txPrebuild.walletId, walletId);
    });

    it('should validate body with all optional fields', function () {
      const validBody = {
        txPrebuild: {
          walletId: walletId,
          txHex: '0100000001...',
        },
        derivationSeed: 'test-seed',
        isLastSignature: true,
        gasLimit: 21000,
        gasPrice: '50000000000',
        expireTime: 1234567890,
        sequenceId: 1,
        pubKeys: ['pubkey1', 'pubkey2'],
        isEvmBasedCrossChainRecovery: false,
        recipients: [{ address: '0x123', amount: 1000 }],
        custodianTransactionId: 'cust-123',
        signingStep: 'signerNonce',
        allowNonSegwitSigningWithoutPrevTx: true,
        // New fields added from coinSignTx
        walletVersion: 3,
        signingKeyNonce: 5,
        walletContractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        pubs: ['xpub1...', 'xpub2...', 'xpub3...'],
        cosignerPub: 'xpub_cosigner...',
      };
      const decoded = assertDecode(t.type(CoinSignBody), validBody);
      assert.strictEqual(decoded.txPrebuild.walletId, walletId);
      assert.strictEqual(decoded.derivationSeed, 'test-seed');
      assert.strictEqual(decoded.isLastSignature, true);
      assert.strictEqual(decoded.gasLimit, 21000);
      assert.strictEqual(decoded.walletVersion, 3);
      assert.strictEqual(decoded.signingKeyNonce, 5);
      assert.strictEqual(decoded.walletContractAddress, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      assert.deepStrictEqual(decoded.pubs, ['xpub1...', 'xpub2...', 'xpub3...']);
      assert.strictEqual(decoded.cosignerPub, 'xpub_cosigner...');
    });

    it('should validate body with gasLimit and gasPrice as different types', function () {
      const validBody = {
        txPrebuild: { walletId: walletId },
        gasLimit: 21000, // as number
        gasPrice: '50000000000', // as string
      };
      const decoded = assertDecode(t.type(CoinSignBody), validBody);
      assert.strictEqual(decoded.gasLimit, 21000);
      assert.strictEqual(decoded.gasPrice, '50000000000');

      const validBody2 = {
        txPrebuild: { walletId: walletId },
        gasLimit: '21000', // as string
        gasPrice: 50000000000, // as number
      };
      const decoded2 = assertDecode(t.type(CoinSignBody), validBody2);
      assert.strictEqual(decoded2.gasLimit, '21000');
      assert.strictEqual(decoded2.gasPrice, 50000000000);
    });

    it('should fail validation when txPrebuild is missing', function () {
      const invalidBody = {
        isLastSignature: true,
      };
      assert.throws(() => {
        assertDecode(t.type(CoinSignBody), invalidBody);
      });
    });
  });

  describe('Response Codecs', function () {
    describe('FullySignedTransactionResponse', function () {
      it('should validate response with required txHex', function () {
        const validResponse = {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000000ffffffff0180a21900000000001976a914c918e1b36f2c72b1aaef94dbb7f578a4b68b542788ac00000000',
        };
        const decoded = assertDecode(FullySignedTransactionResponse, validResponse);
        assert.strictEqual(decoded.txHex, validResponse.txHex);
      });

      it('should fail validation when txHex is missing', function () {
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
            txHex: '0x123...',
            payload: 'payload-data',
            txBase64: 'base64-data',
          },
        };
        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.strictEqual(decoded.halfSigned?.txHex, '0x123...');
        assert.strictEqual(decoded.halfSigned?.payload, 'payload-data');
        assert.strictEqual(decoded.halfSigned?.txBase64, 'base64-data');
      });

      it('should validate response with empty halfSigned', function () {
        const validResponse = {
          halfSigned: {},
        };
        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.deepStrictEqual(decoded.halfSigned, {});
      });

      it('should validate response with minimal halfSigned', function () {
        const validResponse = {
          halfSigned: {
            txHex: '0x123456',
          },
        };
        const decoded = assertDecode(HalfSignedAccountTransactionResponse, validResponse);
        assert.strictEqual(decoded.halfSigned.txHex, '0x123456');
      });
    });

    describe('HalfSignedUtxoTransactionResponse', function () {
      it('should validate response with required txHex', function () {
        const validResponse = {
          txHex:
            '0100000001c7dad3d9607a23c45a6c1c5ad7bce02acff71a0f21eb4a72a59d0c0e19402d0f0000000049483045022100abc...ffffffff',
        };
        const decoded = assertDecode(HalfSignedUtxoTransactionResponse, validResponse);
        assert.strictEqual(decoded.txHex, validResponse.txHex);
      });

      it('should fail validation when txHex is missing', function () {
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

      it('should validate response with all optional TSS fields', function () {
        const validResponse = {
          txRequestId: '5a1341e7c8421dc90710673b3166bbd5',
          walletId: '5a1341e7c8421dc90710673b3166bbd5',
          version: 1,
          latest: true,
          state: 'signed',
          date: '2023-01-01T00:00:00.000Z',
          userId: 'user-123',
          intent: {},
          signatureShares: [
            {
              from: 'user',
              to: 'bitgo',
              share: 'abc123',
            },
          ],
          unsignedTxs: [
            {
              serializedTxHex: '0100000001...',
              signableHex: '0100000001...',
            },
          ],
        };
        const decoded = assertDecode(SignedTransactionRequestResponse, validResponse);
        assert.strictEqual(decoded.txRequestId, validResponse.txRequestId);

        if ('walletId' in decoded) {
          assert.strictEqual(decoded.walletId, validResponse.walletId);
        }
        if ('latest' in decoded) {
          assert.strictEqual(decoded.latest, true);
        }
      });

      it('should fail validation when txRequestId is missing', function () {
        const invalidResponse = {
          walletId: '5a1341e7c8421dc90710673b3166bbd5',
        };
        assert.throws(() => {
          assertDecode(SignedTransactionRequestResponse, invalidResponse);
        });
      });
    });
  });
});
