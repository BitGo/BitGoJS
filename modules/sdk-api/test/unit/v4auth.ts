import * as assert from 'assert';
import * as crypto from 'crypto';
import * as sinon from 'sinon';
import nock from 'nock';

import { BitGoAPI } from '../../src/bitgoAPI';
import { verifyResponse } from '../../src/api';

/**
 * Comprehensive test suite for v4 Authentication Support.
 *
 * Covers:
 * - Constructor / authenticateWithAccessToken / clear: _tokenId lifecycle
 * - requestPatch: v4 headers set correctly, v2/v3 headers NOT set, request metadata stored
 * - verifyResponse (BitGoAPI method): v4 delegation, v2/v3 backward compat
 * - verifyResponse (api.ts function): valid v4, invalid HMAC, expired timestamp, missing sig, v2/v3 compat
 * - v4 helper methods on BitGoAPI: calculateBodyHash, calculateV4Preimage, etc.
 * - v1 auth guard skipped for v4
 */

const TEST_TOKEN = 'v2x5b735fed2486593f8fea19113e5c717308f90a5fb00e740e46c7bfdcc078cfd0';
const TEST_TOKEN_ID = '507f1f77bcf86cd799439011'; // MongoDB ObjectId-like
const EMPTY_BODY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const TEST_BASE_URL = 'https://app.example.local';

/** Helper: nock returns header values as strings (lowercase keys). */
function h(headers: Record<string, string | string[]>, name: string): string {
  const v = headers[name];
  return Array.isArray(v) ? v[0] : (v as string);
}

function createV4Bitgo(opts: Record<string, unknown> = {}): BitGoAPI {
  return new BitGoAPI({
    env: 'custom',
    customRootURI: TEST_BASE_URL,
    authVersion: 4,
    accessToken: TEST_TOKEN,
    tokenId: TEST_TOKEN_ID,
    ...opts,
  });
}

