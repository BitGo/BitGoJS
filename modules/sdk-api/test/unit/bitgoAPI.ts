import 'should';
import { BitGoAPI } from '../../src/bitgoAPI';
import { ProxyAgent } from 'proxy-agent';
import * as sinon from 'sinon';
import nock from 'nock';

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
});

describe('V4 Token Issuance', function () {
  it('should allow V4 authentication to be configured', function () {
    (() => {
      new BitGoAPI({
        env: 'test',
        authVersion: 4,
      });
    }).should.not.throw();
  });

  it('should validate V4 response structure in addAccessToken', async function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    // Set ecdhXprv so we get past that check
    (bitgo as any)._ecdhXprv =
      'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k';

    // Mock a V4 response with encryptedToken and derivationPath but missing V4-specific 'id' field
    const mockResponse = {
      body: {
        encryptedToken: 'encrypted',
        derivationPath: 'm/999999/0/0',
        // Missing V4-specific 'id' field
        label: 'test-token',
      },
    };

    // Stub handleTokenIssuance to return a token (simulating successful ECDH decryption)
    const handleTokenIssuanceStub = sinon.stub(bitgo, 'handleTokenIssuance').returns({ token: 'decrypted_token' });

    // Stub the request
    const postStub = sinon.stub(bitgo, 'post').returns({
      forceV1Auth: false,
      send: sinon.stub().resolves(mockResponse),
    } as any);

    // Stub verifyResponse to pass
    const verifyResponseStub = sinon.stub().returns(undefined);
    const verifyStub = sinon.stub(require('../../src/api'), 'verifyResponse').callsFake(verifyResponseStub);

    try {
      await bitgo.addAccessToken({
        label: 'test',
        scope: ['wallet:read'],
      });
      throw new Error('Should have thrown validation error');
    } catch (e) {
      e.message.should.match(/Invalid V4 token issuance response/);
    }

    handleTokenIssuanceStub.restore();
    postStub.restore();
    verifyStub.restore();
  });
});

