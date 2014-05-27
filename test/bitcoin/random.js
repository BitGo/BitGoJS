//
// Tests for Bitcoin SecureRandom
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var Bitcoin = require('../../src/index');
var Crypto = require('../../src/bitcoin/crypto-js/index');
var assert = require('assert');

describe('Random', function() {
  it("call", function() {
    var rng = new Bitcoin.SecureRandom();
    var randomArray = new Array(32);
    rng.nextBytes(randomArray);
    assert.equal(randomArray.length, 32);
  });

  it("Crypto.util.randomBytes", function() {
    var randomArray = Crypto.util.randomBytes(32);
    assert.equal(randomArray.length, 32);
  });

  xit("is random", function() {
    // When you figure out how to do this, let me know!
  });
});


