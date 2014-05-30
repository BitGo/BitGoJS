//
// Tests for Keychains
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');
var TestBitGo = require('./test_bitgo');

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

  describe('Create', function() {
    var keychainCount;

    it('arguments', function() {
      assert.throws(function() { keychains.create('invalid'); }); 
      assert.throws(function() { keychains.list(); }); 
      assert.throws(function() { keychains.list('invalid'); }); 
      assert.throws(function() { keychains.add(); }); 
      assert.throws(function() { keychains.add('invalid'); }); 
      assert.throws(function() { keychains.add({}, 0); }); 
    });

    it('keychains', function(done) {
      keychains.list(function(err, keychains) {
        assert.equal(err, null);
        assert.equal(Array.isArray(keychains), true);
        keychainCount = keychains.length;
        done();
      });
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

});
