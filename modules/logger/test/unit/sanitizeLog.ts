import assert from 'assert';
import { sanitize, getErrorData } from '../../src/sanitizeLog';

const V2_TOKEN = 'v2xaabbccdd112233445566778899aabbccddeeff';

describe('sanitize', function () {
  describe('primitives', function () {
    it('should pass through null', function () {
      assert.strictEqual(sanitize(null), null);
    });

    it('should pass through undefined', function () {
      assert.strictEqual(sanitize(undefined), undefined);
    });

    it('should pass through numbers', function () {
      assert.strictEqual(sanitize(42), 42);
    });

    it('should pass through booleans', function () {
      assert.strictEqual(sanitize(true), true);
    });

    it('should pass through plain strings', function () {
      assert.strictEqual(sanitize('hello world'), 'hello world');
    });

    it('should redact a bare v2 token string', function () {
      assert.strictEqual(sanitize(V2_TOKEN), '<REMOVED>');
    });

    it('should not redact a string that is not a full v2 token', function () {
      assert.strictEqual(sanitize(`Bearer ${V2_TOKEN}`), `Bearer ${V2_TOKEN}`);
    });

    it('should not redact a short v2x string (< 32 hex chars)', function () {
      assert.strictEqual(sanitize('v2xaabb'), 'v2xaabb');
    });
  });

  describe('sensitive key redaction', function () {
    it('should redact token key', function () {
      assert.deepStrictEqual(sanitize({ token: 'abc' }), { token: '<REMOVED>' });
    });

    it('should redact password key', function () {
      assert.deepStrictEqual(sanitize({ password: 'secret' }), { password: '<REMOVED>' });
    });

    it('should redact prv key', function () {
      assert.deepStrictEqual(sanitize({ prv: 'xprv123' }), { prv: '<REMOVED>' });
    });

    it('should redact xprv key', function () {
      assert.deepStrictEqual(sanitize({ xprv: 'xprvkey' }), { xprv: '<REMOVED>' });
    });

    it('should redact privateKey key (case-insensitive)', function () {
      assert.deepStrictEqual(sanitize({ privateKey: 'key' }), { privateKey: '<REMOVED>' });
    });

    it('should redact otp key', function () {
      assert.deepStrictEqual(sanitize({ otp: '123456' }), { otp: '<REMOVED>' });
    });

    it('should redact passphrase key', function () {
      assert.deepStrictEqual(sanitize({ passphrase: 'secret' }), { passphrase: '<REMOVED>' });
    });

    it('should redact walletPassphrase key', function () {
      assert.deepStrictEqual(sanitize({ walletPassphrase: 'pass' }), { walletPassphrase: '<REMOVED>' });
    });

    it('should redact bearer key', function () {
      assert.deepStrictEqual(sanitize({ bearer: 'token123' }), { bearer: '<REMOVED>' });
    });

    it('should redact _token key', function () {
      assert.deepStrictEqual(sanitize({ _token: 'abc' }), { _token: '<REMOVED>' });
    });

    it('should keep non-sensitive keys', function () {
      assert.deepStrictEqual(sanitize({ user: 'alice' }), { user: 'alice' });
    });
  });

  describe('bearer v2 token redaction in object values', function () {
    it('should redact an object value that is a full v2 token', function () {
      assert.deepStrictEqual(sanitize({ auth: V2_TOKEN }), { auth: '<REMOVED>' });
    });

    it('should NOT redact an embedded v2 token (only full-string match)', function () {
      const embedded = `token is ${V2_TOKEN}`;
      assert.deepStrictEqual(sanitize({ msg: embedded }), { msg: embedded });
    });

    it('should NOT redact a Bearer-prefixed v2 token value (not full match)', function () {
      const prefixed = `Bearer ${V2_TOKEN}`;
      assert.deepStrictEqual(sanitize({ header: prefixed }), { header: prefixed });
    });

    it('should keep an object value without a token', function () {
      assert.deepStrictEqual(sanitize({ msg: 'hello' }), { msg: 'hello' });
    });

    it('should not redact a short v2x string (< 32 hex chars)', function () {
      assert.deepStrictEqual(sanitize({ key: 'v2xaabb' }), { key: 'v2xaabb' });
    });
  });

  describe('bearer v2 token in arrays', function () {
    it('should redact a v2 token in an array', function () {
      assert.deepStrictEqual(sanitize([V2_TOKEN, 'hello']), ['<REMOVED>', 'hello']);
    });
  });

  describe('nested objects with sensitive keys', function () {
    it('should redact sensitive keys at any depth', function () {
      const obj = {
        user: 'alice',
        credentials: {
          password: 'secret',
          otp: '123456',
          config: {
            prv: 'private-key',
            endpoint: 'https://api.bitgo.com',
          },
        },
      };
      const result = sanitize(obj) as any;
      assert.strictEqual(result.user, 'alice');
      assert.strictEqual(result.credentials.password, '<REMOVED>');
      assert.strictEqual(result.credentials.otp, '<REMOVED>');
      assert.strictEqual(result.credentials.config.prv, '<REMOVED>');
      assert.strictEqual(result.credentials.config.endpoint, 'https://api.bitgo.com');
    });
  });

  describe('nested Error inside objects', function () {
    it('should preserve Error properties nested in an object', function () {
      const obj = { action: 'transfer', error: new Error('nested failure') };
      const result = sanitize(obj) as any;
      assert.strictEqual(result.error.name, 'Error');
      assert.strictEqual(result.error.message, 'nested failure');
      assert.strictEqual(typeof result.error.stack, 'string');
    });

    it('should preserve Error properties at any depth', function () {
      const obj = { data: { inner: { error: new Error('deep') } } };
      const result = sanitize(obj) as any;
      assert.strictEqual(result.data.inner.error.message, 'deep');
    });

    it('should redact sensitive custom properties on nested Errors', function () {
      const err: any = new Error('fail');
      err.token = 'secret';
      err.statusCode = 500;
      const obj = { error: err };
      const result = sanitize(obj) as any;
      assert.strictEqual(result.error.token, '<REMOVED>');
      assert.strictEqual(result.error.statusCode, 500);
      assert.strictEqual(result.error.message, 'fail');
    });
  });

  describe('Date handling', function () {
    it('should convert a top-level Date to ISO string', function () {
      assert.strictEqual(sanitize(new Date('2026-03-02T10:30:00.000Z')), '2026-03-02T10:30:00.000Z');
    });

    it('should convert a Date inside an object to ISO string', function () {
      const obj = { createdAt: new Date('2026-01-15T00:00:00.000Z'), user: 'bob' };
      const result = sanitize(obj) as any;
      assert.strictEqual(result.createdAt, '2026-01-15T00:00:00.000Z');
      assert.strictEqual(result.user, 'bob');
    });
  });

  describe('BigInt handling', function () {
    it('should convert a top-level BigInt to string', function () {
      assert.strictEqual(sanitize(100n), '100');
    });

    it('should convert BigInts inside an object to strings', function () {
      assert.deepStrictEqual(sanitize({ amount: 100n, fee: 50n }), { amount: '100', fee: '50' });
    });

    it('should convert BigInts inside an array to strings', function () {
      assert.deepStrictEqual(sanitize([1n, 2n, 3n]), ['1', '2', '3']);
    });
  });

  describe('circular reference handling', function () {
    it('should replace circular references with [Circular]', function () {
      const circular: any = { name: 'test' };
      circular.self = circular;
      const result = sanitize(circular) as any;
      assert.strictEqual(result.name, 'test');
      assert.strictEqual(result.self, '[Circular]');
    });
  });

  describe('array handling', function () {
    it('should pass through a simple array', function () {
      assert.deepStrictEqual(sanitize([1, 'hello', true]), [1, 'hello', true]);
    });

    it('should sanitize objects inside arrays', function () {
      assert.deepStrictEqual(sanitize([{ password: 'secret' }, { user: 'alice' }]), [
        { password: '<REMOVED>' },
        { user: 'alice' },
      ]);
    });

    it('should handle nested arrays', function () {
      assert.deepStrictEqual(
        sanitize([
          [1, 2],
          [3, 4],
        ]),
        [
          [1, 2],
          [3, 4],
        ]
      );
    });
  });

  describe('max depth handling', function () {
    it('should return [Max Depth Exceeded] beyond depth limit', function () {
      let deepObj: any = { value: 'bottom' };
      for (let i = 0; i < 55; i++) {
        deepObj = { nested: deepObj };
      }
      const result = sanitize(deepObj) as any;
      let current = result;
      let reachedLimit = false;
      for (let i = 0; i < 55; i++) {
        if (current.nested === '[Max Depth Exceeded]') {
          reachedLimit = true;
          break;
        }
        current = current.nested;
      }
      assert.strictEqual(reachedLimit, true);
    });
  });

  describe('RegExp handling', function () {
    it('should convert RegExp to string', function () {
      assert.strictEqual(sanitize(/test/gi), '/test/gi');
    });

    it('should handle RegExp in objects', function () {
      const obj = { pattern: /[a-z]+/i, name: 'validator' };
      const result = sanitize(obj) as any;
      assert.strictEqual(result.pattern, '/[a-z]+/i');
      assert.strictEqual(result.name, 'validator');
    });
  });

  describe('Buffer handling', function () {
    it('should handle Buffer objects', function () {
      if (typeof Buffer !== 'undefined') {
        const buf = Buffer.from('test data');
        assert.strictEqual(sanitize(buf), '<Buffer>');
      }
    });

    it('should handle Buffer in objects', function () {
      if (typeof Buffer !== 'undefined') {
        const obj = { data: Buffer.from('secret'), label: 'file' };
        const result = sanitize(obj) as any;
        assert.strictEqual(result.data, '<Buffer>');
        assert.strictEqual(result.label, 'file');
      }
    });
  });

  describe('TypedArray handling', function () {
    it('should handle Uint8Array', function () {
      const arr = new Uint8Array([1, 2, 3]);
      assert.strictEqual(sanitize(arr), '<TypedArray>');
    });

    it('should handle Int32Array in objects', function () {
      const obj = { numbers: new Int32Array([10, 20, 30]), count: 3 };
      const result = sanitize(obj) as any;
      assert.strictEqual(result.numbers, '<TypedArray>');
      assert.strictEqual(result.count, 3);
    });
  });

  describe('Map handling', function () {
    it('should sanitize Map entries', function () {
      const map = new Map([
        ['user', 'alice'],
        ['password', 'secret'],
      ]);
      const result = sanitize(map) as Map<any, any>;
      assert.ok(result instanceof Map);
      assert.strictEqual(result.get('user'), 'alice');
      assert.strictEqual(result.get('password'), '<REMOVED>');
    });

    it('should handle nested Map in objects', function () {
      const obj = {
        config: new Map([
          ['host', 'localhost'],
          ['token', 'secret'],
        ]),
      };
      const result = sanitize(obj) as any;
      assert.ok(result.config instanceof Map);
      assert.strictEqual(result.config.get('host'), 'localhost');
      assert.strictEqual(result.config.get('token'), '<REMOVED>');
    });

    it('should handle v2 token in Map values', function () {
      const map = new Map([['auth', V2_TOKEN]]);
      const result = sanitize(map) as Map<any, any>;
      assert.strictEqual(result.get('auth'), '<REMOVED>');
    });
  });

  describe('Set handling', function () {
    it('should sanitize Set entries', function () {
      const set = new Set(['user1', V2_TOKEN, 'user3']);
      const result = sanitize(set) as Set<any>;
      assert.ok(result instanceof Set);
      assert.strictEqual(result.has('user1'), true);
      assert.strictEqual(result.has('<REMOVED>'), true);
      assert.strictEqual(result.has('user3'), true);
      assert.strictEqual(result.has(V2_TOKEN), false);
    });

    it('should handle nested Set in objects', function () {
      const obj = { tags: new Set(['public', 'private']) };
      const result = sanitize(obj) as any;
      assert.ok(result.tags instanceof Set);
      assert.strictEqual(result.tags.has('public'), true);
      assert.strictEqual(result.tags.has('private'), true);
    });
  });

  describe('mixed complex object', function () {
    it('should handle all data types together', function () {
      const complexObj = {
        user: 'alice',
        password: 'secret',
        transaction: {
          amount: 100n,
          createdAt: new Date('2026-06-15T12:00:00.000Z'),
          error: new Error('validation failed'),
          token: 'my-token',
        },
        authToken: V2_TOKEN,
        tags: ['transfer', 'urgent'],
      };
      const result = sanitize(complexObj) as any;
      assert.strictEqual(result.password, '<REMOVED>');
      assert.strictEqual(result.transaction.amount, '100');
      assert.strictEqual(result.transaction.createdAt, '2026-06-15T12:00:00.000Z');
      assert.strictEqual(result.transaction.error.message, 'validation failed');
      assert.strictEqual(result.transaction.token, '<REMOVED>');
      assert.strictEqual(result.authToken, '<REMOVED>');
      assert.strictEqual(result.tags[0], 'transfer');
      assert.strictEqual(result.tags[1], 'urgent');
    });

    it('should handle all new data types together', function () {
      const complexObj = {
        pattern: /test/gi,
        bigNum: 999n,
        tags: new Set(['a', 'b']),
        config: new Map([['key', 'value']]),
        date: new Date('2026-01-01T00:00:00.000Z'),
      };
      const result = sanitize(complexObj) as any;
      assert.strictEqual(result.pattern, '/test/gi');
      assert.strictEqual(result.bigNum, '999');
      assert.ok(result.tags instanceof Set);
      assert.ok(result.config instanceof Map);
      assert.strictEqual(result.date, '2026-01-01T00:00:00.000Z');
    });
  });
});

