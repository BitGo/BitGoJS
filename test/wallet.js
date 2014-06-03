//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');

var TEST_WALLET1_ADDRESS = '2N94kT4NtoGCbBfcfp3K1rEPYNohL3VV8rC';
var TEST_WALLET1_KEY = 'test wallet #1 security';
var TEST_WALLET2_ADDRESS = '2MyGdUWZuxTNnvPZHJFmrpi4cSiSyEe3Ztp';
var TEST_WALLET2_KEY = 'test wallet #2 security'

describe('Wallet', function() {
  var bitgo;
  var wallet1, wallet2;

  before(function(done) {
    bitgo = new TestBitGo();
    wallets = bitgo.wallets();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        throw err;
      }
      response.should.have.property('token');
      response.should.have.property('user');

      // Fetch the first wallet.
      var options = {
        type: 'bitcoin',
        address: TEST_WALLET1_ADDRESS,
        otp: bitgo.testUserOTP()
      };
      wallets.get(options, function(err, wallet) {
        if (err) {
          throw err;
        }
        wallet1 = wallet;

        // Fetch the second wallet
        var options = {
          type: 'bitcoin',
          address: TEST_WALLET2_ADDRESS,
          otp: bitgo.testUserOTP()
        };
        wallets.get(options, function(err, wallet) {
          wallet2 = wallet;
          done();
        });
      });
    });
  });

  describe('CreateAddress', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet2.createAddress('invalid', function() {}); });
      assert.throws(function() { wallet2.createAddress({}); });
      done();
    });

    it('create', function(done) {
      wallet2.createAddress({}, function(err, wallet) {
        assert.equal(err, null);
        wallet.should.have.property('path');
        wallet.should.have.property('redeemScript');
        wallet.should.have.property('address');
        assert.notEqual(wallet.address, wallet2.address());

        // TODO: Verify the chain?
        done();
      });
    });
  });


  describe('Unspents', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.unspents('invalid', function() {}); });
      assert.throws(function() { wallet1.unspents({btcLimit: 'a string!'}, function() {}); });
      assert.throws(function() { wallet1.unspents({}); });
      done();
    });

    it('list', function(done) {
      var options = { limit: 0.5 * 1e8 };
      wallet1.unspents(options, function(err, unspents) {
        assert.equal(err, null);
        assert.equal(Array.isArray(unspents), true);
        done();
      });
    });
  });

  describe('Transactions', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.transactions('invalid', function() {}); });
      assert.throws(function() { wallet1.transactions({}); });
      done();
    });

    it('list', function(done) {
      var options = { };
      wallet1.transactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        assert.equal(result.start, 0);
        result.should.have.property('total');
        result.should.have.property('count');
        done();
      });
    });
  });

  describe('TransactionBuilder', function() {
    it('arguments', function() {
      assert.throws(function() { new TransactionBuilder(); });
      assert.throws(function() { new TransactionBuilder('should not be a string'); });
      assert.throws(function() { new TransactionBuilder({}); });
      assert.throws(function() { new TransactionBuilder({}, 'should not be a string'); });
      assert.throws(function() { new TransactionBuilder({}, {}, 'should not be a string'); });
    });

    it('recipient arguments', function() {
      assert.throws(function() { new TransactionBuilder({}, {address: 123}); });
      assert.throws(function() { new TransactionBuilder({}, {address: 'string', satoshis: 'should not be a string'}); });
    });

    it('fee check', function() {
      assert.throws(function() { new TransactionBuilder({}, {address: 'string', satoshis: 0.5 * 1e8 }); });
    });
  });

  describe('Send', function() {
  });

});
