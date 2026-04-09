import * as assert from 'assert';
import * as t from 'io-ts';
import {
  GenerateShareTSSParams,
  GenerateShareTSSBody,
  EddsaCommitmentShareResponse,
  EddsaRShareResponse,
  EddsaGShareResponse,
  EcdsaPaillierModulusResponse,
  EcdsaKShareResponse,
  EcdsaMuDeltaShareResponse,
  EcdsaSShareResponse,
  EcdsaMPCv2Round1Response,
  EcdsaMPCv2Round2Response,
  EcdsaMPCv2Round3Response,
} from '../../../src/typedRoutes/api/v2/generateShareTSS';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { EddsaUtils, EcdsaUtils } from '@bitgo/sdk-core';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import { setupAgent } from '../../lib/testutil';

describe('GenerateShareTSS codec tests (External Signer Mode)', function () {
  describe('generateShareTSS', function () {
    const coin = 'tsol'; // Solana testnet (EDDSA)
    const ecdsaCoin = 'tbtc'; // Bitcoin testnet (ECDSA)
    const walletId = '5a1341e7c8421dc90710673b3166bbd5';
    const encryptedPrivKey =
      'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2:encrypted';
    const decryptedPrivKey =
      'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2';
    const walletPassphrase = 'test_wallet_passphrase';
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

    describe('Request Parameter Codec Validation', function () {
      it('should validate params with coin and sharetype', function () {
        const validParams = {
          coin: 'tbtc',
          sharetype: 'commitment',
        };
        const decoded = assertDecode(t.type(GenerateShareTSSParams), validParams);
        assert.strictEqual(decoded.coin, 'tbtc');
        assert.strictEqual(decoded.sharetype, 'commitment');
      });

      it('should fail validation when coin is missing', function () {
        const invalidParams = {
          sharetype: 'commitment',
        };
        assert.throws(() => {
          assertDecode(t.type(GenerateShareTSSParams), invalidParams);
        });
      });

      it('should fail validation when sharetype is missing', function () {
        const invalidParams = {
          coin: 'tbtc',
        };
        assert.throws(() => {
          assertDecode(t.type(GenerateShareTSSParams), invalidParams);
        });
      });
    });

    describe('Request Body Codec Validation', function () {
      it('should validate body with txRequest', function () {
        const validBody = {
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            version: 1,
            state: 'initialized',
            date: '2023-01-01T00:00:00.000Z',
            userId: 'user123',
            intent: {},
            policiesChecked: true,
            unsignedTxs: [],
            latest: true,
          },
        };
        const decoded = assertDecode(t.partial(GenerateShareTSSBody), validBody);
        assert.ok(decoded.txRequest);
      });

      it('should validate body with tssParams', function () {
        const validBody = {
          tssParams: {
            txRequest: 'tx-request-id-string',
            reqId: 'abc123-0001',
            apiVersion: 'lite',
            txParams: {
              recipients: [{ address: '0x123', amount: 1000 }],
            },
          },
        };
        const decoded = assertDecode(t.partial(GenerateShareTSSBody), validBody);
        assert.ok(decoded.tssParams);
        assert.ok(decoded.tssParams.txRequest);
      });

      it('should validate body with EDDSA fields', function () {
        const validBody = {
          txRequest: {
            walletId: walletId,
            unsignedTxs: [],
            latest: true,
          },
          bitgoGpgPubKey: 'bitgo-gpg-public-key',
        };
        const decoded = assertDecode(t.partial(GenerateShareTSSBody), validBody);
        assert.ok(decoded.bitgoGpgPubKey);
      });

      it('should validate body with ECDSA K share fields', function () {
        const validBody = {
          tssParams: {
            txRequest: { walletId: walletId, unsignedTxs: [], latest: true },
          },
          challenges: {
            enterpriseChallenge: {
              ntilde: 'ntilde-value',
              h1: 'h1-value',
              h2: 'h2-value',
              p: ['p-value-1', 'p-value-2'],
            },
            bitgoChallenge: {
              ntilde: 'bitgo-ntilde',
              h1: 'bitgo-h1',
              h2: 'bitgo-h2',
              p: ['p-value-1', 'p-value-2'],
              n: 'n-value',
            },
          },
          requestType: 'tx',
        };
        const decoded = assertDecode(t.partial(GenerateShareTSSBody), validBody);
        assert.ok(decoded.challenges);
        assert.strictEqual(decoded.requestType, 'tx');
      });
    });

    describe('Response Codec Validation', function () {
      it('should validate EDDSA Commitment share response', function () {
        const validResponse = {
          userToBitgoCommitment: {
            from: 'user',
            to: 'bitgo',
            share: 'commitment-data',
            type: 'commitment',
          },
          encryptedSignerShare: {
            from: 'user',
            to: 'bitgo',
            share: 'signer-share',
            type: 'encryptedSignerShare',
          },
          encryptedUserToBitgoRShare: {
            from: 'user',
            to: 'bitgo',
            share: 'r-share',
            type: 'encryptedRShare',
          },
        };
        const decoded = assertDecode(EddsaCommitmentShareResponse, validResponse);
        assert.strictEqual(decoded.userToBitgoCommitment.from, 'user');
        assert.strictEqual(decoded.encryptedSignerShare.type, 'encryptedSignerShare');
      });

      it('should validate EDDSA R share response', function () {
        const validResponse = {
          rShare: {
            i: 1,
            rShares: {
              2: {
                i: 1,
                j: 2,
                u: 'u-value',
                v: 'v-value',
                r: 'r-value',
                R: 'R-value',
                commitment: 'commitment-value',
              },
            },
          },
        };
        const decoded = assertDecode(EddsaRShareResponse, validResponse);
        assert.strictEqual(decoded.rShare.i, 1);
        assert.ok(decoded.rShare.rShares);
      });

      it('should validate EDDSA G share response', function () {
        const validResponse = {
          i: 1,
          y: 'y-coordinate-value',
          gamma: 'gamma-value',
          R: 'R-point-value',
        };
        const decoded = assertDecode(EddsaGShareResponse, validResponse);
        assert.strictEqual(decoded.i, 1);
        assert.strictEqual(decoded.y, 'y-coordinate-value');
        assert.strictEqual(decoded.gamma, 'gamma-value');
        assert.strictEqual(decoded.R, 'R-point-value');
      });

      it('should validate ECDSA Paillier Modulus response', function () {
        const validResponse = {
          userPaillierModulus: '0x123456789abcdef...',
        };
        const decoded = assertDecode(EcdsaPaillierModulusResponse, validResponse);
        assert.strictEqual(decoded.userPaillierModulus, validResponse.userPaillierModulus);
      });

      it('should validate ECDSA K share response', function () {
        const validResponse = {
          privateShareProof: 'proof-data',
          userPublicGpgKey: 'gpg-key',
          publicShare: 'public-share',
          encryptedSignerOffsetShare: 'offset-share',
          kShare: {
            n: 'paillier-n',
            k: 'k-value',
            alpha: 'alpha',
            mu: 'mu',
            w: 'w-value',
          },
          wShare: 'encrypted-w-share-string',
        };
        const decoded = assertDecode(EcdsaKShareResponse, validResponse);
        assert.strictEqual(decoded.kShare.n, 'paillier-n');
        assert.strictEqual(typeof decoded.wShare, 'string');
      });

      it('should validate ECDSA MuDelta share response', function () {
        const validResponse = {
          muDShare: {
            i: 1,
            u: 'u-value',
            v: 'v-value',
          },
          oShare: {
            i: 1,
            gamma: 'gamma-value',
            delta: 'delta-value',
            Gamma: 'Gamma-value',
            k: 'k-value',
            w: 'w-value',
            omicron: 'omicron-value',
          },
        };
        const decoded = assertDecode(EcdsaMuDeltaShareResponse, validResponse);
        assert.strictEqual(decoded.muDShare.i, 1);
        assert.strictEqual(decoded.muDShare.u, 'u-value');
        assert.strictEqual(decoded.muDShare.v, 'v-value');
      });

      it('should validate ECDSA S share response', function () {
        const validResponse = {
          i: 1,
          y: 'y-value',
          R: 'R-value',
          s: 's-signature-value',
        };
        const decoded = assertDecode(EcdsaSShareResponse, validResponse);
        assert.strictEqual(decoded.i, 1);
        assert.strictEqual(decoded.y, 'y-value');
        assert.strictEqual(decoded.R, 'R-value');
        assert.strictEqual(decoded.s, 's-signature-value');
      });

      it('should validate MPCv2 Round1 response', function () {
        const validResponse = {
          signatureShareRound1: {
            from: 'user',
            to: 'bitgo',
            share: 'round1-share',
          },
          userGpgPubKey: 'user-gpg-key',
          encryptedRound1Session: 'session1',
          encryptedUserGpgPrvKey: 'gpg-prv',
        };
        const decoded = assertDecode(EcdsaMPCv2Round1Response, validResponse);
        assert.strictEqual(decoded.signatureShareRound1.from, 'user');
        assert.strictEqual(decoded.userGpgPubKey, 'user-gpg-key');
      });

      it('should validate MPCv2 Round2 response', function () {
        const validResponse = {
          signatureShareRound2: {
            from: 'user',
            to: 'bitgo',
            share: 'round2-share',
          },
          encryptedRound2Session: 'session2',
        };
        const decoded = assertDecode(EcdsaMPCv2Round2Response, validResponse);
        assert.strictEqual(decoded.signatureShareRound2.from, 'user');
        assert.strictEqual(decoded.signatureShareRound2.to, 'bitgo');
        assert.strictEqual(decoded.encryptedRound2Session, 'session2');
      });

      it('should validate MPCv2 Round3 response', function () {
        const validResponse = {
          signatureShareRound3: {
            from: 'user',
            to: 'bitgo',
            share: 'round3-share',
          },
        };
        const decoded = assertDecode(EcdsaMPCv2Round3Response, validResponse);
        assert.strictEqual(decoded.signatureShareRound3.from, 'user');
        assert.strictEqual(decoded.signatureShareRound3.to, 'bitgo');
        assert.strictEqual(decoded.signatureShareRound3.share, 'round3-share');
      });
    });

    describe('EDDSA Share Generation', function () {
      it('should successfully generate EDDSA Commitment share via API', async function () {
        const requestBody = {
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            walletType: 'hot',
            version: 1,
            state: 'pendingUserSignature',
            date: '2023-01-01T00:00:00.000Z',
            userId: 'user123',
            intent: {},
            policiesChecked: true,
            unsignedTxs: [
              {
                serializedTxHex: '0100000001...',
                signableHex: '0100000001...',
                derivationPath: "m/0'",
              },
            ],
            latest: true,
          },
          bitgoGpgPubKey: '-----BEGIN PGP PUBLIC KEY BLOCK-----\n...\n-----END PGP PUBLIC KEY BLOCK-----',
        };

        const mockCommitmentShareResponse = {
          userToBitgoCommitment: {
            from: 'user',
            to: 'bitgo',
            share: 'commitment-data',
            type: 'commitment',
          },
          encryptedSignerShare: {
            from: 'user',
            to: 'bitgo',
            share: 'encrypted-signer-data',
            type: 'encryptedSignerShare',
          },
          encryptedUserToBitgoRShare: {
            from: 'user',
            to: 'bitgo',
            share: 'encrypted-r-share-data',
            type: 'encryptedRShare',
          },
        };

        // Mock filesystem
        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify({ [walletId]: encryptedPrivKey }));

        // Mock coin and Eddsa utils
        const mockEddsaUtils = {
          createCommitmentShareFromTxRequest: sinon.stub().resolves(mockCommitmentShareResponse),
        };

        const mockCoin = {
          getMPCAlgorithm: sinon.stub().returns('eddsa'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);
        sinon
          .stub(EddsaUtils.prototype, 'createCommitmentShareFromTxRequest')
          .callsFake(mockEddsaUtils.createCommitmentShareFromTxRequest);

        // Call API via supertest
        const result = await agent
          .post(`/api/v2/${coin}/tssshare/commitment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify response
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('userToBitgoCommitment');
        result.body.should.have.property('encryptedSignerShare');
        result.body.should.have.property('encryptedUserToBitgoRShare');

        // Validate response against type definition
        const decodedResponse = assertDecode(EddsaCommitmentShareResponse, result.body);
        assert.strictEqual(decodedResponse.userToBitgoCommitment.from, 'user');
        assert.strictEqual(decodedResponse.encryptedSignerShare.type, 'encryptedSignerShare');

        // Verify filesystem was accessed
        assert.strictEqual(fsReadFileStub.calledOnce, true);

        // Verify createCommitmentShareFromTxRequest was called with correct params
        assert.strictEqual(mockEddsaUtils.createCommitmentShareFromTxRequest.calledOnce, true);
        const callArgs = mockEddsaUtils.createCommitmentShareFromTxRequest.firstCall.args[0];
        assert.strictEqual(callArgs.prv, decryptedPrivKey);
        assert.strictEqual(callArgs.walletPassphrase, walletPassphrase);
      });

      it('should successfully generate EDDSA R share via API', async function () {
        const requestBody = {
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
          },
          encryptedUserToBitgoRShare: {
            from: 'user',
            to: 'bitgo',
            share: 'encrypted-r-share',
            type: 'encryptedRShare',
          },
        };

        const mockRShareResponse = {
          rShare: {
            i: 1,
            rShares: {
              2: {
                i: 1,
                j: 2,
                u: 'u-value',
                v: 'v-value',
                r: 'r-value',
                R: 'R-value',
                commitment: 'commitment-value',
              },
            },
          },
        };

        // Mock filesystem and Eddsa utils
        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify({ [walletId]: encryptedPrivKey }));

        const mockEddsaUtils = {
          createRShareFromTxRequest: sinon.stub().resolves(mockRShareResponse),
        };

        const mockCoin = {
          getMPCAlgorithm: sinon.stub().returns('eddsa'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);
        sinon
          .stub(EddsaUtils.prototype, 'createRShareFromTxRequest')
          .callsFake(mockEddsaUtils.createRShareFromTxRequest);

        // Call API via supertest
        const result = await agent
          .post(`/api/v2/${coin}/tssshare/R`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify response
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('rShare');

        // Validate response type
        const decodedResponse = assertDecode(EddsaRShareResponse, result.body);
        assert.strictEqual(decodedResponse.rShare.i, 1);
        assert.ok(decodedResponse.rShare.rShares);
      });

      it('should successfully generate EDDSA G share via API', async function () {
        const requestBody = {
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
          },
          bitgoToUserRShare: {
            from: 'bitgo',
            to: 'user',
            share: 'bitgo-r-share',
          },
          userToBitgoRShare: {
            i: 1,
            rShares: {
              2: {
                i: 1,
                j: 2,
                u: 'u-value',
                v: 'v-value',
                r: 'r-value',
                R: 'R-value',
                commitment: 'commitment-value',
              },
            },
          },
          bitgoToUserCommitment: {
            from: 'bitgo',
            to: 'user',
            share: 'bitgo-commitment',
            type: 'commitment',
          },
        };

        const mockGShareResponse = {
          i: 1,
          y: 'y-coordinate',
          gamma: 'gamma-value',
          R: 'R-point',
        };

        // Mock filesystem and Eddsa utils
        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify({ [walletId]: encryptedPrivKey }));

        const mockEddsaUtils = {
          createGShareFromTxRequest: sinon.stub().resolves(mockGShareResponse),
        };

        const mockCoin = {
          getMPCAlgorithm: sinon.stub().returns('eddsa'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);
        sinon
          .stub(EddsaUtils.prototype, 'createGShareFromTxRequest')
          .callsFake(mockEddsaUtils.createGShareFromTxRequest);

        // Call API via supertest
        const result = await agent
          .post(`/api/v2/${coin}/tssshare/G`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify response
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('i');
        result.body.should.have.property('y');
        result.body.should.have.property('gamma');
        result.body.should.have.property('R');

        // Validate response type
        const decodedResponse = assertDecode(EddsaGShareResponse, result.body);
        assert.strictEqual(decodedResponse.i, 1);
        assert.strictEqual(decodedResponse.y, 'y-coordinate');
      });
    });

    describe('ECDSA Share Generation', function () {
      it('should successfully get ECDSA Paillier Modulus via API', async function () {
        const requestBody = {
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
          },
        };

        const mockPaillierResponse = {
          userPaillierModulus: '0x1234567890abcdef...',
        };

        // Mock filesystem and Ecdsa utils
        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify({ [walletId]: encryptedPrivKey }));

        const mockEcdsaUtils = {
          getOfflineSignerPaillierModulus: sinon.stub().returns(mockPaillierResponse),
        };

        const mockCoin = {
          getMPCAlgorithm: sinon.stub().returns('ecdsa'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);
        sinon
          .stub(EcdsaUtils.prototype, 'getOfflineSignerPaillierModulus')
          .callsFake(mockEcdsaUtils.getOfflineSignerPaillierModulus);

        // Call API via supertest
        const result = await agent
          .post(`/api/v2/${ecdsaCoin}/tssshare/PaillierModulus`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify response
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('userPaillierModulus');

        // Validate response type
        const decodedResponse = assertDecode(EcdsaPaillierModulusResponse, result.body);
        assert.strictEqual(decodedResponse.userPaillierModulus, mockPaillierResponse.userPaillierModulus);
      });

      it('should successfully generate ECDSA K share via API', async function () {
        const requestBody = {
          tssParams: {
            txRequest: {
              txRequestId: 'txreq123',
              walletId: walletId,
              unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
              latest: true,
            },
            reqId: 'abc123-0001',
          },
          challenges: {
            enterpriseChallenge: {
              ntilde: 'ntilde-value',
              h1: 'h1-value',
              h2: 'h2-value',
              p: ['p-proof-1', 'p-proof-2'],
            },
            bitgoChallenge: {
              ntilde: 'bitgo-ntilde',
              h1: 'bitgo-h1',
              h2: 'bitgo-h2',
              p: ['p-proof-1', 'p-proof-2'],
              n: 'n-value',
            },
          },
          requestType: 'tx',
        };

        const mockKShareResponse = {
          privateShareProof: 'private-proof-pgp-data',
          vssProof: 'vss-proof-data',
          userPublicGpgKey: 'user-gpg-public-key',
          publicShare: 'public-share-data',
          encryptedSignerOffsetShare: 'encrypted-offset-share',
          kShare: {
            n: 'paillier-n',
            k: 'encrypted-k',
            alpha: 'alpha-response',
            mu: 'mu-response',
            w: 'encrypted-w',
          },
          wShare: 'encrypted-w-share-string',
        };

        // Mock filesystem and Ecdsa utils
        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify({ [walletId]: encryptedPrivKey }));

        const mockEcdsaUtils = {
          createOfflineKShare: sinon.stub().resolves(mockKShareResponse),
        };

        const mockCoin = {
          getMPCAlgorithm: sinon.stub().returns('ecdsa'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);
        sinon.stub(EcdsaUtils.prototype, 'createOfflineKShare').callsFake(mockEcdsaUtils.createOfflineKShare);

        // Call API via supertest
        const result = await agent
          .post(`/api/v2/${ecdsaCoin}/tssshare/K`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify response
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('kShare');
        result.body.should.have.property('wShare');

        // Validate response type
        const decodedResponse = assertDecode(EcdsaKShareResponse, result.body);
        assert.strictEqual(decodedResponse.privateShareProof, mockKShareResponse.privateShareProof);
        assert.strictEqual(decodedResponse.kShare.n, mockKShareResponse.kShare.n);
      });
    });

    describe('Error Handling', function () {
      it('should fail when walletId is missing from txRequest', async function () {
        const requestBody = {
          txRequest: {
            // Missing walletId
            txRequestId: 'txreq123',
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
          },
        };

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/tssshare/commitment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response - runtime error returns 500
        assert.strictEqual(result.status, 500);
        assert.ok(result.body);
      });

      it('should fail when neither txRequest nor tssParams is provided', async function () {
        const requestBody = {
          // Missing both txRequest and tssParams
          bitgoGpgPubKey: 'some-key',
        };

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/tssshare/commitment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.strictEqual(result.status, 500);
        assert.ok(result.body);
      });

      it('should fail when wallet passphrase environment variable is missing', async function () {
        // Remove the wallet passphrase from environment
        delete process.env[`WALLET_${walletId}_PASSPHRASE`];

        const requestBody = {
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
          },
          bitgoGpgPubKey: 'bitgo-gpg-key',
        };

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/tssshare/commitment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response - runtime errors return 500
        assert.strictEqual(result.status, 500);
        assert.ok(result.body);
      });

      it('should fail when encrypted private key file cannot be read', async function () {
        const requestBody = {
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
          },
        };

        // Mock filesystem read to fail
        fsReadFileStub = sinon.stub(fs, 'readFile').rejects(new Error('ENOENT: File not found'));

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/tssshare/R`)
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
          txRequest: {
            txRequestId: 'txreq123',
            walletId: differentWalletId,
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
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
          .post(`/api/v2/${coin}/tssshare/commitment`)
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
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
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
          .post(`/api/v2/${coin}/tssshare/G`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response - runtime errors return 500
        assert.strictEqual(result.status, 500);
        assert.ok(result.body);
      });

      it('should fail when unsupported MPC algorithm is encountered', async function () {
        const requestBody = {
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
          },
        };

        // Mock filesystem
        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify({ [walletId]: encryptedPrivKey }));

        // Mock coin with unsupported MPC algorithm
        const mockCoin = {
          getMPCAlgorithm: sinon.stub().returns('unknown-algorithm'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/tssshare/commitment`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response - unsupported algorithm returns 500
        assert.strictEqual(result.status, 500);
        assert.ok(result.body);
      });

      it('should fail when unsupported share type for EDDSA', async function () {
        const requestBody = {
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
          },
        };

        // Mock filesystem
        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify({ [walletId]: encryptedPrivKey }));

        // Mock coin with EDDSA
        const mockCoin = {
          getMPCAlgorithm: sinon.stub().returns('eddsa'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

        // Make the request with invalid share type for EDDSA (K is ECDSA only)
        const result = await agent
          .post(`/api/v2/${coin}/tssshare/K`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response - unsupported share type returns 500
        assert.strictEqual(result.status, 500);
        assert.ok(result.body);
      });

      it('should fail when unsupported share type for ECDSA', async function () {
        const requestBody = {
          txRequest: {
            txRequestId: 'txreq123',
            walletId: walletId,
            unsignedTxs: [{ serializedTxHex: '0100000001...', signableHex: '0100000001...', derivationPath: "m/0'" }],
            latest: true,
          },
        };

        // Mock filesystem
        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(JSON.stringify({ [walletId]: encryptedPrivKey }));

        // Mock coin with ECDSA
        const mockCoin = {
          getMPCAlgorithm: sinon.stub().returns('ecdsa'),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

        // Make the request with invalid share type
        const result = await agent
          .post(`/api/v2/${ecdsaCoin}/tssshare/invalidShareType`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response - unsupported share type returns 500
        assert.strictEqual(result.status, 500);
        assert.ok(result.body);
      });
    });
  });
});
