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
  var keychains;

  before(function(done) {
    var bitgo = new TestBitGo();
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

    it('public', function(done) {
      // Generate a new keychain
      var extendedKey = keychains.create();

      var options = {
        label: 'my keychain',
        xpub: extendedKey.xpub,
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
  });

});
