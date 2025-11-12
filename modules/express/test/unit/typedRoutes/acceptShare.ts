import * as assert from 'assert';
import * as t from 'io-ts';
import {
  AcceptShareRequestParams,
  AcceptShareRequestBody,
  AcceptShareResponse,
  PostAcceptShare,
} from '../../../src/typedRoutes/api/v1/acceptShare';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('AcceptShare codec tests', function () {
  describe('AcceptShareRequestParams', function () {
    it('should validate valid params', function () {
      const validParams = {
        shareId: '123456789abcdef',
      };

      const decoded = assertDecode(t.type(AcceptShareRequestParams), validParams);
      assert.strictEqual(decoded.shareId, validParams.shareId);
    });

    it('should reject params with missing shareId', function () {
      const invalidParams = {};

      assert.throws(() => {
        assertDecode(t.type(AcceptShareRequestParams), invalidParams);
      });
    });

    it('should reject params with non-string shareId', function () {
      const invalidParams = {
        shareId: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(AcceptShareRequestParams), invalidParams);
      });
    });
  });

  describe('AcceptShareRequestBody', function () {
    it('should validate body with all fields', function () {
      const validBody = {
        userPassword: 'mySecurePassword',
        newWalletPassphrase: 'myNewPassphrase',
        overrideEncryptedXprv: 'encryptedXprvString',
      };

      const decoded = assertDecode(t.type(AcceptShareRequestBody), validBody);
      assert.strictEqual(decoded.userPassword, validBody.userPassword);
      assert.strictEqual(decoded.newWalletPassphrase, validBody.newWalletPassphrase);
      assert.strictEqual(decoded.overrideEncryptedXprv, validBody.overrideEncryptedXprv);
    });

    it('should validate empty body since all fields are optional', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(AcceptShareRequestBody), validBody);
      assert.strictEqual(decoded.userPassword, undefined);
      assert.strictEqual(decoded.newWalletPassphrase, undefined);
      assert.strictEqual(decoded.overrideEncryptedXprv, undefined);
    });

    it('should reject body with non-string optional fields', function () {
      const invalidBody = {
        userPassword: 12345, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(AcceptShareRequestBody), invalidBody);
      });
    });
  });

  describe('Edge cases', function () {
    describe('PostAcceptShare route definition', function () {
      it('should have the correct path', function () {
        assert.strictEqual(PostAcceptShare.path, '/api/v1/walletshare/{shareId}/acceptShare');
      });

      it('should have the correct HTTP method', function () {
        assert.strictEqual(PostAcceptShare.method, 'POST');
      });

      it('should have the correct request configuration', function () {
        // Verify the route is configured with a request property
        assert.ok(PostAcceptShare.request);
      });

      it('should have the correct response types', function () {
        // Check that the response object has the expected status codes
        assert.ok(PostAcceptShare.response[200]);
        assert.ok(PostAcceptShare.response[400]);
      });
    });

    it('should handle empty strings for optional fields', function () {
      const body = {
        userPassword: '',
        newWalletPassphrase: '',
        overrideEncryptedXprv: '',
      };

      const decoded = assertDecode(t.type(AcceptShareRequestBody), body);
      assert.strictEqual(decoded.userPassword, '');
      assert.strictEqual(decoded.newWalletPassphrase, '');
      assert.strictEqual(decoded.overrideEncryptedXprv, '');
    });

    it('should handle additional unknown properties', function () {
      const body = {
        userPassword: 'password123',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(AcceptShareRequestBody)), body);
      assert.strictEqual(decoded.userPassword, 'password123');
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });

  describe('AcceptShareResponse', function () {
    it('should validate valid response with all fields', function () {
      const validResponse = {
        changed: true,
        state: 'accepted',
      };

      const decoded = assertDecode(AcceptShareResponse, validResponse);
      assert.strictEqual(decoded.changed, validResponse.changed);
      assert.strictEqual(decoded.state, validResponse.state);
    });

    it('should validate response with changed=false', function () {
      const validResponse = {
        changed: false,
        state: 'pending',
      };

      const decoded = assertDecode(AcceptShareResponse, validResponse);
      assert.strictEqual(decoded.changed, false);
      assert.strictEqual(decoded.state, 'pending');
    });

    it('should reject response without changed field', function () {
      const invalidResponse = {
        state: 'accepted',
      };

      assert.throws(() => {
        assertDecode(AcceptShareResponse, invalidResponse);
      });
    });

    it('should reject response without state field', function () {
      const invalidResponse = {
        changed: true,
      };

      assert.throws(() => {
        assertDecode(AcceptShareResponse, invalidResponse);
      });
    });

    it('should reject response with non-boolean changed field', function () {
      const invalidResponse = {
        changed: 'true',
        state: 'accepted',
      };

      assert.throws(() => {
        assertDecode(AcceptShareResponse, invalidResponse);
      });
    });

    it('should reject response with non-string state field', function () {
      const invalidResponse = {
        changed: true,
        state: 123,
      };

      assert.throws(() => {
        assertDecode(AcceptShareResponse, invalidResponse);
      });
    });
  });

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();
    const shareId = 'share123456789abcdef';

    const mockAcceptShareResponse = {
      state: 'accepted',
      changed: true,
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully accept share with all optional fields', async function () {
      const requestBody = {
        userPassword: 'mySecurePassword',
        newWalletPassphrase: 'myNewPassphrase',
        overrideEncryptedXprv: 'encryptedXprvString',
      };

      const acceptShareStub = sinon.stub().resolves(mockAcceptShareResponse);
      const mockWallets = {
        acceptShare: acceptShareStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/walletshare/${shareId}/acceptShare`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.ok(result.body);

      // Validate response structure
      const decodedResponse = assertDecode(AcceptShareResponse, result.body);
      assert.strictEqual(typeof decodedResponse.changed, 'boolean');
      assert.strictEqual(typeof decodedResponse.state, 'string');

      // Verify the method was called with correct params
      sinon.assert.calledOnce(acceptShareStub);
      const callArgs = acceptShareStub.firstCall.args[0];
      assert.strictEqual(callArgs.walletShareId, shareId);
      assert.strictEqual(callArgs.userPassword, requestBody.userPassword);
      assert.strictEqual(callArgs.newWalletPassphrase, requestBody.newWalletPassphrase);
      assert.strictEqual(callArgs.overrideEncryptedXprv, requestBody.overrideEncryptedXprv);
    });

    it('should successfully accept share with empty body', async function () {
      const requestBody = {};

      const acceptShareStub = sinon.stub().resolves(mockAcceptShareResponse);
      const mockWallets = {
        acceptShare: acceptShareStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/walletshare/${shareId}/acceptShare`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.ok(result.body);

      // Validate response structure
      assertDecode(AcceptShareResponse, result.body);

      sinon.assert.calledOnce(acceptShareStub);
      const callArgs = acceptShareStub.firstCall.args[0];
      assert.strictEqual(callArgs.walletShareId, shareId);
    });

    it('should successfully accept share with only userPassword', async function () {
      const requestBody = {
        userPassword: 'mySecurePassword',
      };

      const acceptShareStub = sinon.stub().resolves(mockAcceptShareResponse);
      const mockWallets = {
        acceptShare: acceptShareStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/walletshare/${shareId}/acceptShare`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.ok(result.body);

      // Validate response structure
      assertDecode(AcceptShareResponse, result.body);

      sinon.assert.calledOnce(acceptShareStub);
      const callArgs = acceptShareStub.firstCall.args[0];
      assert.strictEqual(callArgs.walletShareId, shareId);
      assert.strictEqual(callArgs.userPassword, requestBody.userPassword);
    });

    it('should successfully accept share with only newWalletPassphrase', async function () {
      const requestBody = {
        newWalletPassphrase: 'myNewPassphrase',
      };

      const acceptShareStub = sinon.stub().resolves(mockAcceptShareResponse);
      const mockWallets = {
        acceptShare: acceptShareStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/walletshare/${shareId}/acceptShare`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.ok(result.body);

      sinon.assert.calledOnce(acceptShareStub);
      const callArgs = acceptShareStub.firstCall.args[0];
      assert.strictEqual(callArgs.walletShareId, shareId);
      assert.strictEqual(callArgs.newWalletPassphrase, requestBody.newWalletPassphrase);
    });
  });

  describe('Error Handling Tests', function () {
    const agent = setupAgent();
    const shareId = 'share123456789abcdef';

    afterEach(function () {
      sinon.restore();
    });

    it('should return 400 for non-string optional fields', async function () {
      const requestBody = {
        userPassword: 12345, // Invalid type
      };

      const result = await agent
        .post(`/api/v1/walletshare/${shareId}/acceptShare`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 400);
      assert.ok(Array.isArray(result.body));
      assert.ok(result.body.length > 0);
    });

    it('should handle acceptShare method throwing error', async function () {
      const requestBody = {
        userPassword: 'wrongPassword',
      };

      const acceptShareStub = sinon.stub().rejects(new Error('Invalid password'));
      const mockWallets = {
        acceptShare: acceptShareStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/walletshare/${shareId}/acceptShare`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle share not found error', async function () {
      const requestBody = {
        newWalletPassphrase: 'myNewPassphrase',
      };

      const acceptShareStub = sinon.stub().rejects(new Error('Share not found'));
      const mockWallets = {
        acceptShare: acceptShareStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/walletshare/${shareId}/acceptShare`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle share already accepted error', async function () {
      const requestBody = {
        userPassword: 'myPassword',
      };

      const acceptShareStub = sinon.stub().rejects(new Error('Share already accepted'));
      const mockWallets = {
        acceptShare: acceptShareStub,
      };

      sinon.stub(BitGo.prototype, 'wallets').returns(mockWallets as any);

      const result = await agent
        .post(`/api/v1/walletshare/${shareId}/acceptShare`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });
});