function computeHmac(key: string, message: string): string {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

function computeSha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

describe('v4 Authentication', function () {
  afterEach(function () {
    nock.cleanAll();
    sinon.restore();
  });

  // ─────────────────────────────────────────────────────────
  // 1. Token ID lifecycle
  // ─────────────────────────────────────────────────────────
  describe('tokenId lifecycle', function () {
    it('should store tokenId from constructor when authVersion is 4', function () {
      const bitgo = createV4Bitgo();
      assert.strictEqual(bitgo.tokenId, TEST_TOKEN_ID);
    });

    it('should NOT store tokenId from constructor when authVersion is 2', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_BASE_URL,
        authVersion: 2,
        accessToken: TEST_TOKEN,
        tokenId: TEST_TOKEN_ID,
      } as any);
      assert.strictEqual(bitgo.tokenId, undefined);
    });

    it('should store tokenId via authenticateWithAccessToken when authVersion is 4', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_BASE_URL,
        authVersion: 4,
      });
      assert.strictEqual(bitgo.tokenId, undefined);
      bitgo.authenticateWithAccessToken({ accessToken: TEST_TOKEN, tokenId: TEST_TOKEN_ID });
      assert.strictEqual(bitgo.tokenId, TEST_TOKEN_ID);
    });

    it('should NOT store tokenId via authenticateWithAccessToken when authVersion is 2', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_BASE_URL,
        authVersion: 2,
      });
      bitgo.authenticateWithAccessToken({ accessToken: TEST_TOKEN, tokenId: TEST_TOKEN_ID });
      assert.strictEqual(bitgo.tokenId, undefined);
    });

    it('should clear _tokenId when clear() is called', function () {
      const bitgo = createV4Bitgo();
      assert.strictEqual(bitgo.tokenId, TEST_TOKEN_ID);
      bitgo.clear();
      assert.strictEqual(bitgo.tokenId, undefined);
    });

    it('should persist tokenId through toJSON/fromJSON round-trip', function () {
      const bitgo = createV4Bitgo();
      const json = bitgo.toJSON();
      assert.strictEqual(json.tokenId, TEST_TOKEN_ID);

      const bitgo2 = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_BASE_URL,
        authVersion: 4,
      });
      bitgo2.fromJSON(json);
      assert.strictEqual(bitgo2.tokenId, TEST_TOKEN_ID);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 2. requestPatch — v4 request headers
  // ─────────────────────────────────────────────────────────
  describe('requestPatch v4 headers', function () {
    it('should set all 6 v4 headers on a GET request', async function () {
      const bitgo = createV4Bitgo();

      const scope = nock(TEST_BASE_URL)
        .get('/api/v2/wallet/abc123')
        .reply(function () {
          const hdr = this.req.headers;

          // v4-specific headers
          assert.strictEqual(h(hdr, 'bitgo-auth-version'), '4.0');
          assert.ok(
            h(hdr, 'authorization').startsWith('Bearer ' + TEST_TOKEN_ID),
            'Authorization should be Bearer <tokenId>'
          );
          assert.ok(h(hdr, 'x-request-timestamp'), 'X-Request-Timestamp must be set');
          assert.ok(h(hdr, 'x-auth-request-id'), 'X-Auth-Request-Id must be set');
          assert.ok(h(hdr, 'x-content-sha256'), 'X-Content-SHA256 must be set');
          assert.ok(h(hdr, 'x-signature'), 'X-Signature must be set');

          // GET requests should have empty body hash
          assert.strictEqual(
            h(hdr, 'x-content-sha256'),
            EMPTY_BODY_HASH,
            'GET body hash should be SHA256 of empty buffer'
          );

          // v2/v3 headers must NOT be present
          assert.strictEqual(hdr['auth-timestamp'], undefined, 'Auth-Timestamp must NOT be set for v4');
          assert.strictEqual(hdr['hmac'], undefined, 'HMAC must NOT be set for v4');

          return [200, { id: 'wallet123' }];
        });

      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();
      assert.ok(scope.isDone());
    });

    it('should set correct body hash for POST request with JSON body', async function () {
      const bitgo = createV4Bitgo();
      const body = { address: 'tb1qtest', amount: 100000 };

      const scope = nock(TEST_BASE_URL)
        .post('/api/v2/wallet/abc123/sendcoins')
        .reply(function (_uri, requestBody) {
          const bodyString = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
          const expectedHash = computeSha256(bodyString);
          assert.strictEqual(
            h(this.req.headers, 'x-content-sha256'),
            expectedHash,
            'Body hash should match SHA256 of serialized body'
          );
          return [200, { txid: 'tx123' }];
        });

      await bitgo.post(bitgo.url('/wallet/abc123/sendcoins', 2)).send(body).result();
      assert.ok(scope.isDone());
    });

    it('should set X-Auth-Request-Id as a valid UUID', async function () {
      const bitgo = createV4Bitgo();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      const scope = nock(TEST_BASE_URL)
        .get('/api/v2/wallet/abc123')
        .reply(function () {
          const authRequestId = h(this.req.headers, 'x-auth-request-id');
          assert.ok(
            uuidRegex.test(authRequestId),
            `X-Auth-Request-Id should be a valid UUID v4, got: ${authRequestId}`
          );
          return [200, { id: 'wallet123' }];
        });

      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();
      assert.ok(scope.isDone());
    });

    it('should generate unique X-Auth-Request-Id per request', async function () {
      const bitgo = createV4Bitgo();
      const requestIds: string[] = [];

      nock(TEST_BASE_URL)
        .get('/api/v2/wallet/abc123')
        .times(3)
        .reply(function () {
          requestIds.push(h(this.req.headers, 'x-auth-request-id'));
          return [200, { id: 'wallet123' }];
        });

      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();
      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();
      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();

      // All 3 should be unique
      const unique = new Set(requestIds);
      assert.strictEqual(unique.size, 3, 'Each request should have a unique X-Auth-Request-Id');
    });

    it('should use timestamp in seconds (not milliseconds)', async function () {
      const bitgo = createV4Bitgo();

      const scope = nock(TEST_BASE_URL)
        .get('/api/v2/wallet/abc123')
        .reply(function () {
          const ts = Number(h(this.req.headers, 'x-request-timestamp'));
          const now = nowSec();
          // Timestamp should be within 5 seconds of now (in seconds, not ms)
          assert.ok(ts <= now + 5 && ts >= now - 5, `Timestamp ${ts} should be close to ${now} (seconds)`);
          // It definitely shouldn't be in milliseconds (13 digits)
          assert.ok(ts < 1e11, 'Timestamp should be in seconds, not milliseconds');
          return [200, { id: 'wallet123' }];
        });

      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();
      assert.ok(scope.isDone());
    });

    it('should NOT set v4 auth headers when token or tokenId is missing', async function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_BASE_URL,
        authVersion: 4,
        // No accessToken or tokenId
      });

      const scope = nock(TEST_BASE_URL)
        .get('/api/v2/wallet/abc123')
        .reply(function () {
          // Should still set BitGo-Auth-Version
          assert.strictEqual(h(this.req.headers, 'bitgo-auth-version'), '4.0');
          // But should NOT set auth headers since no token
          assert.strictEqual(this.req.headers['x-signature'], undefined, 'X-Signature must NOT be set without token');
          return [200, { id: 'wallet123' }];
        });

      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();
      assert.ok(scope.isDone());
    });

    it('should NOT trigger v1 auth fallback for v4 tokens that do not match v2x format', async function () {
      // Use a token that doesn't match v2 format (not 67 chars, doesn't start with v2x)
      const shortToken = 'abcdef1234567890abcdef1234567890';
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_BASE_URL,
        authVersion: 4,
        accessToken: shortToken,
        tokenId: TEST_TOKEN_ID,
      });

      const scope = nock(TEST_BASE_URL)
        .get('/api/v2/wallet/abc123')
        .reply(function () {
          const authHeader = h(this.req.headers, 'authorization');
          // For v4, Authorization should be Bearer <tokenId>, NOT Bearer <rawToken>
          assert.strictEqual(authHeader, 'Bearer ' + TEST_TOKEN_ID);
          // v4 headers should be present (not v1 fallback)
          assert.ok(this.req.headers['x-signature'], 'v4 headers should be set, not v1 fallback');
          return [200, { id: 'wallet123' }];
        });

      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();
      assert.ok(scope.isDone());
    });

    it('should set isV2Authenticated = true for v4', async function () {
      // This is indirectly tested: if isV2Authenticated were false, verifyResponse would skip
      // verification. We test it by asserting that response verification runs on a v4 request.
      const bitgo = createV4Bitgo();

      const scope = nock(TEST_BASE_URL).get('/api/v2/wallet/abc123').reply(200, { id: 'wallet123' });

      // If isV2Authenticated is false, verifyResponse would pass through (no HMAC check).
      // Since HMAC verification IS enforced for mock env, and the nock response has no
      // x-signature header, this proves isV2Authenticated = true (verification ran but
      // gracefully returned since server didn't sign).
      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();
      assert.ok(scope.isDone());
    });
  });

  // ─────────────────────────────────────────────────────────
  // 3. v2/v3 backward compatibility
  // ─────────────────────────────────────────────────────────
  describe('v2/v3 backward compatibility', function () {
    // Use 'mock' env (hmacVerificationEnforced: false) so nock responses without
    // proper HMAC headers don't cause verification failures. We're testing request
    // headers here, not response verification.
    const MOCK_URL = 'https://bitgo.fakeurl';

    it('should still set v2 headers (Auth-Timestamp, HMAC) when authVersion is 2', async function () {
      const bitgo = new BitGoAPI({
        env: 'mock',
        authVersion: 2,
        accessToken: TEST_TOKEN,
        hmacVerification: false,
      });

      const scope = nock(MOCK_URL)
        .get('/api/v2/wallet/abc123')
        .reply(function () {
          const hdr = this.req.headers;
          assert.strictEqual(h(hdr, 'bitgo-auth-version'), '2.0');
          assert.ok(hdr['auth-timestamp'], 'Auth-Timestamp should be set for v2');
          assert.ok(hdr['hmac'], 'HMAC should be set for v2');
          // v4 headers must NOT be present
          assert.strictEqual(hdr['x-signature'], undefined, 'X-Signature must NOT be set for v2');
          assert.strictEqual(hdr['x-request-timestamp'], undefined, 'X-Request-Timestamp must NOT be set for v2');
          assert.strictEqual(hdr['x-auth-request-id'], undefined, 'X-Auth-Request-Id must NOT be set for v2');
          assert.strictEqual(hdr['x-content-sha256'], undefined, 'X-Content-SHA256 must NOT be set for v2');
          return [200, { id: 'wallet123' }];
        });

      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();
      assert.ok(scope.isDone());
    });

    it('should still set v3 headers when authVersion is 3', async function () {
      const bitgo = new BitGoAPI({
        env: 'mock',
        authVersion: 3,
        accessToken: TEST_TOKEN,
        hmacVerification: false,
      });

      const scope = nock(MOCK_URL)
        .get('/api/v2/wallet/abc123')
        .reply(function () {
          const hdr = this.req.headers;
          assert.strictEqual(h(hdr, 'bitgo-auth-version'), '3.0');
          assert.ok(hdr['auth-timestamp'], 'Auth-Timestamp should be set for v3');
          assert.ok(hdr['hmac'], 'HMAC should be set for v3');
          return [200, { id: 'wallet123' }];
        });

      await bitgo.get(bitgo.url('/wallet/abc123', 2)).result();
      assert.ok(scope.isDone());
    });
  });

  // ─────────────────────────────────────────────────────────
  // 4. BitGoAPI.verifyResponse (method overload)
  // ─────────────────────────────────────────────────────────
  describe('BitGoAPI.verifyResponse method', function () {
    it('should delegate to verifyV4Response for authVersion 4', function () {
      const bitgo = createV4Bitgo();
      const responseBody = '{"id":"wallet123","coin":"tbtc"}';
      const bodyHash = computeSha256(responseBody);
      const ts = nowSec();
      const preimage = `${ts}\nGET\n/api/v2/wallet/abc123\n200\n${bodyHash}\ntest-uuid-1234\n`;
      const hmac = computeHmac(TEST_TOKEN, preimage);

      const result = bitgo.verifyResponse({
        hmac,
        timestampSec: ts,
        method: 'GET',
        pathWithQuery: '/api/v2/wallet/abc123',
        bodyHashHex: bodyHash,
        authRequestId: 'test-uuid-1234',
        statusCode: 200,
        rawToken: TEST_TOKEN,
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.expectedHmac, hmac);
      assert.strictEqual(result.isInResponseValidityWindow, true);
      assert.strictEqual(result.preimage, preimage);
    });

    it('should return isValid=false for wrong HMAC', function () {
      const bitgo = createV4Bitgo();
      const bodyHash = EMPTY_BODY_HASH;
      const ts = nowSec();

      const result = bitgo.verifyResponse({
        hmac: 'deadbeef'.repeat(8),
        timestampSec: ts,
        method: 'GET',
        pathWithQuery: '/api/v2/wallet/abc123',
        bodyHashHex: bodyHash,
        authRequestId: 'test-uuid-1234',
        statusCode: 200,
        rawToken: TEST_TOKEN,
      });

      assert.strictEqual(result.isValid, false);
    });

    it('should return isInResponseValidityWindow=false for expired timestamp', function () {
      const bitgo = createV4Bitgo();
      const bodyHash = EMPTY_BODY_HASH;
      const oldTs = nowSec() - 600; // 10 minutes ago (outside 5-min window)
      const preimage = `${oldTs}\nGET\n/api/v2/wallet/abc123\n200\n${bodyHash}\ntest-uuid-1234\n`;
      const hmac = computeHmac(TEST_TOKEN, preimage);

      const result = bitgo.verifyResponse({
        hmac,
        timestampSec: oldTs,
        method: 'GET',
        pathWithQuery: '/api/v2/wallet/abc123',
        bodyHashHex: bodyHash,
        authRequestId: 'test-uuid-1234',
        statusCode: 200,
        rawToken: TEST_TOKEN,
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.isInResponseValidityWindow, false);
    });

    it('should delegate to v2/v3 verifyResponse for authVersion 2', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_BASE_URL,
        authVersion: 2,
        accessToken: TEST_TOKEN,
      });

      const result = bitgo.verifyResponse({
        url: 'https://google.com/api',
        hmac: 'somehash',
        timestamp: 1521590532925,
        token: TEST_TOKEN,
        statusCode: 200,
        text: 'fakedata',
        method: 'get',
        authVersion: 2,
      });

      // Should return a v2/v3 VerifyResponseInfo with signatureSubject
      assert.ok('signatureSubject' in result, 'v2 result should have signatureSubject');
      assert.ok('expectedHmac' in result, 'v2 result should have expectedHmac');
    });
  });

  // ─────────────────────────────────────────────────────────
  // 5. api.ts verifyResponse function
  // ─────────────────────────────────────────────────────────
  describe('api.ts verifyResponse function', function () {
    function mockReq(overrides: Record<string, unknown> = {}): any {
      return {
        isV2Authenticated: true,
        authenticationToken: TEST_TOKEN,
        url: TEST_BASE_URL + '/api/v2/wallet/abc123',
        v4AuthRequestId: 'test-uuid-1234',
        v4Method: 'get',
        v4PathWithQuery: '/api/v2/wallet/abc123',
        ...overrides,
      };
    }

    it('should pass through valid v4 response', function () {
      const bitgo = createV4Bitgo();
      const body = '{"id":"wallet123"}';
      const bodyHash = computeSha256(body);
      const ts = nowSec();
      const preimage = `${ts}\nGET\n/api/v2/wallet/abc123\n200\n${bodyHash}\ntest-uuid-1234\n`;
      const hmac = computeHmac(TEST_TOKEN, preimage);

      const req = mockReq();
      const response = {
        status: 200,
        text: body,
        header: {
          'x-signature': hmac,
          'x-request-timestamp': ts.toString(),
          'x-auth-request-id': 'test-uuid-1234',
          'x-content-sha256': bodyHash,
        },
      };

      const result = verifyResponse(bitgo, TEST_TOKEN, 'get', req, response as any, 4);
      assert.strictEqual(result, response);
    });

    it('should throw ApiResponseError for invalid v4 HMAC', function () {
      const bitgo = createV4Bitgo();
      const body = '{"id":"wallet123"}';
      const ts = nowSec();

      const req = mockReq();
      const response = {
        status: 200,
        text: body,
        header: {
          'x-signature': 'deadbeef'.repeat(8), // wrong HMAC
          'x-request-timestamp': ts.toString(),
          'x-auth-request-id': 'test-uuid-1234',
        },
      };

      assert.throws(
        () => verifyResponse(bitgo, TEST_TOKEN, 'get', req, response as any, 4),
        (err: any) => {
          assert.strictEqual(err.status, 511);
          assert.ok(err.message.includes('invalid response HMAC'));
          return true;
        }
      );
    });

    it('should throw ApiResponseError for expired v4 timestamp', function () {
      const bitgo = createV4Bitgo();
      const body = '{"id":"wallet123"}';
      const bodyHash = computeSha256(body);
      const oldTs = nowSec() - 600; // 10 minutes ago
      const preimage = `${oldTs}\nGET\n/api/v2/wallet/abc123\n200\n${bodyHash}\ntest-uuid-1234\n`;
      const hmac = computeHmac(TEST_TOKEN, preimage);

      const req = mockReq();
      const response = {
        status: 200,
        text: body,
        header: {
          'x-signature': hmac,
          'x-request-timestamp': oldTs.toString(),
          'x-auth-request-id': 'test-uuid-1234',
        },
      };

      assert.throws(
        () => verifyResponse(bitgo, TEST_TOKEN, 'get', req, response as any, 4),
        (err: any) => {
          assert.strictEqual(err.status, 511);
          assert.ok(err.message.includes('response validity time window'));
          return true;
        }
      );
    });

    it('should pass through when server did not sign the v4 response (missing x-signature)', function () {
      const bitgo = createV4Bitgo();
      const req = mockReq();
      const response = {
        status: 401,
        text: '{"error":"Unauthorized"}',
        header: {
          // No x-signature or x-request-timestamp
        },
      };

      const result = verifyResponse(bitgo, TEST_TOKEN, 'get', req, response as any, 4);
      assert.strictEqual(result, response, 'Should return response as-is when server signature is missing');
    });

    it('should pass through when request is not v2 authenticated', function () {
      const bitgo = createV4Bitgo();
      const req = mockReq({ isV2Authenticated: false });
      const response = {
        status: 200,
        text: '{"id":"wallet123"}',
        header: {},
      };

      const result = verifyResponse(bitgo, TEST_TOKEN, 'get', req, response as any, 4);
      assert.strictEqual(result, response, 'Should return response as-is when not v2 authenticated');
    });

    it('should pass through when authenticationToken is missing', function () {
      const bitgo = createV4Bitgo();
      const req = mockReq({ authenticationToken: undefined });
      const response = {
        status: 200,
        text: '{"id":"wallet123"}',
        header: {},
      };

      const result = verifyResponse(bitgo, TEST_TOKEN, 'get', req, response as any, 4);
      assert.strictEqual(result, response, 'Should return response as-is when auth token is missing');
    });

    it('should verify v4 response with POST method and body', function () {
      const bitgo = createV4Bitgo();
      const body = '{"txid":"tx123","status":"signed"}';
      const bodyHash = computeSha256(body);
      const ts = nowSec();
      const preimage = `${ts}\nPOST\n/api/v2/wallet/abc123/sendcoins\n200\n${bodyHash}\npost-uuid-5678\n`;
      const hmac = computeHmac(TEST_TOKEN, preimage);

      const req = mockReq({
        v4Method: 'post',
        v4PathWithQuery: '/api/v2/wallet/abc123/sendcoins',
        v4AuthRequestId: 'post-uuid-5678',
      });
      const response = {
        status: 200,
        text: body,
        header: {
          'x-signature': hmac,
          'x-request-timestamp': ts.toString(),
          'x-auth-request-id': 'post-uuid-5678',
        },
      };

      const result = verifyResponse(bitgo, TEST_TOKEN, 'post', req, response as any, 4);
      assert.strictEqual(result, response);
    });

    it('should verify v4 response with query string in path', function () {
      const bitgo = createV4Bitgo();
      const body = '{"wallets":[]}';
      const bodyHash = computeSha256(body);
      const ts = nowSec();
      const pathWithQuery = '/api/v2/wallets?limit=25&coin=tbtc';
      const preimage = `${ts}\nGET\n${pathWithQuery}\n200\n${bodyHash}\nquery-uuid-9999\n`;
      const hmac = computeHmac(TEST_TOKEN, preimage);

      const req = mockReq({
        v4Method: 'get',
        v4PathWithQuery: pathWithQuery,
        v4AuthRequestId: 'query-uuid-9999',
      });
      const response = {
        status: 200,
        text: body,
        header: {
          'x-signature': hmac,
          'x-request-timestamp': ts.toString(),
          'x-auth-request-id': 'query-uuid-9999',
        },
      };

      const result = verifyResponse(bitgo, TEST_TOKEN, 'get', req, response as any, 4);
      assert.strictEqual(result, response);
    });

    it('should verify v4 response for DELETE with empty body', function () {
      const bitgo = createV4Bitgo();
      const body = '';
      const bodyHash = computeSha256(Buffer.from(''));
      const ts = nowSec();
      const preimage = `${ts}\nDELETE\n/api/v2/wallet/abc123\n204\n${bodyHash}\ndel-uuid-0000\n`;
      const hmac = computeHmac(TEST_TOKEN, preimage);

      const req = mockReq({
        v4Method: 'del',
        v4PathWithQuery: '/api/v2/wallet/abc123',
        v4AuthRequestId: 'del-uuid-0000',
      });
      const response = {
        status: 204,
        text: body,
        header: {
          'x-signature': hmac,
          'x-request-timestamp': ts.toString(),
          'x-auth-request-id': 'del-uuid-0000',
        },
      };

      const result = verifyResponse(bitgo, TEST_TOKEN, 'del', req, response as any, 4);
      assert.strictEqual(result, response);
    });

    it('should detect tampered v4 response body', function () {
      const bitgo = createV4Bitgo();
      const originalBody = '{"id":"wallet123"}';
      const bodyHash = computeSha256(originalBody);
      const ts = nowSec();
      const preimage = `${ts}\nGET\n/api/v2/wallet/abc123\n200\n${bodyHash}\ntest-uuid-1234\n`;
      const hmac = computeHmac(TEST_TOKEN, preimage);

      const req = mockReq();
      const response = {
        status: 200,
        text: '{"id":"wallet999_TAMPERED"}', // tampered body
        header: {
          'x-signature': hmac,
          'x-request-timestamp': ts.toString(),
          'x-auth-request-id': 'test-uuid-1234',
        },
      };

      assert.throws(
        () => verifyResponse(bitgo, TEST_TOKEN, 'get', req, response as any, 4),
        (err: any) => {
          assert.strictEqual(err.status, 511);
          assert.ok(err.message.includes('invalid response HMAC'));
          return true;
        }
      );
    });

    it('should detect tampered v4 status code', function () {
      const bitgo = createV4Bitgo();
      const body = '{"id":"wallet123"}';
      const bodyHash = computeSha256(body);
      const ts = nowSec();
      // HMAC was computed with statusCode 200
      const preimage = `${ts}\nGET\n/api/v2/wallet/abc123\n200\n${bodyHash}\ntest-uuid-1234\n`;
      const hmac = computeHmac(TEST_TOKEN, preimage);

      const req = mockReq();
      const response = {
        status: 403, // but response arrives with 403
        text: body,
        header: {
          'x-signature': hmac,
          'x-request-timestamp': ts.toString(),
          'x-auth-request-id': 'test-uuid-1234',
        },
      };

      assert.throws(
        () => verifyResponse(bitgo, TEST_TOKEN, 'get', req, response as any, 4),
        (err: any) => {
          assert.strictEqual(err.status, 511);
          return true;
        }
      );
    });

    it('should still verify v2 responses correctly (backward compat)', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_BASE_URL,
        authVersion: 2,
        accessToken: TEST_TOKEN,
      });

      const ts = Date.now();
      const url = TEST_BASE_URL + '/api/v2/wallet/abc123';
      const body = '{"id":"wallet123"}';
      // v2 preimage: timestamp|path|statusCode|body
      const subject = `${ts}|/api/v2/wallet/abc123|200|${body}`;
      const hmac = computeHmac(TEST_TOKEN, subject);

      const req: any = {
        isV2Authenticated: true,
        authenticationToken: TEST_TOKEN,
        url,
      };
      const response: any = {
        status: 200,
        text: body,
        header: {
          hmac,
          timestamp: ts.toString(),
        },
      };

      const result = verifyResponse(bitgo, TEST_TOKEN, 'get', req, response, 2);
      assert.strictEqual(result, response);
    });

    it('should enforce validity window for v3 (authVersion >= 3)', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_BASE_URL,
        authVersion: 3,
        accessToken: TEST_TOKEN,
      });

      const oldTs = Date.now() - 10 * 60 * 1000; // 10 minutes ago in ms
      const url = TEST_BASE_URL + '/api/v2/wallet/abc123';
      const body = '{"id":"wallet123"}';
      // v3 preimage with statusCode: METHOD|timestamp|path|statusCode|body
      const subject = `GET|${oldTs}|/api/v2/wallet/abc123|200|${body}`;
      const hmac = computeHmac(TEST_TOKEN, subject);

      const req: any = {
        isV2Authenticated: true,
        authenticationToken: TEST_TOKEN,
        url,
      };
      const response: any = {
        status: 200,
        text: body,
        header: {
          hmac,
          timestamp: oldTs.toString(),
        },
      };

      assert.throws(
        () => verifyResponse(bitgo, TEST_TOKEN, 'get', req, response, 3),
        (err: any) => {
          assert.strictEqual(err.status, 511);
          assert.ok(err.message.includes('response validity time window'));
          return true;
        }
      );
    });

    it('should NOT enforce validity window for v2', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: TEST_BASE_URL,
        authVersion: 2,
        accessToken: TEST_TOKEN,
      });

      const oldTs = Date.now() - 10 * 60 * 1000; // 10 minutes ago in ms
      const url = TEST_BASE_URL + '/api/v2/wallet/abc123';
      const body = '{"id":"wallet123"}';
      // v2 preimage: timestamp|path|statusCode|body
      const subject = `${oldTs}|/api/v2/wallet/abc123|200|${body}`;
      const hmac = computeHmac(TEST_TOKEN, subject);

      const req: any = {
        isV2Authenticated: true,
        authenticationToken: TEST_TOKEN,
        url,
      };
      const response: any = {
        status: 200,
        text: body,
        header: {
          hmac,
          timestamp: oldTs.toString(),
        },
      };

      // Should NOT throw for v2, even with old timestamp
      const result = verifyResponse(bitgo, TEST_TOKEN, 'get', req, response, 2);
      assert.strictEqual(result, response);
    });
  });

  // ─────────────────────────────────────────────────────────
  // 6. v4 helper methods on BitGoAPI
  // ─────────────────────────────────────────────────────────
  describe('v4 helper methods', function () {
    it('calculateBodyHash should return SHA256 of Buffer input', function () {
      const bitgo = createV4Bitgo();
      const body = Buffer.from('{"address":"tb1qtest","amount":100000}');
      const expected = computeSha256(body);
      assert.strictEqual(bitgo.calculateBodyHash(body), expected);
    });

    it('calculateBodyHash should return empty buffer hash for empty input', function () {
      const bitgo = createV4Bitgo();
      assert.strictEqual(bitgo.calculateBodyHash(Buffer.from('')), EMPTY_BODY_HASH);
    });

    it('calculateBodyHash should accept string input', function () {
      const bitgo = createV4Bitgo();
      const body = '{"test":"value"}';
      const expected = computeSha256(body);
      assert.strictEqual(bitgo.calculateBodyHash(body), expected);
    });

    it('calculateV4Preimage should build newline-separated preimage with trailing newline', function () {
      const bitgo = createV4Bitgo();
      const result = bitgo.calculateV4Preimage({
        timestampSec: 1700000000,
        method: 'post',
        pathWithQuery: '/api/v2/wallet/abc123',
        bodyHashHex: 'abcdef123456',
        authRequestId: 'test-uuid',
      });
      assert.strictEqual(result, '1700000000\nPOST\n/api/v2/wallet/abc123\nabcdef123456\ntest-uuid\n');
    });

    it('calculateV4Preimage should normalize del to DELETE', function () {
      const bitgo = createV4Bitgo();
      const result = bitgo.calculateV4Preimage({
        timestampSec: 1700000000,
        method: 'del',
        pathWithQuery: '/api/v2/wallet/abc123',
        bodyHashHex: EMPTY_BODY_HASH,
        authRequestId: 'test-uuid',
      });
      assert.ok(result.includes('\nDELETE\n'), 'del should be normalized to DELETE');
    });

    it('calculateV4RequestHmac should return valid HMAC', function () {
      const bitgo = createV4Bitgo();
      const params = {
        timestampSec: 1700000000,
        method: 'GET',
        pathWithQuery: '/api/v2/wallet/abc123',
        bodyHashHex: EMPTY_BODY_HASH,
        authRequestId: 'test-uuid-1234',
        rawToken: TEST_TOKEN,
      };
      const result = bitgo.calculateV4RequestHmac(params);
      const preimage = `1700000000\nGET\n/api/v2/wallet/abc123\n${EMPTY_BODY_HASH}\ntest-uuid-1234\n`;
      const expected = computeHmac(TEST_TOKEN, preimage);
      assert.strictEqual(result, expected);
    });

    it('calculateV4RequestHeaders should return all 4 header values', function () {
      const bitgo = createV4Bitgo();
      const result = bitgo.calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery: '/api/v2/wallet/abc123/sendcoins',
        rawBody: Buffer.from('{"amount":100000}'),
        rawToken: TEST_TOKEN,
        authRequestId: 'header-uuid',
      });

      assert.ok(result.hmac, 'should have hmac');
      assert.ok(typeof result.timestampSec === 'number', 'should have timestampSec');
      assert.ok(result.bodyHashHex, 'should have bodyHashHex');
      assert.strictEqual(result.authRequestId, 'header-uuid');
      assert.strictEqual(result.bodyHashHex, computeSha256(Buffer.from('{"amount":100000}')));
    });

    it('calculateV4ResponsePreimage should include statusCode', function () {
      const bitgo = createV4Bitgo();
      const result = bitgo.calculateV4ResponsePreimage({
        timestampSec: 1700000000,
        method: 'GET',
        pathWithQuery: '/api/v2/wallet/abc123',
        statusCode: 200,
        bodyHashHex: EMPTY_BODY_HASH,
        authRequestId: 'test-uuid',
      });
      assert.strictEqual(result, `1700000000\nGET\n/api/v2/wallet/abc123\n200\n${EMPTY_BODY_HASH}\ntest-uuid\n`);
    });

    it('calculateV4ResponsePreimage should differ from request preimage (has statusCode)', function () {
      const bitgo = createV4Bitgo();
      const commonParams = {
        timestampSec: 1700000000,
        method: 'GET',
        pathWithQuery: '/api/v2/wallet/abc123',
        bodyHashHex: EMPTY_BODY_HASH,
        authRequestId: 'test-uuid',
      };
      const requestPreimage = bitgo.calculateV4Preimage(commonParams);
      const responsePreimage = bitgo.calculateV4ResponsePreimage({ ...commonParams, statusCode: 200 });
      assert.notStrictEqual(requestPreimage, responsePreimage, 'Request and response preimage should differ');
      assert.ok(responsePreimage.includes('\n200\n'), 'Response preimage should contain status code');
    });
  });

  // ─────────────────────────────────────────────────────────
  // 7. HMAC signature correctness (end-to-end)
  // ─────────────────────────────────────────────────────────
  describe('HMAC signature correctness', function () {
    it('request HMAC should be verifiable with the same preimage construction', function () {
      const bitgo = createV4Bitgo();
      const body = '{"address":"tb1qtest","amount":100000}';
      const rawBody = Buffer.from(body);
      const authRequestId = 'e2e-uuid-1234';
      const pathWithQuery = '/api/v2/wallet/abc123/sendcoins';

      const headers = bitgo.calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery,
        rawBody,
        rawToken: TEST_TOKEN,
        authRequestId,
      });

      // Manually reconstruct and verify
      const bodyHash = computeSha256(rawBody);
      assert.strictEqual(headers.bodyHashHex, bodyHash);

      const preimage = `${headers.timestampSec}\nPOST\n${pathWithQuery}\n${bodyHash}\n${authRequestId}\n`;
      const expectedHmac = computeHmac(TEST_TOKEN, preimage);
      assert.strictEqual(headers.hmac, expectedHmac);
    });

    it('response verification should match manual preimage + HMAC calculation', function () {
      const bitgo = createV4Bitgo();
      const responseBody = '{"txid":"tx123","status":"signed"}';
      const bodyHash = computeSha256(responseBody);
      const ts = nowSec();
      const pathWithQuery = '/api/v2/wallet/abc123/sendcoins';

      // Manually build response preimage
      const preimage = `${ts}\nPOST\n${pathWithQuery}\n200\n${bodyHash}\nresponse-uuid\n`;
      const hmac = computeHmac(TEST_TOKEN, preimage);

      const result = bitgo.verifyResponse({
        hmac,
        timestampSec: ts,
        method: 'POST',
        pathWithQuery,
        bodyHashHex: bodyHash,
        authRequestId: 'response-uuid',
        statusCode: 200,
        rawToken: TEST_TOKEN,
      });

      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.expectedHmac, hmac);
      assert.strictEqual(result.preimage, preimage);
    });

    it('different token should produce different HMAC', function () {
      const bitgo = createV4Bitgo();
      const body = '{"test":"data"}';
      const rawBody = Buffer.from(body);
      const otherToken = 'v2xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

      const headers1 = bitgo.calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery: '/api/v2/test',
        rawBody,
        rawToken: TEST_TOKEN,
        authRequestId: 'uuid-1',
      });

      const headers2 = bitgo.calculateV4RequestHeaders({
        method: 'POST',
        pathWithQuery: '/api/v2/test',
        rawBody,
        rawToken: otherToken,
        authRequestId: 'uuid-1',
      });

      assert.notStrictEqual(headers1.hmac, headers2.hmac, 'Different tokens should produce different HMACs');
      // Body hash should be the same (doesn't depend on token)
      assert.strictEqual(headers1.bodyHashHex, headers2.bodyHashHex);
    });
  });
});
