//
// Tests for API Access Tokens
//
// Copyright 2016, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
const should = require('should');
const moment = require('moment');
const _ = require('lodash');

const TestBitGo = require('../lib/test_bitgo');
const TestUtil = require('./testutil');

describe('Access Token', function() {
  let INITIAL_TOKEN_COUNT; // used as an offset when checking if tokens were properly created or removed
  let loginAccessTokenHex; // save token hex for when we remove a token that was just set
  let bitgo;
  const someScopes = ['openid', 'profile', 'wallet_create', 'wallet_view_all'];

  before(function() {
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      loginAccessTokenHex = bitgo._token;

      const filterFunc = function(tok) { return tok.label; };
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
    let addedTokenHex;
    it('should authenticate with added access token', function() {
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', scope: someScopes })
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

        assert.throws(function() {
          bitgo.addAccessToken({
            otp: bitgo.testUserOTP(),
            scope: ['wallet_view_all', 'openid', 'profile']
          }, 'invalid');
        });
      });

      it('fails to add without scope', function() {
        assert.throws(function() {
          bitgo.addAccessToken({
            otp: bitgo.testUserOTP()
          }, function() {});
        });
      });

      it('fails to add with empty scope', function() {
        assert.throws(function() {
          bitgo.addAccessToken({
            otp: bitgo.testUserOTP(),
            scope: []
          }, function() {});
        });
      });

      it('fails to add with incorrect type of scope', function() {
        assert.throws(function() {
          bitgo.addAccessToken({
            otp: bitgo.testUserOTP(),
            scope: 'notAnArray'
          }, function() {});
        });
      });

      it('fails to add with invalid scope', function() {
        const promise = bitgo.addAccessToken({ otp: 'badToken', label: 'test token', scope: ['invalid'] });
        return TestUtil.throws(promise, 'invalid scope');
      });

      it('fails to add with bad otp', function() {
        const promise = bitgo.addAccessToken({ otp: 'badToken', label: 'test token', scope: someScopes });
        return TestUtil.throws(promise, 'invalid');
      });
    });

    describe('success', function() {

      afterEach(function() {
        return bitgo.removeAccessToken({ label: 'test token' });
      });

      it('simple add', function() {
        return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', scope: someScopes })
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
          const numTokens = tokens.length;
          numTokens.should.equal(INITIAL_TOKEN_COUNT + 1);
        });
      });

      it('duration', function() {
        const DURATION = 3600 * 10; // ten days
        return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', duration: DURATION, scope: someScopes })
        .then(function(res) {
          res.label.should.equal('test token');

          const created = res.created;
          const expires = res.expires;
          const createdPlusDuration = moment(created).utc().add(DURATION, 'seconds').toDate().getTime();
          const expiresTime = moment(expires).utc().toDate().getTime();
          const leeway = 10; // because of the miniscule time it takes to execute a function, we give a 10 ms leeway in the time differences
          createdPlusDuration.should.be.greaterThan(expiresTime - leeway);
          createdPlusDuration.should.be.lessThan(expiresTime + leeway);
        });
      });

      it('ipRestrict', function() {
        const IPRESTRICT = ['0.0.0.0', '8.8.8.8'];
        return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', ipRestrict: IPRESTRICT, scope: someScopes })
        .then(function(token) {
          token.should.have.property('token');
        });
      });

      it('txValueLimit', function() {
        const TXVALUELIMIT = 1e8; // 1 BTC
        return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', txValueLimit: TXVALUELIMIT, scope: someScopes })
        .then(function(res) {
          res.unlock.txValueLimit.should.equal(1e8);
        });
      });

      // see some examples of Scope Values under https://www.bitgo.com/api/#partner-oauth
      it('scopes', function() {
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
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', scope: someScopes })
      .then(function(res) {
        res.label.should.equal('test token');

        return bitgo.listAccessTokens();
      })
      .then(function(tokens) {
        tokens.length.should.equal(INITIAL_TOKEN_COUNT + 1);
        const token = _.find(tokens, function(tok) {
          return tok.label === 'test token';
        });
        should.exist(token);
      });
    });

    it('should add another and list multiple access tokens', function() {
      let token1;
      let token2;
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token 2', scope: someScopes })
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
    should.exist(true); // no-op
    // access tokens have no update API, they can only be created or removed
  });

  describe('Remove', function() {
    let ambiguousTokenId;
    before(function() {
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', scope: someScopes });
    });

    it('arguments', function() {
      assert.throws(function() { bitgo.removeAccessToken({}, 'invalid'); });
      assert.throws(function() { bitgo.removeAccessToken({}, function() {}); });
      assert.throws(function() { bitgo.removeAccessToken({ id: 'non-existent id' }, 'invalid'); });
      assert.throws(function() { bitgo.removeAccessToken({ label: 'non-existent label' }, 'invalid'); });
    });

    it('should fail with ambigous remove', function() {
      // begin by adding second token
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', scope: someScopes })
      .then(function(token) {
        ambiguousTokenId = token.id;
        const promise = bitgo.removeAccessToken({ label: 'test token' });
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
      });
    });

    it('should remove access token by id', function() {
      return bitgo.addAccessToken({ otp: bitgo.testUserOTP(), label: 'test token', scope: someScopes })
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
