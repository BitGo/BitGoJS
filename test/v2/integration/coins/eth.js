const should = require('should');

const TestV2BitGo = require('../../../lib/test_bitgo');

describe('ETH:', function() {
  let bitgo;

  before(function() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
  });

  describe('Keychains', function() {
    it('should fail to create a key without an enterprise ID', function() {
      const ethKeychains = bitgo.coin('eth').keychains();
      try {
        ethKeychains.createBitGo();
        should.fail();
      } catch (e) {
        e.message.should.include('expecting enterprise when adding BitGo key');
      }
    });
  });
});
