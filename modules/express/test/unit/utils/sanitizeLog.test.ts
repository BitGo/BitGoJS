/**
 * @prettier
 */

import { sanitize } from '../../../src/utils/sanitizeLog';
import 'should';

describe('sanitizeLog', () => {
  describe('sensitive field removal', () => {
    it('should remove token field', () => {
      const input = { token: 'secret123', name: 'John' };
      const result = sanitize(input);
      result.should.eql({ name: 'John' });
      (result as any).should.not.have.property('token');
    });

    it('should remove _token field (underscore prefix)', () => {
      const input = { _token: 'v2x54ef119d44dbdc76069d19d41f70c48ef5ea344215b5edc36552e1ba648d9d88', name: 'John' };
      const result = sanitize(input);
      result.should.eql({ name: 'John' });
      (result as any).should.not.have.property('_token');
    });

    it('should remove all token variations', () => {
      const input = {
        accessToken: 'abc',
        refreshToken: 'def',
        bearerToken: 'ghi',
        authToken: 'jkl',
        normalField: 'safe',
      };
      const result = sanitize(input);
      result.should.eql({ normalField: 'safe' });
      (result as any).should.not.have.property('accessToken');
      (result as any).should.not.have.property('refreshToken');
      (result as any).should.not.have.property('bearerToken');
      (result as any).should.not.have.property('authToken');
    });

    it('should remove password fields', () => {
      const input = {
        password: 'mypass',
        userPassword: 'p2',
        passphrase: 'phrase',
        passwd: 'p3',
        name: 'safe',
      };
      const result = sanitize(input);
      result.should.eql({ name: 'safe' });
      (result as any).should.not.have.property('password');
      (result as any).should.not.have.property('userPassword');
      (result as any).should.not.have.property('passphrase');
      (result as any).should.not.have.property('passwd');
    });

    it('should remove key fields', () => {
      const input = {
        privateKey: 'k1',
        secretKey: 'k2',
        apiKey: 'k3',
        prv: 'k4',
        keychain: 'k5',
        name: 'safe',
      };
      const result = sanitize(input);
      result.should.eql({ name: 'safe' });
      (result as any).should.not.have.property('privateKey');
      (result as any).should.not.have.property('secretKey');
      (result as any).should.not.have.property('apiKey');
      (result as any).should.not.have.property('prv');
      (result as any).should.not.have.property('keychain');
    });

    it('should be case-insensitive', () => {
      const input = { TOKEN: 'abc', Token: 'def', ToKeN: 'ghi', name: 'safe' };
      const result = sanitize(input);
      result.should.eql({ name: 'safe' });
      (result as any).should.not.have.property('TOKEN');
      (result as any).should.not.have.property('Token');
      (result as any).should.not.have.property('ToKeN');
    });

    it('should remove clientSecret and clientId', () => {
      const input = {
        clientSecret: 'secret',
        clientId: 'id123',
        client_secret: 'secret2',
        client_id: 'id456',
        name: 'safe',
      };
      const result = sanitize(input);
      result.should.eql({ name: 'safe' });
      (result as any).should.not.have.property('clientSecret');
      (result as any).should.not.have.property('clientId');
      (result as any).should.not.have.property('client_secret');
      (result as any).should.not.have.property('client_id');
    });

    it('should remove mnemonic and seed fields', () => {
      const input = {
        mnemonic: 'word1 word2 word3',
        seed: 'seedphrase',
        seedPhrase: 'phrase',
        name: 'safe',
      };
      const result = sanitize(input);
      result.should.eql({ name: 'safe' });
      (result as any).should.not.have.property('mnemonic');
      (result as any).should.not.have.property('seed');
      (result as any).should.not.have.property('seedPhrase');
    });

    it('should remove signature and otp fields', () => {
      const input = {
        signature: 'sig123',
        otp: '123456',
        otpCode: '654321',
        name: 'safe',
      };
      const result = sanitize(input);
      result.should.eql({ name: 'safe' });
      (result as any).should.not.have.property('signature');
      (result as any).should.not.have.property('otp');
      (result as any).should.not.have.property('otpCode');
    });
  });

  describe('nested objects', () => {
    it('should sanitize deeply nested objects', () => {
      const input = {
        user: {
          name: 'John',
          credentials: {
            token: 'secret',
            apiKey: 'key123',
          },
        },
        safe: 'data',
      };
      const result = sanitize(input);
      result.should.eql({
        user: {
          name: 'John',
          credentials: {},
        },
        safe: 'data',
      });
    });

    it('should handle the BitGo wallet case from real logs', () => {
      const input = {
        wallet: {
          id: 'wallet123',
          bitgo: {
            _token: 'v2x-secret-token',
            _baseUrl: 'https://app.bitgo-test.com',
          },
        },
        amount: 100,
      };
      const result = sanitize(input);
      result.should.eql({
        wallet: {
          id: 'wallet123',
          bitgo: {
            _baseUrl: 'https://app.bitgo-test.com',
          },
        },
        amount: 100,
      });
      (result.wallet.bitgo as any).should.not.have.property('_token');
    });

    it('should handle very deep nesting', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  token: 'deep-secret',
                  safe: 'visible',
                },
              },
            },
          },
        },
      };
      const result = sanitize(input);
      result.should.eql({
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  safe: 'visible',
                },
              },
            },
          },
        },
      });
    });
  });

  describe('circular references', () => {
    it('should handle direct circular references', () => {
      const input: any = { name: 'Test' };
      input.self = input;
      const result = sanitize(input);
      result.should.have.property('name', 'Test');
      result.should.have.property('self', '[Circular]');
    });

    it('should handle nested circular references', () => {
      const parent: any = { name: 'Parent' };
      const child: any = { name: 'Child', parent };
      parent.child = child;
      const result = sanitize(parent);
      result.should.have.property('name', 'Parent');
      result.child.should.have.property('name', 'Child');
      result.child.parent.should.equal('[Circular]');
    });

    it('should handle circular references with sensitive fields', () => {
      const obj: any = { token: 'secret', name: 'Test' };
      obj.self = obj;
      const result = sanitize(obj);
      result.should.eql({ name: 'Test', self: '[Circular]' });
      (result as any).should.not.have.property('token');
    });
  });

  describe('arrays', () => {
    it('should sanitize arrays of objects', () => {
      const input = {
        users: [
          { name: 'Alice', token: 's1' },
          { name: 'Bob', apiKey: 's2' },
        ],
      };
      const result = sanitize(input);
      result.should.eql({
        users: [{ name: 'Alice' }, { name: 'Bob' }],
      });
    });

    it('should handle nested arrays', () => {
      const input = {
        data: [[{ token: 'a', value: 1 }], [{ password: 'b', value: 2 }]],
      };
      const result = sanitize(input);
      result.should.eql({
        data: [[{ value: 1 }], [{ value: 2 }]],
      });
    });

    it('should handle arrays with mixed types', () => {
      const input = {
        mixed: ['string', 123, { token: 'secret', safe: 'data' }, [1, 2, 3]],
      };
      const result = sanitize(input);
      result.should.eql({
        mixed: ['string', 123, { safe: 'data' }, [1, 2, 3]],
      });
    });
  });

  describe('primitives', () => {
    it('should return primitives unchanged', () => {
      sanitize('string').should.equal('string');
      sanitize(123).should.equal(123);
      sanitize(true).should.equal(true);
      sanitize(false).should.equal(false);
      (sanitize(null) === null).should.be.true();
      (sanitize(undefined) === undefined).should.be.true();
    });

    it('should handle empty strings and numbers', () => {
      sanitize('').should.equal('');
      sanitize(0).should.equal(0);
      sanitize(-1).should.equal(-1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects', () => {
      const result = sanitize({});
      result.should.eql({});
    });

    it('should handle empty arrays', () => {
      const result = sanitize([]);
      result.should.eql([]);
    });

    it('should handle objects with only sensitive fields', () => {
      const input = {
        token: 'a',
        password: 'b',
        apiKey: 'c',
      };
      const result = sanitize(input);
      result.should.eql({});
      (result as any).should.not.have.property('token');
      (result as any).should.not.have.property('password');
      (result as any).should.not.have.property('apiKey');
    });

    it('should handle max depth protection', () => {
      // Create a very deep object (200 levels)
      let deep: any = { value: 'bottom' };
      for (let i = 0; i < 200; i++) {
        deep = { nested: deep };
      }

      // Should not throw and should handle gracefully
      const result = sanitize(deep);
      result.should.be.an.Object();
    });

    it('should preserve safe fields that contain sensitive keywords in values', () => {
      const input = {
        description: 'This is a token description',
        note: 'Remember your password',
        value: 'key-value-pair',
      };
      const result = sanitize(input);
      result.should.eql({
        description: 'This is a token description',
        note: 'Remember your password',
        value: 'key-value-pair',
      });
    });
  });

  describe('real-world scenarios', () => {
    it('should sanitize Express request-like objects', () => {
      const input = {
        method: 'POST',
        url: '/api/wallet',
        headers: {
          authorization: 'Bearer secret-token',
          'content-type': 'application/json',
          'x-custom': 'value',
        },
        body: {
          walletId: 'w123',
          passphrase: 'secret-pass',
        },
      };
      const result = sanitize(input);
      result.should.eql({
        method: 'POST',
        url: '/api/wallet',
        headers: {
          'content-type': 'application/json',
          'x-custom': 'value',
        },
        body: {
          walletId: 'w123',
        },
      });
      (result.headers as any).should.not.have.property('authorization');
      (result.body as any).should.not.have.property('passphrase');
    });

    it('should sanitize BitGo transaction params', () => {
      const input = {
        coin: 'btc',
        txPrebuild: {
          txHex: '01000000...',
          tx: {
            inputs: [{ address: 'addr1' }],
            outputs: [{ address: 'addr2' }],
          },
        },
        wallet: {
          _id: 'w123',
          bitgo: {
            _token: 'v2x123...', // This should be removed
            _baseUrl: 'https://bitgo.com',
          },
        },
        prv: 'xprv123...', // This should be removed
      };
      const result = sanitize(input);
      result.should.eql({
        coin: 'btc',
        txPrebuild: {
          txHex: '01000000...',
          tx: {
            inputs: [{ address: 'addr1' }],
            outputs: [{ address: 'addr2' }],
          },
        },
        wallet: {
          _id: 'w123',
          bitgo: {
            _baseUrl: 'https://bitgo.com',
          },
        },
      });
      (result as any).should.not.have.property('prv');
      (result.wallet.bitgo as any).should.not.have.property('_token');
    });
  });
});
