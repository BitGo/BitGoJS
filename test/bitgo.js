//
// Tests for BitGo Object
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');

describe('BitGo', function() {

  describe('Constructor', function() {
    it('arguments', function() {
      assert.throws(function() { new BitGoJS.BitGo('invalid'); });
    });

    it('methods', function() {
      var bitgo = new TestBitGo();
      bitgo.should.have.property('version');
      bitgo.should.have.property('market');
      bitgo.should.have.property('authenticate');
      bitgo.should.have.property('logout');
      bitgo.should.have.property('me');
      bitgo.should.have.property('encrypt');
      bitgo.should.have.property('decrypt');
    });
  });

  describe('Version', function() {
    it('version', function() {
      var bitgo = new TestBitGo();
      var version = bitgo.version();
      assert.equal(typeof(version), 'string');
    });
  });

  describe('Verify Address', function() {
    var bitgo;
    before(function() {
      bitgo = new BitGoJS.BitGo();
    });

    it('errors', function() {
      assert.throws(function() {bitgo.verifyAddress(); });
      assert.throws(function() {bitgo.verifyAddress({}); });

      assert.equal(bitgo.verifyAddress('xyzzy'), false);
    });

    it('standard', function() {
      BitGoJS.setNetwork('prod');
      assert.equal(bitgo.verifyAddress('1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd'), true);
      BitGoJS.setNetwork('testnet');
      assert.equal(bitgo.verifyAddress('n4DNhSiEaodqaiF9tLYXTCh4kFbdUzxBHs'), true);
    });

    it('p2sh', function() {
      BitGoJS.setNetwork('prod');
      assert.equal(bitgo.verifyAddress('3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC'), true);
      BitGoJS.setNetwork('testnet');
      assert.equal(bitgo.verifyAddress('2NEeFWbfu4EA1rcKx48e82Mj8d6FKcWawZw'), true);
    });
  });

  describe('Encrypt/Decrypt', function() {
    var password = 'mickey mouse';
    var secret = 'this is a secret';

    it('invalid password', function() {
      var bitgo = new TestBitGo();
      var opaque = bitgo.encrypt(password, secret);
      assert.throws(function() { bitgo.decrypt('hack hack', opaque); });
    });

    it('valid password', function() {
      var bitgo = new TestBitGo();
      var opaque = bitgo.encrypt(password, secret);
      assert.equal(bitgo.decrypt(password, opaque), secret);
    });
  });

  describe('Market', function() {
    var bitgo;
    before(function() {
      bitgo = new TestBitGo();
    });

    it('arguments', function() {
      assert.throws(function() { bitgo.market(); });
      assert.throws(function() { bitgo.market('invalid'); });
    });

    it('latest', function(done) {
      bitgo.market(function(err, marketData) {
        if (err) {
          throw err;
        }
        marketData.should.have.property('latest');
        marketData.latest.should.have.property('currencies');
        marketData.latest.currencies.should.have.property('USD');
        marketData.latest.currencies.USD.should.have.property('bid');
        marketData.latest.currencies.USD.should.have.property('ask');
        marketData.latest.currencies.USD.should.have.property('last');
        marketData.latest.currencies.USD.should.have.property('total_vol');
        marketData.latest.currencies.USD.should.have.property('prevDayHigh');
        marketData.latest.currencies.USD.should.have.property('prevDayLow');
        done();
      });
    });
  });

  describe('Logged Out', function() {
    describe('Authenticate', function() {
      var bitgo;
      before(function() {
        bitgo = new TestBitGo();
      });

      it('arguments', function() {
        assert.throws(function() { bitgo.authenticate(); });
        assert.throws(function() { bitgo.authenticate(123); });
        assert.throws(function() { bitgo.authenticate('foo', 123); });
        assert.throws(function() { bitgo.authenticate('foo', 'bar'); });
        assert.throws(function() { bitgo.authenticate('foo', 'bar', 'baz'); });
        assert.throws(function() { bitgo.authenticate('foo', 'bar', 'baz', 123); });
      });

      it('fails without OTP', function(done) {
        bitgo.authenticateTestUser("0", function(err, response) {
          err.status.should.equal(401);
          err.needsOTP.should.equal(true);
          done();
        });
      });

      it('succeeds with OTP', function(done) {
        bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
          if (err) {
            console.dir(err);   // Seeing an intermittent failure here.  Log if this occurs.
            throw err;
          }
          done();
        });
      });
    });

    describe('Logout', function() {
      it('arguments', function() {
        var bitgo = new TestBitGo();
        assert.throws(function() { bitgo.logout(); });
      });

      it('logout', function(done) {
        var bitgo = new TestBitGo();
        bitgo.logout(function(err) {
          if (err) {
            throw err;
          }
          done();
        });
      });
    });

    describe('me', function() {
      it('arguments', function() {
        var bitgo = new TestBitGo();
        assert.throws(function() { bitgo.me(); });
      });

      it('me', function(done) {
        var bitgo = new TestBitGo();
        bitgo.me(function(err, user) {
          // Expect an error
          assert.equal(err.message, 'not authenticated');
          done();
        });
      });
    });
  });

  describe('Logged In', function() {
    var bitgo;
    before(function(done) {
      bitgo = new TestBitGo();
      bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
        if (err) {
          throw err;
        }
        done();
      });
    });

    describe('Authenticate', function() {
      it('already logged in', function(done) {
        bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
          // Expect an error
          assert.equal(err.message, 'already logged in');
          done();
        });
      });
    });

    describe('me', function() {
      it('get', function(done) {
        bitgo.me(function(err, user) {
          if (err) {
            throw err;
          }
          user.should.have.property('id');
          user.should.have.property('name');
          user.name.full.should.equal(TestBitGo.TEST_USER);
          user.isActive.should.equal(true);
          done();
        });
      });
    });

    describe('Logout', function() {
      it('logout', function(done) {
        bitgo.logout(function(err) {
          if (err) {
            throw err;
          }
          done();
        });
      });
    });

  });
});
