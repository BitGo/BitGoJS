//
// Tests for BitGo Object
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var BitGoJS = require('../src/index');

var should = require('should');
var assert = require('assert');

describe('BitGo', function() {
  describe('bitgo methods', function() {
    it('has version', function() {
      var bitgo = new BitGoJS.BitGo();
      bitgo.should.have.property('version');
      var version = bitgo.version();
      assert.equal(typeof(version), 'string');
    });
  });
});
