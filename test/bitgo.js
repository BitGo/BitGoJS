//
// Tests for BitGo Object
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');
var speakeasy = require('speakeasy');

var BitGoJS = require('../src/index');

var TEST_USER = 'mike+test@bitgo.com';
var TEST_PASSWORD = 'itestutestwetest';
var TEST_OTP_KEY = 'KVVT4LS5O5ICMPB6LJTWMT2GGJ4SKTBW';

// Utility function to compute an OTP value.
var computeOTP = function() {
  var parameters = {
    key: TEST_OTP_KEY,
    step: 60,
    time: Math.floor(new Date().getTime() / 1000)
  };
  return speakeasy.totp(parameters);
};



describe('BitGo', function() {

  describe('Constuctor', function() {
    it('methods', function() {
      var bitgo = new BitGoJS.BitGo();
      bitgo.should.have.property('version');
      bitgo.should.have.property('market');
      bitgo.should.have.property('authenticate');
      bitgo.should.have.property('logout');
      bitgo.should.have.property('me');
    });
  });

  describe('Version', function() {
    it('version', function() {
      var bitgo = new BitGoJS.BitGo();
      var version = bitgo.version();
      assert.equal(typeof(version), 'string');
    });
  });

  describe('Market', function() {
    it('latest', function(done) {
      var bitgo = new BitGoJS.BitGo();
      bitgo.market(function(err, marketData) {
        if (err) {
          throw err;
        }
        marketData.should.have.property('last');
        marketData.should.have.property('bid');
        marketData.should.have.property('ask');
        marketData.should.have.property('volume');
        marketData.should.have.property('high');
        marketData.should.have.property('low');
        marketData.should.have.property('updateTime');
        done();
      });
    });
  });

  describe('Logged Out', function() {
    describe('Authenticate', function() {
      it('fails without OTP', function(done) {
        var bitgo = new BitGoJS.BitGo();
        bitgo.authenticate(TEST_USER, TEST_PASSWORD, 0, function(err, response) {
          err.status.should.equal(401);
          err.needsOTP.should.equal(true);
          done();
        });
      });

      it('succeeds with OTP', function(done) {
        var bitgo = new BitGoJS.BitGo();
        bitgo.authenticate(TEST_USER, TEST_PASSWORD, computeOTP(), function(err, response) {
          if (err) {
            console.dir(err);   // Seeing an intermittent failure here.  Log if this occurs.
            throw err;
          }
          response.should.have.property('token');
          response.should.have.property('user');
          done();
        });
      });
    });

    describe('Logout', function() {
      it('logout', function(done) {
        var bitgo = new BitGoJS.BitGo();
        bitgo.logout(function(err) {
          if (err) {
            throw err;
          }
          done();
        });
      });
    });

    describe('me', function() {
      it('me', function(done) {
        var bitgo = new BitGoJS.BitGo();
        bitgo.me(function(err, user) {
          // Expect an error
          assert.equal(err.message, 'not authenticated');
          done();
        });
      });
    });
  });

  describe('Logged In', function() {
    var bitgo = new BitGoJS.BitGo();
    before(function(done) {
      bitgo.authenticate(TEST_USER, TEST_PASSWORD, computeOTP(), function(err, response) {
        if (err) {
          throw err;
        }
        response.should.have.property('token');
        response.should.have.property('user');
        done();
      });
    });

    describe('Authenticate', function() {
      it('already logged in', function(done) {
        bitgo.authenticate(TEST_USER, TEST_PASSWORD, 0, function(err, response) {
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
          user.name.full.should.equal(TEST_USER);
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