describe('V4 authenticate() flow', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('should store tokenId when V4 login succeeds', async function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    const mockResponseBody = {
      user: { username: 'testuser@example.com', id: 'user123' },
      token_id: 'v4_token_id_12345',
      encryptedToken:
        '{"iv":"test","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"test","ct":"test"}',
      derivationPath: 'm/999999/54719676/90455048',
      encryptedECDHXprv:
        '{"iv":"test","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"test","ct":"test"}',
    };

    const mockResponse = {
      status: 200,
      body: mockResponseBody,
      header: {},
    };

    // Stub the post method
    const postStub = sinon.stub(bitgo, 'post').returns({
      send: sinon.stub().resolves(mockResponse),
    } as any);

    // Stub handleTokenIssuance to return a token
    const handleTokenIssuanceStub = sinon.stub(bitgo, 'handleTokenIssuance').returns({
      token: 'decrypted_signing_key_12345',
      ecdhXprv:
        'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    });

    // Stub verifyResponse
    const verifyResponseStub = sinon.stub().returns(undefined);
    sinon.stub(require('../../src/api'), 'verifyResponse').callsFake(verifyResponseStub);

    const result = await bitgo.authenticate({
      username: 'testuser@example.com',
      password: 'testpassword',
    });

    // Verify tokenId is stored
    (bitgo as any)._tokenId.should.equal('v4_token_id_12345');
    (bitgo as any)._token.should.equal('decrypted_signing_key_12345');

    // Verify response includes the token
    result.should.have.property('access_token', 'decrypted_signing_key_12345');

    postStub.restore();
    handleTokenIssuanceStub.restore();
  });

  it('should not store tokenId for V2 login', async function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 2,
    });

    const mockResponseBody = {
      user: { username: 'testuser@example.com', id: 'user123' },
      // V2 response does not include 'id' field
      encryptedToken:
        '{"iv":"test","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"test","ct":"test"}',
      derivationPath: 'm/999999/54719676/90455048',
      encryptedECDHXprv:
        '{"iv":"test","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"test","ct":"test"}',
    };

    const mockResponse = {
      status: 200,
      body: mockResponseBody,
      header: {},
    };

    const postStub = sinon.stub(bitgo, 'post').returns({
      send: sinon.stub().resolves(mockResponse),
    } as any);

    const handleTokenIssuanceStub = sinon.stub(bitgo, 'handleTokenIssuance').returns({
      token: 'v2_token_hash_12345',
      ecdhXprv:
        'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    });

    const verifyResponseStub = sinon.stub().returns(undefined);
    sinon.stub(require('../../src/api'), 'verifyResponse').callsFake(verifyResponseStub);

    await bitgo.authenticate({
      username: 'testuser@example.com',
      password: 'testpassword',
    });

    // Verify tokenId is NOT set for V2
    const tokenId = (bitgo as any)._tokenId;
    (tokenId === undefined).should.be.true();

    // Verify token is still set
    (bitgo as any)._token.should.equal('v2_token_hash_12345');

    postStub.restore();
    handleTokenIssuanceStub.restore();
  });

  it('should not store tokenId for V3 login', async function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 3,
    });

    const mockResponseBody = {
      user: { username: 'testuser@example.com', id: 'user123' },
      // V3 response does not include 'id' field
      encryptedToken:
        '{"iv":"test","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"test","ct":"test"}',
      derivationPath: 'm/999999/54719676/90455048',
      encryptedECDHXprv:
        '{"iv":"test","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"test","ct":"test"}',
    };

    const mockResponse = {
      status: 200,
      body: mockResponseBody,
      header: {},
    };

    const postStub = sinon.stub(bitgo, 'post').returns({
      send: sinon.stub().resolves(mockResponse),
    } as any);

    const handleTokenIssuanceStub = sinon.stub(bitgo, 'handleTokenIssuance').returns({
      token: 'v3_token_hash_12345',
      ecdhXprv:
        'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    });

    const verifyResponseStub = sinon.stub().returns(undefined);
    sinon.stub(require('../../src/api'), 'verifyResponse').callsFake(verifyResponseStub);

    await bitgo.authenticate({
      username: 'testuser@example.com',
      password: 'testpassword',
    });

    // Verify tokenId is NOT set for V3
    const tokenId = (bitgo as any)._tokenId;
    (tokenId === undefined).should.be.true();

    // Verify token is still set
    (bitgo as any)._token.should.equal('v3_token_hash_12345');

    postStub.restore();
    handleTokenIssuanceStub.restore();
  });
});

describe('V4 serialization', function () {
  it('should serialize tokenId in toJSON()', function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    // Manually set V4 session state
    (bitgo as any)._user = { username: 'testuser@example.com', id: 'user123' };
    (bitgo as any)._token = 'signing_key_12345';
    (bitgo as any)._tokenId = 'v4_token_id_12345';
    (bitgo as any)._ecdhXprv =
      'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k';

    const json = bitgo.toJSON();

    // Verify tokenId is included in serialization
    json.should.have.property('tokenId', 'v4_token_id_12345');
    json.should.have.property('token', 'signing_key_12345');
    json.should.have.property('user');
    json.should.have.property('ecdhXprv');
  });

  it('should deserialize tokenId in fromJSON()', function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    const sessionData = {
      user: { username: 'testuser@example.com', id: 'user123' },
      token: 'signing_key_12345',
      tokenId: 'v4_token_id_12345',
      ecdhXprv:
        'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    };

    bitgo.fromJSON(sessionData);

    // Verify tokenId is restored
    (bitgo as any)._tokenId.should.equal('v4_token_id_12345');
    (bitgo as any)._token.should.equal('signing_key_12345');
    (bitgo as any)._user.should.deepEqual({ username: 'testuser@example.com', id: 'user123' });
    (bitgo as any)._ecdhXprv.should.equal(
      'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k'
    );
  });

  it('should not serialize tokenId for V2/V3', function () {
    const bitgoV2 = new BitGoAPI({
      env: 'test',
      authVersion: 2,
    });

    // Set V2 session state (no tokenId)
    (bitgoV2 as any)._user = { username: 'testuser@example.com', id: 'user123' };
    (bitgoV2 as any)._token = 'v2_token_hash_12345';
    (bitgoV2 as any)._ecdhXprv =
      'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k';

    const json = bitgoV2.toJSON();

    // Verify tokenId is NOT included for V2
    json.should.have.property('token', 'v2_token_hash_12345');
    json.should.have.property('user');
    json.should.have.property('ecdhXprv');

    // tokenId may be present but should be undefined
    const hasTokenId = 'tokenId' in json;
    if (hasTokenId) {
      (json.tokenId === undefined).should.be.true();
    }
  });

  it('should handle round-trip serialization for V4', function () {
    const bitgo1 = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    // Set up V4 session
    (bitgo1 as any)._user = { username: 'testuser@example.com', id: 'user123' };
    (bitgo1 as any)._token = 'signing_key_12345';
    (bitgo1 as any)._tokenId = 'v4_token_id_12345';
    (bitgo1 as any)._ecdhXprv =
      'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k';

    // Serialize
    const json = bitgo1.toJSON();

    // Create new instance and deserialize
    const bitgo2 = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });
    bitgo2.fromJSON(json);

    // Verify all state is preserved
    (bitgo2 as any)._tokenId.should.equal((bitgo1 as any)._tokenId);
    (bitgo2 as any)._token.should.equal((bitgo1 as any)._token);
    (bitgo2 as any)._user.should.deepEqual((bitgo1 as any)._user);
    (bitgo2 as any)._ecdhXprv.should.equal((bitgo1 as any)._ecdhXprv);
  });
});

