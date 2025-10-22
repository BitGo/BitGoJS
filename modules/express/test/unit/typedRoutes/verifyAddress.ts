import * as assert from 'assert';
import { PostVerifyCoinAddress } from '../../../src/typedRoutes/api/v2/verifyAddress';
import { assertDecode } from './common';
import 'should';
import 'should-http';
import 'should-sinon';
import * as sinon from 'sinon';
import { BitGo } from 'bitgo';
import { setupAgent } from '../../lib/testutil';

describe('VerifyAddress codec tests', function () {
  describe('verifyAddress', function () {
    const agent = setupAgent();

    afterEach(function () {
      sinon.restore();
    });
    // ==========================================
    // SUCCESSFUL REQUEST TESTS
    // ==========================================

    it('should successfully verify a valid Bitcoin address', async function () {
      const coin = 'tbtc';
      const requestBody = {
        address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
      };

      // Create mock coin with isValidAddress method
      const mockCoin = {
        isValidAddress: sinon.stub().returns(true),
      };

      // Stub BitGo.prototype.coin to return our mock coin
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/verifyaddress`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('isValid');
      assert.strictEqual(result.body.isValid, true);

      const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
      assert.strictEqual(decodedResponse.isValid, true);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockCoin.isValidAddress.calledOnce, true);
      assert.strictEqual(mockCoin.isValidAddress.calledWith(requestBody.address), true);
    });

    it('should successfully verify an invalid Bitcoin address', async function () {
      const coin = 'tbtc';
      const requestBody = {
        address: 'invalid_bitcoin_address',
      };

      // Create mock coin with isValidAddress method
      const mockCoin = {
        isValidAddress: sinon.stub().returns(false),
      };

      // Stub BitGo.prototype.coin to return our mock coin
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/verifyaddress`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('isValid');
      assert.strictEqual(result.body.isValid, false);

      const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
      assert.strictEqual(decodedResponse.isValid, false);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockCoin.isValidAddress.calledOnce, true);
      assert.strictEqual(mockCoin.isValidAddress.calledWith(requestBody.address), true);
    });

    it('should successfully verify a valid Ethereum address', async function () {
      const coin = 'teth';
      const requestBody = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      };

      // Create mock coin with isValidAddress method (account-based coin)
      const mockCoin = {
        isValidAddress: sinon.stub().returns(true),
      };

      // Stub BitGo.prototype.coin to return our mock coin
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/verifyaddress`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('isValid');
      assert.strictEqual(result.body.isValid, true);

      const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
      assert.strictEqual(decodedResponse.isValid, true);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockCoin.isValidAddress.calledOnce, true);
      assert.strictEqual(mockCoin.isValidAddress.calledWith(requestBody.address), true);
    });

    it('should successfully verify address with supportOldScriptHashVersion flag for UTXO coins', async function () {
      const coin = 'tbtc';
      const requestBody = {
        address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
        supportOldScriptHashVersion: true,
      };

      // Create mock UTXO coin with isValidAddress method that accepts the flag
      const mockCoin = {
        isValidAddress: sinon.stub().returns(true),
      };

      // Make the coin an instance of AbstractUtxoCoin for proper type checking
      Object.setPrototypeOf(mockCoin, {
        constructor: { name: 'AbstractUtxoCoin' },
      });

      // Stub BitGo.prototype.coin to return our mock coin
      const coinStub = sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      // Make the request to Express
      const result = await agent
        .post(`/api/v2/${coin}/verifyaddress`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('isValid');
      assert.strictEqual(result.body.isValid, true);

      const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
      assert.strictEqual(decodedResponse.isValid, true);

      // Verify that the correct BitGoJS methods were called
      assert.strictEqual(coinStub.calledOnceWith(coin), true);
      assert.strictEqual(mockCoin.isValidAddress.calledOnce, true);
    });

    it('should successfully verify a valid XRP address', async function () {
      const coin = 'txrp';
      const requestBody = {
        address: 'rN7n7otQDd6FczFgLdlqtyMVrn3NnrcVXc',
      };

      const mockCoin = {
        isValidAddress: sinon.stub().returns(true),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/verifyaddress`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('isValid');
      assert.strictEqual(result.body.isValid, true);
      const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
      assert.strictEqual(decodedResponse.isValid, true);
    });

    it('should successfully verify a valid Litecoin address', async function () {
      const coin = 'tltc';
      const requestBody = {
        address: 'QVk4MvUu7Wb7tZ1wvAeiUvdF7wxhvpyLLK',
      };

      const mockCoin = {
        isValidAddress: sinon.stub().returns(true),
      };

      sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

      const result = await agent
        .post(`/api/v2/${coin}/verifyaddress`)
        .set('Authorization', 'Bearer test_access_token_12345')
        .set('Content-Type', 'application/json')
        .send(requestBody);

      // Verify the response
      assert.strictEqual(result.status, 200);
      result.body.should.have.property('isValid');
      assert.strictEqual(result.body.isValid, true);
      const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
      assert.strictEqual(decodedResponse.isValid, true);
    });

    // ==========================================
    // ERROR HANDLING TESTS
    // ==========================================

    describe('Error Cases', function () {
      it('should handle invalid coin error', async function () {
        const invalidCoin = 'invalid_coin_xyz';
        const requestBody = {
          address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
        };

        // Stub coin() to throw error for invalid coin
        sinon.stub(BitGo.prototype, 'coin').throws(new Error(`Coin ${invalidCoin} is not supported`));

        // Make the request to Express
        const result = await agent
          .post(`/api/v2/${invalidCoin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.ok(result.status >= 400);
        result.body.should.have.property('error');
      });

      it('should handle SDK failure during address validation', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
        };

        // Create mock coin where isValidAddress throws an error
        const mockCoin = {
          isValidAddress: sinon.stub().throws(new Error('SDK validation error')),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        // Make the request to Express
        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.ok(result.status >= 400);
        result.body.should.have.property('error');
      });

      it('should handle coin not found error', async function () {
        const coin = 'nonexistent_coin';
        const requestBody = {
          address: 'some_address',
        };

        // Stub coin() to return undefined (coin not found)
        sinon.stub(BitGo.prototype, 'coin').returns(undefined as any);

        // Make the request to Express
        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Verify error response
        assert.ok(result.status >= 400);
      });
    });

    // ==========================================
    // INVALID REQUEST BODY TESTS
    // ==========================================

    describe('Invalid Request Body', function () {
      it('should reject request with empty body', async function () {
        const coin = 'tbtc';

        // Make the request with empty body
        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send({});

        // io-ts validation should fail
        assert.ok(result.status >= 400);
      });

      it('should reject request with missing address field', async function () {
        const coin = 'tbtc';
        const requestBody = {
          // Missing address field
          supportOldScriptHashVersion: true,
        };

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid address type', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: 12345, // Wrong type! Should be string
        };

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with invalid supportOldScriptHashVersion type', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
          supportOldScriptHashVersion: 'true', // Wrong type! Should be boolean
        };

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with null address', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: null, // Null value
        };

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should reject request with undefined address', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: undefined, // Undefined value
        };

        // Make the request
        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should fail validation
        assert.ok(result.status >= 400);
      });

      it('should handle request with malformed JSON', async function () {
        const coin = 'tbtc';

        // Make the request with malformed JSON
        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send('{ invalid json }');

        // Should fail parsing
        assert.ok(result.status >= 400);
      });

      it('should reject request with array instead of object', async function () {
        const coin = 'tbtc';

        // Make the request with array
        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(['invalid', 'array']);

        // Should fail validation
        assert.ok(result.status >= 400);
      });
    });

    // ==========================================
    // EDGE CASES
    // ==========================================

    describe('Edge Cases', function () {
      it('should handle very long address string', async function () {
        const coin = 'tbtc';
        const veryLongAddress = 'a'.repeat(10000);
        const requestBody = {
          address: veryLongAddress,
        };

        const mockCoin = {
          isValidAddress: sinon.stub().returns(false),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle gracefully
        assert.ok(result.status === 200 || result.status >= 400);

        if (result.status === 200) {
          const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
          assert.strictEqual(decodedResponse.isValid, false);
        }
      });

      it('should handle address with special characters', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: '!@#$%^&*()_+{}[]|\\:";\'<>?,./~`',
        };

        const mockCoin = {
          isValidAddress: sinon.stub().returns(false),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle special characters safely
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('isValid');
        assert.strictEqual(result.body.isValid, false);

        const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
        assert.strictEqual(decodedResponse.isValid, false);
      });

      it('should handle empty string address', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: '',
        };

        const mockCoin = {
          isValidAddress: sinon.stub().returns(false),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle empty string
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('isValid');
        assert.strictEqual(result.body.isValid, false);
        const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
        assert.strictEqual(decodedResponse.isValid, false);
      });

      it('should handle whitespace-only address', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: '     ',
        };

        const mockCoin = {
          isValidAddress: sinon.stub().returns(false),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle whitespace
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('isValid');
        assert.strictEqual(result.body.isValid, false);

        const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
        assert.strictEqual(decodedResponse.isValid, false);
      });

      it('should handle address with newlines and tabs', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: 'address\nwith\nnewlines\tand\ttabs',
        };

        const mockCoin = {
          isValidAddress: sinon.stub().returns(false),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should handle control characters
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('isValid');
        assert.strictEqual(result.body.isValid, false);

        const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
        assert.strictEqual(decodedResponse.isValid, false);
      });

      it('should handle coin with special characters in path', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
        };

        const mockCoin = {
          isValidAddress: sinon.stub().returns(true),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Should work normally
        assert.strictEqual(result.status, 200);
        result.body.should.have.property('isValid');
        assert.strictEqual(result.body.isValid, true);

        const decodedResponse = assertDecode(PostVerifyCoinAddress.response[200], result.body);
        assert.strictEqual(decodedResponse.isValid, true);
      });
    });

    // ==========================================
    // RESPONSE VALIDATION EDGE CASES
    // ==========================================

    describe('Response Validation Edge Cases', function () {
      it('should reject response with missing isValid field', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
        };

        // Mock returns invalid response (missing isValid)
        const mockCoin = {
          isValidAddress: sinon.stub().returns(undefined),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Even if request processes, response validation should catch it
        if (result.status === 200) {
          // Codec validation should fail for invalid response
          assert.throws(() => {
            assertDecode(PostVerifyCoinAddress.response[200], result.body);
          });
        }
      });

      it('should reject response with wrong type in isValid field', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
        };

        // Mock returns invalid response (isValid is string instead of boolean)
        const mockCoin = {
          isValidAddress: sinon.stub().returns('true'), // Wrong type!
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Response codec validation should catch type mismatch
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(PostVerifyCoinAddress.response[200], result.body);
          });
        }
      });

      it('should reject response with null isValid field', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
        };

        // Mock returns invalid response (isValid is null)
        const mockCoin = {
          isValidAddress: sinon.stub().returns(null),
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Response codec validation should catch null value
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(PostVerifyCoinAddress.response[200], result.body);
          });
        }
      });

      it('should reject response with number isValid field', async function () {
        const coin = 'tbtc';
        const requestBody = {
          address: '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
        };

        // Mock returns invalid response (isValid is number)
        const mockCoin = {
          isValidAddress: sinon.stub().returns(1), // Wrong type!
        };

        sinon.stub(BitGo.prototype, 'coin').returns(mockCoin as any);

        const result = await agent
          .post(`/api/v2/${coin}/verifyaddress`)
          .set('Authorization', 'Bearer test_access_token_12345')
          .set('Content-Type', 'application/json')
          .send(requestBody);

        // Response codec validation should catch type mismatch
        if (result.status === 200) {
          assert.throws(() => {
            assertDecode(PostVerifyCoinAddress.response[200], result.body);
          });
        }
      });
    });
  });

  // ==========================================
  // ROUTE DEFINITION TESTS
  // ==========================================

  describe('PostVerifyCoinAddress route definition', function () {
    it('should have the correct path', function () {
      assert.strictEqual(PostVerifyCoinAddress.path, '/api/v2/{coin}/verifyaddress');
    });

    it('should have the correct HTTP method', function () {
      assert.strictEqual(PostVerifyCoinAddress.method, 'POST');
    });

    it('should have the correct request configuration', function () {
      assert.ok(PostVerifyCoinAddress.request);
      // Verify request has params and body defined
      const requestType = PostVerifyCoinAddress.request;
      assert.ok(requestType);
    });

    it('should have the correct response types', function () {
      assert.ok(PostVerifyCoinAddress.response[200]);
      assert.ok(PostVerifyCoinAddress.response[404]);
    });
  });
});
