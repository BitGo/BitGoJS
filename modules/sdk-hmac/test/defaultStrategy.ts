import { expect } from 'chai';
import * as sinon from 'sinon';
import { DefaultHmacAuthStrategy } from '../src/defaultStrategy';
import * as hmac from '../src/hmac';

const MOCK_TIMESTAMP = 1672531200000;

describe('DefaultHmacAuthStrategy', () => {
  let strategy: DefaultHmacAuthStrategy;
  let clock: sinon.SinonFakeTimers;

  before(() => {
    clock = sinon.useFakeTimers(MOCK_TIMESTAMP);
  });

  after(() => {
    clock.restore();
  });

  beforeEach(() => {
    strategy = new DefaultHmacAuthStrategy();
  });

  describe('calculateRequestHeaders', () => {
    it('should produce the same result as the sync calculateRequestHeaders', async () => {
      const params = {
        url: 'https://app.bitgo.com/api/v2/wallet',
        token: 'v2x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefab',
        method: 'get' as const,
        text: '',
        authVersion: 2 as const,
      };

      const syncResult = hmac.calculateRequestHeaders(params);
      const asyncResult = await strategy.calculateRequestHeaders(params);

      expect(asyncResult.hmac).to.equal(syncResult.hmac);
      expect(asyncResult.timestamp).to.equal(syncResult.timestamp);
      expect(asyncResult.tokenHash).to.equal(syncResult.tokenHash);
    });

    it('should produce correct headers for v3 auth with a body', async () => {
      const params = {
        url: 'https://app.bitgo.com/api/v2/wallet/send',
        token: 'v2x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefab',
        method: 'post' as const,
        text: '{"amount":100000}',
        authVersion: 3 as const,
      };

      const syncResult = hmac.calculateRequestHeaders(params);
      const asyncResult = await strategy.calculateRequestHeaders(params);

      expect(asyncResult.hmac).to.equal(syncResult.hmac);
      expect(asyncResult.tokenHash).to.equal(syncResult.tokenHash);
    });
  });

  describe('verifyResponse', () => {
    it('should produce the same result as the sync verifyResponse', async () => {
      const token = 'v2x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefab';
      const responseText = '{"status":"ok"}';
      const method = 'get' as const;
      const url = 'https://app.bitgo.com/api/v2/wallet';
      const authVersion = 2 as const;

      const syncHeaders = hmac.calculateRequestHeaders({
        url,
        token,
        method,
        text: '',
        authVersion,
      });

      const responseHmac = hmac.calculateHMAC(
        token,
        hmac.calculateHMACSubject({
          urlPath: url,
          text: responseText,
          timestamp: syncHeaders.timestamp,
          statusCode: 200,
          method,
          authVersion,
        })
      );

      const params = {
        url,
        hmac: responseHmac,
        statusCode: 200,
        text: responseText,
        timestamp: syncHeaders.timestamp,
        token,
        method,
        authVersion,
      };

      const syncResult = hmac.verifyResponse(params);
      const asyncResult = await strategy.verifyResponse(params);

      expect(asyncResult.isValid).to.equal(syncResult.isValid);
      expect(asyncResult.isValid).to.equal(true);
      expect(asyncResult.expectedHmac).to.equal(syncResult.expectedHmac);
      expect(asyncResult.isInResponseValidityWindow).to.equal(syncResult.isInResponseValidityWindow);
    });

    it('should reject an invalid HMAC', async () => {
      const result = await strategy.verifyResponse({
        url: 'https://app.bitgo.com/api/v2/wallet',
        hmac: 'invalid-hmac',
        statusCode: 200,
        text: '{"status":"ok"}',
        timestamp: MOCK_TIMESTAMP,
        token: 'v2x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefab',
        method: 'get',
        authVersion: 2,
      });

      expect(result.isValid).to.equal(false);
    });
  });

  describe('calculateHMAC', () => {
    it('should produce the same result as the sync calculateHMAC', async () => {
      const key = 'test-key';
      const message = 'test-message';

      const syncResult = hmac.calculateHMAC(key, message);
      const asyncResult = await strategy.calculateHMAC(key, message);

      expect(asyncResult).to.equal(syncResult);
    });
  });
});