describe('V4 clear() cleanup', function () {
  it('should clear tokenId when clear() is called', function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    // Set up V4 session
    (bitgo as any)._user = { username: 'testuser@example.com', id: 'user123' };
    (bitgo as any)._token = 'signing_key_12345';
    (bitgo as any)._tokenId = 'v4_token_id_12345';
    (bitgo as any)._ecdhXprv =
      'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k';

    // Verify state is set
    (bitgo as any)._tokenId.should.equal('v4_token_id_12345');
    (bitgo as any)._token.should.equal('signing_key_12345');

    // Call clear
    bitgo.clear();

    // Verify all session state is cleared
    const tokenId = (bitgo as any)._tokenId;
    const token = (bitgo as any)._token;
    const user = (bitgo as any)._user;
    const ecdhXprv = (bitgo as any)._ecdhXprv;

    (tokenId === undefined).should.be.true();
    (token === undefined).should.be.true();
    (user === undefined).should.be.true();
    (ecdhXprv === undefined).should.be.true();
  });

  it('should clear tokenId in logout()', async function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    // Set up V4 session
    (bitgo as any)._user = { username: 'testuser@example.com', id: 'user123' };
    (bitgo as any)._token = 'signing_key_12345';
    (bitgo as any)._tokenId = 'v4_token_id_12345';

    // Stub the get method for logout
    const getStub = sinon.stub(bitgo, 'get').returns({
      result: sinon.stub().resolves({ success: true }),
    } as any);

    await bitgo.logout();

    // Verify all session state is cleared
    const tokenId = (bitgo as any)._tokenId;
    const token = (bitgo as any)._token;
    const user = (bitgo as any)._user;

    (tokenId === undefined).should.be.true();
    (token === undefined).should.be.true();
    (user === undefined).should.be.true();

    getStub.restore();
  });

  it('should not affect V2/V3 clear() behavior', function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 2,
    });

    // Set up V2 session (no tokenId)
    (bitgo as any)._user = { username: 'testuser@example.com', id: 'user123' };
    (bitgo as any)._token = 'v2_token_hash_12345';
    (bitgo as any)._ecdhXprv =
      'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k';

    // Call clear
    bitgo.clear();

    // Verify session state is cleared
    const token = (bitgo as any)._token;
    const user = (bitgo as any)._user;
    const ecdhXprv = (bitgo as any)._ecdhXprv;

    (token === undefined).should.be.true();
    (user === undefined).should.be.true();
    (ecdhXprv === undefined).should.be.true();
  });
});

