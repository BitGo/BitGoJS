//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');

var TEST_ADDRESS1 = '2N4Xz4itCdKKUREiySS7oBzoXUKnuxP4nRD';
var TEST_MANYTRANSACTIONSADDRESS = 'moCVzXCQgrHdZEhwRmkLHYM9N4wq77n5eL';

var TEST_TRANSACTION = 'c82775ab4f266573820f085c7a466591dfb96af689f9ccce9eba7f87020dc6a6';

describe('Address', function() {
  var bitgo;
  var blockchain;

  before(function(done) {
    BitGoJS.setNetwork('testnet');

    bitgo = new TestBitGo();
    blockchain = bitgo.blockchain();
    done();
  });

  describe('Get Address', function() {
    it('arguments', function(done) {
      assert.throws(function() { blockchain.getAddress('invalid', function() {}); });
      assert.throws(function() { blockchain.getAddress({}); });
      done();
    });

    it('get', function(done) {
      blockchain.getAddress({address: TEST_ADDRESS1}, function(err, address) {
        assert.equal(err, null);
        address.should.have.property('address');
        address.should.have.property('balance');
        address.should.have.property('pendingBalance');

        done();
      });
    });
  });

  describe('Get Address Transactions', function() {
    it('arguments', function(done) {
      assert.throws(function() { blockchain.getAddressTransactions('invalid', function() {}); });
      assert.throws(function() { blockchain.getAddressTransactions({}); });
      done();
    });

    it('list', function(done) {
      var options = { address: TEST_ADDRESS1 };
      blockchain.getAddressTransactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        assert.equal(result.start, 0);
        result.should.have.property('total');
        result.should.have.property('count');
        done();
      });
    });

    it('list_many_transactions', function(done) {
      var options = { address: TEST_MANYTRANSACTIONSADDRESS };
      blockchain.getAddressTransactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        assert.equal(result.start, 0);
        result.should.have.property('total');
        result.should.have.property('count');
        assert(result.transactions.length > 20);
        assert.equal(result.transactions.length, result.count);
        assert(result.total > 75);
        done();
      });
    });
  });

  describe('Get Address Unspents', function() {
    it('arguments', function(done) {
      assert.throws(function() { blockchain.getAddressUnspents('invalid', function() {}); });
      assert.throws(function() { blockchain.getAddressUnspents({btcLimit: 'a string!'}, function() {}); });
      assert.throws(function() { blockchain.getAddressUnspents({}); });
      done();
    });

    it('list', function(done) {
      var options = { address: TEST_ADDRESS1, limit: 0.5 * 1e8 };
      blockchain.getAddressUnspents(options, function(err, unspents) {
        assert.equal(err, null);
        assert.equal(Array.isArray(unspents), true);
        done();
      });
    });
  });

  describe('Get Transaction', function() {
    it('arguments', function(done) {
      assert.throws(function() { blockchain.getTransaction('invalid', function() {}); });
      assert.throws(function() { blockchain.getTransaction({}); });
      assert.throws(function() { blockchain.getTransaction({}, function() {}); });
      done();
    });

    it('get', function(done) {
      blockchain.getTransaction({id: TEST_TRANSACTION}, function(err, transaction) {
        assert.equal(err, null);
        transaction.should.have.property('id');
        transaction.should.have.property('date');
        transaction.should.have.property('entries');
        assert.equal(Array.isArray(transaction.entries), true);
        assert.equal(transaction.entries.length, 3);
        var transactionEntry = transaction.entries[0];
        transactionEntry.should.have.property('account');
        transactionEntry.should.have.property('value');

        done();
      });
    });
  });
});
