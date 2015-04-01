//
// Tests for Wallets
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');
var HDNode = require('../src/hdnode');

describe('HDNode', function() {

  describe('deriveFromPath', function() {
    
    it('should derive these standard test vectors', function() {
      var hdnode = HDNode.fromSeedBuffer(new Buffer('000102030405060708090a0b0c0d0e0f', 'hex'));
      hdnode.deriveFromPath("m/0'/1").toBase58().should.equal('xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs');
      hdnode.deriveFromPath("m/0'/1/2'/2/1000000000").toBase58().should.equal('xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76');
      hdnode.deriveFromPath("m/0'/1/2'/2/1000000000").neutered().toBase58().should.equal('xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy');
      hdnode = hdnode.deriveFromPath("m/0'/1/2'").neutered();
      hdnode.deriveFromPath("m/2/1000000000").toBase58().should.equal('xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy');
    });
    
  });

});
