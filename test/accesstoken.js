//
// Tests for API Access Tokens
//
// Copyright 2016, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');
var moment = require('moment');
var Q = require('q');
var _ = require('lodash');

var TestBitGo = require('./lib/test_bitgo');
var TestUtil = require('./testutil');

describe('Access Token', function() {
  var INITIAL_TOKEN_COUNT; // used as an offset when checking if tokens were properly created or removed
  var loginAccessTokenHex; // save token hex for when we remove a token that was just set
  var bitgo;

  before(function() {
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      loginAccessTokenHex = bitgo._token;

      var filterFunc = function(tok) { return tok.label; };
      return TestUtil.deleteTestTokens(bitgo, filterFunc);
    })
    .then(function() {
      return bitgo.listAccessTokens();
    })
    .then(function(tokens) {
      INITIAL_TOKEN_COUNT = tokens.length;
    });
  });

  describe('authentication with access token', function() {
    var addedTokenHex;
    it('should authenticate with added access token', function() {
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token' })
      .then(function(res) {
        addedTokenHex = res.token;
        return bitgo.authenticateWithAccessToken({ accessToken: addedTokenHex });
      })
      .then(function() {
        bitgo._token.should.equal(addedTokenHex);

        // set _token back to original login value
        return bitgo.authenticateWithAccessToken({ accessToken: loginAccessTokenHex });
      })
      .then(function() {
        bitgo._token.should.equal(loginAccessTokenHex);

        return bitgo.removeAccessToken({ label: 'test token' });
      });
    });
  });

  describe('Add', function() {
    describe('bad args', function() {
      it('arguments', function() {
        assert.throws(function() { bitgo.addAccessToken({}, 'invalid'); });
        assert.throws(function() { bitgo.addAccessToken({}, function() {}); });
        assert.throws(function() { bitgo.addAccessToken({ otp: bitgo.testUserOTP() }, 'invalid'); });
      });

      it('fails to add with bad otp', function() {
        var promise = bitgo.addAccessToken({otp: 'badToken', label: 'test token'});
        return TestUtil.throws(promise, 'invalid');
      });
    });

    describe('success', function() {

      afterEach(function() {
        return bitgo.removeAccessToken({ label: 'test token' });
      });

      it('simple add', function() {
        return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token' })
        .then(function(res) {
          res.should.have.property('user');
          res.should.have.property('scope');
          res.should.have.property('created');
          res.should.have.property('expires');
          res.should.have.property('origin');
          res.should.have.property('label');
          res.should.have.property('isExtensible');
          res.should.have.property('token');

          res.should.not.have.property('unlock');
          res.should.not.have.property('enterprise');

          res.label.should.equal('test token');
          res.isExtensible.should.equal(false);

          return bitgo.listAccessTokens();
        })
        .then(function(tokens) {
          var numTokens = tokens.length;
          numTokens.should.equal(INITIAL_TOKEN_COUNT + 1);
        });
      });

      it('duration', function() {
        var DURATION = 3600 * 10; // ten days
        return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', duration: DURATION })
        .then(function(res) {
          res.label.should.equal('test token');

          var created = res.created;
          var expires = res.expires;
          var createdPlusDuration = moment(created).utc().add(DURATION, 'seconds').toDate().getTime();
          var expiresTime = moment(expires).utc().toDate().getTime();
          var leeway = 10; // because of the miniscule time it takes to execute a function, we give a 10 ms leeway in the time differences
          createdPlusDuration.should.be.greaterThan(expiresTime - leeway);
          createdPlusDuration.should.be.lessThan(expiresTime + leeway);
        });
      });

      it('ipRestrict', function() {
        var IPRESTRICT = ['0.0.0.0', '8.8.8.8'];
        return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', ipRestrict: IPRESTRICT })
        .then(function(token) {
          token.should.have.property('token');
        });
      });

      it('txValueLimit', function() {
        var TXVALUELIMIT = 1e8; // 1 BTC
        return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', txValueLimit: TXVALUELIMIT })
        .then(function(res) {
          res.unlock.txValueLimit.should.equal(1e8);
        });
      });

      // see some examples of Scope Values under https://www.bitgo.com/api/#partner-oauth
      it('scopes', function() {
        var someScopes = ['openid', 'profile', 'wallet_create', 'wallet_view_all'];
        return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', scope: someScopes })
        .then(function(res) {
          res.scope.should.have.length(4);
        });
      });
    });
  });

  describe('List', function() {
    it('should list no new access token', function() {
      return bitgo.listAccessTokens()
      .then(function(tokens) {
        tokens.length.should.equal(INITIAL_TOKEN_COUNT);
      });
    });
    
    it('should add and list single access token', function() {
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token'})
      .then(function(res) {
        res.label.should.equal('test token');

        return bitgo.listAccessTokens();
      })
      .then(function(tokens) {
        tokens.length.should.equal(INITIAL_TOKEN_COUNT + 1);
        var token = _.find(tokens, function(tok) {
          return tok.label === 'test token';
        });
        should.exist(token);
      });
    });

    it('should add another and list multiple access tokens', function() {
      var token1;
      var token2;
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token 2'})
      .then(function(res) {
        res.label.should.equal('test token 2');

        return bitgo.listAccessTokens();
      })
      .then(function(tokens) {
        tokens.length.should.equal(INITIAL_TOKEN_COUNT + 2);

        token1 = _.find(tokens, function(tok) {
          return tok.label === 'test token 2';
        });
        token2 = _.find(tokens, function(tok) {
          return tok.label === 'test token';
        });

        should.exist(token1);
        should.exist(token2);

        // cleanup access tokens for future tests
        return bitgo.removeAccessToken({ id: token1.id });
      })
      .then(function() {
        return bitgo.removeAccessToken({ id: token2.id });
      });
    });
  });

  describe('Update', function() {
    should.exist(true); //no-op
    // access tokens have no update API, they can only be created or removed
  });

  describe('Remove', function() {
    var ambiguousTokenId;
    before(function() {
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token'})
    });

    it('arguments', function() {
      assert.throws(function() { bitgo.removeAccessToken({}, 'invalid'); });
      assert.throws(function() { bitgo.removeAccessToken({}, function() {}); });
      assert.throws(function() { bitgo.removeAccessToken({ id: 'non-existent id' }, 'invalid'); });
      assert.throws(function() { bitgo.removeAccessToken({ label: 'non-existent label' }, 'invalid'); });
    });

    it('should fail with ambigous remove', function() {
      // begin by adding second token
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token' })
      .then(function(token) {
        ambiguousTokenId = token.id;
        var promise = bitgo.removeAccessToken({ label: 'test token' });
        return TestUtil.throws(promise, 'ambiguous call: multiple tokens matching this label');
      });
    });

    it('should remove by label', function() {
      return bitgo.listAccessTokens()
      .then(function(tokens) {
        tokens.length.should.equal(INITIAL_TOKEN_COUNT + 2);

        // now remove
        return bitgo.removeAccessToken({ id: ambiguousTokenId });
      })
      .then(function() {
        return bitgo.listAccessTokens();
      })
      .then(function(tokens) {
        tokens.length.should.equal(INITIAL_TOKEN_COUNT + 1);

        return bitgo.removeAccessToken({ label: 'test token' });
      })
      .then(function() {
        return bitgo.listAccessTokens();
      })
      .then(function(tokens) {
        tokens.length.should.equal(INITIAL_TOKEN_COUNT);
      })
    });

    it('should remove access token by id', function() {
      var tokId;
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token' })
      .then(function(tok) {
        return bitgo.removeAccessToken({ id: tok.id });
      })
      .then(function() {
        return bitgo.listAccessTokens();
      })
      .then(function(tokens) {
        tokens.length.should.equal(INITIAL_TOKEN_COUNT);
      });
    });
  });
});