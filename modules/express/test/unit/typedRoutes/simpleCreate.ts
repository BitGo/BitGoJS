import * as assert from 'assert';
import * as t from 'io-ts';
import {
  SimpleCreateRequestBody,
  SimpleCreateResponse,
  PostSimpleCreate,
} from '../../../src/typedRoutes/api/v1/simpleCreate';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('SimpleCreate codec tests', function () {
  describe('SimpleCreateRequestBody', function () {
    it('should validate body with required field (passphrase)', function () {
      const validBody = {
        passphrase: 'mySecurePassphrase123',
      };

      const decoded = assertDecode(t.type(SimpleCreateRequestBody), validBody);
      assert.strictEqual(decoded.passphrase, validBody.passphrase);
      assert.strictEqual(decoded.label, undefined);
      assert.strictEqual(decoded.backupXpub, undefined);
    });

    it('should validate body with all fields', function () {
      const validBody = {
        passphrase: 'mySecurePassphrase123',
        label: 'My Test Wallet',
        backupXpub:
          'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        backupXpubProvider: 'keyternal',
        enterprise: 'enterprise123',
        passcodeEncryptionCode: 'encryptionCode123',
        disableTransactionNotifications: true,
        disableKRSEmail: false,
      };

      const decoded = assertDecode(t.type(SimpleCreateRequestBody), validBody);
      assert.strictEqual(decoded.passphrase, validBody.passphrase);
      assert.strictEqual(decoded.label, validBody.label);
      assert.strictEqual(decoded.backupXpub, validBody.backupXpub);
      assert.strictEqual(decoded.backupXpubProvider, validBody.backupXpubProvider);
      assert.strictEqual(decoded.enterprise, validBody.enterprise);
      assert.strictEqual(decoded.passcodeEncryptionCode, validBody.passcodeEncryptionCode);
      assert.strictEqual(decoded.disableTransactionNotifications, validBody.disableTransactionNotifications);
      assert.strictEqual(decoded.disableKRSEmail, validBody.disableKRSEmail);
    });

    it('should reject body with missing passphrase', function () {
      const invalidBody = {
        label: 'My Wallet',
      };

      assert.throws(() => {
        assertDecode(t.type(SimpleCreateRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string passphrase', function () {
      const invalidBody = {
        passphrase: 12345,
      };

      assert.throws(() => {
        assertDecode(t.type(SimpleCreateRequestBody), invalidBody);
      });
    });
  });

  describe('SimpleCreateResponse', function () {
    it('should validate response with all required fields as objects', function () {
      const validResponse = {
        wallet: {
          id: 'wallet_id_123',
          label: 'My Wallet',
          m: 2,
          n: 3,
        },
        userKeychain: {
          xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
          encryptedXprv: 'encrypted_xprv_data',
        },
        backupKeychain: {
          xpub: 'xpub661MyMwAqRbcFW31YEwpkMuc5THy2PSt5bDMsktWQcFF8syAmRUapSCGu8ED9W6oDMSgv6Zz8idoc4a6mr8BDzTJY47LJhkJ8UB7WEGuduB',
        },
        bitgoKeychain: {
          xpub: 'xpub661MyMwAqRbcGU7FnXMKSHMwbWxARxYJUpKD1CoMJP6vonLT9bZZaWYq7A7tKPXmDFFXTKigT7VHMnbtEnjCmxQ1E93ZJe6HDKwxWD28M6f',
          isBitGo: true,
        },
      };

      const decoded = assertDecode(SimpleCreateResponse, validResponse);
      assert.deepStrictEqual(decoded.wallet, validResponse.wallet);
      assert.deepStrictEqual(decoded.userKeychain, validResponse.userKeychain);
      assert.deepStrictEqual(decoded.backupKeychain, validResponse.backupKeychain);
      assert.deepStrictEqual(decoded.bitgoKeychain, validResponse.bitgoKeychain);
    });

    it('should validate response with optional warning field', function () {
      const validResponse = {
        wallet: { id: 'wallet_id_123' },
        userKeychain: { xpub: 'xpub123' },
        backupKeychain: { xpub: 'xpub456', xprv: 'xprv789' },
        bitgoKeychain: { xpub: 'xpub789' },
        warning: 'Be sure to backup the backup keychain -- it is not stored anywhere else!',
      };

      const decoded = assertDecode(SimpleCreateResponse, validResponse);
      assert.strictEqual(decoded.warning, validResponse.warning);
    });

    it('should reject response with missing wallet field', function () {
      const invalidResponse = {
        userKeychain: { xpub: 'xpub123' },
        backupKeychain: { xpub: 'xpub456' },
        bitgoKeychain: { xpub: 'xpub789' },
      };

      assert.throws(() => {
        assertDecode(SimpleCreateResponse, invalidResponse);
      });
    });

    it('should reject response with missing bitgoKeychain field', function () {
      const invalidResponse = {
        wallet: { id: 'wallet_id_123' },
        userKeychain: { xpub: 'xpub123' },
        backupKeychain: { xpub: 'xpub456' },
      };

      assert.throws(() => {
        assertDecode(SimpleCreateResponse, invalidResponse);
      });
    });

    it('should reject response with non-object fields', function () {
      const invalidResponse = {
        wallet: 'not_an_object',
        userKeychain: { xpub: 'xpub123' },
        backupKeychain: { xpub: 'xpub456' },
        bitgoKeychain: { xpub: 'xpub789' },
      };

      assert.throws(() => {
        assertDecode(SimpleCreateResponse, invalidResponse);
      });
    });
  });

  describe('PostSimpleCreate route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostSimpleCreate.path, '/api/v1/wallets/simplecreate');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostSimpleCreate.method, 'POST');
    });

    it('should have the correct response types', function () {
      assert.ok(PostSimpleCreate.response[200]);
      assert.ok(PostSimpleCreate.response[400]);
    });
  });

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    const mockCreateWalletResponse = {
      wallet: {
        id: 'wallet_id_123',
        label: 'My Test Wallet',
        m: 2,
        n: 3,
        keychains: [{ xpub: 'xpub_user' }, { xpub: 'xpub_backup' }, { xpub: 'xpub_bitgo' }],
      },
      userKeychain: {
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        encryptedXprv: 'encrypted_user_xprv',
      },
      backupKeychain: {
        xpub: 'xpub661MyMwAqRbcFW31YEwpkMuc5THy2PSt5bDMsktWQcFF8syAmRUapSCGu8ED9W6oDMSgv6Zz8idoc4a6mr8BDzTJY47LJhkJ8UB7WEGuduB',
      },
      bitgoKeychain: {
        xpub: 'xpub661MyMwAqRbcGU7FnXMKSHMwbWxARxYJUpKD1CoMJP6vonLT9bZZaWYq7A7tKPXmDFFXTKigT7VHMnbtEnjCmxQ1E93ZJe6HDKwxWD28M6f',
        isBitGo: true,
      },
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully create wallet with passphrase only', async function () {
      const requestBody = {
        passphrase: 'mySecurePassphrase123',
      };

      const createWalletStub = sinon.stub().resolves(mockCreateWalletResponse);
      const mockWallets = {
        createWalletWithKeychains: createWalletStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post('/api/v1/wallets/simplecreate')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('wallet');
      result.body.should.have.property('userKeychain');
      result.body.should.have.property('backupKeychain');
      result.body.should.have.property('bitgoKeychain');
      assert.deepStrictEqual(result.body.wallet, mockCreateWalletResponse.wallet);

      const decodedResponse = assertDecode(SimpleCreateResponse, result.body);
      assert.deepStrictEqual(decodedResponse.wallet, mockCreateWalletResponse.wallet);

      sinon.assert.calledOnce(createWalletStub);
      sinon.assert.calledWith(createWalletStub, requestBody);
    });

    it('should successfully create wallet with all optional parameters', async function () {
      const requestBody = {
        passphrase: 'mySecurePassphrase123',
        label: 'My Test Wallet',
        backupXpub:
          'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        enterprise: 'enterprise123',
        disableTransactionNotifications: true,
      };

      const createWalletStub = sinon.stub().resolves(mockCreateWalletResponse);
      const mockWallets = {
        createWalletWithKeychains: createWalletStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post('/api/v1/wallets/simplecreate')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.deepStrictEqual(result.body.wallet, mockCreateWalletResponse.wallet);

      const decodedResponse = assertDecode(SimpleCreateResponse, result.body);
      assert.ok(decodedResponse);

      sinon.assert.calledOnce(createWalletStub);
      sinon.assert.calledWith(createWalletStub, requestBody);
    });

    it('should successfully create wallet with KRS backup provider', async function () {
      const requestBody = {
        passphrase: 'mySecurePassphrase123',
        label: 'KRS Wallet',
        backupXpubProvider: 'keyternal',
      };

      const createWalletStub = sinon.stub().resolves(mockCreateWalletResponse);
      const mockWallets = {
        createWalletWithKeychains: createWalletStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post('/api/v1/wallets/simplecreate')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.deepStrictEqual(result.body.wallet, mockCreateWalletResponse.wallet);

      sinon.assert.calledOnce(createWalletStub);
      sinon.assert.calledWith(createWalletStub, requestBody);
    });
  });

  // ==========================================
  // ERROR HANDLING TESTS
  // ==========================================

  describe('Error Handling Tests', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should return 400 for missing passphrase', async function () {
      const requestBody = {
        label: 'My Wallet',
      };

      const result = await agent
        .post('/api/v1/wallets/simplecreate')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error);
      assert.ok(result.body.error.length > 0);
    });

    it('should return 400 for non-string passphrase', async function () {
      const requestBody = {
        passphrase: 12345,
      };

      const result = await agent
        .post('/api/v1/wallets/simplecreate')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 400);
      assert.ok(result.body.error);
      assert.ok(result.body.error.length > 0);
    });

    it('should handle wallet creation failure', async function () {
      const requestBody = {
        passphrase: 'mySecurePassphrase123',
        label: 'Test Wallet',
      };

      const createWalletStub = sinon.stub().rejects(new Error('Wallet creation failed'));
      const mockWallets = {
        createWalletWithKeychains: createWalletStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post('/api/v1/wallets/simplecreate')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle invalid passphrase error', async function () {
      const requestBody = {
        passphrase: 'weak',
        label: 'Test Wallet',
      };

      const createWalletStub = sinon.stub().rejects(new Error('Passphrase too weak'));
      const mockWallets = {
        createWalletWithKeychains: createWalletStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post('/api/v1/wallets/simplecreate')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });
});
