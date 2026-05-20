import * as assert from 'assert';
import * as t from 'io-ts';
import {
  DeriveLocalKeyChainRequestBody,
  DeriveLocalKeyChainResponse,
  PostDeriveLocalKeyChain,
} from '../../../src/typedRoutes/api/v1/deriveLocalKeyChain';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('DeriveLocalKeyChain codec tests', function () {
  describe('DeriveLocalKeyChainRequestBody', function () {
    it('should validate body with required path and xprv', function () {
      const validBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const decoded = assertDecode(t.type(DeriveLocalKeyChainRequestBody), validBody);
      assert.strictEqual(decoded.path, validBody.path);
      assert.strictEqual(decoded.xprv, validBody.xprv);
      assert.strictEqual(decoded.xpub, undefined); // Optional field
    });

    it('should validate body with required path and xpub', function () {
      const validBody = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const decoded = assertDecode(t.type(DeriveLocalKeyChainRequestBody), validBody);
      assert.strictEqual(decoded.path, validBody.path);
      assert.strictEqual(decoded.xpub, validBody.xpub);
      assert.strictEqual(decoded.xprv, undefined); // Optional field
    });

    it('should reject body with missing path', function () {
      const invalidBody = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      assert.throws(() => {
        assertDecode(t.type(DeriveLocalKeyChainRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string path', function () {
      const invalidBody = {
        path: 123, // number instead of string
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      assert.throws(() => {
        assertDecode(t.type(DeriveLocalKeyChainRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xprv', function () {
      const invalidBody = {
        path: 'm/0/1',
        xprv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(DeriveLocalKeyChainRequestBody), invalidBody);
      });
    });

    it('should reject body with non-string xpub', function () {
      const invalidBody = {
        path: 'm/0/1',
        xpub: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(DeriveLocalKeyChainRequestBody), invalidBody);
      });
    });

    // Note: The validation that either xprv or xpub must be provided is handled by the implementation,
    // not by the io-ts codec, so we don't test for that here.
  });

  describe('DeriveLocalKeyChainResponse', function () {
    it('should validate response with all required fields', function () {
      const validResponse = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const decoded = assertDecode(DeriveLocalKeyChainResponse, validResponse);
      assert.strictEqual(decoded.path, validResponse.path);
      assert.strictEqual(decoded.xpub, validResponse.xpub);
      assert.strictEqual(decoded.xprv, undefined); // Optional field
      assert.strictEqual(decoded.ethAddress, undefined); // Optional field
    });

    it('should validate response with all fields including optional ones', function () {
      const validResponse = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        ethAddress: '0x1234567890123456789012345678901234567890',
      };

      const decoded = assertDecode(DeriveLocalKeyChainResponse, validResponse);
      assert.strictEqual(decoded.path, validResponse.path);
      assert.strictEqual(decoded.xpub, validResponse.xpub);
      assert.strictEqual(decoded.xprv, validResponse.xprv);
      assert.strictEqual(decoded.ethAddress, validResponse.ethAddress);
    });

    it('should reject response with missing path', function () {
      const invalidResponse = {
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with missing xpub', function () {
      const invalidResponse = {
        path: 'm/0/1',
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string path', function () {
      const invalidResponse = {
        path: 123, // number instead of string
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string xpub', function () {
      const invalidResponse = {
        path: 'm/0/1',
        xpub: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string xprv', function () {
      const invalidResponse = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        xprv: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string ethAddress', function () {
      const invalidResponse = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        ethAddress: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, invalidResponse);
      });
    });
  });

  describe('Edge cases', function () {
    it('should handle empty strings for string fields', function () {
      const body = {
        path: '',
        xprv: '',
      };

      const decoded = assertDecode(t.type(DeriveLocalKeyChainRequestBody), body);
      assert.strictEqual(decoded.path, '');
      assert.strictEqual(decoded.xprv, '');
    });

    it('should handle additional unknown properties', function () {
      const body = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(DeriveLocalKeyChainRequestBody)), body);
      assert.strictEqual(decoded.path, body.path);
      assert.strictEqual(decoded.xprv, body.xprv);
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });

  describe('PostDeriveLocalKeyChain route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostDeriveLocalKeyChain.path, '/api/v1/keychain/derive');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostDeriveLocalKeyChain.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostDeriveLocalKeyChain.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostDeriveLocalKeyChain.response[200]);
      assert.ok(PostDeriveLocalKeyChain.response[400]);
    });
  });

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    const mockDerivedResponse = {
      path: 'm/0/1',
      xpub: 'xpub6ASuArnXKPbfEVRpCesNx4P939HDXENHkksgxsVG1yNp9958A33qYoPiTN9QrJmWFa2jNLdK84bWmyqTSPGtApP8P7nHUYwxHPhqmzUyeFG',
      xprv: 'xprv9uSw6nTvnWzSd1VdDfcBgPJhJPBKreSgzB4qJKW59SePrYFTFVHhYZRtMjvH6Td21v6uFu7t6dCCEK5xo9fNf9kPwVyMcv5GnXGMBHqm2oS',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully derive a keychain from xprv', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(mockDerivedResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('path');
      result.body.should.have.property('xpub');
      result.body.should.have.property('xprv');
      assert.strictEqual(result.body.path, mockDerivedResponse.path);
      assert.strictEqual(result.body.xpub, mockDerivedResponse.xpub);
      assert.strictEqual(result.body.xprv, mockDerivedResponse.xprv);

      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
      assert.strictEqual(decodedResponse.path, mockDerivedResponse.path);
      assert.strictEqual(decodedResponse.xpub, mockDerivedResponse.xpub);
      assert.strictEqual(decodedResponse.xprv, mockDerivedResponse.xprv);

      assert.strictEqual(mockKeychains.deriveLocal.calledOnceWith(requestBody), true);
    });

    it('should successfully derive a keychain from xpub', async function () {
      const requestBody = {
        path: 'm/0/1',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const mockDerivedFromXpub = {
        path: 'm/0/1',
        xpub: 'xpub6ASuArnXKPbfEVRpCesNx4P939HDXENHkksgxsVG1yNp9958A33qYoPiTN9QrJmWFa2jNLdK84bWmyqTSPGtApP8P7nHUYwxHPhqmzUyeFG',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(mockDerivedFromXpub),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('path');
      result.body.should.have.property('xpub');
      assert.strictEqual(result.body.path, mockDerivedFromXpub.path);
      assert.strictEqual(result.body.xpub, mockDerivedFromXpub.xpub);
      assert.strictEqual(result.body.xprv, undefined); // No xprv when deriving from xpub

      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
      assert.strictEqual(decodedResponse.path, mockDerivedFromXpub.path);
      assert.strictEqual(decodedResponse.xpub, mockDerivedFromXpub.xpub);
    });

    it('should successfully derive a keychain with ethAddress', async function () {
      const requestBody = {
        path: "m/44'/60'/0'/0/0",
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockResponseWithEthAddress = {
        ...mockDerivedResponse,
        path: "m/44'/60'/0'/0/0",
        ethAddress: '0x1234567890123456789012345678901234567890',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(mockResponseWithEthAddress),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('ethAddress');
      assert.strictEqual(result.body.ethAddress, mockResponseWithEthAddress.ethAddress);

      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
      assert.strictEqual(decodedResponse.ethAddress, mockResponseWithEthAddress.ethAddress);
    });

    it('should derive keychain with hardened derivation path', async function () {
      const requestBody = {
        path: "m/44'/0'/0'",
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves({
          ...mockDerivedResponse,
          path: "m/44'/0'/0'",
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.path, "m/44'/0'/0'");

      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should derive keychain with deep derivation path', async function () {
      const requestBody = {
        path: "m/44'/0'/0'/0/0",
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves({
          ...mockDerivedResponse,
          path: "m/44'/0'/0'/0/0",
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.path, "m/44'/0'/0'/0/0");

      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
      assert.ok(decodedResponse);
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

    it('should handle deriveLocal() failure', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().rejects(new Error('Failed to derive keychain')),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle invalid derivation path error', async function () {
      const requestBody = {
        path: 'invalid/path',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().rejects(new Error('Invalid derivation path')),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle invalid xprv error', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'invalid-xprv',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().rejects(new Error('Invalid xprv')),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle invalid xpub error', async function () {
      const requestBody = {
        path: 'm/0/1',
        xpub: 'invalid-xpub',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().rejects(new Error('Invalid xpub')),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle keychains() method not available error', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      sinon.stub(BitGo.prototype, 'keychains').throws(new Error('Keychains method not available'));

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle SDK returning null or undefined', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(null),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with null, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, result.body);
      });
    });

    it('should reject request with missing path', async function () {
      const requestBody = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should reject request with invalid path type', async function () {
      const requestBody = {
        path: 123, // number instead of string
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should reject request with invalid xprv type', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 123, // number instead of string
      };

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should handle malformed JSON request', async function () {
      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      assert.ok(result.status >= 400);
    });

    it('should handle timeout error', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().rejects(new Error('Request timeout')),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle network error', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().rejects(new Error('Network error')),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });
  });

  // ==========================================
  // EDGE CASE TESTS
  // ==========================================

  describe('Edge Case Tests', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should handle root derivation path', async function () {
      const requestBody = {
        path: 'm',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves({
          path: 'm',
          xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should handle single level derivation path', async function () {
      const requestBody = {
        path: 'm/0',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves({
          path: 'm/0',
          xpub: 'xpub69H7F5d8KSRgmmdJg2KhpAK8SR3DjMwAdkxj3ZuxV27CprR9LgpeyGmXUbC6wb7ERfvrnKZjXoUmmDznezpbZb7ap6r1D3tgFxHmwMkQTPH',
          xprv: 'xprv9vHNqdQ8RYvg4YPFdYDHjV8VJgfZvG7r4NqxK7cQMqKZ8CgVh5R7FJtq8kbLY4nKhPcnEhXKxKX5g6Y2YcFjFhzQRjPbZhiFYTnQcGqqZgr',
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should handle very deep derivation path', async function () {
      const requestBody = {
        path: "m/44'/0'/0'/0/0/0/0/0",
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves({
          path: "m/44'/0'/0'/0/0/0/0/0",
          xpub: 'xpub6ASuArnXKPbfEVRpCesNx4P939HDXENHkksgxsVG1yNp9958A33qYoPiTN9QrJmWFa2jNLdK84bWmyqTSPGtApP8P7nHUYwxHPhqmzUyeFG',
          xprv: 'xprv9uSw6nTvnWzSd1VdDfcBgPJhJPBKreSgzB4qJKW59SePrYFTFVHhYZRtMjvH6Td21v6uFu7t6dCCEK5xo9fNf9kPwVyMcv5GnXGMBHqm2oS',
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should handle large index in derivation path', async function () {
      const requestBody = {
        path: 'm/2147483647',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves({
          path: 'm/2147483647',
          xpub: 'xpub69H7F5d8KSRgmmdJg2KhpAK8SR3DjMwAdkxj3ZuxV27CprR9LgpeyGmXUbC6wb7ERfvrnKZjXoUmmDznezpbZb7ap6r1D3tgFxHmwMkQTPH',
          xprv: 'xprv9vHNqdQ8RYvg4YPFdYDHjV8VJgfZvG7r4NqxK7cQMqKZ8CgVh5R7FJtq8kbLY4nKhPcnEhXKxKX5g6Y2YcFjFhzQRjPbZhiFYTnQcGqqZgr',
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should handle empty ethAddress', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves({
          path: 'm/0/1',
          xpub: 'xpub6ASuArnXKPbfEVRpCesNx4P939HDXENHkksgxsVG1yNp9958A33qYoPiTN9QrJmWFa2jNLdK84bWmyqTSPGtApP8P7nHUYwxHPhqmzUyeFG',
          xprv: 'xprv9uSw6nTvnWzSd1VdDfcBgPJhJPBKreSgzB4qJKW59SePrYFTFVHhYZRtMjvH6Td21v6uFu7t6dCCEK5xo9fNf9kPwVyMcv5GnXGMBHqm2oS',
          ethAddress: '',
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.ethAddress, '');

      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
      assert.strictEqual(decodedResponse.ethAddress, '');
    });

    it('should handle response with additional unexpected fields', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves({
          path: 'm/0/1',
          xpub: 'xpub6ASuArnXKPbfEVRpCesNx4P939HDXENHkksgxsVG1yNp9958A33qYoPiTN9QrJmWFa2jNLdK84bWmyqTSPGtApP8P7nHUYwxHPhqmzUyeFG',
          xprv: 'xprv9uSw6nTvnWzSd1VdDfcBgPJhJPBKreSgzB4qJKW59SePrYFTFVHhYZRtMjvH6Td21v6uFu7t6dCCEK5xo9fNf9kPwVyMcv5GnXGMBHqm2oS',
          unexpectedField: 'should be ignored',
          anotherField: 12345,
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      // Codec validation should still pass with required fields present
      const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, {
        path: result.body.path,
        xpub: result.body.xpub,
        xprv: result.body.xprv,
        ethAddress: result.body.ethAddress,
      });
      assert.ok(decodedResponse);
    });

    it('should handle multiple sequential requests', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves({
          path: 'm/0/1',
          xpub: 'xpub6ASuArnXKPbfEVRpCesNx4P939HDXENHkksgxsVG1yNp9958A33qYoPiTN9QrJmWFa2jNLdK84bWmyqTSPGtApP8P7nHUYwxHPhqmzUyeFG',
          xprv: 'xprv9uSw6nTvnWzSd1VdDfcBgPJhJPBKreSgzB4qJKW59SePrYFTFVHhYZRtMjvH6Td21v6uFu7t6dCCEK5xo9fNf9kPwVyMcv5GnXGMBHqm2oS',
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      // Test multiple sequential requests instead of parallel to avoid connection overload
      for (let i = 0; i < 3; i++) {
        const result = await agent
          .post('/api/v1/keychain/derive')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(DeriveLocalKeyChainResponse, result.body);
        assert.ok(decodedResponse);
      }

      // Verify deriveLocal was called multiple times
      assert.strictEqual(mockKeychains.deriveLocal.callCount, 3);
    });
  });

  // ==========================================
  // RESPONSE VALIDATION EDGE CASES
  // ==========================================

  describe('Response Validation Edge Cases', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });

    it('should reject response with missing path field', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const invalidResponse = {
        xpub: 'xpub6ASuArnXKPbfEVRpCesNx4P939HDXENHkksgxsVG1yNp9958A33qYoPiTN9QrJmWFa2jNLdK84bWmyqTSPGtApP8P7nHUYwxHPhqmzUyeFG',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, result.body);
      });
    });

    it('should reject response with missing xpub field', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const invalidResponse = {
        path: 'm/0/1',
        xprv: 'xprv9uSw6nTvnWzSd1VdDfcBgPJhJPBKreSgzB4qJKW59SePrYFTFVHhYZRtMjvH6Td21v6uFu7t6dCCEK5xo9fNf9kPwVyMcv5GnXGMBHqm2oS',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, result.body);
      });
    });

    it('should reject response with wrong type for path', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const invalidResponse = {
        path: 123, // number instead of string
        xpub: 'xpub6ASuArnXKPbfEVRpCesNx4P939HDXENHkksgxsVG1yNp9958A33qYoPiTN9QrJmWFa2jNLdK84bWmyqTSPGtApP8P7nHUYwxHPhqmzUyeFG',
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, result.body);
      });
    });

    it('should reject response with wrong type for xpub', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const invalidResponse = {
        path: 'm/0/1',
        xpub: 123, // number instead of string
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, result.body);
      });
    });

    it('should reject response with wrong type for xprv', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const invalidResponse = {
        path: 'm/0/1',
        xpub: 'xpub6ASuArnXKPbfEVRpCesNx4P939HDXENHkksgxsVG1yNp9958A33qYoPiTN9QrJmWFa2jNLdK84bWmyqTSPGtApP8P7nHUYwxHPhqmzUyeFG',
        xprv: 123, // number instead of string
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, result.body);
      });
    });

    it('should reject response with wrong type for ethAddress', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const invalidResponse = {
        path: 'm/0/1',
        xpub: 'xpub6ASuArnXKPbfEVRpCesNx4P939HDXENHkksgxsVG1yNp9958A33qYoPiTN9QrJmWFa2jNLdK84bWmyqTSPGtApP8P7nHUYwxHPhqmzUyeFG',
        ethAddress: 123, // number instead of string
      };

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, result.body);
      });
    });

    it('should reject response with empty object', async function () {
      const requestBody = {
        path: 'm/0/1',
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      };

      const invalidResponse = {};

      const mockKeychains = {
        deriveLocal: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/derive')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(DeriveLocalKeyChainResponse, result.body);
      });
    });
  });
});
