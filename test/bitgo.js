//
// Tests for BitGo Object
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var should = require('should');
var BitGoJS = require('../src/index');

describe('BitGo', function() {
  describe('bitgo methods', function() {
    it('has version', function() {
      var bitgo = new BitGoJS.BitGo();
      bitgo.should.have.property('version');
    });
  });
});
