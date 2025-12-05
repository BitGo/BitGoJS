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