describe('V4 HMAC calculation', function () {
  it('should use signing key for V4 HMAC calculation', function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    const signingKey = 'signing_key_for_hmac_12345';
    const message = 'test_message_to_hmac';

    const hmac = bitgo.calculateHMAC(signingKey, message);

    // Verify HMAC is calculated (should be a hex string)
    hmac.should.be.a.String();
    hmac.length.should.be.greaterThan(0);
  });

  it('should produce consistent HMAC values for same inputs', function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    const signingKey = 'signing_key_consistent';
    const message = 'consistent_message';

    const hmac1 = bitgo.calculateHMAC(signingKey, message);
    const hmac2 = bitgo.calculateHMAC(signingKey, message);

    hmac1.should.equal(hmac2);
  });

  it('should produce different HMAC values for different signing keys', function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    const signingKey1 = 'signing_key_1';
    const signingKey2 = 'signing_key_2';
    const message = 'same_message';

    const hmac1 = bitgo.calculateHMAC(signingKey1, message);
    const hmac2 = bitgo.calculateHMAC(signingKey2, message);

    hmac1.should.not.equal(hmac2);
  });
});

describe('V4 edge cases', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('should handle missing token_id in V4 response gracefully', async function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    const mockResponseBody = {
      user: { username: 'testuser@example.com', id: 'user123' },
      // Missing 'token_id' field
      encryptedToken:
        '{"iv":"test","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"test","ct":"test"}',
      derivationPath: 'm/999999/54719676/90455048',
      encryptedECDHXprv:
        '{"iv":"test","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"test","ct":"test"}',
    };

    const mockResponse = {
      status: 200,
      body: mockResponseBody,
      header: {},
    };

    const postStub = sinon.stub(bitgo, 'post').returns({
      send: sinon.stub().resolves(mockResponse),
    } as any);

    const handleTokenIssuanceStub = sinon.stub(bitgo, 'handleTokenIssuance').returns({
      token: 'decrypted_signing_key',
      ecdhXprv:
        'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    });

    const verifyResponseStub = sinon.stub().returns(undefined);
    sinon.stub(require('../../src/api'), 'verifyResponse').callsFake(verifyResponseStub);

    await bitgo.authenticate({
      username: 'testuser@example.com',
      password: 'testpassword',
    });

    // Verify tokenId is not set when missing from response
    const tokenId = (bitgo as any)._tokenId;
    (tokenId === undefined).should.be.true();

    // Token should still be set
    (bitgo as any)._token.should.equal('decrypted_signing_key');

    postStub.restore();
    handleTokenIssuanceStub.restore();
  });

  it('should handle fromJSON with missing tokenId field', function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    const sessionData = {
      user: { username: 'testuser@example.com', id: 'user123' },
      token: 'signing_key_12345',
      // tokenId is missing
      ecdhXprv:
        'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    };

    bitgo.fromJSON(sessionData);

    // Should not throw, tokenId should be undefined
    const tokenId = (bitgo as any)._tokenId;
    (tokenId === undefined).should.be.true();

    // Other fields should be restored
    (bitgo as any)._token.should.equal('signing_key_12345');
  });

  it('should handle switching from V2 to V4 session', function () {
    const bitgo = new BitGoAPI({
      env: 'test',
      authVersion: 4,
    });

    // Start with V2 session (no tokenId)
    const v2SessionData = {
      user: { username: 'testuser@example.com', id: 'user123' },
      token: 'v2_token_hash',
      ecdhXprv:
        'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    };

    bitgo.fromJSON(v2SessionData);

    // Verify V2 session loaded
    (bitgo as any)._token.should.equal('v2_token_hash');
    const tokenIdAfterV2 = (bitgo as any)._tokenId;
    (tokenIdAfterV2 === undefined).should.be.true();

    // Now switch to V4 session
    const v4SessionData = {
      user: { username: 'testuser@example.com', id: 'user123' },
      token: 'v4_signing_key',
      tokenId: 'v4_token_id',
      ecdhXprv:
        'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    };

    bitgo.fromJSON(v4SessionData);

    // Verify V4 session loaded
    (bitgo as any)._token.should.equal('v4_signing_key');
    (bitgo as any)._tokenId.should.equal('v4_token_id');
  });
});
