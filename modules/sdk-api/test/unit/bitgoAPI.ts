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
});
