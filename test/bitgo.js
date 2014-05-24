//
// Tests for BitGo Object
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');

describe('BitGo', function() {

  describe('methods', function() {
    it('includes version', function() {
      var bitgo = new BitGoJS.BitGo();
      bitgo.should.have.property('version');
      var version = bitgo.version();
      assert.equal(typeof(version), 'string');
    });

    it('includes market', function(done) {
      var bitgo = new BitGoJS.BitGo();
      bitgo.should.have.property('market');
      bitgo.market(function(marketData) {
        marketData.should.have.property('last');
        marketData.should.have.property('bid');
        marketData.should.have.property('ask');
        marketData.should.have.property('volume');
        marketData.should.have.property('high');
        marketData.should.have.property('low');
        done();
      });
    });
  });
});
