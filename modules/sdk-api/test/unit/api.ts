import * as assert from 'assert';
import { handleResponseError, handleResponseResult } from '../../src';

describe('bitgo:api unit tests', function () {
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
