import { expect } from 'chai';
import * as sinon from 'sinon';
import {
  calculateHMAC,
  calculateHMACSubject,
  calculateRequestHMAC,
  calculateRequestHeaders,
  verifyResponse,
} from '../src/hmac';
import * as sjcl from '@bitgo/sjcl';

// Mock Date.now for consistent timestamp values
const MOCK_TIMESTAMP = 1672531200000; // Example timestamp (e.g., Jan 1, 2023, 00:00:00 UTC)

describe('HMAC Utility Functions', () => {
  let clock;

  before(() => {
    clock = sinon.useFakeTimers(MOCK_TIMESTAMP);
  });

  after(() => {
    clock.restore();
  });

  describe('calculateHMAC', () => {
    it('should calculate the correct HMAC for a given key and message', () => {
      const key = 'test-key';
      const message = 'test-message';
      const expectedHmac = 'f8c2bb87c17608c9038eab4e92ef2775e42629c939d6fd3390d42f80af6bb712';
      expect(calculateHMAC(key, message)).to.equal(expectedHmac);
    });
  });

  describe('calculateHMACSubject', () => {
    it('should calculate the correct subject for a request', () => {
      const expectedSubject = 'GET|1672531200000|3.0|/api/test?query=123|body-content';
      expect(
        calculateHMACSubject({
          urlPath: '/api/test?query=123',
          text: 'body-content',
          timestamp: MOCK_TIMESTAMP,
          method: 'get',
          authVersion: 3,
        })
      ).to.equal(expectedSubject);
    });

    it('should include statusCode for a response', () => {
      const expectedSubject = 'GET|1672531200000|/api/test|200|response-body';
      expect(
        calculateHMACSubject({
          urlPath: '/api/test',
          text: 'response-body',
          timestamp: MOCK_TIMESTAMP,
          statusCode: 200,
          method: 'get',
          authVersion: 3,
        })
      ).to.equal(expectedSubject);
    });
  });

  describe('calculateRequestHMAC', () => {
    it('should calculate the correct HMAC for a request', () => {
      const expectedHmac = '56b7c2bb722ebfa55600a0201af42ad5cd926340d9df5735005d91db452386d1';
      expect(
        calculateRequestHMAC({
          url: '/api/test',
          text: 'request-body',
          timestamp: MOCK_TIMESTAMP,
          token: 'test-token',
          method: 'post',
          authVersion: 3,
        })
      ).to.equal(expectedHmac);
    });
  });

  describe('calculateRequestHeaders', () => {
    it('should calculate the correct headers with HMAC', () => {
      const headers = calculateRequestHeaders({
        url: '/api/test',
        text: 'request-body',
        token: 'test-token',
        method: 'post',
        authVersion: 3,
      });
      const hashDigest = sjcl.hash.sha256.hash('test-token');
      const tokenHash = sjcl.codec.hex.fromBits(hashDigest);

      expect(headers).to.include({
        hmac: headers.hmac, // Verify hmac exists
        timestamp: MOCK_TIMESTAMP,
        tokenHash,
      });
    });
  });

  describe('verifyResponse', () => {
    it('should verify the HMAC and timestamp validity', () => {
      const result = verifyResponse({
        url: '/api/test',
        statusCode: 200,
        text: 'response-body',
        timestamp: MOCK_TIMESTAMP,
        token: 'test-token',
        hmac: 'a16c08b1fa8bff1e2e58d1831855e1745361f78bd6eb6e18b5b7ee17ae0a3bb7',
        method: 'post',
        authVersion: 3,
      });

      expect(result).to.include({
        isValid: true,
        expectedHmac: 'a16c08b1fa8bff1e2e58d1831855e1745361f78bd6eb6e18b5b7ee17ae0a3bb7',
        isInResponseValidityWindow: true,
      });
    });

    it('should return invalid if HMAC does not match', () => {
      const result = verifyResponse({
        url: '/api/test',
        statusCode: 200,
        text: 'response-body',
        timestamp: MOCK_TIMESTAMP,
        token: 'wrong-token',
        hmac: 'invalid-hmac',
        method: 'post',
        authVersion: 3,
      });

      expect(result.isValid).to.be.false;
    });

    it('should return invalid if timestamp is outside the validity window', () => {
      const result = verifyResponse({
        url: '/api/test',
        statusCode: 200,
        text: 'response-body',
        timestamp: MOCK_TIMESTAMP - 1000 * 60 * 10, // 10 minutes in the past
        token: 'test-token',
        hmac: '8f6a2d183e4c4f2bd2023202486e1651292c84573a31b3829d394f1763a6ec6c',
        method: 'post',
        authVersion: 3,
      });

      expect(result.isInResponseValidityWindow).to.be.false;
    });
  });
});
