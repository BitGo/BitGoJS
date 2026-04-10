import assert from 'assert';
import { argon2id, argon2i, argon2d, argon2Verify } from '..';

// Small params for fast tests
const FAST_PARAMS = {
  iterations: 1,
  parallelism: 1,
  memorySize: 256,
  hashLength: 32,
};

describe('@bitgo/argon2', function () {
  describe('argon2id', function () {
    it('should produce a hex hash by default', async function () {
      const hash = await argon2id({
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
      });
      assert.strictEqual(typeof hash, 'string');
      assert.match(hash, /^[0-9a-f]{64}$/);
    });

    it('should produce a hex hash when outputType is hex', async function () {
      const hash = await argon2id({
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        outputType: 'hex',
      });
      assert.strictEqual(typeof hash, 'string');
      assert.match(hash, /^[0-9a-f]{64}$/);
    });

    it('should produce a binary hash when outputType is binary', async function () {
      const hash = await argon2id({
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        outputType: 'binary',
      });
      assert(hash instanceof Uint8Array);
      assert.strictEqual(hash.length, 32);
    });

    it('should produce an encoded hash when outputType is encoded', async function () {
      const hash = await argon2id({
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        outputType: 'encoded',
      });
      assert.strictEqual(typeof hash, 'string');
      assert(hash.startsWith('$argon2id$'), `Expected encoded hash to start with $argon2id$, got: ${hash}`);
    });

    it('should be deterministic (same inputs produce same output)', async function () {
      const opts = {
        password: 'deterministic-test',
        salt: 'fixedsalt1234567',
        ...FAST_PARAMS,
      };
      const hash1 = await argon2id(opts);
      const hash2 = await argon2id(opts);
      assert.strictEqual(hash1, hash2);
    });

    it('should produce different hashes for different passwords', async function () {
      const common = {
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
      };
      const hash1 = await argon2id({ password: 'password1', ...common });
      const hash2 = await argon2id({ password: 'password2', ...common });
      assert.notStrictEqual(hash1, hash2);
    });

    it('should support RFC 9106 reference params (m=65536, t=3, p=4)', async function () {
      // This test uses larger memory to exercise non-trivial params.
      // m=65536 KiB = 64 MiB, t=3, p=4 are the RFC 9106 recommended params.
      const hash = await argon2id({
        password: 'password',
        salt: 'somesalt12345678',
        iterations: 3,
        parallelism: 4,
        memorySize: 65536,
        hashLength: 32,
      });
      assert.strictEqual(typeof hash, 'string');
      assert.match(hash, /^[0-9a-f]{64}$/);
    });

    it('should support configurable hash length', async function () {
      const hash16 = await argon2id({
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        hashLength: 16,
      });
      assert.match(hash16, /^[0-9a-f]{32}$/);

      const hash64 = await argon2id({
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        hashLength: 64,
      });
      assert.match(hash64, /^[0-9a-f]{128}$/);
    });
  });

  describe('argon2i', function () {
    it('should produce a hex hash', async function () {
      const hash = await argon2i({
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
      });
      assert.strictEqual(typeof hash, 'string');
      assert.match(hash, /^[0-9a-f]{64}$/);
    });

    it('should produce a different hash than argon2id with the same inputs', async function () {
      const opts = {
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
      };
      const hashI = await argon2i(opts);
      const hashId = await argon2id(opts);
      assert.notStrictEqual(hashI, hashId);
    });

    it('should produce an encoded hash starting with $argon2i$', async function () {
      const hash = await argon2i({
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        outputType: 'encoded',
      });
      assert(hash.startsWith('$argon2i$'), `Expected $argon2i$ prefix, got: ${hash}`);
    });
  });

  describe('argon2d', function () {
    it('should produce a hex hash', async function () {
      const hash = await argon2d({
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
      });
      assert.strictEqual(typeof hash, 'string');
      assert.match(hash, /^[0-9a-f]{64}$/);
    });

    it('should produce a different hash than argon2id and argon2i', async function () {
      const opts = {
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
      };
      const hashD = await argon2d(opts);
      const hashId = await argon2id(opts);
      const hashI = await argon2i(opts);
      assert.notStrictEqual(hashD, hashId);
      assert.notStrictEqual(hashD, hashI);
    });

    it('should produce an encoded hash starting with $argon2d$', async function () {
      const hash = await argon2d({
        password: 'password123',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        outputType: 'encoded',
      });
      assert(hash.startsWith('$argon2d$'), `Expected $argon2d$ prefix, got: ${hash}`);
    });
  });

  describe('argon2Verify', function () {
    it('should verify a correct password', async function () {
      const encoded = await argon2id({
        password: 'correct-password',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        outputType: 'encoded',
      });
      const result = await argon2Verify({
        password: 'correct-password',
        hash: encoded,
      });
      assert.strictEqual(result, true);
    });

    it('should reject an incorrect password', async function () {
      const encoded = await argon2id({
        password: 'correct-password',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        outputType: 'encoded',
      });
      const result = await argon2Verify({
        password: 'wrong-password',
        hash: encoded,
      });
      assert.strictEqual(result, false);
    });

    it('should verify argon2i encoded hashes', async function () {
      const encoded = await argon2i({
        password: 'test-password',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        outputType: 'encoded',
      });
      const result = await argon2Verify({
        password: 'test-password',
        hash: encoded,
      });
      assert.strictEqual(result, true);
    });

    it('should verify argon2d encoded hashes', async function () {
      const encoded = await argon2d({
        password: 'test-password',
        salt: 'somesalt12345678',
        ...FAST_PARAMS,
        outputType: 'encoded',
      });
      const result = await argon2Verify({
        password: 'test-password',
        hash: encoded,
      });
      assert.strictEqual(result, true);
    });
  });

  describe('input validation', function () {
    it('should reject a salt shorter than 8 bytes', async function () {
      await assert.rejects(
        () =>
          argon2id({
            password: 'password',
            salt: 'short',
            ...FAST_PARAMS,
          }),
        /salt/i
      );
    });

    it('should reject an empty password', async function () {
      await assert.rejects(
        () =>
          argon2id({
            password: '',
            salt: 'somesalt12345678',
            ...FAST_PARAMS,
          }),
        /password/i
      );
    });

    it('should accept Uint8Array inputs for password and salt', async function () {
      const password = new Uint8Array([112, 97, 115, 115, 119, 111, 114, 100]); // "password"
      const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const hash = await argon2id({
        password,
        salt,
        ...FAST_PARAMS,
      });
      assert.strictEqual(typeof hash, 'string');
      assert.match(hash, /^[0-9a-f]{64}$/);
    });

    it('should produce consistent results between string and equivalent Uint8Array password', async function () {
      const salt = 'somesalt12345678';
      const passwordStr = 'password';
      const passwordBuf = new Uint8Array(Buffer.from(passwordStr));

      const hash1 = await argon2id({
        password: passwordStr,
        salt,
        ...FAST_PARAMS,
      });
      const hash2 = await argon2id({
        password: passwordBuf,
        salt,
        ...FAST_PARAMS,
      });
      assert.strictEqual(hash1, hash2);
    });
  });
});
