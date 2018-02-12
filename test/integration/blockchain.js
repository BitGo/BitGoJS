//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
require('should');

const BitGoJS = require('../../src/index');
const TestBitGo = require('../lib/test_bitgo');

const TEST_ADDRESS1 = '2N4Xz4itCdKKUREiySS7oBzoXUKnuxP4nRD';
const TEST_MANYTRANSACTIONSADDRESS = 'moCVzXCQgrHdZEhwRmkLHYM9N4wq77n5eL';

const TEST_TRANSACTION = 'c82775ab4f266573820f085c7a466591dfb96af689f9ccce9eba7f87020dc6a6';

const TEST_BLOCK = '00000000000000066fff8a67fbb6fac31e9c4ce5b1eabc279ce53218106aa26a';

describe('Address', function() {
  let bitgo;
  let blockchain;

  before(function(done) {
    BitGoJS.setNetwork('testnet');

    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
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
      blockchain.getAddress({ address: TEST_ADDRESS1 }, function(err, address) {
        assert.equal(err, null);
        address.should.have.property('address');
        address.should.have.property('balance');
        address.should.have.property('confirmedBalance');

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
      const options = { address: TEST_ADDRESS1 };
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
      const options = { address: TEST_MANYTRANSACTIONSADDRESS };
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
      assert.throws(function() { blockchain.getAddressUnspents({ limit: 'a string!' }, function() {}); });
      assert.throws(function() { blockchain.getAddressUnspents({}); });
      done();
    });

    it('list', function(done) {
      const options = { address: TEST_ADDRESS1, limit: 0.5 * 1e8 };
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
      blockchain.getTransaction({ id: TEST_TRANSACTION }, function(err, transaction) {
        assert.equal(err, null);
        transaction.should.have.property('id');
        transaction.should.have.property('date');
        transaction.should.have.property('entries');
        assert.equal(Array.isArray(transaction.entries), true);
        assert.equal(transaction.entries.length, 3);
        const transactionEntry = transaction.entries[0];
        transactionEntry.should.have.property('account');
        transactionEntry.should.have.property('value');

        done();
      });
    });
  });

  describe('Get Transaction By Input', function() {
    it('arguments', function(done) {
      assert.throws(function() { blockchain.getTransactionByInput('invalid', function() {}); });
      assert.throws(function() { blockchain.getTransactionByInput({ txid: '90411397fd43aa1e285a0c2b3ac8cb341f26805e14e69264dacf91801d9fd6e2' }, function() {}); });
      assert.throws(function() { blockchain.getTransactionByInput({ vout: 999 }, function() {}); });
      assert.throws(function() { blockchain.getTransactionByInput({ txid: '90411397fd43aa1e285a0c2b3ac8cb341f26805e14e69264dacf91801d9fd6e2', vout: 'asdf' }, function() {}); });
      assert.throws(function() { blockchain.getTransactionByInput({}); });
      assert.throws(function() { blockchain.getTransactionByInput({}, function() {}); });
      done();
    });

    it('get', function(done) {
      blockchain.getTransactionByInput({ txid: TEST_TRANSACTION, vout: 0 }, function(err, result) {
        assert.equal(err, null);
        result.should.have.property('transactions');
        result.transactions.length.should.eql(1);
        const transaction = result.transactions[0];
        transaction.should.have.property('id');
        transaction.should.have.property('date');
        transaction.should.have.property('entries');
        assert.equal(Array.isArray(transaction.entries), true);
        assert.equal(transaction.entries.length, 3);
        const transactionEntry = transaction.entries[0];
        transactionEntry.should.have.property('account');
        transactionEntry.should.have.property('value');

        done();
      });
    });
  });

  describe('Get Block', function() {
    it('arguments', function(done) {
      assert.throws(function() { blockchain.getBlock('invalid', function() {}); });
      assert.throws(function() { blockchain.getBlock({}); });
      assert.throws(function() { blockchain.getBlock({}, function() {}); });
      done();
    });

    it('get', function(done) {
      blockchain.getBlock({ id: TEST_BLOCK }, function(err, block) {
        assert.equal(err, null);
        block.should.have.property('height');
        block.should.have.property('date');
        block.should.have.property('previous');
        block.should.have.property('transactions');
        block.height.should.eql(326945);
        block.previous.should.eql('00000000eecd159babde9b094c6dbf1f4f63028ba100f6f092cacb65f04afc46');
        block.transactions.should.include('e393422e5a0b4c011f511cf3c5911e9c09defdcadbcf16ceb12a47a80e257aaa');
        done();
      });
    });
  });
});
