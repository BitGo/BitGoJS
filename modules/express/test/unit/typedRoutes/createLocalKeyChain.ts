import * as assert from 'assert';
import * as t from 'io-ts';
import {
  CreateLocalKeyChainRequestBody,
  CreateLocalKeyChainResponse,
  PostCreateLocalKeyChain,
} from '../../../src/typedRoutes/api/v1/createLocalKeyChain';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('CreateLocalKeyChain codec tests', function () {
  describe('CreateLocalKeyChainRequestBody', function () {
    it('should validate body with optional seed', function () {
      const validBody = {
        seed: 'some-seed-value',
      };

      const decoded = assertDecode(t.type(CreateLocalKeyChainRequestBody), validBody);
      assert.strictEqual(decoded.seed, validBody.seed);
    });

    it('should validate body with no parameters', function () {
      const validBody = {};

      const decoded = assertDecode(t.type(CreateLocalKeyChainRequestBody), validBody);
      assert.strictEqual(decoded.seed, undefined); // Optional field
    });

    it('should reject body with non-string seed', function () {
      const invalidBody = {
        seed: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(t.type(CreateLocalKeyChainRequestBody), invalidBody);
      });
    });
  });

  describe('CreateLocalKeyChainResponse', function () {
    it('should validate response with required xprv field', function () {
      const validResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const decoded = assertDecode(CreateLocalKeyChainResponse, validResponse);
      assert.strictEqual(decoded.xprv, validResponse.xprv);
      assert.strictEqual(decoded.xpub, validResponse.xpub);
    });

    it('should validate response with both xprv and xpub fields', function () {
      const validResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const decoded = assertDecode(CreateLocalKeyChainResponse, validResponse);
      assert.strictEqual(decoded.xprv, validResponse.xprv);
      assert.strictEqual(decoded.xpub, validResponse.xpub);
    });

    it('should reject response with missing xprv', function () {
      const invalidResponse = {
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should allow response with missing ethAddress (optional)', function () {
      const validResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const decoded = assertDecode(CreateLocalKeyChainResponse, validResponse);
      assert.strictEqual(decoded.xprv, validResponse.xprv);
      assert.strictEqual(decoded.xpub, validResponse.xpub);
    });

    it('should reject response with non-string xprv', function () {
      const invalidResponse = {
        xprv: 123, // number instead of string
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, invalidResponse);
      });
    });

    it('should reject response with non-string xpub', function () {
      const invalidResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        xpub: 123, // number instead of string
      };

      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, invalidResponse);
      });
    });
  });

  describe('Edge cases', function () {
    it('should handle empty strings for string fields', function () {
      const body = {
        seed: '',
      };

      const decoded = assertDecode(t.type(CreateLocalKeyChainRequestBody), body);
      assert.strictEqual(decoded.seed, '');
    });

    it('should handle additional unknown properties', function () {
      const body = {
        seed: 'some-seed-value',
        unknownProperty: 'some value',
      };

      // io-ts with t.exact() strips out additional properties
      const decoded = assertDecode(t.exact(t.type(CreateLocalKeyChainRequestBody)), body);
      assert.strictEqual(decoded.seed, body.seed);
      // @ts-expect-error - unknownProperty doesn't exist on the type
      assert.strictEqual(decoded.unknownProperty, undefined);
    });
  });
  describe('PostCreateLocalKeyChain route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostCreateLocalKeyChain.path, '/api/v1/keychain/local');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostCreateLocalKeyChain.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      // Verify the route is configured with a request property
      assert.ok(PostCreateLocalKeyChain.request);
    });

    it('should have the correct response types', function () {
      // Check that the response object has the expected status codes
      assert.ok(PostCreateLocalKeyChain.response[200]);
      assert.ok(PostCreateLocalKeyChain.response[400]);
    });
  });

  // ==========================================
  // SUPERTEST INTEGRATION TESTS
  // ==========================================

  describe('Supertest Integration Tests', function () {
    const agent = setupAgent();

    const mockKeychainResponse = {
      xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
      xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      ethAddress: '0x1234567890123456789012345678901234567890',
    };

    afterEach(function () {
      sinon.restore();
    });

    it('should successfully create a local keychain without seed', async function () {
      const requestBody = {};

      const mockKeychains = {
        create: sinon.stub().resolves(mockKeychainResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('xprv');
      result.body.should.have.property('xpub');
      assert.strictEqual(result.body.xprv, mockKeychainResponse.xprv);
      assert.strictEqual(result.body.xpub, mockKeychainResponse.xpub);

      const decodedResponse = assertDecode(CreateLocalKeyChainResponse, result.body);
      assert.strictEqual(decodedResponse.xprv, mockKeychainResponse.xprv);
      assert.strictEqual(decodedResponse.xpub, mockKeychainResponse.xpub);

      assert.strictEqual(mockKeychains.create.calledOnceWith({}), true);
    });

    it('should successfully create a local keychain with seed', async function () {
      const requestBody = {
        seed: 'custom-seed-value-for-testing',
      };

      const mockKeychains = {
        create: sinon.stub().resolves(mockKeychainResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('xprv');
      result.body.should.have.property('xpub');
      assert.strictEqual(result.body.xprv, mockKeychainResponse.xprv);
      assert.strictEqual(result.body.xpub, mockKeychainResponse.xpub);

      const decodedResponse = assertDecode(CreateLocalKeyChainResponse, result.body);
      assert.strictEqual(decodedResponse.xprv, mockKeychainResponse.xprv);

      assert.strictEqual(mockKeychains.create.calledOnceWith(requestBody), true);
    });

    it('should successfully create a local keychain with ethAddress', async function () {
      const requestBody = {};

      const mockResponseWithEthAddress = {
        ...mockKeychainResponse,
        ethAddress: '0x1234567890123456789012345678901234567890',
      };

      const mockKeychains = {
        create: sinon.stub().resolves(mockResponseWithEthAddress),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      result.body.should.have.property('xprv');
      result.body.should.have.property('xpub');
      result.body.should.have.property('ethAddress');
      assert.strictEqual(result.body.ethAddress, mockResponseWithEthAddress.ethAddress);

      const decodedResponse = assertDecode(CreateLocalKeyChainResponse, result.body);
      assert.strictEqual(decodedResponse.ethAddress, mockResponseWithEthAddress.ethAddress);
    });

    it('should create keychain with very long seed value', async function () {
      const requestBody = {
        seed: 'a'.repeat(1000), // Very long seed
      };

      const mockKeychains = {
        create: sinon.stub().resolves(mockKeychainResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.xprv, mockKeychainResponse.xprv);

      const decodedResponse = assertDecode(CreateLocalKeyChainResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should create keychain with hex seed value', async function () {
      const requestBody = {
        seed: '0123456789abcdef0123456789abcdef',
      };

      const mockKeychains = {
        create: sinon.stub().resolves(mockKeychainResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.xprv, mockKeychainResponse.xprv);

      const decodedResponse = assertDecode(CreateLocalKeyChainResponse, result.body);
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

    it('should handle keychains().create() failure', async function () {
      const requestBody = {};

      const mockKeychains = {
        create: sinon.stub().rejects(new Error('Failed to create keychain')),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle invalid seed error', async function () {
      const requestBody = {
        seed: 'invalid-seed',
      };

      const mockKeychains = {
        create: sinon.stub().rejects(new Error('Invalid seed')),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle keychains() method not available error', async function () {
      const requestBody = {};

      sinon.stub(BitGo.prototype, 'keychains').throws(new Error('Keychains method not available'));

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle SDK returning null or undefined', async function () {
      const requestBody = {};

      const mockKeychains = {
        create: sinon.stub().resolves(null),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with null, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, result.body);
      });
    });

    it('should reject request with invalid seed type', async function () {
      const requestBody = {
        seed: 123, // number instead of string
      };

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.ok(result.status >= 400);
    });

    it('should handle malformed JSON request', async function () {
      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      assert.ok(result.status >= 400);
    });

    it('should handle request with unknown fields', async function () {
      const requestBody = {
        seed: 'test-seed',
        unknownField: 'should be ignored',
      };

      const mockKeychains = {
        create: sinon.stub().resolves({
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
          xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Should succeed - extra fields are typically stripped by codec
      assert.strictEqual(result.status, 200);
    });

    it('should handle timeout error', async function () {
      const requestBody = {};

      const mockKeychains = {
        create: sinon.stub().rejects(new Error('Request timeout')),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 500);
      result.body.should.have.property('error');
    });

    it('should handle network error', async function () {
      const requestBody = {};

      const mockKeychains = {
        create: sinon.stub().rejects(new Error('Network error')),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
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

    it('should handle empty seed string', async function () {
      const requestBody = {
        seed: '',
      };

      const mockKeychains = {
        create: sinon.stub().resolves({
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
          xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(CreateLocalKeyChainResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should handle response with very long xprv/xpub', async function () {
      const requestBody = {};

      const longXprv = 'xprv' + 'a'.repeat(200);
      const longXpub = 'xpub' + 'b'.repeat(200);

      const mockKeychains = {
        create: sinon.stub().resolves({
          xprv: longXprv,
          xpub: longXpub,
          ethAddress: '0x1234567890123456789012345678901234567890',
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.xprv, longXprv);
      assert.strictEqual(result.body.xpub, longXpub);

      const decodedResponse = assertDecode(CreateLocalKeyChainResponse, result.body);
      assert.strictEqual(decodedResponse.xprv, longXprv);
    });

    it('should handle response with additional unexpected fields', async function () {
      const requestBody = {};

      const mockKeychains = {
        create: sinon.stub().resolves({
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
          xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
          unexpectedField: 'should be ignored',
          anotherField: 12345,
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      assert.strictEqual(result.status, 200);
      // Codec validation should still pass with required fields present
      const decodedResponse = assertDecode(CreateLocalKeyChainResponse, result.body);
      assert.ok(decodedResponse);
    });

    it('should handle multiple sequential requests', async function () {
      const requestBody = {};

      const mockKeychains = {
        create: sinon.stub().resolves({
          xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
          xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        }),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      // Test multiple sequential requests instead of parallel to avoid connection overload
      for (let i = 0; i < 3; i++) {
        const result = await agent
          .post('/api/v1/keychain/local')
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        assert.strictEqual(result.status, 200);
        const decodedResponse = assertDecode(CreateLocalKeyChainResponse, result.body);
        assert.ok(decodedResponse);
      }

      // Verify create was called multiple times
      assert.strictEqual(mockKeychains.create.callCount, 3);
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

    it('should reject response with missing xprv field', async function () {
      const requestBody = {};

      const invalidResponse = {
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const mockKeychains = {
        create: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, result.body);
      });
    });

    it('should allow response with missing ethAddress field (optional)', async function () {
      const requestBody = {};

      const validResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
        // ethAddress is optional, so missing it is valid
      };

      const mockKeychains = {
        create: sinon.stub().resolves(validResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // pub is optional, so this should pass
      assert.strictEqual(result.status, 200);
      const decodedResponse = assertDecode(CreateLocalKeyChainResponse, result.body);
      assert.strictEqual(decodedResponse.xprv, validResponse.xprv);
      assert.strictEqual(decodedResponse.xpub, validResponse.xpub);
    });

    it('should reject response with wrong type for xprv', async function () {
      const requestBody = {};

      const invalidResponse = {
        xprv: 123, // number instead of string
        xpub: 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8',
      };

      const mockKeychains = {
        create: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, result.body);
      });
    });

    it('should reject response with wrong type for xpub', async function () {
      const requestBody = {};

      const invalidResponse = {
        xprv: 'xprv9s21ZrQH143K3D8TXfvAJgHVfTEeQNW5Ys9wZtnUZkqPzFzSjbEJrWC1vZ4GnXCvR7rQL2UFX3RSuYeU9MrERm1XBvACow7c36vnz5iYyj2',
        xpub: 123, // number instead of string
      };

      const mockKeychains = {
        create: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, result.body);
      });
    });

    it('should reject response with empty object', async function () {
      const requestBody = {};

      const invalidResponse = {};

      const mockKeychains = {
        create: sinon.stub().resolves(invalidResponse),
      };

      sinon.stub(BitGo.prototype, 'keychains').returns(mockKeychains as any);

      const result = await agent
        .post('/api/v1/keychain/local')
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Framework returns 200 with invalid response, codec validation should fail
      assert.strictEqual(result.status, 200);
      assert.throws(() => {
        assertDecode(CreateLocalKeyChainResponse, result.body);
      });
    });
  });
});
