//
// Tests for Wallets
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

require('should');
const bitcoin = require('../src/bitcoin');
const HDNode = bitcoin.HDNode;

describe('HDNode', function() {

  describe('derive', function() {

    it('should derive these standard test vectors', function() {
      let hdnode = HDNode.fromSeedBuffer(new Buffer('000102030405060708090a0b0c0d0e0f', 'hex'));
      let hdpath = bitcoin.hdPath(hdnode);
      hdpath.derive('m/0/0').toBase58().should.equal('xprv9ww7sMFLzJMzur2oEQDB642fbsMS4q6JRraMVTrM9bTWBq7NDS8ZpmsKVB4YF3mZecqax1fjnsPF19xnsJNfRp4RSyexacULXMKowSACTRc');
      hdpath.derive("m/0'/1").toBase58().should.equal('xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs');
      hdpath.derive("m/0'/1/2'/2/1000000000").toBase58().should.equal('xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76');
      hdpath.derive("m/0'/1/2'/2/1000000000").neutered().toBase58().should.equal('xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy');
      hdnode = hdpath.derive("m/0'/1/2'").neutered();
      bitcoin.hdPath(hdnode).derive('m/2/1000000000').toBase58().should.equal('xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy');

      // make sure caching does not overcache
      let hdnode2 = HDNode.fromSeedBuffer(new Buffer('000102030405060708090a0b0c0d0e0e', 'hex'));
      hdpath = bitcoin.hdPath(hdnode2);
      hdpath.derive('m/0/0').toBase58().should.equal('xprv9wTW8JGaw3LLpqYG35f4WdWA7yF5UFNsp5QptdwhU2uy7XarRUrZx2AbPft7VocxAdVmYxviYvhJbV1EeY2yiDKu8gSipwUE6TZoQsjLALL');
      hdnode2 = hdpath.derive("m/0'/1/2'").neutered();
      bitcoin.hdPath(hdnode2).derive('m/2/1000000000').toBase58().should.equal('xpub6FiKNEcQ25UZV3FU9qXu46i5nvoAA6zWRxa93zWAdZTT2JYa5fRDR6BJzyvbZNgNNVTesr3iEFnRrKcqkUNewig4aARKBH4AUxft5YXTG9X');
    });

    it('uses caching for previously derived keys (hardened)', function() {
      const hdnode = HDNode.fromSeedBuffer(new Buffer('000103030405060708090a0b0c0d0e0f', 'hex'));
      const hdpath = bitcoin.hdPath(hdnode);
      hdpath.derive("m/1/2'/3/4").toBase58().should.equal('xprvA1PudVPRZQFcfftzuHtMGwhs3siwHTKz2YjoJcVchrz7eugyW8riiaxYRyg1oXdzGxgFQ1Nz4Smokj7pi8NsWYTQwNqWXiRde2Jv37XwnDX');
      for (let i = 0; i < 1000; i++) {
        hdpath.derive("m/1/2'/3/4").toBase58().should.equal('xprvA1PudVPRZQFcfftzuHtMGwhs3siwHTKz2YjoJcVchrz7eugyW8riiaxYRyg1oXdzGxgFQ1Nz4Smokj7pi8NsWYTQwNqWXiRde2Jv37XwnDX');
      }
    });

    it('uses caching for previously derived keys (public)', function() {
      const hdnode = HDNode.fromSeedBuffer(new Buffer('000103030405060708090a0b0c0d0e0f', 'hex')).neutered();
      const hdpath = bitcoin.hdPath(hdnode);
      hdpath.derive('m/0/1/2/3').toBase58().should.equal('xpub6F46ySPYeyfcJzEZVS2zWVnx4ai5eSRbFXkdm3DCezF8jT1zE35L4SJbsMPyCSbyWppi9tuSH6PzAMxe5vWHPR8Bpstt3tyw5GBqeSXQLB5');
      for (let i = 0; i < 1000; i++) {
        hdpath.derive('m/0/1/2/3').toBase58().should.equal('xpub6F46ySPYeyfcJzEZVS2zWVnx4ai5eSRbFXkdm3DCezF8jT1zE35L4SJbsMPyCSbyWppi9tuSH6PzAMxe5vWHPR8Bpstt3tyw5GBqeSXQLB5');
      }
    });
  });

});
