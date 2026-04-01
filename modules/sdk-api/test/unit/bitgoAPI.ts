import 'should';
import { BitGoAPI } from '../../src/bitgoAPI';
import { ProxyAgent } from 'proxy-agent';
import * as sinon from 'sinon';
import nock from 'nock';
import type { IHmacAuthStrategy } from '@bitgo/sdk-hmac';
import { GlobalCoinFactory, CoinConstructor } from '@bitgo/sdk-core';

describe('Constructor', function () {
  describe('cookiesPropagationEnabled argument', function () {
    it('cookiesPropagationEnabled is enabled explicitly', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        cookiesPropagationEnabled: true,
      });

      bitgo.should.have.property('cookiesPropagationEnabled');
      bitgo.cookiesPropagationEnabled.should.equal(true);
    });

    it('cookiesPropagationEnabled is disabled explicitly', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        cookiesPropagationEnabled: false,
      });

      bitgo.should.have.property('cookiesPropagationEnabled');
      bitgo.cookiesPropagationEnabled.should.equal(false);
    });

    it('cookiesPropagationEnabled is disabled by default', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
      });

      bitgo.should.have.property('cookiesPropagationEnabled');
      bitgo.cookiesPropagationEnabled.should.equal(false);
    });
  });

  describe('requestIdPrefix argument', function () {
    afterEach(function () {
      nock.cleanAll();
    });

    it('should prepend requestIdPrefix to Request-ID header when set', async function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        requestIdPrefix: 'test-prefix-',
      });

      const scope = nock('https://app.example.local')
        .get('/api/v1/ping')
        .matchHeader('Request-ID', /^test-prefix-/)
        .reply(200, { status: 'ok' });

      await bitgo.ping({
        reqId: {
          toString: () => '12345',
          inc: () => {
            /* mock */
          },
        } as any,
      });

      scope.isDone().should.be.true();
    });

    it('should not modify Request-ID header when requestIdPrefix is not set', async function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
      });

      const scope = nock('https://app.example.local')
        .get('/api/v1/ping')
        .matchHeader('Request-ID', /^12345$/)
        .reply(200, { status: 'ok' });

      await bitgo.ping({
        reqId: {
          toString: () => '12345',
          inc: () => {
            /* mock */
          },
        } as any,
      });

      scope.isDone().should.be.true();
    });

    it('should correctly format Request-ID with prefix and numeric sequence', async function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        requestIdPrefix: 'myapp-v1-',
      });

      const scope = nock('https://app.example.local')
        .get('/api/v1/ping')
        .matchHeader('Request-ID', 'myapp-v1-trace-123')
        .reply(200, { status: 'ok' });

      await bitgo.ping({
        reqId: {
          toString: () => 'trace-123',
          inc: () => {
            /* mock */
          },
        } as any,
      });

      scope.isDone().should.be.true();
    });

    it('should work with empty string prefix', async function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        requestIdPrefix: '',
      });

      const scope = nock('https://app.example.local')
        .get('/api/v1/ping')
        .matchHeader('Request-ID', 'abc-123')
        .reply(200, { status: 'ok' });

      await bitgo.ping({
        reqId: {
          toString: () => 'abc-123',
          inc: () => {
            /* mock */
          },
        } as any,
      });

      scope.isDone().should.be.true();
    });
  });
  describe('http proxy agent', function () {
    it('http proxy agent shall be created when proxy(customProxyagent) is set', function () {
      const customProxyAgent = new ProxyAgent({
        getProxyForUrl: () => 'http://localhost:3000',
      });
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        customProxyAgent,
      });

      bitgo.should.have.property('_customProxyAgent', customProxyAgent);
    });

    it('bitgo api is still initiated when proxy(customProxyAgent) is not set', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
      });

      bitgo.should.have.property('_customProxyAgent', undefined);
    });
  });

  describe('verifyAddress', function () {
    it('should successfully verify a base58 address', function () {
      const bitgo = new BitGoAPI({
        env: 'test',
      });

      bitgo.verifyAddress({ address: '2N6paT2TU4N1XpaZjJiApWJXoeyrL3UWpkZ' }).should.be.true();
    });

    it('should successfully verify a bech32 address', function () {
      const bitgo = new BitGoAPI({
        env: 'test',
      });

      bitgo
        .verifyAddress({ address: 'tb1qguzyk4w6kaqtpsczs5aj0w8r7598jq36egm8e98wqph3rwmex68seslgsg' })
        .should.be.true();
    });
  });

  describe('url', function () {
    it('should return the correct URL for version 1', function () {
      const bitgo = new BitGoAPI({
        env: 'test',
        customRootURI: 'https://test.bitgo.com',
      });
      const path = '/test-path';
      const expectedUrl = 'https://test.bitgo.com/api/v1/test-path';
      const result = bitgo.url(path, 1);
      result.should.equal(expectedUrl);
    });

    it('should return the correct URL for version 2', function () {
      const bitgo = new BitGoAPI({
        env: 'test',
        customRootURI: 'https://test.bitgo.com',
      });
      const path = '/test-path';
      const expectedUrl = 'https://test.bitgo.com/api/v2/test-path';
      const result = bitgo.url(path, 2);
      result.should.equal(expectedUrl);
    });

    it('should return the correct URL for version 3', function () {
      const bitgo = new BitGoAPI({
        env: 'test',
        customRootURI: 'https://test.bitgo.com',
      });
      const path = '/test-path';
      const expectedUrl = 'https://test.bitgo.com/api/v3/test-path';
      const result = bitgo.url(path, 3);
      result.should.equal(expectedUrl);
    });

    it('should default to version 1 if no version is provided', function () {
      const bitgo = new BitGoAPI({
        env: 'test',
        customRootURI: 'https://test.bitgo.com',
      });
      const path = '/test-path';
      const expectedUrl = 'https://test.bitgo.com/api/v1/test-path';
      const result = bitgo.url(path);
      result.should.equal(expectedUrl);
    });
  });

  describe('decryptKeys', function () {
    let bitgo: BitGoAPI;

    beforeEach(function () {
      bitgo = new BitGoAPI({
        env: 'test',
      });
    });

    afterEach(function () {
      sinon.restore();
    });

    it('should throw if no params are provided', function () {
      try {
        // @ts-expect-error - intentionally calling with no params for test
        bitgo.decryptKeys();
        throw new Error('Expected error but got none');
      } catch (e) {
        e.message.should.containEql('Missing parameter');
      }
    });

    it('should throw if walletIdEncryptedKeyPairs is missing', function () {
      try {
        // @ts-expect-error - intentionally missing required param
        bitgo.decryptKeys({ password: 'password123' });
        throw new Error('Expected error but got none');
      } catch (e) {
        e.message.should.containEql('Missing parameter: walletIdEncryptedKeyPairs');
      }
    });

    it('should throw if password is missing', function () {
      try {
        // @ts-expect-error - intentionally missing required param
        bitgo.decryptKeys({ walletIdEncryptedKeyPairs: [] });
        throw new Error('Expected error but got none');
      } catch (e) {
        e.message.should.containEql('Missing parameter: password');
      }
    });

    it('should throw if walletIdEncryptedKeyPairs is not an array', function () {
      try {
        // @ts-expect-error - intentionally providing wrong type
        bitgo.decryptKeys({ walletIdEncryptedKeyPairs: 'not an array', password: 'password123' });
        throw new Error('Expected error but got none');
      } catch (e) {
        e.message.should.equal('walletIdEncryptedKeyPairs must be an array');
      }
    });

    it('should return empty array for empty walletIdEncryptedKeyPairs', function () {
      const result = bitgo.decryptKeys({ walletIdEncryptedKeyPairs: [], password: 'password123' });
      result.should.be.an.Array();
      result.should.be.empty();
    });

    it('should throw if any walletId is missing or not a string', function () {
      try {
        bitgo.decryptKeys({
          walletIdEncryptedKeyPairs: [
            // @ts-expect-error - intentionally missing walletId
            {
              encryptedPrv: 'encrypted-data',
            },
          ],
          password: 'password123',
        });
        throw new Error('Expected error but got none');
      } catch (e) {
        e.message.should.equal('each key pair must have a string walletId');
      }

      try {
        bitgo.decryptKeys({
          walletIdEncryptedKeyPairs: [
            {
              // @ts-expect-error - intentionally providing wrong type
              walletId: 123,
              encryptedPrv: 'encrypted-data',
            },
          ],
          password: 'password123',
        });
        throw new Error('Expected error but got none');
      } catch (e) {
        e.message.should.equal('each key pair must have a string walletId');
      }
    });

    it('should throw if any encryptedPrv is missing or not a string', function () {
      try {
        bitgo.decryptKeys({
          walletIdEncryptedKeyPairs: [
            // @ts-expect-error - intentionally missing encryptedPrv
            {
              walletId: 'wallet-id-1',
            },
          ],
          password: 'password123',
        });
        throw new Error('Expected error but got none');
      } catch (e) {
        e.message.should.equal('each key pair must have a string encryptedPrv');
      }

      try {
        bitgo.decryptKeys({
          walletIdEncryptedKeyPairs: [
            {
              walletId: 'wallet-id-1',
              // @ts-expect-error - intentionally providing wrong type
              encryptedPrv: 123,
            },
          ],
          password: 'password123',
        });
        throw new Error('Expected error but got none');
      } catch (e) {
        e.message.should.equal('each key pair must have a string encryptedPrv');
      }
    });

    it('should return walletIds of keys that failed to decrypt', function () {
      // Create a stub for the decrypt method
      const decryptStub = sinon.stub(bitgo, 'decrypt');

      // Make it succeed for first wallet and fail for second wallet
      decryptStub.onFirstCall().returns('decrypted-key-1');
      decryptStub.onSecondCall().throws(new Error('decryption failed'));

      const result = bitgo.decryptKeys({
        walletIdEncryptedKeyPairs: [
          { walletId: 'wallet-id-1', encryptedPrv: 'encrypted-data-1' },
          { walletId: 'wallet-id-2', encryptedPrv: 'encrypted-data-2' },
        ],
        password: 'password123',
      });

      result.should.be.an.Array();
      result.should.have.length(1);
      result[0].should.equal('wallet-id-2');
    });

    it('should correctly process multiple wallet keys', function () {
      // Create a spy on the decrypt method
      const decryptStub = sinon.stub(bitgo, 'decrypt');

      // Configure the stub to throw for specific wallets
      decryptStub
        .withArgs({ input: 'encrypted-data-2', password: 'password123' })
        .throws(new Error('decryption failed'));
      decryptStub
        .withArgs({ input: 'encrypted-data-4', password: 'password123' })
        .throws(new Error('decryption failed'));
      decryptStub.returns('success'); // Default return for other calls

      const result = bitgo.decryptKeys({
        walletIdEncryptedKeyPairs: [
          { walletId: 'wallet-id-1', encryptedPrv: 'encrypted-data-1' },
          { walletId: 'wallet-id-2', encryptedPrv: 'encrypted-data-2' },
          { walletId: 'wallet-id-3', encryptedPrv: 'encrypted-data-3' },
          { walletId: 'wallet-id-4', encryptedPrv: 'encrypted-data-4' },
        ],
        password: 'password123',
      });

      // Should be called once for each wallet
      decryptStub.callCount.should.equal(4);

      // Should include only the failed wallet IDs
      result.should.be.an.Array();
      result.should.have.length(2);
      result.should.containDeep(['wallet-id-2', 'wallet-id-4']);
    });
  });

  describe('User-Agent header based on environment', function () {
    afterEach(function () {
      nock.cleanAll();
      sinon.restore();
    });

    it('should set User-Agent header when running in Node.js (typeof window === undefined)', async function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        userAgent: 'TestAgent/1.0',
      });

      // Ensure we're in a Node.js environment by verifying window is undefined
      (typeof window).should.equal('undefined');

      const scope = nock('https://app.example.local')
        .get('/api/v1/ping')
        .matchHeader('User-Agent', 'TestAgent/1.0')
        .reply(200, { status: 'ok' });

      await bitgo.ping({
        reqId: {
          toString: () => 'test-123',
          inc: () => {
            /* mock */
          },
        } as any,
      });

      scope.isDone().should.be.true();
    });

    it('should not set User-Agent header when running in browser (typeof window !== undefined)', async function () {
      // Mock the window object to simulate browser environment
      const windowStub = { location: 'mock' };
      (global as any).window = windowStub;

      try {
        const bitgo = new BitGoAPI({
          env: 'custom',
          customRootURI: 'https://app.example.local',
          userAgent: 'TestAgent/1.0',
        });

        const scope = nock('https://app.example.local')
          .get('/api/v1/ping')
          .reply(function () {
            // Verify User-Agent header is NOT set to our custom value
            const userAgent = this.req.headers['user-agent'];
            if (userAgent && userAgent.includes('TestAgent/1.0')) {
              throw new Error('User-Agent should not be set in browser environment');
            }
            return [200, { status: 'ok' }];
          });

        await bitgo.ping({
          reqId: {
            toString: () => 'test-123',
            inc: () => {
              /* mock */
            },
          } as any,
        });

        scope.isDone().should.be.true();
      } finally {
        // Clean up the global window mock
        delete (global as any).window;
      }
    });
  });

  describe('hmacAuthStrategy token lifecycle', function () {
    const ROOT = 'https://app.example.local';

    // Builds a mock strategy whose setToken / clearToken are sinon stubs.
    function makeStrategy(overrides: Partial<IHmacAuthStrategy> = {}): {
      strategy: IHmacAuthStrategy;
      setTokenStub: sinon.SinonStub;
      clearTokenStub: sinon.SinonStub;
    } {
      const setTokenStub = sinon.stub().resolves();
      const clearTokenStub = sinon.stub().resolves();
      const strategy: IHmacAuthStrategy = {
        calculateRequestHeaders: sinon.stub().resolves({ hmac: 'hmac', timestamp: 1, tokenHash: 'hash' }),
        verifyResponse: sinon.stub().resolves({
          isValid: true,
          expectedHmac: 'hmac',
          signatureSubject: '',
          isInResponseValidityWindow: true,
          verificationTime: Date.now(),
        }),
        calculateHMAC: sinon.stub().resolves('hashed-pw'),
        setToken: setTokenStub,
        clearToken: clearTokenStub,
        ...overrides,
      };
      return { strategy, setTokenStub, clearTokenStub };
    }

    afterEach(function () {
      nock.cleanAll();
      sinon.restore();
    });

    describe('authenticate()', function () {
      it('calls setToken with the access_token received from the server', async function () {
        const { strategy, setTokenStub } = makeStrategy();
        const bitgo = new BitGoAPI({ env: 'custom', customRootURI: ROOT, hmacAuthStrategy: strategy });

        nock(ROOT)
          .post('/api/auth/v1/session')
          .reply(200, {
            user: { username: 'test@example.com' },
            access_token: 'v2xmyaccesstoken',
          });

        await bitgo.authenticate({ username: 'test@example.com', password: 'hunter2' });

        setTokenStub.calledOnce.should.be.true();
        setTokenStub.firstCall.args[0].should.equal('v2xmyaccesstoken');
      });

      it('awaits setToken before making ensureEcdhKeychain requests', async function () {
        // This is the core regression test: if setToken is not awaited, the
        // strategy's key material won't be ready before calculateRequestHeaders
        // is called for the GET /user/settings request, and it would throw.
        let keyReady = false;
        const { strategy } = makeStrategy({
          setToken: sinon.stub().callsFake(async () => {
            // Simulate non-trivial async key derivation (like crypto.subtle.importKey).
            await new Promise<void>((resolve) => setImmediate(resolve));
            keyReady = true;
          }),
          calculateRequestHeaders: sinon.stub().callsFake(async () => {
            if (!keyReady) {
              throw new Error('No token available. Call setToken() or restoreToken() first.');
            }
            return { hmac: 'hmac', timestamp: Date.now(), tokenHash: 'hash' };
          }),
        });
        const bitgo = new BitGoAPI({ env: 'custom', customRootURI: ROOT, hmacAuthStrategy: strategy });

        nock(ROOT)
          .post('/api/auth/v1/session')
          .reply(200, {
            user: { username: 'test@example.com' },
            access_token: 'v2xmytoken',
          });
        // The GET /user/settings request made by ensureUserEcdhKeychainIsCreated
        // must succeed — it would throw if setToken wasn't awaited first.
        nock(ROOT)
          .get('/api/v1/user/settings')
          .reply(200, {
            settings: { ecdhKeychain: 'xpub123' },
          });

        await bitgo.authenticate({
          username: 'test@example.com',
          password: 'hunter2',
          ensureEcdhKeychain: true,
        });

        keyReady.should.be.true();
      });
    });

    describe('authenticateWithPasskey()', function () {
      const validPasskey = JSON.stringify({
        id: 'credential-id',
        rawId: 'raw-id',
        type: 'public-key',
        response: {
          authenticatorData: 'auth-data',
          clientDataJSON: 'client-data',
          signature: 'sig',
          userHandle: 'user-handle-123',
        },
      });

      it('calls setToken with the access_token received from the server', async function () {
        const { strategy, setTokenStub } = makeStrategy();
        const bitgo = new BitGoAPI({ env: 'custom', customRootURI: ROOT, hmacAuthStrategy: strategy });

        nock(ROOT)
          .post('/api/auth/v1/session')
          .reply(200, {
            user: { username: 'test@example.com' },
            access_token: 'v2xpasskeytoken',
          });

        await bitgo.authenticateWithPasskey(validPasskey);

        setTokenStub.calledOnce.should.be.true();
        setTokenStub.firstCall.args[0].should.equal('v2xpasskeytoken');
      });
    });

    describe('clearAsync()', function () {
      it('clears _token and calls clearToken on the strategy', async function () {
        const { strategy, clearTokenStub } = makeStrategy();
        const bitgo = new BitGoAPI({ env: 'custom', customRootURI: ROOT, hmacAuthStrategy: strategy });

        bitgo.authenticateWithAccessToken({ accessToken: 'v2xsometoken' });
        (bitgo as any)._token.should.equal('v2xsometoken');

        await bitgo.clearAsync();

        ((bitgo as any)._token === undefined).should.be.true();
        clearTokenStub.calledOnce.should.be.true();
      });
    });

    describe('refreshToken()', function () {
      it('calls setToken with the new access_token from the OAuth response', async function () {
        const { strategy, setTokenStub } = makeStrategy();
        const bitgo = new BitGoAPI({
          env: 'custom',
          customRootURI: ROOT,
          hmacAuthStrategy: strategy,
          clientId: 'client-id',
          clientSecret: 'client-secret',
        });
        (bitgo as any)._refreshToken = 'old-refresh-token';

        nock(ROOT).post('/oauth/token').reply(200, {
          access_token: 'v2xnewtoken',
          refresh_token: 'new-refresh-token',
        });

        await bitgo.refreshToken();

        setTokenStub.calledOnce.should.be.true();
        setTokenStub.firstCall.args[0].should.equal('v2xnewtoken');
      });
    });

    describe('authenticateWithAuthCode()', function () {
      it('calls setToken with the access_token from the OAuth response', async function () {
        const { strategy, setTokenStub } = makeStrategy();
        const bitgo = new BitGoAPI({
          env: 'custom',
          customRootURI: ROOT,
          hmacAuthStrategy: strategy,
          clientId: 'client-id',
          clientSecret: 'client-secret',
        });

        nock(ROOT).post('/oauth/token').reply(200, {
          access_token: 'v2xauthcodetoken',
          refresh_token: 'refresh-token',
        });
        // authenticateWithAuthCode calls this.me() after setting the token
        nock(ROOT)
          .get('/api/v1/user/me')
          .reply(200, {
            user: { username: 'test@example.com' },
          });

        await bitgo.authenticateWithAuthCode({ authCode: 'my-auth-code' });

        setTokenStub.calledOnce.should.be.true();
        setTokenStub.firstCall.args[0].should.equal('v2xauthcodetoken');
      });
    });

    describe('sync token-setting methods', function () {
      it('authenticateWithAccessToken does not call setToken (synchronous — caller must invoke setToken on the strategy manually)', function () {
        const { strategy, setTokenStub } = makeStrategy();
        const bitgo = new BitGoAPI({ env: 'custom', customRootURI: ROOT, hmacAuthStrategy: strategy });

        bitgo.authenticateWithAccessToken({ accessToken: 'v2xsynctoken' });

        setTokenStub.called.should.be.false();
      });

      it('fromJSON does not call setToken (synchronous — caller must invoke setToken on the strategy manually)', function () {
        const { strategy, setTokenStub } = makeStrategy();
        const bitgo = new BitGoAPI({ env: 'custom', customRootURI: ROOT, hmacAuthStrategy: strategy });

        (bitgo as any).fromJSON({ user: { username: 'test@example.com' }, token: 'v2xjsontoken' });

        setTokenStub.called.should.be.false();
      });
    });
  });

  describe('constants parameter', function () {
    it('should allow passing constants via options and expose via fetchConstants', async function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        clientConstants: { maxFeeRate: '123123123123123' },
      });

      const constants = await bitgo.fetchConstants();
      constants.should.have.property('maxFeeRate', '123123123123123');
    });

    it('should refresh constants when cache has expired', async function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
      });

      // Set up cached constants with an expired cache
      (BitGoAPI as any)._constants = (BitGoAPI as any)._constants || {};
      (BitGoAPI as any)._constantsExpire = (BitGoAPI as any)._constantsExpire || {};
      (BitGoAPI as any)._constants['custom'] = { maxFeeRate: 'old-value' };
      (BitGoAPI as any)._constantsExpire['custom'] = new Date(Date.now() - 1000); // Expired 1 second ago

      const scope = nock('https://app.example.local')
        .get('/api/v1/client/constants')
        .reply(200, {
          constants: { maxFeeRate: 'new-value', newConstant: 'added' },
        });

      const constants = await bitgo.fetchConstants();

      // Should return the new constants from the server
      constants.should.have.property('maxFeeRate', 'new-value');
      constants.should.have.property('newConstant', 'added');

      scope.isDone().should.be.true();

      nock.cleanAll();
    });

    it('should use cached constants when cache is still valid', async function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
      });

      // Set up cached constants with a future expiry
      const cachedConstants = { maxFeeRate: 'cached-value', anotherSetting: 'cached-setting' };
      (BitGoAPI as any)._constants = (BitGoAPI as any)._constants || {};
      (BitGoAPI as any)._constantsExpire = (BitGoAPI as any)._constantsExpire || {};
      (BitGoAPI as any)._constants['custom'] = cachedConstants;
      (BitGoAPI as any)._constantsExpire['custom'] = new Date(Date.now() + 5 * 60 * 1000); // Valid for 5 more minutes

      const scope = nock('https://app.example.local')
        .get('/api/v1/client/constants')
        .reply(200, { constants: { shouldNotBeUsed: true } });

      const constants = await bitgo.fetchConstants();

      // Should return the cached constants
      constants.should.deepEqual(cachedConstants);

      // Verify that no HTTP request was made (since cache was valid)
      scope.isDone().should.be.false();

      nock.cleanAll();
    });

    it('should use cached constants when no cache expiry is set', async function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
      });

      // Set up cached constants with no expiry
      const cachedConstants = { maxFeeRate: 'no-expiry-value' };
      (BitGoAPI as any)._constants = (BitGoAPI as any)._constants || {};
      (BitGoAPI as any)._constantsExpire = (BitGoAPI as any)._constantsExpire || {};
      (BitGoAPI as any)._constants['custom'] = cachedConstants;
      (BitGoAPI as any)._constantsExpire['custom'] = undefined;

      const scope = nock('https://app.example.local')
        .get('/api/v1/client/constants')
        .reply(200, { constants: { shouldNotBeUsed: true } });

      const constants = await bitgo.fetchConstants();

      // Should return the cached constants
      constants.should.deepEqual(cachedConstants);

      // Verify that no HTTP request was made (since no expiry means cache is always valid)
      scope.isDone().should.be.false();

      nock.cleanAll();
    });
  });

  describe('registerToken', function () {
    let bitgo: BitGoAPI;
    let sandbox: sinon.SinonSandbox;

    beforeEach(function () {
      bitgo = new BitGoAPI({ env: 'custom', customRootURI: 'https://app.example.local' });
      sandbox = sinon.createSandbox();
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should call GlobalCoinFactory.registerToken and allow sdk.coin() to resolve the registered token', function () {
      const mockCoinInstance = { type: 'test-ams-dynamic-token' } as any;
      const mockConstructor = sandbox.stub().returns(mockCoinInstance) as unknown as CoinConstructor;
      const mockCoinConfig = { name: 'test-ams-dynamic-token', id: 'test-ams-dynamic-token-id' } as any;

      sandbox.stub(GlobalCoinFactory, 'registerToken');
      sandbox.stub(GlobalCoinFactory, 'getInstance').callsFake((_bitgo, name) => {
        if (name === 'test-ams-dynamic-token') {
          return mockConstructor(_bitgo, mockCoinConfig);
        }
        throw new Error(`Unsupported coin: ${name}`);
      });

      bitgo.registerToken(mockCoinConfig, mockConstructor);

      const coin = bitgo.coin('test-ams-dynamic-token');
      coin.should.equal(mockCoinInstance);
      (GlobalCoinFactory.registerToken as sinon.SinonStub)
        .calledOnceWith(mockCoinConfig, mockConstructor)
        .should.be.true();
    });

    it('should be idempotent — calling registerToken twice for same token does not throw', function () {
      const mockCoinConfig = { name: 'test-ams-idempotent-token', id: 'test-ams-idempotent-token-id' } as any;
      const mockConstructor = sandbox.stub() as unknown as CoinConstructor;
      sandbox.stub(GlobalCoinFactory, 'registerToken');

      (() => {
        bitgo.registerToken(mockCoinConfig, mockConstructor);
        bitgo.registerToken(mockCoinConfig, mockConstructor);
      }).should.not.throw();

      (GlobalCoinFactory.registerToken as sinon.SinonStub).callCount.should.equal(2);
    });

    it('should not affect existing statics coins after registerToken calls', function () {
      const newCoinConfig = { name: 'test-ams-new-token', id: 'test-ams-new-token-id' } as any;
      const newConstructor = sandbox.stub() as unknown as CoinConstructor;
      const existingCoinInstance = { type: 'eth' } as any;
      const existingConstructor = sandbox.stub().returns(existingCoinInstance) as unknown as CoinConstructor;

      const registerTokenStub = sandbox.stub(GlobalCoinFactory, 'registerToken');
      sandbox.stub(GlobalCoinFactory, 'getInstance').callsFake((_bitgo, name) => {
        if (name === 'eth') {
          return existingConstructor(_bitgo, undefined);
        }
        throw new Error(`Unsupported coin: ${name}`);
      });

      // Register a new AMS token
      bitgo.registerToken(newCoinConfig, newConstructor);

      // Existing statics coin should still resolve correctly
      const ethCoin = bitgo.coin('eth');
      ethCoin.should.equal(existingCoinInstance);

      // registerToken was called only once (for the new token, not for eth)
      registerTokenStub.calledOnce.should.be.true();
      registerTokenStub.calledWith(newCoinConfig, newConstructor).should.be.true();
    });
  });
});
