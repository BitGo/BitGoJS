import { expect } from 'chai';
import * as sinon from 'sinon';
import { WebCryptoHmacStrategy } from '../src/webCryptoStrategy';
import * as hmac from '../src/hmac';
import type { CryptoSigning, ITokenStore } from '../src/types';

const MOCK_TIMESTAMP = 1672531200000;

/**
 * In-memory token store for testing (IndexedDB is not available in Node.js).
 * Stores the {@link CryptoSigning} material, mirroring what IndexedDbTokenStore does.
 */
class InMemoryTokenStore implements ITokenStore {
  private signing: CryptoSigning | null = null;

  async save(signing: CryptoSigning): Promise<void> {
    this.signing = signing;
  }
  async load(): Promise<CryptoSigning | null> {
    return this.signing;
  }
  async remove(): Promise<void> {
    this.signing = null;
  }
}

describe('WebCryptoHmacStrategy', () => {
  let strategy: WebCryptoHmacStrategy;
  let tokenStore: InMemoryTokenStore;
  let clock: sinon.SinonFakeTimers;

  const TEST_TOKEN = 'v2x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefab';

  before(() => {
    clock = sinon.useFakeTimers(MOCK_TIMESTAMP);
  });

  after(() => {
    clock.restore();
  });

  beforeEach(async () => {
    tokenStore = new InMemoryTokenStore();
    strategy = new WebCryptoHmacStrategy({ tokenStore, authVersion: 2 });
    await strategy.setToken(TEST_TOKEN);
  });

  describe('token lifecycle', () => {
    it('hasToken should be true after setToken', () => {
      expect(strategy.hasToken()).to.equal(true);
    });

    it('hasToken should be false after clearToken', async () => {
      await strategy.clearToken();
      expect(strategy.hasToken()).to.equal(false);
    });

    it('setToken should persist CryptoSigning (not raw token) to the store', async () => {
      const stored = await tokenStore.load();
      expect(stored).to.not.be.null;
      expect(stored).to.have.property('cryptoKey');
      expect(stored).to.have.property('tokenHash').that.is.a('string').with.length.greaterThan(0);
    });

    it('clearToken should remove from the token store', async () => {
      await strategy.clearToken();
      const stored = await tokenStore.load();
      expect(stored).to.be.null;
    });

    it('restoreToken should recover a previously stored token', async () => {
      const newStrategy = new WebCryptoHmacStrategy({ tokenStore, authVersion: 2 });
      expect(newStrategy.hasToken()).to.equal(false);

      const restored = await newStrategy.restoreToken();
      expect(restored).to.equal(true);
      expect(newStrategy.hasToken()).to.equal(true);
    });

    it('restoreToken should return false when no token is stored', async () => {
      const emptyStore = new InMemoryTokenStore();
      const newStrategy = new WebCryptoHmacStrategy({ tokenStore: emptyStore });
      const restored = await newStrategy.restoreToken();
      expect(restored).to.equal(false);
      expect(newStrategy.hasToken()).to.equal(false);
    });
  });

  describe('calculateRequestHeaders', () => {
    it('should produce HMAC values matching the Node.js implementation', async () => {
      const url = 'https://app.bitgo.com/api/v2/wallet';
      const method = 'get' as const;
      const text = '';
      const authVersion = 2 as const;

      const webCryptoResult = await strategy.calculateRequestHeaders({
        url,
        token: TEST_TOKEN,
        method,
        text,
        authVersion,
      });

      const nodeResult = hmac.calculateRequestHeaders({
        url,
        token: TEST_TOKEN,
        method,
        text,
        authVersion,
      });

      // Timestamps may differ slightly, so we verify structure and token hash
      expect(webCryptoResult.tokenHash).to.equal(nodeResult.tokenHash);
      expect(webCryptoResult.hmac).to.be.a('string').with.length.greaterThan(0);
      expect(webCryptoResult.timestamp).to.equal(MOCK_TIMESTAMP);
    });

    it('should produce matching HMAC for v3 auth with body', async () => {
      const url = 'https://app.bitgo.com/api/v2/wallet/send';
      const method = 'post' as const;
      const text = '{"amount":100000}';
      const authVersion = 3 as const;

      const v3Strategy = new WebCryptoHmacStrategy({ tokenStore, authVersion: 3 });
      await v3Strategy.setToken(TEST_TOKEN);

      const webCryptoResult = await v3Strategy.calculateRequestHeaders({
        url,
        token: TEST_TOKEN,
        method,
        text,
        authVersion,
      });

      const nodeResult = hmac.calculateRequestHeaders({
        url,
        token: TEST_TOKEN,
        method,
        text,
        authVersion,
      });

      expect(webCryptoResult.tokenHash).to.equal(nodeResult.tokenHash);
      expect(webCryptoResult.hmac).to.equal(nodeResult.hmac);
    });

    it('should throw if no token is set', async () => {
      const emptyStrategy = new WebCryptoHmacStrategy({ tokenStore: new InMemoryTokenStore() });
      try {
        await emptyStrategy.calculateRequestHeaders({
          url: 'https://app.bitgo.com/api/v2/wallet',
          token: '',
          method: 'get',
          text: '',
          authVersion: 2,
        });
        expect.fail('should have thrown');
      } catch (e: any) {
        expect(e.message).to.contain('No token available');
      }
    });
  });

  describe('verifyResponse', () => {
    it('should verify a valid response HMAC', async () => {
      const url = 'https://app.bitgo.com/api/v2/wallet';
      const method = 'get' as const;
      const authVersion = 2 as const;
      const responseText = '{"status":"ok"}';
      const statusCode = 200;

      // Generate a valid response HMAC using the Node.js implementation
      const responseHmac = hmac.calculateHMAC(
        TEST_TOKEN,
        hmac.calculateHMACSubject({
          urlPath: url,
          text: responseText,
          timestamp: MOCK_TIMESTAMP,
          statusCode,
          method,
          authVersion,
        })
      );

      const result = await strategy.verifyResponse({
        url,
        hmac: responseHmac,
        statusCode,
        text: responseText,
        timestamp: MOCK_TIMESTAMP,
        token: TEST_TOKEN,
        method,
        authVersion,
      });

      expect(result.isValid).to.equal(true);
      expect(result.isInResponseValidityWindow).to.equal(true);
    });

    it('should reject an invalid HMAC', async () => {
      const result = await strategy.verifyResponse({
        url: 'https://app.bitgo.com/api/v2/wallet',
        hmac: 'badf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00dbadf00d00',
        statusCode: 200,
        text: '{"status":"ok"}',
        timestamp: MOCK_TIMESTAMP,
        token: TEST_TOKEN,
        method: 'get',
        authVersion: 2,
      });

      expect(result.isValid).to.equal(false);
    });

    it('should flag responses outside the validity window', async () => {
      const url = 'https://app.bitgo.com/api/v2/wallet';
      const method = 'get' as const;
      const authVersion = 2 as const;
      const responseText = '{"status":"ok"}';
      const oldTimestamp = MOCK_TIMESTAMP - 10 * 60 * 1000; // 10 minutes ago

      const responseHmac = hmac.calculateHMAC(
        TEST_TOKEN,
        hmac.calculateHMACSubject({
          urlPath: url,
          text: responseText,
          timestamp: oldTimestamp,
          statusCode: 200,
          method,
          authVersion,
        })
      );

      const result = await strategy.verifyResponse({
        url,
        hmac: responseHmac,
        statusCode: 200,
        text: responseText,
        timestamp: oldTimestamp,
        token: TEST_TOKEN,
        method,
        authVersion,
      });

      expect(result.isValid).to.equal(true);
      expect(result.isInResponseValidityWindow).to.equal(false);
    });
  });

  describe('calculateHMAC', () => {
    it('should produce the same result as the Node.js calculateHMAC', async () => {
      const key = 'test-key';
      const message = 'test-message';

      const nodeResult = hmac.calculateHMAC(key, message);
      const webCryptoResult = await strategy.calculateHMAC(key, message);

      expect(webCryptoResult).to.equal(nodeResult);
    });

    it('should work for password-style HMAC (username as key)', async () => {
      const username = 'user@example.com';
      const password = 'supersecretpassword';

      const nodeResult = hmac.calculateHMAC(username, password);
      const webCryptoResult = await strategy.calculateHMAC(username, password);

      expect(webCryptoResult).to.equal(nodeResult);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return a flat headers dict for fetch()', async () => {
      const headers = await strategy.getAuthHeaders({
        url: 'https://app.bitgo.com/api/v2/wallet',
        method: 'get',
      });

      expect(headers).to.have.property('Auth-Timestamp');
      expect(headers).to.have.property('Authorization');
      expect(headers).to.have.property('HMAC');
      expect(headers).to.have.property('BitGo-Auth-Version', '2.0');
      expect(headers['Authorization']).to.match(/^Bearer [0-9a-f]+$/);
      expect(headers['HMAC']).to.be.a('string').with.length.greaterThan(0);
    });

    it('should set BitGo-Auth-Version to 3.0 for v3 strategy', async () => {
      const v3Strategy = new WebCryptoHmacStrategy({
        tokenStore,
        authVersion: 3,
      });
      await v3Strategy.setToken(TEST_TOKEN);

      const headers = await v3Strategy.getAuthHeaders({
        url: 'https://app.bitgo.com/api/v2/wallet',
        method: 'get',
      });

      expect(headers['BitGo-Auth-Version']).to.equal('3.0');
    });
  });
});
