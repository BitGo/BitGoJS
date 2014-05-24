var should = require('should');
var BitGoJS = require('../src/bitgo');

describe('BitGo', function() {
  describe('bitgo methods', function() {
    it('has version', function() {
      var bitgo = new BitGoJS.BitGo();
      bitgo.should.have.property('version');
    });
  });
});
