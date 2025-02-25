import 'should';
import { BitGoAPI } from '../../src/bitgoAPI';
import { ProxyAgent } from 'proxy-agent';

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
});