describe('getErrorData', function () {
  it('should extract name, message, and stack from an Error', function () {
    const err = new Error('something broke');
    const result = getErrorData(err) as Record<string, unknown>;
    assert.strictEqual(result.name, 'Error');
    assert.strictEqual(result.message, 'something broke');
    assert.strictEqual(typeof result.stack, 'string');
  });

  it('should preserve custom enumerable properties', function () {
    const err: any = new Error('auth failed');
    err.statusCode = 401;
    err.url = 'https://api.bitgo.com';
    const result = getErrorData(err) as Record<string, unknown>;
    assert.strictEqual(result.statusCode, 401);
    assert.strictEqual(result.url, 'https://api.bitgo.com');
    assert.strictEqual(result.name, 'Error');
    assert.strictEqual(result.message, 'auth failed');
  });

  it('should return non-Error values as-is', function () {
    assert.strictEqual(getErrorData('hello'), 'hello');
    assert.strictEqual(getErrorData(null), null);
    assert.strictEqual(getErrorData(42), 42);
    assert.strictEqual(getErrorData(undefined), undefined);
  });

  it('should extract Error.cause when present', function () {
    const inner = new Error('db connection failed');
    const outer = new (Error as any)('transaction failed', { cause: inner });
    const result = getErrorData(outer) as Record<string, unknown>;
    assert.strictEqual(result.message, 'transaction failed');
    const causeData = result.cause as Record<string, unknown>;
    assert.strictEqual(causeData.name, 'Error');
    assert.strictEqual(causeData.message, 'db connection failed');
    assert.strictEqual(typeof causeData.stack, 'string');
  });

  it('should extract non-enumerable custom properties', function () {
    const err = new Error('fail');
    Object.defineProperty(err, 'code', { value: 'ECONNREFUSED', enumerable: false });
    const result = getErrorData(err) as Record<string, unknown>;
    assert.strictEqual(result.code, 'ECONNREFUSED');
    assert.strictEqual(result.message, 'fail');
  });

  it('should handle nested Error causes', function () {
    const root = new Error('root cause');
    const middle = new (Error as any)('middle', { cause: root });
    const outer = new (Error as any)('outer', { cause: middle });
    const result = getErrorData(outer) as Record<string, unknown>;
    const middleData = result.cause as Record<string, unknown>;
    assert.strictEqual(middleData.message, 'middle');
    const rootData = middleData.cause as Record<string, unknown>;
    assert.strictEqual(rootData.message, 'root cause');
  });

  describe('full Error sanitization flow (getErrorData + sanitize)', function () {
    it('should preserve Error info and redact sensitive custom properties', function () {
      const err: any = new Error('failed');
      err.token = 'secret-token';
      err.password = 'hunter2';
      err.statusCode = 500;
      const result = sanitize(getErrorData(err)) as Record<string, unknown>;
      assert.strictEqual(result.name, 'Error');
      assert.strictEqual(result.message, 'failed');
      assert.strictEqual(typeof result.stack, 'string');
      assert.strictEqual(result.token, '<REMOVED>');
      assert.strictEqual(result.password, '<REMOVED>');
      assert.strictEqual(result.statusCode, 500);
    });

    it('should redact a v2 token in a custom Error property', function () {
      const err: any = new Error('bad request');
      err.authHeader = V2_TOKEN;
      const result = sanitize(getErrorData(err)) as Record<string, unknown>;
      assert.strictEqual(result.authHeader, '<REMOVED>');
      assert.strictEqual(result.message, 'bad request');
    });
  });
});
