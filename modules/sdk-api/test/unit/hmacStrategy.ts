import 'should';
import nock from 'nock';
import { BitGoAPI } from '../../src/bitgoAPI';
import type {
  IHmacAuthStrategy,
  CalculateRequestHeadersOptions,
  RequestHeaders,
  VerifyResponseOptions,
  VerifyResponseInfo,
} from '@bitgo/sdk-hmac';
import assert from 'node:assert';

const TEST_TOKEN = 'v2x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefab';
const TEST_URI = 'https://app.example.local';

/**
 * Mock strategy that records calls and returns predictable values.
 */
class MockHmacAuthStrategy implements IHmacAuthStrategy {
  public calculateRequestHeadersCalls: CalculateRequestHeadersOptions[] = [];
  public verifyResponseCalls: VerifyResponseOptions[] = [];
  public calculateHMACCalls: Array<{ key: string; message: string }> = [];

  async calculateRequestHeaders(params: CalculateRequestHeadersOptions): Promise<RequestHeaders> {
    this.calculateRequestHeadersCalls.push(params);
    return {
      hmac: 'mock-hmac-value',
      timestamp: 1672531200000,
      tokenHash: 'mock-token-hash',
    };
  }

  async verifyResponse(params: VerifyResponseOptions): Promise<VerifyResponseInfo> {
    this.verifyResponseCalls.push(params);
    return {
      isValid: true,
      expectedHmac: 'mock-hmac-value',
      signatureSubject: 'mock-subject',
      isInResponseValidityWindow: true,
      verificationTime: Date.now(),
    };
  }

  async calculateHMAC(key: string, message: string): Promise<string> {
    this.calculateHMACCalls.push({ key, message });
    return 'mock-hmac-password';
  }
}

describe('BitGoAPI HMAC Strategy Injection', function () {
  afterEach(function () {
    nock.cleanAll();
  });

  describe('constructor', function () {
    it('should accept a custom hmacAuthStrategy', function () {
      const strategy = new MockHmacAuthStrategy();
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_URI,
        hmacAuthStrategy: strategy,
      });

      bitgo.should.be.ok();
    });

    it('should default to DefaultHmacAuthStrategy when none is provided', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_URI,
      });

      bitgo.should.be.ok();
    });
  });

  describe('request signing via strategy', function () {
    it('should use the custom strategy for HMAC header calculation', async function () {
      const strategy = new MockHmacAuthStrategy();
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_URI,
        accessToken: TEST_TOKEN,
        hmacAuthStrategy: strategy,
      });

      const scope = nock(TEST_URI)
        .get('/api/v2/wallet')
        .matchHeader('HMAC', 'mock-hmac-value')
        .matchHeader('Authorization', 'Bearer mock-token-hash')
        .matchHeader('Auth-Timestamp', '1672531200000')
        .reply(
          200,
          { wallets: [] },
          {
            hmac: 'response-hmac',
            timestamp: Date.now().toString(),
          }
        );

      await bitgo.get(bitgo.url('/wallet', 2)).result();

      strategy.calculateRequestHeadersCalls.length.should.equal(1);
      const call = strategy.calculateRequestHeadersCalls[0];
      call.token.should.equal(TEST_TOKEN);
      call.method.should.equal('get');

      scope.isDone().should.be.true();
    });

    it('should use the custom strategy for response verification', async function () {
      const strategy = new MockHmacAuthStrategy();
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_URI,
        accessToken: TEST_TOKEN,
        hmacAuthStrategy: strategy,
      });

      nock(TEST_URI).get('/api/v2/wallet').reply(
        200,
        { wallets: [] },
        {
          hmac: 'server-response-hmac',
          timestamp: Date.now().toString(),
        }
      );

      await bitgo.get(bitgo.url('/wallet', 2)).result();

      strategy.verifyResponseCalls.length.should.equal(1);
      const call = strategy.verifyResponseCalls[0];
      call.hmac.should.equal('server-response-hmac');
      assert(call.statusCode, 'statusCode is required');
      call.statusCode.should.equal(200);
    });
  });

  describe('password HMAC via strategy', function () {
    it('should use the custom strategy for password hashing in preprocessAuthenticationParams', async function () {
      const strategy = new MockHmacAuthStrategy();
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_URI,
        hmacAuthStrategy: strategy,
      });

      nock(TEST_URI)
        .post('/api/auth/v1/session')
        .reply(
          200,
          { access_token: TEST_TOKEN, user: { username: 'test@test.com' } },
          {
            hmac: 'resp-hmac',
            timestamp: Date.now().toString(),
          }
        );

      try {
        await bitgo.authenticate({
          username: 'test@test.com',
          password: 'mypassword',
        });
      } catch {
        // Authentication may fail for various reasons in this test context,
        // but we only care that the strategy was called for password HMAC.
      }

      strategy.calculateHMACCalls.length.should.be.greaterThan(0);
      const hmacCall = strategy.calculateHMACCalls[0];
      hmacCall.key.should.equal('test@test.com');
      hmacCall.message.should.equal('mypassword');
    });
  });
});
