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

  describe('Unspents', function() {
    it('not implemented', function() {
      assert.throws(function() { wallet1.unspents(function() {}); });
    });
  });

  describe('Transactions', function() {
    it('not implemented', function() {
      assert.throws(function() { wallet1.transactions(function() {}); });
    });
  });

  describe('Send', function() {
    it('not implemented', function() {
      assert.throws(function() { wallet1.send(function() {}); });
    });
  });

});
