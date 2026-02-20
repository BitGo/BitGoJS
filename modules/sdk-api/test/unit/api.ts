import * as assert from 'assert';
import { handleResponseError, handleResponseResult, serializeRequestData } from '../../src';

describe('bitgo:api unit tests', function () {
  describe('serializeRequestData', function () {
    it('should return string data as-is for v4 raw body support', function () {
      const stringBody = '{"address":  "tb1qtest",   "amount":100000}';
      const mockReq: any = {
        _data: stringBody,
        get: () => 'application/json',
      };

      const result = serializeRequestData(mockReq);
      assert.strictEqual(result, stringBody);
      // Verify _data was not modified
      assert.strictEqual(mockReq._data, stringBody);
    });

    it('should return empty string as-is', function () {
      const mockReq: any = {
        _data: '',
        get: () => 'application/json',
      };

      const result = serializeRequestData(mockReq);
      assert.strictEqual(result, '');
    });

    it('should convert Buffer to UTF-8 string and mutate _data', function () {
      const jsonString = '{"address":"tb1qtest","amount":100000}';
      const bufferBody = Buffer.from(jsonString, 'utf8');
      const mockReq: any = {
        _data: bufferBody,
        get: () => 'application/json',
      };

      const result = serializeRequestData(mockReq);
      assert.strictEqual(typeof result, 'string');
      assert.strictEqual(result, jsonString);
      // Verify _data WAS mutated to string - critical for superagent to send correct bytes
      assert.strictEqual(typeof mockReq._data, 'string');
      assert.strictEqual(mockReq._data, jsonString);
    });

    it('should convert empty Buffer to empty string and mutate _data', function () {
      const mockReq: any = {
        _data: Buffer.from(''),
        get: () => 'application/json',
      };

      const result = serializeRequestData(mockReq);
      assert.strictEqual(typeof result, 'string');
      assert.strictEqual(result, '');
      // Verify _data WAS mutated to string
      assert.strictEqual(typeof mockReq._data, 'string');
      assert.strictEqual(mockReq._data, '');
    });

    it('should produce identical results on retry for HMAC consistency', function () {
      const jsonString = '{"address":"tb1qtest","amount":100000}';
      const bufferBody = Buffer.from(jsonString, 'utf8');
      const mockReq: any = {
        _data: bufferBody,
        get: () => 'application/json',
      };

      // First call (original request) - converts Buffer to string, mutates _data
      const result1 = serializeRequestData(mockReq);
      assert.strictEqual(result1, jsonString);
      assert.strictEqual(typeof mockReq._data, 'string');

      // Second call (simulating retry) - _data is now a string, returns as-is
      const result2 = serializeRequestData(mockReq);

      // Both calls should return identical strings for consistent HMAC
      assert.strictEqual(result1, result2);
      assert.strictEqual(result2, jsonString);
      // _data should now be a string (mutated on first call)
      assert.strictEqual(typeof mockReq._data, 'string');
      assert.strictEqual(mockReq._data, jsonString);
    });

    it('should mutate Buffer to prevent superagent JSON serialization', function () {
      // This test verifies the critical behavior: if we don't mutate _data from Buffer to string,
      // superagent will serialize the Buffer as {"type":"Buffer","data":[...]}, which won't match
      // the HMAC calculated on the UTF-8 string. By mutating _data, we ensure superagent sends
      // the exact bytes we used for HMAC calculation.
      const jsonString = '{"address":"tb1qtest","amount":100000}';
      const bufferBody = Buffer.from(jsonString, 'utf8');
      const mockReq: any = {
        _data: bufferBody,
        get: () => 'application/json',
      };

      serializeRequestData(mockReq);

      // After serialization, _data MUST be a string, not a Buffer
      assert.strictEqual(typeof mockReq._data, 'string');
      assert.strictEqual(mockReq._data, jsonString);

      // This ensures when superagent sends the request, it sends the UTF-8 string,
      // not the JSON-serialized Buffer representation.
    });

    it('should serialize object data to JSON', function () {
      const objectBody = { address: 'tb1qtest', amount: 100000 };
      const mockReq: any = {
        _data: objectBody,
        get: () => 'application/json',
      };

      const result = serializeRequestData(mockReq);
      assert.strictEqual(result, JSON.stringify(objectBody));
      // Verify _data was updated to serialized form
      assert.strictEqual(mockReq._data, JSON.stringify(objectBody));
    });

    it('should handle nested objects', function () {
      const nestedBody = { level1: { level2: { value: 'deep' } } };
      const mockReq: any = {
        _data: nestedBody,
        get: () => 'application/json',
      };

      const result = serializeRequestData(mockReq);
      assert.strictEqual(result, JSON.stringify(nestedBody));
    });

    it('should return undefined for undefined data', function () {
      const mockReq: any = {
        _data: undefined,
        get: () => 'application/json',
      };

      const result = serializeRequestData(mockReq);
      assert.strictEqual(result, undefined);
    });

    it('should return undefined for null data', function () {
      const mockReq: any = {
        _data: null,
        get: () => 'application/json',
      };

      const result = serializeRequestData(mockReq);
      assert.strictEqual(result, undefined);
    });

    it('should handle Content-Type with charset', function () {
      const objectBody = { test: 'value' };
      const mockReq: any = {
        _data: objectBody,
        get: () => 'application/json; charset=utf-8',
      };

      const result = serializeRequestData(mockReq);
      assert.strictEqual(result, JSON.stringify(objectBody));
    });

    it('should handle application/vnd.api+json content type', function () {
      const objectBody = { data: 'test' };
      const mockReq: any = {
        _data: objectBody,
        get: () => 'application/vnd.api+json',
      };

      const result = serializeRequestData(mockReq);
      assert.strictEqual(result, JSON.stringify(objectBody));
    });

    it('should return undefined for unsupported content type without serializer', function () {
      const objectBody = { test: 'value' };
      const mockReq: any = {
        _data: objectBody,
        get: () => 'text/plain',
      };

      const result = serializeRequestData(mockReq);
      // text/plain doesn't have a JSON serializer, so returns undefined
      assert.strictEqual(result, undefined);
    });
  });

  describe('handleResponseResult', function () {
    it('should return text for text-based responses', function () {
      const csvText = `transactionId,date,amount,currency,status
        12345,2025-01-15,100.00,USD,completed
        67890,2025-01-22,50.50,EUR,completed
        13579,2025-02-10,200.00,USD,pending
        24680,2025-02-28,75.25,BTC,completed`;

      const response: any = {
        status: 200,
        header: { 'content-type': 'text/csv' },
        text: csvText,
      };

      const result = handleResponseResult()(response);
      assert.strictEqual(result, response.text);
    });

    it('should parse JSON response and return the entire body if no field is specified', function () {
      const response: any = {
        status: 200,
        header: { 'content-type': 'application/json' },
        body: { foo: 'bar', baz: 123 },
      };

      const result = handleResponseResult()(response);
      assert.deepStrictEqual(result, response.body);
    });

    it('should parse JSON response and return the specified field if provided', function () {
      const response: any = {
        status: 200,
        header: { 'content-type': 'application/json' },
        body: { foo: 'bar', baz: 123 },
      };

      const result = handleResponseResult('foo')(response);
      assert.strictEqual(result, 'bar');
    });

    it('should return the entire response for non-JSON and non-text responses', function () {
      const response: any = {
        status: 200,
        header: { 'content-type': 'image/png' },
        blob: 'abcdefghijk',
      };

      const result = handleResponseResult()(response);
      assert.strictEqual(result, response);
    });

    it('should return the full body if this field exists', function () {
      const response: any = {
        status: 200,
        header: { 'content-type': 'application/octet-stream' },
        body: { irrelevant: true },
      };

      const result = handleResponseResult()(response);
      assert.strictEqual(result, response.body);
    });
  });

  describe('handleResponseError', function () {
    it('should re-throw an error without response property', function () {
      const originalError = new Error('Han shot first');
      assert.throws(() => handleResponseError(originalError), { name: 'Error', message: 'Han shot first' });
    });

    it('should use the status code if the response has no error text', function () {
      const originalError: any = new Error();
      originalError.response = { status: 400 };
      assert.throws(() => handleResponseError(originalError), {
        name: 'ApiResponseError',
        message: '400',
        invalidToken: false,
        needsOTP: false,
        result: undefined,
        status: 400,
      });
    });

    it('should use the response body.error text', function () {
      const originalError: any = new Error();
      originalError.response = { status: 400, body: { error: 'Han shot first' } };
      assert.throws(() => handleResponseError(originalError), {
        name: 'ApiResponseError',
        message: 'Han shot first',
        invalidToken: false,
        needsOTP: false,
        result: originalError.response.body,
        status: 400,
      });
    });

    it('should parse HTML code from the response text', function () {
      const originalError: any = new Error();
      originalError.response = { status: 400, text: ' <b> Han shot first </b>' };
      assert.throws(() => handleResponseError(originalError), {
        name: 'ApiResponseError',
        message: '400\nHan shot first',
        invalidToken: false,
        needsOTP: false,
        result: undefined,
        status: 400,
      });
    });

    it('should annotate invalidToken property', function () {
      const originalError: any = new Error();
      originalError.response = { status: 400, header: { 'x-auth-required': 'true' } };
      assert.throws(() => handleResponseError(originalError), {
        name: 'ApiResponseError',
        message: '400',
        invalidToken: true,
        needsOTP: false,
        result: undefined,
        status: 400,
      });
    });

    it('should annotate needsOTP property', function () {
      const originalError: any = new Error();
      originalError.response = { status: 400, body: { needsOTP: true } };
      assert.throws(() => handleResponseError(originalError), {
        name: 'ApiResponseError',
        message: '400',
        invalidToken: false,
        needsOTP: true,
        result: originalError.response.body,
        status: 400,
      });
    });
  });
});
