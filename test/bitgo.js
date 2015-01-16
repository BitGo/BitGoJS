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
      assert.throws(function() { new BitGoJS.BitGo({useProduction: 'invalid'}); });
      assert.throws(function() { new BitGoJS.BitGo({clientId: 'invalid'}); });
      assert.throws(function() { new BitGoJS.BitGo({clientSecret: 'invalid'}); });
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

      assert.equal(bitgo.verifyAddress({ address: 'xyzzy' }), false);
    });

    it('standard', function() {
      BitGoJS.setNetwork('prod');
      assert.equal(bitgo.verifyAddress({ address: '1Bu3bhwRmevHLAy1JrRB6AfcxfgDG2vXRd' }), true);
      BitGoJS.setNetwork('testnet');
      assert.equal(bitgo.verifyAddress({ address: 'n4DNhSiEaodqaiF9tLYXTCh4kFbdUzxBHs' }), true);
    });

    it('p2sh', function() {
      BitGoJS.setNetwork('prod');
      assert.equal(bitgo.verifyAddress({ address: '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC' }), true);
      BitGoJS.setNetwork('testnet');
      assert.equal(bitgo.verifyAddress({ address: '2NEeFWbfu4EA1rcKx48e82Mj8d6FKcWawZw' }), true);
    });
  });

  describe('Encrypt/Decrypt', function() {
    var password = 'mickey mouse';
    var secret = 'this is a secret';

    it('invalid password', function() {
      var bitgo = new TestBitGo();
      var opaque = bitgo.encrypt({ password: password, input: secret });
      assert.throws(function() { bitgo.decrypt({ password: 'hack hack', input: opaque }); });
    });

    it('valid password', function() {
      var bitgo = new TestBitGo();
      var opaque = bitgo.encrypt({ password: password, input: secret });
      assert.equal(bitgo.decrypt({ password: password, input: opaque }), secret);
    });
  });

  describe('Market', function() {
    var bitgo;
    before(function() {
      bitgo = new BitGoJS.BitGo();
    });

    it('arguments', function() {
      assert.throws(function() { bitgo.market('invalid'); });
      assert.throws(function() { bitgo.market({}, 'invalid'); });
    });

    it('latest', function(done) {
      bitgo.market({}, function(err, marketData) {
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
        assert.throws(function() { bitgo.authenticate({ username: 'foo', password: 'bar', otp: 0.01}); });
        assert.throws(function() { bitgo.authenticate({ username: 'foo', password: 'bar', otp: 'baz'}, 123); });
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
            console.dir(err); // Seeing an intermittent failure here.  Log if this occurs.
            throw err;
          }
          done();
        });
      });
    });

    describe('Logout API', function() {
      it('arguments', function(done) {
        var bitgo = new TestBitGo();
        assert.throws(function() { bitgo.logout({}, 'bad'); });
        done();
      });

      it('logout', function(done) {
        var bitgo = new TestBitGo();
        bitgo.logout({}, function(err) {
          // logout should fail when not logged in
          assert(err);
          done();
        });
      });
    });

    describe('me', function() {
      it('arguments', function() {
        var bitgo = new TestBitGo();
        assert.throws(function() { bitgo.me({}, 'bad'); });
      });

      it('me', function(done) {
        var bitgo = new TestBitGo();
        bitgo.me({}, function(err, user) {
          // Expect an error
          assert.equal(err.message, 'Authorization required');
          done();
        });
      });
    });

    describe('session', function() {
      it('arguments', function() {
        var bitgo = new TestBitGo();
        assert.throws(function() { bitgo.session({}, 'bad'); });
      });

      it('session', function(done) {
        var bitgo = new TestBitGo();
        bitgo.session({}, function(err, user) {
          // Expect an error
          assert.equal(err.message, 'Authorization required');
          done();
        });
      });
    });
  });

  describe('Ping', function() {
    var bitgo;
    before(function(done) {
      bitgo = new TestBitGo();
      done();
    });

    it('environment', function(done) {

      BitGoJS.setNetwork('testnet');
      bitgo.ping({}, function(err, res) {
        if (err) {
          console.log(err);
          throw err;
        }
        res.should.have.property('status');
        res.should.have.property('environment');
        res.environment.should.include('BitGo');
      });

      done();
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
        bitgo.me({}, function(err, user) {
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

    describe('session', function() {
      it('get', function(done) {
        bitgo.session({}, function(err, session) {
          if (err) {
            throw err;
          }
          session.should.have.property('client');
          session.should.have.property('user');
          session.should.have.property('scope');
          session.client.should.equal('bitgo');
          done();
        });
      });
    });

    describe('Logout', function() {
      it('logout', function(done) {
        bitgo.logout({}, function(err) {
          if (err) {
            throw err;
          }
          done();
        });
      });
    });

  });

  describe('ECDH sharing keychain', function() {

    before(function(done) {
      bitgo = new TestBitGo();
      bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
        if (err) {
          throw err;
        }
        done();
      });
    });

    it('Get user ECDH sharing keychain', function(done) {
      return bitgo.unlock({ otp: '0000000' })
      .then (function() {
        return bitgo.getECDHSharingKeychain();
      })
      .then(function (result) {
        result.xpub.should.equal('xpub661MyMwAqRbcGn8KmC8qy9cNcLcmLo8aGtcHgiMmXw7R5drDHReavre767FausTZtZTw8vfych3J9jWw67eX8314ARTb3FczLdsPnqkQjyT');
        done();
      })
      .done();
    });
  });

  describe('Oauth test', function() {
    var bitgo;
    var refreshToken;

    before(function (done) {
      bitgo = new BitGoJS.BitGo({clientId: TestBitGo.TEST_CLIENTID, clientSecret: TestBitGo.TEST_CLIENTSECRET});
      done();
    });

    describe('Authenticate with auth code', function () {
      it('arguments', function() {
        assert.throws(function() { bitgo.authenticateWithAuthCode(); });
        assert.throws(function() { bitgo.authenticateWithAuthCode({ authCode: 123 }); });
        assert.throws(function() { bitgo.authenticateWithAuthCode({ authCode: 'foo' }, 123); });
        var bitgoNoClientId = new BitGoJS.BitGo();
        assert.throws(function() { bitgoNoClientId.authenticateWithAuthCode({ authCode: TestBitGo.TEST_AUTHCODE }, function() {}); });
      });

      it('bad code', function (done) {
        bitgo.authenticateWithAuthCode({ authCode: 'BADCODE' }, function (err, response) {
          // Expect error
          assert.notEqual(err, null);
          err.message.should.equal('invalid_grant');
          err.should.have.property('status');
          done();
        });
      });

      it('use auth code to get me', function (done) {
        bitgo.authenticateWithAuthCode({ authCode: TestBitGo.TEST_AUTHCODE }, function (err, response) {
          // Expect no error
          assert.equal(err, null);
          response.should.have.property('token_type');
          response.should.have.property('access_token');
          response.should.have.property('expires_in');
          response.should.have.property('refresh_token');

          bitgo.me({}, function (err, me_result) {

            me_result.should.have.property('username');
            me_result.should.have.property('email');
            me_result.should.have.property('phone');
            done();
          });
        });
      });
    });

    describe('Initialize with access token', function () {
      it('arguments', function () {
        assert.throws(function () {
          bitgo.authenticateWithAuthCode({}, 123);
        });
      });

      it('use bad access token', function (done) {
        var bitgoAT = new BitGoJS.BitGo({
          clientId: TestBitGo.TEST_CLIENTID,
          clientSecret: TestBitGo.TEST_CLIENTSECRET,
          accessToken: 'bad token'
        });

        bitgoAT.me({}, function (err, me_result) {
          assert.notEqual(err, null);
          err.message.should.equal('Authorization required');
          err.should.have.property('status');
          done();
        });
      });

      it('use access token', function (done) {
        var bitgoAT = new BitGoJS.BitGo({
          clientId: TestBitGo.TEST_CLIENTID,
          clientSecret: TestBitGo.TEST_CLIENTSECRET,
          accessToken: TestBitGo.TEST_ACCESSTOKEN
        });

        bitgoAT.me({}, function (err, me_result) {
          me_result.should.have.property('username');
          me_result.should.have.property('email');
          me_result.should.have.property('phone');
          done();
        });
      });
    });

    describe('Use refresh token', function() {
      it('arguments', function () {
        assert.throws(function() { bitgo.refresh_token(); });
        assert.throws(function() { bitgo.refresh_token(123); });
        assert.throws(function() { bitgo.refresh_token('foo', 123); });
        assert.throws(function() { bitgo.refresh_token(TestBitGo.TEST_REFRESHTOKEN, 123); });
        var bitgoNoClientId = new BitGoJS.BitGo();
        assert.throws(function() { bitgoNoClientId.refresh_token(TestBitGo.TEST_AUTHCODE, function() {}); });
      });

      it('bad token', function (done) {
        bitgo.refreshToken({ refreshToken: 'BADTOKEN' }, function (err, response) {
          // Expect error
          assert.notEqual(err, null);
          err.message.should.equal('invalid_grant');
          err.should.have.property('status');
          done();
        });
      });

      it('use refresh token to get access token to get me', function (done) {
        bitgo.refreshToken({ refreshToken: TestBitGo.TEST_REFRESHTOKEN }, function (err, response) {
          // Expect no error
          assert.equal(err, null);
          response.should.have.property('token_type');
          response.should.have.property('access_token');
          response.should.have.property('expires_in');
          response.should.have.property('refresh_token');

          bitgoWithNewToken = new BitGoJS.BitGo({
            clientId: TestBitGo.TEST_CLIENTID,
            clientSecret: TestBitGo.TEST_CLIENTSECRET,
            accessToken: response.access_token
          });

          bitgoWithNewToken.me({}, function (err, me_result) {

            me_result.should.have.property('username');
            me_result.should.have.property('email');
            me_result.should.have.property('phone');
            done();
          });
        });
      });

      it('login with auth code then refresh with no args', function (done) {

        bitgo = new BitGoJS.BitGo({clientId: TestBitGo.TEST_CLIENTID, clientSecret: TestBitGo.TEST_CLIENTSECRET});
        bitgo.authenticateWithAuthCode({ authCode: TestBitGo.TEST_AUTHCODE }, function (err, response) {
          // Expect no error
          assert.equal(err, null);
          response.should.have.property('token_type');
          response.should.have.property('access_token');
          response.should.have.property('expires_in');
          response.should.have.property('refresh_token');

          bitgo.refreshToken({ refreshToken: undefined }, function (err, response) {
            // Expect no error
            assert.equal(err, null);
            response.should.have.property('token_type');
            response.should.have.property('access_token');
            response.should.have.property('expires_in');
            response.should.have.property('refresh_token');

            bitgoWithNewToken = new BitGoJS.BitGo({
              clientId: TestBitGo.TEST_CLIENTID,
              clientSecret: TestBitGo.TEST_CLIENTSECRET,
              accessToken: response.access_token
            });

            bitgoWithNewToken.me({}, function (err, me_result) {

              me_result.should.have.property('username');
              me_result.should.have.property('email');
              me_result.should.have.property('phone');
              done();
            });
          });
        });
      });
    });
  });

});
