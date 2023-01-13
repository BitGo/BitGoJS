import * as assert from 'assert';
import { handleResponseError } from '../../src';

describe('bitgo:api unit tests', function () {
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
