/**
 * @prettier
 */

import 'should';
import { sanitize } from '../../../src/utils/sanitizeLog';

describe('sanitizeLog - Exact Key Matching Implementation', function () {
  describe('sanitize() - Basic Functionality', function () {
    it('should handle null and undefined', function () {
      const result = sanitize(null);
      (result === null).should.be.true();
      (sanitize(undefined) === undefined).should.be.true();
    });

    it('should handle primitives', function () {
      sanitize(123).should.equal(123);
      sanitize('test').should.equal('test');
      sanitize(true).should.equal(true);
      sanitize(false).should.equal(false);
    });

    it('should handle empty objects and arrays', function () {
      sanitize({}).should.deepEqual({});
      sanitize([]).should.deepEqual([]);
    });

    it('should redact token fields (exact match)', function () {
      const input = { token: 'secret123', other: 'value' };
      const result = sanitize(input);
      result.should.deepEqual({ token: '<REMOVED>', other: 'value' });
    });

    it('should NOT redact token fields with prefixes/suffixes', function () {
      const input = { accessToken: 'secret123', _token: 'secret456', other: 'value' };
      const result = sanitize(input);
      result.should.deepEqual({ accessToken: 'secret123', _token: 'secret456', other: 'value' });
    });

    it('should redact bearer fields (exact match)', function () {
      const input = { bearer: 'secret123', userBearer: 'Bearer token123', other: 'value' };
      const result = sanitize(input);
      result.should.deepEqual({ bearer: '<REMOVED>', userBearer: 'Bearer token123', other: 'value' });
    });

    it('should redact password fields', function () {
      const input = { password: 'mypass', other: 'value' };
      const result = sanitize(input);
      result.should.deepEqual({ password: '<REMOVED>', other: 'value' });
    });

    it('should redact private key fields (exact match, case-insensitive)', function () {
      const input = { prv: 'xprv123', privatekey: 'key123', privateKey: 'key456', other: 'value' };
      const result = sanitize(input);
      result.should.deepEqual({ prv: '<REMOVED>', privatekey: '<REMOVED>', privateKey: '<REMOVED>', other: 'value' });
    });

    it('should be case-insensitive', function () {
      const input = {
        TOKEN: 'value1',
        Token: 'value2',
        ToKeN: 'value3',
        PASSWORD: 'value4',
        Password: 'value5',
        other: 'safe',
      };
      const result = sanitize(input);
      result.should.deepEqual({
        TOKEN: '<REMOVED>',
        Token: '<REMOVED>',
        ToKeN: '<REMOVED>',
        PASSWORD: '<REMOVED>',
        Password: '<REMOVED>',
        other: 'safe',
      });
    });

    it('should handle nested objects', function () {
      const input = {
        outer: 'safe',
        nested: {
          token: 'secret123',
          password: 'mypass',
          safe: 'value',
        },
      };
      const result = sanitize(input);
      result.should.deepEqual({
        outer: 'safe',
        nested: { token: '<REMOVED>', password: '<REMOVED>', safe: 'value' },
      });
    });

    it('should handle deeply nested objects', function () {
      const input = {
        level1: {
          level2: {
            level3: {
              token: 'secret',
              safe: 'value',
            },
          },
        },
      };
      const result = sanitize(input);
      result.should.deepEqual({
        level1: {
          level2: {
            level3: { token: '<REMOVED>', safe: 'value' },
          },
        },
      });
    });

    it('should handle arrays', function () {
      const input = [{ token: 'secret1', safe: 'value1' }, { password: 'pass123', safe: 'value2' }, { safe: 'value3' }];
      const result = sanitize(input);
      result.should.deepEqual([
        { token: '<REMOVED>', safe: 'value1' },
        { password: '<REMOVED>', safe: 'value2' },
        { safe: 'value3' },
      ]);
    });

    it('should handle arrays with nested objects', function () {
      const input = {
        items: [
          { token: 'secret1', data: 'value1' },
          { password: 'pass123', data: 'value2' },
        ],
        other: 'safe',
      };
      const result = sanitize(input);
      result.should.deepEqual({
        items: [
          { token: '<REMOVED>', data: 'value1' },
          { password: '<REMOVED>', data: 'value2' },
        ],
        other: 'safe',
      });
    });

    it('should handle circular references', function () {
      const obj: Record<string, unknown> = { safe: 'value' };
      obj.circular = obj;

      const result = sanitize(obj);
      result.should.have.property('safe', 'value');
      result.should.have.property('circular', '[Circular]');
    });

    it('should handle max depth protection', function () {
      let deepObj: Record<string, unknown> = { safe: 'value' };
      for (let i = 0; i < 60; i++) {
        deepObj = { nested: deepObj };
      }

      const result = sanitize(deepObj);
      // Should not throw stack overflow
      result.should.be.ok();
    });

    it('should redact all sensitive keyword fields', function () {
      const input = {
        token: 'val1',
        bearer: 'val2',
        prv: 'val3',
        privatekey: 'val4',
        password: 'val5',
        otp: 'val6',
        safe: 'keepme',
      };

      const result = sanitize(input);
      result.should.deepEqual({
        token: '<REMOVED>',
        bearer: '<REMOVED>',
        prv: '<REMOVED>',
        privatekey: '<REMOVED>',
        password: '<REMOVED>',
        otp: '<REMOVED>',
        safe: 'keepme',
      });
    });

    it('should handle BitGo wallet with exact token key', function () {
      const wallet = {
        id: '123abc',
        label: 'My Wallet',
        token: 'v2xsensitivetoken123',
        _token: 'not-matched',
        balance: 1000000,
        _permissions: ['spend', 'view'],
      };

      const result = sanitize(wallet);
      result.should.deepEqual({
        id: '123abc',
        label: 'My Wallet',
        token: '<REMOVED>',
        _token: 'not-matched',
        balance: 1000000,
        _permissions: ['spend', 'view'],
      });
    });

    it('should handle mixed arrays and objects', function () {
      const input = {
        users: [
          { name: 'Alice', password: 'secret1' },
          { name: 'Bob', token: 'key123', userToken: 'not-matched' },
        ],
        config: {
          password: 'dbpass',
          dbPassword: 'not-matched',
          dbHost: 'localhost',
        },
      };

      const result = sanitize(input);
      result.should.deepEqual({
        users: [
          { name: 'Alice', password: '<REMOVED>' },
          { name: 'Bob', token: '<REMOVED>', userToken: 'not-matched' },
        ],
        config: { password: '<REMOVED>', dbPassword: 'not-matched', dbHost: 'localhost' },
      });
    });

    it('should handle objects with numeric keys', function () {
      const input = {
        0: 'value0',
        1: 'value1',
        token: 'secret',
      };

      const result = sanitize(input);
      result.should.deepEqual({
        0: 'value0',
        1: 'value1',
        token: '<REMOVED>',
      });
    });

    it('should NOT redact keys with sensitive substrings', function () {
      const input = {
        notation: 'musical',
        myToken: 'sensitive',
        tokenize: 'sensitive',
        token: 'exact-match',
        safe: 'value',
      };

      const result = sanitize(input);
      // Only 'token' exact match should be redacted
      result.should.deepEqual({
        notation: 'musical',
        myToken: 'sensitive',
        tokenize: 'sensitive',
        token: '<REMOVED>',
        safe: 'value',
      });
    });
  });

  describe('sanitize() - Exact Key Matching (6 Keywords)', function () {
    it('should match all 6 sensitive keywords exactly', function () {
      const keywords = ['token', 'bearer', 'prv', 'privatekey', 'password', 'otp'];

      keywords.forEach((keyword) => {
        const input = { [keyword]: 'sensitive' };
        const result = sanitize(input);
        result.should.deepEqual({ [keyword]: '<REMOVED>' }, `Failed for keyword: ${keyword}`);
      });
    });

    it('should NOT match keywords with prefixes or suffixes', function () {
      const input = {
        myToken: 'val1',
        token: 'exact',
        tokenValue: 'val2',
        safe: 'keepme',
      };

      const result = sanitize(input);
      result.should.deepEqual({
        myToken: 'val1',
        token: '<REMOVED>',
        tokenValue: 'val2',
        safe: 'keepme',
      });
    });

    it('should match exact keywords even with underscores in values', function () {
      const input = {
        token: 'val1',
        _token: 'not-matched',
        password: 'val2',
        user_password: 'not-matched',
        safe_value: 'keepme',
      };

      const result = sanitize(input);
      result.should.deepEqual({
        token: '<REMOVED>',
        _token: 'not-matched',
        password: '<REMOVED>',
        user_password: 'not-matched',
        safe_value: 'keepme',
      });
    });

    it('should match exact keywords even with hyphens in values', function () {
      const input = {
        token: 'val1',
        'x-api-token': 'not-matched',
        password: 'val2',
        'user-password': 'not-matched',
        'safe-value': 'keepme',
      };

      const result = sanitize(input);
      result.should.deepEqual({
        token: '<REMOVED>',
        'x-api-token': 'not-matched',
        password: '<REMOVED>',
        'user-password': 'not-matched',
        'safe-value': 'keepme',
      });
    });

    it('should NOT match similar-sounding but different words', function () {
      const input = {
        taken: 'value1', // Not 'token'
        bear: 'value2', // Not 'bearer'
        author: 'value3', // Not 'authorization'
        pass: 'value4', // Not 'password'
        clinic: 'value5', // Not 'client'
        see: 'value6', // Not 'seed'
        sign: 'value7', // Not 'signature'
        notation: 'value8', // Contains 'otp' but not as word
      };

      const result = sanitize(input);
      result.should.deepEqual({
        taken: 'value1',
        bear: 'value2',
        author: 'value3',
        pass: 'value4',
        clinic: 'value5',
        see: 'value6',
        sign: 'value7',
        notation: 'value8',
      });
    });
  });

  describe('sanitize() - Bearer V2 Token Detection', function () {
    it('should detect and redact v2 bearer tokens in string values', function () {
      const input = {
        field1: 'v2xea99e123bba182f1360ad35529a7a6ae77cfc0bc4e5dcb4f88a6dd4e4bf6a8db',
        other: 'safe-value',
      };
      const result = sanitize(input);
      result.should.deepEqual({
        field1: '<REMOVED>',
        other: 'safe-value',
      });
    });

    it('should detect v2 tokens regardless of case', function () {
      const input = {
        value1: 'V2Xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
        value2: 'v2x1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        value3: 'V2x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fe',
        safe: 'v1token',
      };
      const result = sanitize(input);
      result.should.deepEqual({
        value1: '<REMOVED>',
        value2: '<REMOVED>',
        value3: '<REMOVED>',
        safe: 'v1token',
      });
    });

    it('should detect v2 tokens in nested structures', function () {
      const input = {
        data: {
          value: 'v2xabcd1234efab5678abcd1234efab5678abcd1234efab5678abcd1234efab',
          user: 'john',
        },
        list: ['safe', 'v2x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fe', 'also-safe'],
      };
      const result = sanitize(input);
      result.should.deepEqual({
        data: {
          value: '<REMOVED>',
          user: 'john',
        },
        list: ['safe', '<REMOVED>', 'also-safe'],
      });
    });

    it('should not match partial v2 patterns', function () {
      const input = {
        value1: 'prefix-v2xtoken',
        value2: 'v2xtoken-suffix',
        value3: 'v2',
        value4: 'v2x',
        safe: 'just-v2-text',
      };
      const result = sanitize(input);
      result.should.deepEqual({
        value1: 'prefix-v2xtoken',
        value2: 'v2xtoken-suffix',
        value3: 'v2',
        value4: 'v2x',
        safe: 'just-v2-text',
      });
    });

    it('should handle v2 tokens in arrays', function () {
      const input = [
        'v2xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678',
        'safe',
        'v2x1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        123,
        true,
      ];
      const result = sanitize(input);
      result.should.deepEqual(['<REMOVED>', 'safe', '<REMOVED>', 123, true]);
    });

    it('should redact v2 tokens even when key name is not sensitive', function () {
      const input = {
        randomField: 'v2xea99e123bba182f1360ad35529a7a6ae77cfc0bc4e5dcb4f88a6dd4e4bf6a8db',
        anotherField: 'safe-value',
      };
      const result = sanitize(input);
      result.should.deepEqual({
        randomField: '<REMOVED>',
        anotherField: 'safe-value',
      });
    });

    it('should sanitize v2 token with single character key', function () {
      const input = {
        a: 'v2xea99e123bba182f1360ad35529a7a6ae77cfc0bc4e5dcb4f88a6dd4e4bf6a8db',
        b: 'safe-value',
      };
      const result = sanitize(input);
      result.should.deepEqual({
        a: '<REMOVED>',
        b: 'safe-value',
      });
    });
  });

  describe('sanitize() - Case Insensitivity', function () {
    it('should match keywords in ALL CAPS', function () {
      const input = {
        TOKEN: 'val1',
        PASSWORD: 'val2',
        BEARER: 'val3',
        PRV: 'val4',
        safe: 'keepme',
      };

      const result = sanitize(input);
      result.should.deepEqual({
        TOKEN: '<REMOVED>',
        PASSWORD: '<REMOVED>',
        BEARER: '<REMOVED>',
        PRV: '<REMOVED>',
        safe: 'keepme',
      });
    });

    it('should match keywords in mixed case', function () {
      const input = {
        ToKeN: 'val1',
        PaSsWoRd: 'val2',
        BeArEr: 'val3',
        PrV: 'val4',
        safe: 'keepme',
      };

      const result = sanitize(input);
      result.should.deepEqual({
        ToKeN: '<REMOVED>',
        PaSsWoRd: '<REMOVED>',
        BeArEr: '<REMOVED>',
        PrV: '<REMOVED>',
        safe: 'keepme',
      });
    });

    it('should match exact keywords regardless of case', function () {
      const input = {
        Token: 'val1',
        PASSWORD: 'val2',
        Bearer: 'val3',
        accessToken: 'not-matched',
        safe: 'keepme',
      };

      const result = sanitize(input);
      result.should.deepEqual({
        Token: '<REMOVED>',
        PASSWORD: '<REMOVED>',
        Bearer: '<REMOVED>',
        accessToken: 'not-matched',
        safe: 'keepme',
      });
    });
  });

  describe('sanitize() - Performance & Edge Cases', function () {
    it('should handle large objects with many keys efficiently', function () {
      const input: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        input[`key${i}`] = `value${i}`;
      }
      input.token = 'secret';
      input.password = 'secret';

      const start = Date.now();
      const result = sanitize(input);
      const duration = Date.now() - start;

      result.token.should.equal('<REMOVED>');
      result.password.should.equal('<REMOVED>');
      result.key500.should.equal('value500');
      duration.should.be.below(100); // Should complete in < 100ms
    });

    it('should handle objects with many sensitive keys efficiently', function () {
      const input: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        input[`tokenprefix${i}`] = `secret${i}`;
        input[`passwordprefix${i}`] = `secret${i}`;
        input[`safe${i}`] = `value${i}`;
      }
      // Add exact matches
      input.token = 'exact-match';
      input.password = 'exact-match';

      const start = Date.now();
      const result = sanitize(input);
      const duration = Date.now() - start;

      result.token.should.equal('<REMOVED>');
      result.password.should.equal('<REMOVED>');
      result.tokenprefix50.should.equal('secret50');
      result.passwordprefix50.should.equal('secret50');
      result.safe50.should.equal('value50');
      duration.should.be.below(50); // Should complete in < 50ms
    });

    it('should handle empty strings as keys', function () {
      const input = { '': 'value', token: 'secret' };
      const result = sanitize(input);
      result.should.deepEqual({ '': 'value', token: '<REMOVED>' });
    });

    it('should handle special characters in keys - no match for modified keys', function () {
      const input = {
        'token@#$': 'secret',
        token: 'exact',
        'password!': 'secret2',
        password: 'exact2',
        'safe@value': 'keepme',
      };

      const result = sanitize(input);
      result.should.deepEqual({
        'token@#$': 'secret',
        token: '<REMOVED>',
        'password!': 'secret2',
        password: '<REMOVED>',
        'safe@value': 'keepme',
      });
    });

    it('should NOT match token in long key names', function () {
      const longKey = 'this_is_a_very_long_key_name_with_token_in_the_middle_and_more_text';
      const input = { [longKey]: 'secret', token: 'exact', safe: 'value' };
      const result = sanitize(input);
      result[longKey].should.equal('secret');
      result.token.should.equal('<REMOVED>');
      result.safe.should.equal('value');
    });

    it('should NOT match compound keys with multiple sensitive keywords', function () {
      const input = {
        token_password: 'not-matched',
        token: 'exact1',
        password: 'exact2',
        safe: 'keepme',
      };

      const result = sanitize(input);
      result.should.deepEqual({
        token_password: 'not-matched',
        token: '<REMOVED>',
        password: '<REMOVED>',
        safe: 'keepme',
      });
    });
  });

  describe('sanitize() - Real-World BitGo Scenarios', function () {
    it('should sanitize BitGo wallet object with _token', function () {
      const wallet = {
        id: '5f8e9d0c1234567890abcdef',
        label: 'My Trading Wallet',
        coin: 'btc',
        _token: 'v2x1234567890abcdef1234567890abcdef1234567890abcdef',
        balance: 1000000000,
        confirmedBalance: 1000000000,
        spendableBalance: 1000000000,
        _permissions: ['admin', 'spend', 'view'],
        admin: {
          users: [
            { user: 'user1', permissions: ['admin', 'spend'] },
            { user: 'user2', permissions: ['view'] },
          ],
        },
      };

      const result = sanitize(wallet);
      result._token.should.equal('<REMOVED>');
      result.id.should.equal('5f8e9d0c1234567890abcdef');
      result.label.should.equal('My Trading Wallet');
      result.balance.should.equal(1000000000);
    });

    it('should sanitize BitGo API request with exact key matches', function () {
      const request = {
        method: 'POST',
        url: 'https://app.bitgo.com/api/v2/btc/wallet/123/sendcoins',
        headers: {
          bearer: 'Bearer v2x1234567890',
          BearerToken: 'not-matched',
          'Content-Type': 'application/json',
          'User-Agent': 'BitGoJS/1.0.0',
        },
        body: {
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          amount: 100000,
          password: 'my-secure-passphrase',
          walletPassword: 'not-matched',
        },
      };

      const result = sanitize(request);
      result.headers.bearer.should.equal('<REMOVED>');
      result.headers.BearerToken.should.equal('not-matched');
      result.headers['Content-Type'].should.equal('application/json');
      result.body.password.should.equal('<REMOVED>');
      result.body.walletPassword.should.equal('not-matched');
      result.body.address.should.equal('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    });

    it('should sanitize wallet recovery data with exact keys', function () {
      const recoveryData = {
        walletId: 'wallet123',
        userKey: 'xpub123...',
        backupKey: 'xpub456...',
        backupKeyNonce: 'nonce123',
        prv: 'xprv789...',
        recoveryPrivateKey: 'not-matched',
        passcode: 'user-passcode',
        userKeyPath: 'm/0/0',
      };

      const result = sanitize(recoveryData);
      result.prv.should.equal('<REMOVED>');
      result.recoveryPrivateKey.should.equal('not-matched');
      result.walletId.should.equal('wallet123');
      result.userKey.should.equal('xpub123...');
    });

    it('should sanitize MFA/OTP setup data with exact keys', function () {
      const mfaData = {
        userId: 'user123',
        otp: 'JBSWY3DPEHPK3PXP',
        otpSecret: 'not-matched',
        backupCodes: ['code1', 'code2', 'code3'],
        qrCode: 'data:image/png;base64...',
        deviceId: 'device123',
      };

      const result = sanitize(mfaData);
      result.otp.should.equal('<REMOVED>');
      result.otpSecret.should.equal('not-matched');
      result.userId.should.equal('user123');
      result.qrCode.should.equal('data:image/png;base64...');
    });

    it('should sanitize webhook payload with exact token fields', function () {
      const webhook = {
        type: 'transfer',
        walletId: 'wallet123',
        transfer: {
          id: 'transfer123',
          coin: 'btc',
          state: 'confirmed',
        },
        token: 'sha256=abcdef123456',
        authToken: 'not-matched',
        bearer: 'bearer-auth-value',
        bearerAuth: 'not-matched',
        timestamp: 1234567890,
      };

      const result = sanitize(webhook);
      result.token.should.equal('<REMOVED>');
      result.authToken.should.equal('not-matched');
      result.bearer.should.equal('<REMOVED>');
      result.bearerAuth.should.equal('not-matched');
      result.walletId.should.equal('wallet123');
      result.transfer.state.should.equal('confirmed');
    });

    it('should handle Date objects with exact keys', function () {
      const date = new Date('2024-01-01');
      const input = {
        timestamp: date,
        token: 'secret',
        userToken: 'not-matched',
        safe: 'value',
      };

      const result = sanitize(input);
      result.should.have.property('timestamp');
      result.should.have.property('token', '<REMOVED>');
      result.should.have.property('userToken', 'not-matched');
      result.should.have.property('safe', 'value');
    });

    it('should handle Error objects', function () {
      const error = new Error('Test error');
      const input = {
        error: error,
        token: 'secret',
        message: 'safe',
      };

      const result = sanitize(input);
      result.should.have.property('error');
      result.should.have.property('token', '<REMOVED>');
      result.should.have.property('message', 'safe');
    });

    it('should handle complex real-world scenario with exact keys', function () {
      const request = {
        method: 'POST',
        url: '/api/wallet',
        headers: {
          bearer: 'Bearer secret123',
          bearerToken: 'not-matched',
          'content-type': 'application/json',
        },
        body: {
          wallet: {
            id: 'wallet123',
            token: 'v2xtoken',
            _token: 'not-matched',
            balance: 5000000,
          },
          user: {
            id: 'user456',
            email: 'user@example.com',
            password: 'secret',
          },
        },
      };

      const result = sanitize(request);
      result.should.deepEqual({
        method: 'POST',
        url: '/api/wallet',
        headers: {
          bearer: '<REMOVED>',
          bearerToken: 'not-matched',
          'content-type': 'application/json',
        },
        body: {
          wallet: {
            id: 'wallet123',
            token: '<REMOVED>',
            _token: 'not-matched',
            balance: 5000000,
          },
          user: {
            id: 'user456',
            email: 'user@example.com',
            password: '<REMOVED>',
          },
        },
      });
    });
  });
});
