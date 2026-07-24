/**
 * @prettier
 */
import { expect } from 'chai';
import * as sinon from 'sinon';
import {
  calculateV4Preimage,
  calculateBodyHash,
  calculateV4RequestHmac,
  calculateV4RequestHeaders,
  calculateV4ResponsePreimage,
  verifyV4Response,
  getPathWithQuery,
  getMethod,
} from '../src/hmacv4';
import { sha256Hex, createHmacWithSha256, normalizeMethod, getTimestampSec } from '../src/util';

const MOCK_TIMESTAMP_SEC = 1761100000;
const MOCK_TIMESTAMP_MS = MOCK_TIMESTAMP_SEC * 1000;

describe('V4 HMAC Authentication', () => {
  let clock: sinon.SinonFakeTimers;

  before(() => {
    clock = sinon.useFakeTimers(MOCK_TIMESTAMP_MS);
  });

  after(() => {
    clock.restore();
  });

  describe('Helper Functions', () => {
    describe('sha256Hex', () => {
      it('should calculate correct SHA256 hash for string input', () => {
        const input = '{"address":"tb1qtest","amount":100000}';
        const hash = sha256Hex(input);

        expect(hash).to.be.a('string');
        expect(hash).to.have.lengthOf(64); // SHA256 produces 64 hex chars
        expect(hash).to.match(/^[0-9a-f]+$/); // Lowercase hex
      });

      it('should calculate correct SHA256 hash for Buffer input', () => {
        const input = Buffer.from('{"address":"tb1qtest","amount":100000}');
        const hash = sha256Hex(input);

        expect(hash).to.have.lengthOf(64);
        expect(hash).to.match(/^[0-9a-f]+$/);
      });

      it('should produce same hash for same content in string and Buffer', () => {
        const content = '{"test":"data"}';
        const hashFromString = sha256Hex(content);
        const hashFromBuffer = sha256Hex(Buffer.from(content));

        expect(hashFromString).to.equal(hashFromBuffer);
      });

      it('should produce empty string hash for empty input', () => {
        const emptyHash = sha256Hex('');
        // SHA256 of empty string is a known constant
        expect(emptyHash).to.equal('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      });
    });

    describe('normalizeMethod', () => {
      it('should convert lowercase methods to uppercase', () => {
        expect(normalizeMethod('get')).to.equal('GET');
        expect(normalizeMethod('post')).to.equal('POST');
        expect(normalizeMethod('put')).to.equal('PUT');
        expect(normalizeMethod('patch')).to.equal('PATCH');
        expect(normalizeMethod('delete')).to.equal('DELETE');
        expect(normalizeMethod('options')).to.equal('OPTIONS');
      });

      it('should handle legacy "del" method', () => {
        expect(normalizeMethod('del')).to.equal('DELETE');
        expect(normalizeMethod('DEL')).to.equal('DELETE');
      });

      it('should preserve already uppercase methods', () => {
        expect(normalizeMethod('POST')).to.equal('POST');
        expect(normalizeMethod('GET')).to.equal('GET');
      });
    });

    describe('getTimestampSec', () => {
      it('should return timestamp in seconds', () => {
        const ts = getTimestampSec();
        expect(ts).to.equal(MOCK_TIMESTAMP_SEC);
      });
    });
  });

  describe('calculateBodyHash', () => {
    it('should calculate SHA256 hash of request body', () => {
      const body = '{"address":"tb1qtest","amount":100000}';
      const hash = calculateBodyHash(body);

      expect(hash).to.have.lengthOf(64);
      expect(hash).to.match(/^[0-9a-f]+$/);
    });

    it('should handle Buffer input', () => {
      const body = Buffer.from('{"address":"tb1qtest","amount":100000}');
      const hash = calculateBodyHash(body);

      expect(hash).to.have.lengthOf(64);
    });

    it('should handle Uint8Array input (browser compatibility)', () => {
      const body = new Uint8Array(Buffer.from('{"address":"tb1qtest","amount":100000}'));
      const hash = calculateBodyHash(body);

      expect(hash).to.have.lengthOf(64);
      expect(hash).to.match(/^[0-9a-f]+$/);
    });

    it('should handle ArrayBuffer input (browser compatibility)', () => {
      const buffer = Buffer.from('{"address":"tb1qtest","amount":100000}');
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const hash = calculateBodyHash(arrayBuffer);

      expect(hash).to.have.lengthOf(64);
      expect(hash).to.match(/^[0-9a-f]+$/);
    });

    it('should produce consistent hash for same content', () => {
      const body = '{"test":"value"}';
      const hash1 = calculateBodyHash(body);
      const hash2 = calculateBodyHash(body);

      expect(hash1).to.equal(hash2);
    });

    it('should produce same hash for string, Buffer, Uint8Array, and ArrayBuffer', () => {
      const content = '{"test":"data"}';
      const hashFromString = calculateBodyHash(content);
      const hashFromBuffer = calculateBodyHash(Buffer.from(content));
      const hashFromUint8Array = calculateBodyHash(new Uint8Array(Buffer.from(content)));
      const buffer = Buffer.from(content);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const hashFromArrayBuffer = calculateBodyHash(arrayBuffer);

      expect(hashFromString).to.equal(hashFromBuffer);
      expect(hashFromString).to.equal(hashFromUint8Array);
      expect(hashFromString).to.equal(hashFromArrayBuffer);
    });
  });

  describe('calculateV4Preimage', () => {
    it('should build correct canonical preimage', () => {
      const preimage = calculateV4Preimage({
        timestampSec: 1761100000,
        method: 'post',
        pathWithQuery: '/v2/wallets/transfer?foo=bar',
        bodyHashHex: '0d5e3b7a8f9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
        authRequestId: '1b7a1d2b-7a2f-4e4b-a1f8-c2a5a0f84e3e',
      });

      const expectedPreimage =
        '1761100000\n' +
        'POST\n' +
        '/v2/wallets/transfer?foo=bar\n' +
        '0d5e3b7a8f9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e\n' +
        '1b7a1d2b-7a2f-4e4b-a1f8-c2a5a0f84e3e\n';

      expect(preimage).to.equal(expectedPreimage);
    });

    it('should normalize method to uppercase', () => {
      const preimage = calculateV4Preimage({
        timestampSec: 1761100000,
        method: 'post', // lowercase
        pathWithQuery: '/api/test',
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      });

      expect(preimage).to.include('\nPOST\n');
    });

    it('should handle legacy "del" method', () => {
      const preimage = calculateV4Preimage({
        timestampSec: 1761100000,
        method: 'del',
        pathWithQuery: '/api/test',
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      });

      expect(preimage).to.include('\nDELETE\n');
    });

    it('should include trailing newline', () => {
      const preimage = calculateV4Preimage({
        timestampSec: 1761100000,
        method: 'GET',
        pathWithQuery: '/api/test',
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      });

      expect(preimage.endsWith('\n')).to.be.true;
    });

    it('should have exactly 5 newlines (5 fields + trailing)', () => {
      const preimage = calculateV4Preimage({
        timestampSec: 1761100000,
        method: 'GET',
        pathWithQuery: '/api/test',
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      });

      const newlineCount = (preimage.match(/\n/g) || []).length;
      expect(newlineCount).to.equal(5);
    });

    it('should preserve query parameters in path', () => {
      const preimage = calculateV4Preimage({
        timestampSec: 1761100000,
        method: 'GET',
        pathWithQuery: '/api/v2/wallet?limit=10&offset=0',
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      });

      expect(preimage).to.include('/api/v2/wallet?limit=10&offset=0\n');
    });
  });

  describe('calculateV4RequestHmac', () => {
    it('should calculate HMAC for a request', () => {
      const hmac = calculateV4RequestHmac({
        timestampSec: 1761100000,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        bodyHashHex: 'abc123def456',
        authRequestId: '1b7a1d2b-7a2f-4e4b-a1f8-c2a5a0f84e3e',
        rawToken: 'test-raw-token',
      });

      expect(hmac).to.be.a('string');
      expect(hmac).to.have.lengthOf(64); // HMAC-SHA256 produces 64 hex chars
      expect(hmac).to.match(/^[0-9a-f]+$/);
    });

    it('should produce different HMACs for different raw tokens', () => {
      const baseOptions = {
        timestampSec: 1761100000,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      };

      const hmac1 = calculateV4RequestHmac({ ...baseOptions, rawToken: 'token1' });
      const hmac2 = calculateV4RequestHmac({ ...baseOptions, rawToken: 'token2' });

      expect(hmac1).to.not.equal(hmac2);
    });

    it('should produce different HMACs for different timestamps', () => {
      const baseOptions = {
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
        rawToken: 'test-key',
      };

      const hmac1 = calculateV4RequestHmac({ ...baseOptions, timestampSec: 1761100000 });
      const hmac2 = calculateV4RequestHmac({ ...baseOptions, timestampSec: 1761100001 });

      expect(hmac1).to.not.equal(hmac2);
    });

    it('should produce consistent HMAC for same inputs', () => {
      const options = {
        timestampSec: 1761100000,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
        rawToken: 'test-key',
      };

      const hmac1 = calculateV4RequestHmac(options);
      const hmac2 = calculateV4RequestHmac(options);

      expect(hmac1).to.equal(hmac2);
    });
  });

  describe('calculateV4RequestHeaders', () => {
    it('should generate all required headers', () => {
      const headers = calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        rawBody: '{"address":"tb1qtest"}',
        rawToken: 'test-raw-token',
        authRequestId: '1b7a1d2b-7a2f-4e4b-a1f8-c2a5a0f84e3e',
      });

      expect(headers).to.have.property('hmac');
      expect(headers).to.have.property('timestampSec');
      expect(headers).to.have.property('bodyHashHex');
      expect(headers).to.have.property('authRequestId');
    });

    it('should use current timestamp in seconds', () => {
      const headers = calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        rawBody: '{}',
        rawToken: 'test-key',
        authRequestId: 'req-123',
      });

      expect(headers.timestampSec).to.equal(MOCK_TIMESTAMP_SEC);
    });

    it('should calculate correct body hash from raw body', () => {
      const rawBody = '{"address":"tb1qtest"}';
      const expectedHash = sha256Hex(rawBody);

      const headers = calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        rawBody,
        rawToken: 'test-key',
        authRequestId: 'req-123',
      });

      expect(headers.bodyHashHex).to.equal(expectedHash);
    });

    it('should preserve authRequestId in headers', () => {
      const authRequestId = '1b7a1d2b-7a2f-4e4b-a1f8-c2a5a0f84e3e';

      const headers = calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        rawBody: '{}',
        rawToken: 'test-key',
        authRequestId,
      });

      expect(headers.authRequestId).to.equal(authRequestId);
    });

    it('should handle Buffer raw body', () => {
      const rawBody = Buffer.from('{"address":"tb1qtest"}');
      const expectedHash = sha256Hex(rawBody);

      const headers = calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        rawBody,
        rawToken: 'test-key',
        authRequestId: 'req-123',
      });

      expect(headers.bodyHashHex).to.equal(expectedHash);
    });

    it('should handle Uint8Array raw body (browser compatibility)', () => {
      const rawBody = new Uint8Array(Buffer.from('{"address":"tb1qtest"}'));
      const expectedHash = sha256Hex(rawBody);

      const headers = calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        rawBody,
        rawToken: 'test-key',
        authRequestId: 'req-123',
      });

      expect(headers.bodyHashHex).to.equal(expectedHash);
      expect(headers).to.have.property('hmac');
      expect(headers.hmac).to.have.lengthOf(64);
    });

    it('should handle ArrayBuffer raw body (browser compatibility)', () => {
      const buffer = Buffer.from('{"address":"tb1qtest"}');
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      const expectedHash = sha256Hex(arrayBuffer);

      const headers = calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        rawBody: arrayBuffer,
        rawToken: 'test-key',
        authRequestId: 'req-123',
      });

      expect(headers.bodyHashHex).to.equal(expectedHash);
      expect(headers).to.have.property('hmac');
      expect(headers.hmac).to.have.lengthOf(64);
    });
  });

  describe('calculateV4ResponsePreimage', () => {
    it('should include status code in response preimage', () => {
      const preimage = calculateV4ResponsePreimage({
        timestampSec: 1761100000,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      });

      const expectedPreimage =
        '1761100000\n' + 'POST\n' + '/v2/wallets/transfer\n' + '200\n' + 'abc123\n' + 'req-123\n';

      expect(preimage).to.equal(expectedPreimage);
    });

    it('should have exactly 6 newlines for response (6 fields + trailing)', () => {
      const preimage = calculateV4ResponsePreimage({
        timestampSec: 1761100000,
        method: 'GET',
        pathWithQuery: '/api/test',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      });

      const newlineCount = (preimage.match(/\n/g) || []).length;
      expect(newlineCount).to.equal(6);
    });
  });

  describe('verifyV4Response', () => {
    it('should verify valid response HMAC', () => {
      // First generate a valid HMAC
      const options = {
        timestampSec: MOCK_TIMESTAMP_SEC,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
        rawToken: 'test-key',
      };

      const preimage = calculateV4ResponsePreimage(options);
      const validHmac = createHmacWithSha256(options.rawToken, preimage);
      const result = verifyV4Response({
        ...options,
        hmac: validHmac,
      });

      expect(result.isValid).to.be.true;
      expect(result.isInResponseValidityWindow).to.be.true;
    });

    it('should reject invalid HMAC', () => {
      const result = verifyV4Response({
        timestampSec: MOCK_TIMESTAMP_SEC,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
        rawToken: 'test-key',
        hmac: 'invalid-hmac',
      });

      expect(result.isValid).to.be.false;
    });

    it('should reject timestamp outside backward validity window (5 min)', () => {
      const oldTimestamp = MOCK_TIMESTAMP_SEC - 6 * 60; // 6 minutes ago

      const preimage = calculateV4ResponsePreimage({
        timestampSec: oldTimestamp,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      });
      const validHmac = createHmacWithSha256('test-key', preimage);

      const result = verifyV4Response({
        timestampSec: oldTimestamp,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
        rawToken: 'test-key',
        hmac: validHmac,
      });

      expect(result.isValid).to.be.true; // HMAC is correct
      expect(result.isInResponseValidityWindow).to.be.false; // But timestamp is old
    });

    it('should reject timestamp outside forward validity window (1 min)', () => {
      const futureTimestamp = MOCK_TIMESTAMP_SEC + 2 * 60; // 2 minutes in future

      const preimage = calculateV4ResponsePreimage({
        timestampSec: futureTimestamp,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      });
      const validHmac = createHmacWithSha256('test-key', preimage);

      const result = verifyV4Response({
        timestampSec: futureTimestamp,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
        rawToken: 'test-key',
        hmac: validHmac,
      });

      expect(result.isValid).to.be.true;
      expect(result.isInResponseValidityWindow).to.be.false;
    });

    it('should accept timestamp within forward validity window', () => {
      const nearFutureTimestamp = MOCK_TIMESTAMP_SEC + 30; // 30 seconds in future

      const preimage = calculateV4ResponsePreimage({
        timestampSec: nearFutureTimestamp,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
      });
      const validHmac = createHmacWithSha256('test-key', preimage);

      const result = verifyV4Response({
        timestampSec: nearFutureTimestamp,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
        rawToken: 'test-key',
        hmac: validHmac,
      });

      expect(result.isValid).to.be.true;
      expect(result.isInResponseValidityWindow).to.be.true;
    });

    it('should return expected HMAC and preimage in result', () => {
      const options = {
        timestampSec: MOCK_TIMESTAMP_SEC,
        method: 'POST',
        pathWithQuery: '/v2/wallets/transfer',
        statusCode: 200,
        bodyHashHex: 'abc123',
        authRequestId: 'req-123',
        rawToken: 'test-key',
      };

      const expectedPreimage = calculateV4ResponsePreimage(options);
      const expectedHmac = createHmacWithSha256(options.rawToken, expectedPreimage);
      const result = verifyV4Response({
        ...options,
        hmac: expectedHmac,
      });

      expect(result.expectedHmac).to.equal(expectedHmac);
      expect(result.preimage).to.equal(expectedPreimage);
      expect(result.verificationTime).to.be.a('number');
    });
  });

  describe('Proxy Header Helpers', () => {
    describe('getPathWithQuery', () => {
      it('should return x-original-uri when provided', () => {
        const result = getPathWithQuery('/v2/wallets/transfer?foo=bar', '/internal/proxy');

        expect(result).to.equal('/v2/wallets/transfer?foo=bar');
      });

      it('should return request URL when x-original-uri is undefined', () => {
        const result = getPathWithQuery(undefined, '/api/v2/wallet');

        expect(result).to.equal('/api/v2/wallet');
      });
    });

    describe('getMethod', () => {
      it('should return x-original-method when provided', () => {
        const result = getMethod('POST', 'GET');

        expect(result).to.equal('POST');
      });

      it('should return request method when x-original-method is undefined', () => {
        const result = getMethod(undefined, 'DELETE');

        expect(result).to.equal('DELETE');
      });
    });
  });

  describe('Integration: Full Request Signing and Verification', () => {
    it('should successfully sign and verify a complete request-response cycle', () => {
      const rawToken = 'my-secret-signing-key';
      const rawRequestBody = Buffer.from('{"address":"tb1qtest","amount":100000}');
      const authRequestId = '550e8400-e29b-41d4-a716-446655440000';
      const pathWithQuery = '/v2/wallets/abc123/transfer?coin=btc';
      const method = 'POST';

      // Step 1: Client generates request headers
      const requestHeaders = calculateV4RequestHeaders({
        method,
        pathWithQuery,
        rawBody: rawRequestBody,
        rawToken,
        authRequestId,
      });

      expect(requestHeaders.timestampSec).to.equal(MOCK_TIMESTAMP_SEC);
      expect(requestHeaders.authRequestId).to.equal(authRequestId);

      // Step 2: Simulate server processing and response
      const responseBody = '{"txid":"abc123def456","status":"completed"}';
      const responseBodyHash = calculateBodyHash(responseBody);
      const statusCode = 200;

      // Step 3: Server generates response HMAC
      const responsePreimage = calculateV4ResponsePreimage({
        timestampSec: requestHeaders.timestampSec,
        method,
        pathWithQuery,
        statusCode,
        bodyHashHex: responseBodyHash,
        authRequestId,
      });
      const responseHmac = createHmacWithSha256(rawToken, responsePreimage);

      // Step 4: Client verifies response
      const verificationResult = verifyV4Response({
        hmac: responseHmac,
        timestampSec: requestHeaders.timestampSec,
        method,
        pathWithQuery,
        statusCode,
        bodyHashHex: responseBodyHash,
        authRequestId,
        rawToken,
      });

      expect(verificationResult.isValid).to.be.true;
      expect(verificationResult.isInResponseValidityWindow).to.be.true;
    });
  });
});
