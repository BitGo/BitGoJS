//
// Tests for Keychains
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');

describe('Keychains', function() {
  var bitgo;
  var keychains;

  before(function(done) {
    bitgo = new TestBitGo();
    keychains = bitgo.keychains();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        throw err;
      }
      response.should.have.property('token');
      response.should.have.property('user');
      done();
    });
  });

  describe('Local', function() {
    it('isValid', function() {
      assert.equal(keychains.isValid(''), false);
      assert.equal(keychains.isValid('hello world'), false);
      assert.equal(keychains.isValid('xpub123123'), false);
      assert.equal(keychains.isValid('xprv123123'), false);

      assert.equal(keychains.isValid('xpub661MyMwAqRbcH5xFjpBfCe74cj5tks4nxE8hSMepNfsMVsBkx8eT1m9mnR1tAMGdbbdsE8yMDcuZ3NgVJbTzCYDiu8rcc3sqLF6vzi9yfTB'), true);
      assert.equal(keychains.isValid('xprv9s21ZrQH143K2hrPzWSx6ZXUbcq6Skc22ZsACrjzx6wae8fV63x9gbixpv89ssBvcYLju8BSbjSVF1q2DM1BnFdhi65fgbYrS5WE9UzZaaw'), true);
    });

    it('create', function() {
      var seed = BitGoJS.Util.hexToBytes('1234567890');
      assert.equal(keychains.create(seed).xprv, 'xprv9s21ZrQH143K2hrPzWSx6ZXUbcq6Skc22ZsACrjzx6wae8fV63x9gbixpv89ssBvcYLju8BSbjSVF1q2DM1BnFdhi65fgbYrS5WE9UzZaaw');
    });
  });

  describe('List', function() {
    it('arguments', function() {
      assert.throws(function() { keychains.list(); });
      assert.throws(function() { keychains.list('invalid'); });
    });

    it('all', function(done) {
      keychains.list(function(err, keychains) {
        assert.equal(err, null);
        assert.equal(Array.isArray(keychains), true);
        done();
      });
    });
  });

  describe('Get', function() {
    it('arguments', function() {
      assert.throws(function() { keychains.get('invalid'); });
      assert.throws(function() { keychains.get({}, function() {}); });
      assert.throws(function() { keychains.get({otp: 'foo'}); });
    });

    it('non existent keychain', function(done) {
      var newKey = keychains.create();
      var options = {
        xpub: newKey.xpub,
        otp: bitgo.testUserOTP()
      };
      keychains.get(options, function(err, keychain) {
        assert.ok(err);
        done();
      });
    });
  });

  describe('Add', function() {
    it('arguments', function() {
      assert.throws(function() { keychains.create('invalid'); });
      assert.throws(function() { keychains.add(); });
      assert.throws(function() { keychains.add('invalid'); });
      assert.throws(function() { keychains.add({}, 0); });
    });

    describe('public', function() {
      var extendedKey;

      before(function() {
        // Generate a new keychain
        extendedKey = keychains.create();
      });

      it('add', function(done) {
        var options = {
          label: 'my keychain',
          xpub: extendedKey.xpub
        };
        keychains.add(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.label, 'my keychain');
          assert.equal(keychain.index, 100);
          assert.equal(keychain.path, 'm');
          done();
        });
      });

      it('get', function(done) {
        var options = {
          xpub: extendedKey.xpub,
          otp: bitgo.testUserOTP()
        };
        keychains.get(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.label, 'my keychain');
          assert.equal(keychain.index, 100);
          assert.equal(keychain.path, 'm');
          done();
        });
      });
    });

    describe('private', function() {
      var extendedKey;

      before(function() {
        // Generate a new keychain
        extendedKey = keychains.create();
      });

      it('add', function(done) {
        var options = {
          label: 'my keychain',
          xpub: extendedKey.xpub,
          encryptedXprv: 'xyzzy'    // TODO - add encryption!
        };
        keychains.add(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.label, 'my keychain');
          assert.equal(keychain.index, 100);
          assert.equal(keychain.path, 'm');
          assert.equal(keychain.encryptedXprv, 'xyzzy');
          done();
        });
      });

      it('get', function(done) {
        var options = {
          xpub: extendedKey.xpub,
          otp: bitgo.testUserOTP()
        };
        keychains.get(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, extendedKey.xpub);
          assert.equal(keychain.label, 'my keychain');
          assert.equal(keychain.index, 100);
          assert.equal(keychain.path, 'm');
          assert.equal(keychain.encryptedXprv, 'xyzzy');
          done();
        });
      });
    });
  });

  describe('Update', function() {
    var newKey;

    before(function() {
      newKey = keychains.create();
    });

    it('arguments', function() {
      assert.throws(function() { keychains.get('invalid'); });
      assert.throws(function() { keychains.get({}, function() {}); });
      assert.throws(function() { keychains.get({otp: 'foo'}); });
    });

    it('non existent keychain', function(done) {
      var options = {
        xpub: newKey.xpub,
        otp: bitgo.testUserOTP()
      };
      keychains.get(options, function(err, keychain) {
        assert.ok(err);
        done();
      });
    });

    it('update ', function(done) {
      var options = {
        label: 'my keychain',
        xpub: newKey.xpub,
        otp: bitgo.testUserOTP()
      };
      keychains.add(options, function(err, keychain) {
        assert.equal(err, null);
        assert.equal(keychain.xpub, newKey.xpub);
        assert.equal(keychain.label, 'my keychain');
        assert.equal(keychain.index, 100);
        assert.equal(keychain.path, 'm');

        options.label = 'new label';
        options.encryptedXprv = 'abracadabra';
        options.otp = bitgo.testUserOTP();
        keychains.update(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, newKey.xpub);
          assert.equal(keychain.label, 'new label');
          assert.equal(keychain.encryptedXprv, 'abracadabra');
          assert.equal(keychain.index, 100);
          assert.equal(keychain.path, 'm');

          done();
        });
      });
    });

  });


});
