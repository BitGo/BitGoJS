//
// Tests for Wallets
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');

describe('Wallets', function() {
  var bitgo;
  var wallets;
  var testWallet;      // Test will create this wallet
  var keychains = [];  // Test will create these keychains

  before(function(done) {
    bitgo = new TestBitGo();
    wallets = bitgo.wallets();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        throw err;
      }
      response.should.have.property('token');
      response.should.have.property('user');
      done();
    });
  });

  describe('List', function() {
    it('arguments', function() {
      assert.throws(function() { wallets.list(); });
      assert.throws(function() { wallets.list('invalid'); });
    });

    it('all', function(done) {
      wallets.list(function(err, wallets) {
        assert.equal(err, null);
        assert.equal(typeof(wallets), 'object');
        done();
      });
    });
  });

  describe('Add', function() {
    var numKeychains = 3;

    before(function() {
      for (var index = 0; index < numKeychains; ++index) {
        keychains.push(bitgo.keychains().create());
      }
    });

    it('arguments', function() {
      assert.throws(function() { wallets.add(); });
      assert.throws(function() { wallets.add('invalid'); });
      assert.throws(function() { wallets.add({}, 0); });
    });

    it('wallet', function(done) {
      var options = {
        label: 'user keychain',
        xpub: keychains[0].xpub,
        encryptedXprv: keychains[0].xprv
      };
      bitgo.keychains().add(options, function(err, keychain) {
        assert.equal(err, null);
        assert.equal(keychain.xpub, keychains[0].xpub);

        var options = {
          label: 'backup keychain',
          xpub: keychains[1].xpub
        };
        bitgo.keychains().add(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, keychains[1].xpub);

          var options = {
            label: 'my wallet',
            m: 2,
            n: 3,
            keychains: [ keychains[0].xpub, keychains[1].xpub ]
          };
          wallets.add(options, function(err, wallet) {
            assert.equal(err, null);
            testWallet = wallet;

            assert.equal(wallet.balance(), 0);
            assert.equal(wallet.label(), 'my wallet');
            assert.equal(wallet.pendingBalance(), 0);
            assert.equal(wallet.availableBalance(), 0);
            assert.equal(wallet.keychains.length, 3);
            assert.equal(bitgo.keychains().isValid(wallet.keychains[0]), true);
            assert.equal(bitgo.keychains().isValid(wallet.keychains[1]), true);
            assert.equal(bitgo.keychains().isValid(wallet.keychains[2]), true);
            assert.equal(wallet.keychains[0], keychains[0].xpub);
            assert.equal(wallet.keychains[1], keychains[1].xpub);
            done();
          });
        });
      });
    });
  });

  describe('Get', function() {
    it('arguments', function() {
      assert.throws(function() { wallets.get('invalid'); });
      assert.throws(function() { wallets.get({}, function() {}); });
      assert.throws(function() { wallets.get({otp: 'foo'}); });
    });

    it('non existent wallet', function(done) {
      var newKey = wallets.createKey();
      var options = {
        type: 'bitcoin',
        address: newKey.address.toString(),
        otp: bitgo.testUserOTP()
      };
      wallets.get(options, function(err, wallet) {
        assert.equal(wallet.address(), options.address);
        assert.equal(wallet.balance(), 0);
        assert.equal(wallet.label(), '');
        assert.equal(wallet.pendingBalance(), 0);
        assert.equal(wallet.availableBalance(), 0);
        done();
      });
    });

    it('get', function(done) {
      var options = {
        type: 'bitcoin',
        address: testWallet.address()
      };
      wallets.get(options, function(err, wallet) {
        assert.equal(err, null);
        assert.equal(wallet.address(), options.address);
        assert.equal(wallet.balance(), 0);
        assert.equal(wallet.label(), 'my wallet');
        assert.equal(wallet.pendingBalance(), 0);
        assert.equal(wallet.availableBalance(), 0);
        assert.equal(wallet.keychains.length, 0);
        done();
      });
    });

    it('get private', function(done) {
      var options = {
        type: 'bitcoin',
        address: testWallet.address(),
        otp: bitgo.testUserOTP()
      };
      wallets.get(options, function(err, wallet) {
        assert.equal(err, null);
        assert.equal(wallet.address(), options.address);
        assert.equal(wallet.balance(), 0);
        assert.equal(wallet.label(), 'my wallet');
        assert.equal(wallet.pendingBalance(), 0);
        assert.equal(wallet.availableBalance(), 0);
        assert.equal(wallet.keychains.length, 3);
        assert.equal(bitgo.keychains().isValid(wallet.keychains[0]), true);
        assert.equal(bitgo.keychains().isValid(wallet.keychains[1]), true);
        assert.equal(bitgo.keychains().isValid(wallet.keychains[2]), true);
        done();
      });
    });
  });

  describe('Chain', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallets.chain('invalid'); });
      assert.throws(function() { wallets.chain({}, function() {}); });
      assert.throws(function() { wallets.chain({otp: 'foo'}); });
      done();
    });

    it('create', function(done) {
      var options = {
        type: 'bitcoin',
        address: testWallet.address()
      };
      wallets.chain(options, function(err, wallet) {
        assert.equal(err, null);
        wallet.should.have.property('path');
        wallet.should.have.property('redeemScript');
        wallet.should.have.property('address');
        assert.notEqual(wallet.address, testWallet.address());
        done();
      });
    });
  });

  describe('Delete', function() {
    it('arguments', function(done) {
      assert.throws(function() { testWallet.delete('invalid'); });
      done();
    });

    it('delete', function(done) {
      testWallet.delete(function(err, status) {
        assert.equal(err, null);
        done();
      });
    });
  });
});
