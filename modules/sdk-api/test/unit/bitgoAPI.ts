import 'should';
import { BitGoAPI } from '../../src/bitgoAPI';

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
    it('http proxy agent shall be created when proxy is set', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
        proxy: 'http://localhost:3000',
      });

      bitgo.should.have.property('_proxy', 'http://localhost:3000');
    });

    it('bitgo api is still initiated when proxy is not set', function () {
      const bitgo = new BitGoAPI({
        env: 'custom',
        customRootURI: 'https://app.example.local',
      });

      bitgo.should.have.property('_proxy', undefined);
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
});
