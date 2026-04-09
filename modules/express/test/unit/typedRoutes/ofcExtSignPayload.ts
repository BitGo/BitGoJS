import * as assert from 'assert';
import { OfcSignPayloadResponse200 } from '../../../src/typedRoutes/api/v2/ofcSignPayload';
import { PostOfcExtSignPayload } from '../../../src/typedRoutes/api/v2/ofcExtSignPayload';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import { setupAgent } from '../../lib/testutil';

describe('OfcExtSignPayload External Signer Mode Tests', function () {
  describe('ofcExtSignPayload', function () {
    const walletId = 'ofc-wallet-ext-id-123';
    const encryptedPrivKey = 'xprvA1KNMoDNPEsKcNu7Lf5hUVp5L3f9qfH9DpW5L3f9qfH9DpW5L3f9qfH9DpW5:encrypted';
    const decryptedPrivKey = 'xprvA1KNMoDNPEsKcNu7Lf5hUVp5L3f9qfH9DpW5';
    const walletPassphrase = 'test_wallet_passphrase_ofc';

    const path = require('path');
    const signerFilePath = path.join(__dirname, '../../../encryptedPrivKeys.json');

    let fsReadFileStub: sinon.SinonStub;
    let agent: ReturnType<typeof setupAgent>;
    let originalFileContent: string;

    const mockSignerFileContent = JSON.stringify({
      [walletId]: encryptedPrivKey,
    });

    const mockSignPayloadResponse = {
      payload: '{"amount":"1000000","currency":"USD","recipient":"0xabcdefabcdef"}',
      signature:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    };

    before(function () {
      try {
        originalFileContent = fsSync.readFileSync(signerFilePath, 'utf8');
      } catch (e) {
        originalFileContent = '{}';
      }

      fsSync.writeFileSync(signerFilePath, mockSignerFileContent);

      agent = setupAgent({
        signerMode: true,
        signerFileSystemPath: signerFilePath,
      });
    });

    after(function () {
      fsSync.writeFileSync(signerFilePath, originalFileContent);
    });

    beforeEach(function () {
      process.env[`WALLET_${walletId}_PASSPHRASE`] = walletPassphrase;
    });

    afterEach(function () {
      sinon.restore();
      delete process.env[`WALLET_${walletId}_PASSPHRASE`];
    });

    it('should successfully sign payload in external signer mode', async function () {
      const requestBody = {
        walletId: walletId,
        payload: { amount: '1000000', currency: 'USD', recipient: '0xabcdefabcdef' },
        walletPassphrase: walletPassphrase,
      };

      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      const mockSignMessageResult = Buffer.from(mockSignPayloadResponse.signature.substring(2), 'hex');
      const mockCoin = {
        signMessage: sinon.stub().resolves(mockSignMessageResult),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('payload');
      result.body.should.have.property('signature');

      const decodedResponse = assertDecode(OfcSignPayloadResponse200, result.body);
      assert.strictEqual(typeof decodedResponse.payload, 'string');
      assert.strictEqual(typeof decodedResponse.signature, 'string');

      // Verify external signing mode operations
      assert.strictEqual(fsReadFileStub.calledOnce, true);
      const decryptStub = BitGo.prototype.decrypt as sinon.SinonStub;
      assert.strictEqual(decryptStub.calledOnce, true);
      assert.strictEqual(decryptStub.calledWith({ password: walletPassphrase, input: encryptedPrivKey }), true);
      assert.strictEqual(mockCoin.signMessage.calledOnce, true);
      assert.strictEqual(mockCoin.signMessage.firstCall.args[0].prv, decryptedPrivKey);
    });

    it('should successfully sign with stringified JSON payload', async function () {
      const requestBody = {
        walletId: walletId,
        payload: '{"transaction":"data","amount":1000}',
        walletPassphrase: walletPassphrase,
      };

      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      const mockSignMessageResult = Buffer.from(mockSignPayloadResponse.signature.substring(2), 'hex');
      const mockCoin = {
        signMessage: sinon.stub().resolves(mockSignMessageResult),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(OfcSignPayloadResponse200, result.body);
      assert.ok(decodedResponse);

      // Verify payload stayed as string
      const signMessageCall = mockCoin.signMessage.firstCall.args;
      assert.strictEqual(signMessageCall[1], requestBody.payload);
    });

    it('should successfully sign without walletPassphrase (uses env)', async function () {
      const requestBody = {
        walletId: walletId,
        payload: { amount: '1000000', currency: 'USD' },
      };

      fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
        JSON.stringify({
          [walletId]: encryptedPrivKey,
        })
      );

      const mockSignMessageResult = Buffer.from(mockSignPayloadResponse.signature.substring(2), 'hex');
      const mockCoin = {
        signMessage: sinon.stub().resolves(mockSignMessageResult),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
      sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

      const result = await agent
        .post('/api/v2/ofc/signPayload')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(OfcSignPayloadResponse200, result.body);
      assert.ok(decodedResponse.signature);

      // Verify decrypt was called with env passphrase
      const decryptStub = BitGo.prototype.decrypt as sinon.SinonStub;
      assert.strictEqual(decryptStub.calledWith({ password: walletPassphrase, input: encryptedPrivKey }), true);
    });

    describe('Error Cases', function () {
      it('should fail when encrypted private key file cannot be read', async function () {
        const requestBody = {
          walletId: walletId,
          payload: { amount: '1000000' },
          walletPassphrase: walletPassphrase,
        };

        fsReadFileStub = sinon.stub(fs, 'readFile').rejects(new Error('ENOENT: File not found'));

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should fail when walletId is not found in encrypted private keys file', async function () {
        const differentWalletId = 'different-ofc-wallet-id-123';

        const requestBody = {
          walletId: differentWalletId,
          payload: { amount: '1000000' },
          walletPassphrase: 'test-pass',
        };

        process.env[`WALLET_${differentWalletId}_PASSPHRASE`] = 'test-pass';

        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
          JSON.stringify({
            [walletId]: encryptedPrivKey,
          })
        );

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');

        delete process.env[`WALLET_${differentWalletId}_PASSPHRASE`];
      });

      it('should fail when wallet passphrase environment variable is missing', async function () {
        delete process.env[`WALLET_${walletId}_PASSPHRASE`];

        const requestBody = {
          walletId: walletId,
          payload: { amount: '1000000' },
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        assert.ok(result.body);
      });

      it('should fail when private key decryption fails', async function () {
        const requestBody = {
          walletId: walletId,
          payload: { amount: '1000000' },
          walletPassphrase: 'wrong_passphrase',
        };

        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
          JSON.stringify({
            [walletId]: encryptedPrivKey,
          })
        );

        sinon.stub(BitGo.prototype, 'decrypt').throws(new Error('Invalid passphrase'));

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should fail when coin.signMessage throws an error', async function () {
        const requestBody = {
          walletId: walletId,
          payload: { amount: '1000000' },
          walletPassphrase: walletPassphrase,
        };

        fsReadFileStub = sinon.stub(fs, 'readFile').resolves(
          JSON.stringify({
            [walletId]: encryptedPrivKey,
          })
        );

        const mockCoin = {
          signMessage: sinon.stub().rejects(new Error('Signing failed')),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);
        sinon.stub(BitGo.prototype, 'decrypt').returns(decryptedPrivKey);

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 500);
        result.body.should.have.property('error');
      });

      it('should reject request with missing walletId', async function () {
        const requestBody = {
          payload: { amount: '1000000' },
          walletPassphrase: walletPassphrase,
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });

      it('should reject request with missing payload', async function () {
        const requestBody = {
          walletId: walletId,
          walletPassphrase: walletPassphrase,
        };

        const result = await agent
          .post('/api/v2/ofc/signPayload')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.ok(result.status >= 400);
      });
    });
  });

  describe('PostOfcExtSignPayload route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostOfcExtSignPayload.path, '/api/v2/ofc/signPayload');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostOfcExtSignPayload.method, 'POST');
    });

    it('should have the correct response types', function () {
      assert.ok(PostOfcExtSignPayload.response[200]);
      assert.ok(PostOfcExtSignPayload.response[400]);
    });
  });
});
