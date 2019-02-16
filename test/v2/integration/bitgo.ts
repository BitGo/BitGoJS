//
// Tests for BitGo Object
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

import { strict as assert } from 'assert';

const BitGoJS = require('../../../src/index');
const TestBitGo = require('../../lib/test_bitgo');

const TestUtil = require('../../integration/testutil');
import * as Promise from 'bluebird';
const co = Promise.coroutine;

describe('BitGo', function() {

  describe('Logged Out', function() {
    describe('Authenticate', function() {
      let bitgo;
      before(function() {
        bitgo = new TestBitGo();
        bitgo.initializeTestVars();
      });

      it('arguments', function() {
        assert.throws(function() { bitgo.authenticate(); });
        assert.throws(function() { bitgo.authenticate(123); });
        assert.throws(function() { bitgo.authenticate('foo', 123); });
        assert.throws(function() { bitgo.authenticate({ username: 'foo', password: 'bar', otp: 0.01 }); });
        assert.throws(function() { bitgo.authenticate({ username: 'foo', password: 'bar', otp: 'baz' }, 123); });
      });

      it('fails without OTP', function(done) {
        bitgo.authenticateTestUser('0', function(err, response) {
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

      it('verify password fails', function(done) {
        bitgo.verifyPassword({ password: 'foobar' }, function(err, result) {
          if (err) {
            throw err;
          }
          assert.equal(result, false);
          done();
        });
      });

      it('verify password succeeds', function(done) {
        bitgo.verifyPassword({ password: TestBitGo.TEST_PASSWORD }, function(err, result) {
          if (err) {
            throw err;
          }
          assert.equal(result, true);
          done();
        });
      });
    });

    describe('Logout API', function() {
      it('arguments', function(done) {
        const bitgo = new TestBitGo();
        bitgo.initializeTestVars();
        assert.throws(function() { bitgo.logout({}, 'bad'); });
        done();
      });

      it('logout', function(done) {
        const bitgo = new TestBitGo();
        bitgo.initializeTestVars();
        bitgo.logout({}, function(err) {
          // logout should fail when not logged in
          assert(err);
          done();
        });
      });
    });

    describe('me', function() {
      it('arguments', function() {
        const bitgo = new TestBitGo();
        bitgo.initializeTestVars();
        assert.throws(function() { bitgo.me({}, 'bad'); });
      });

      it('me', function(done) {
        const bitgo = new TestBitGo();
        bitgo.initializeTestVars();
        bitgo.me({}, function(err, user) {
          // Expect an error
          assert.equal(err.message, 'unauthorized');
          done();
        });
      });
    });

    describe('session', function() {
      it('arguments', function() {
        const bitgo = new TestBitGo();
        bitgo.initializeTestVars();
        assert.throws(function() { bitgo.session({}, 'bad'); });
      });

      it('session', function(done) {
        const bitgo = new TestBitGo();
        bitgo.initializeTestVars();
        bitgo.session({}, function(err, user) {
          // Expect an error
          assert.equal(err.message, 'unauthorized');
          done();
        });
      });
    });
  });

  describe('Estimate Fee', function() {
    let bitgo;
    before(function(done) {
      bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      done();
    });

    it('arguments', function() {
      assert.throws(function() {
        bitgo.estimateFee({ numBlocks: 'none' });
      });
    });

    it('get default', function() {
      return bitgo.estimateFee()
      .then(function(res) {
        res.should.have.property('feePerKb');
        res.should.have.property('numBlocks');
        res.numBlocks.should.eql(2);
        res.feePerKb.should.be.within(1e3, 1e7);
      });
    });

    it('get fee for target of 3 blocks', function() {
      return bitgo.estimateFee({ numBlocks: 3 })
      .then(function(res) {
        res.should.have.property('feePerKb');
        res.should.have.property('numBlocks');
        res.numBlocks.should.eql(3);
        res.feePerKb.should.be.within(1e3, 1e7);
      });
    });
  });

  describe('Ping', function() {
    let bitgo;
    before(function(done) {
      bitgo = new TestBitGo();
      bitgo.initializeTestVars();
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
        res.environment.should.containEql('BitGo');
      });

      done();
    });
  });

  describe('Logged In (Test User)', function() {
    let bitgo;
    before(function(done) {
      bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
        if (err) {
          throw err;
        }
        // this isn't doing anything, but it's testing the API method's availability
        bitgo.authenticateWithAccessToken({ accessToken: bitgo._token }); // assert that this doesn't fail
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

    describe('Extend Token', function() {
      let extensibleTokenBitGo;
      before(function(done) {
        extensibleTokenBitGo = new TestBitGo();
        extensibleTokenBitGo.initializeTestVars();
        done();
      });

      after(function() {
        // delete all extensible tokens, because if they're left around then the test/accessToken.js tests will
        // fail because there are more than 10 long lived tokens, and then we can't add any more long lived tokens
        const filterFunc = function(tok) { return tok.isExtensible; };
        return TestUtil.deleteTestTokens(extensibleTokenBitGo, filterFunc);
      });

      it('logging in with extensible token', function(done) {
        const authenticationData = {
          username: BitGoJS.BitGo.TEST_USER,
          password: BitGoJS.BitGo.TEST_PASSWORD,
          otp: bitgo.testUserOTP(),
          extensible: true
        };
        extensibleTokenBitGo.authenticate(authenticationData, function(err, response) {
          if (err) {
            throw err;
          }
          response.access_token.should.be.type('string');
          done();
        });
      });

      it('extending token by impermissible duration', function(done) {
        extensibleTokenBitGo.extendToken({ duration: 3600 * 24 * 20 }, function(err, response) {
          err.status.should.equal(400);
          done();
        });
      });

      it('extending token by permissible duration', function(done) {
        extensibleTokenBitGo.extendToken({ duration: 3600 * 24 * 10 }, function(err, response) {
          if (err) {
            throw err;
          }
          response.isExtensible.should.equal(true);
          response.extensionAddress.should.be.type('string');
          done();
        });
      });

      it('extending token after juggling session data', function() {
        const sessionData = extensibleTokenBitGo.toJSON();
        extensibleTokenBitGo.fromJSON(sessionData);
        return extensibleTokenBitGo.extendToken({ duration: 3600 * 24 * 10 })
        .then(function(response) {
          response.isExtensible.should.equal(true);
          response.extensionAddress.should.be.type('string');
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

    describe('getUser', function() {
      it('success', function(done) {
        bitgo.getUser({ id: TestBitGo.TEST_SHARED_KEY_USERID }, function(err, user) {
          if (err) { throw err; }
          user.should.have.property('id');
          user.should.have.property('email');
          user.email.email.should.equal(TestBitGo.TEST_SHARED_KEY_USER);
          done();
        });
      });
    });

    describe('labels', function() {
      // ensure that we have at least one label created on two of this user's wallets
      before(function() {
        return bitgo.wallets().get({ id: TestBitGo.TEST_WALLET1_ADDRESS })
        .then(function(wallet) {
          return wallet.setLabel({ label: 'testLabel', address: TestBitGo.TEST_WALLET1_ADDRESS2 });
        })
        .then(function() {
          return bitgo.wallets().get({ id: TestBitGo.TEST_WALLET3_ADDRESS });
        })
        .then(function(wallet3) {
          return wallet3.setLabel({ label: 'testLabel3', address: TestBitGo.TEST_WALLET3_ADDRESS2 });
        });
      });

      it('success', function(done) {
        bitgo.labels({}, function(err, labels) {
          if (err) {
            throw err;
          }

          labels.length.should.not.equal(0);
          labels.should.containDeep([{ address: TestBitGo.TEST_WALLET1_ADDRESS2 }]);
          labels.should.containDeep([{ label: 'testLabel' }]);
          labels.should.containDeep([{ address: TestBitGo.TEST_WALLET3_ADDRESS2 }]);
          labels.should.containDeep([{ label: 'testLabel3' }]);

          labels.forEach(function(label) {
            label.should.have.property('label');
            label.should.have.property('address');
          });
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

    describe('getWalletAddress', function() {
      it('address not found', function() {
        return bitgo.getWalletAddress({ address: 'mk6ZqJBctDBbVuy6FHK9ddS7CVtRJnN15a' }) // not a bitgo address
        .then(function(result) {
          throw new Error('unexpected success on non bitgo address');
        })
        .catch(function(error) {
          error.message.should.containEql('not found');
        });
      });

      it('get', function() {
        return bitgo.getWalletAddress({ address: TestBitGo.TEST_WALLET1_ADDRESS2 })
        .then(function(result) {
          result.should.have.property('address');
          result.should.have.property('wallet');
          result.should.have.property('path');
          result.should.have.property('chain');
          result.should.have.property('index');
          result.address.should.eql(TestBitGo.TEST_WALLET1_ADDRESS2);
          result.wallet.should.eql(TestBitGo.TEST_WALLET1_ADDRESS);
        });
      });
    });

    describe('instant', function() {
      it('get guarantee', function() {
        return bitgo.instantGuarantee({ id: '56562ee923ab7f3a28d638085ba6955a' })
        .then(function(result) {
          result.normalizedHash.should.eql('074d7bd485253bd050d669aa0d34217c6566b6518ac2bc628f9bdc29ba00a785');
          result.amount.should.eql(600000);
          result.guarantee.should.containEql('BitGo Inc. guarantees the transaction');
          result.signature.should.eql('1c4146bd7f54b6ac7cd18e27fd7e4369a312f5be727a6d7a3519cdee2aee2e05255d76ce320effe6777d87c03cc1ff1c2dfadfc0fcb74aaf1b58d0d3425980699a');
        });
      });
      it('detect a bad gaurantee', function() {
        return bitgo.instantGuarantee({ id: '5656359623ab7f3a28d64266ba8c11db' })
        .then(function() {
          throw new Error('should not be here!!');
        })
        .catch(function(error) {
          error.message.should.containEql('Invalid signature');
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

  describe('Change Password', function() {
    let bitgo;
    let oldPassword;
    let newPassword;
    const incorrectPassword = 'incorrectPassword';

    before(co(function *beforeLoggedInUpdatePW() {
      bitgo = new TestBitGo({ env: 'test' });
      bitgo.initializeTestVars();
      const loginPasswords = yield bitgo.authenticateChangePWTestUser(bitgo.testUserOTP());
      yield bitgo.unlock({ otp: bitgo.testUserOTP() });
      oldPassword = loginPasswords.password;
      newPassword = loginPasswords.alternatePassword;
    }));

    it('wrong password', co(function *coWrongPassword() {
      try {
        yield bitgo.changePassword({ oldPassword: incorrectPassword, newPassword });
        throw new Error();
      } catch (e) {
        e.message.should.equal('the provided oldPassword is incorrect');
      }
    }));

    it('successful password change', co(function *coSuccessfulPasswordChange() {
      yield bitgo.changePassword({ oldPassword, newPassword });
    }));
  });

  describe('ECDH sharing keychain', function() {
    let bitgo;

    before(function(done) {
      bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
        if (err) {
          throw err;
        }
        done();
      });
    });

    it('Get user ECDH sharing keychain', function() {
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return bitgo.getECDHSharingKeychain();
      })
      .then(function(result) {
        result.xpub.should.equal(TestBitGo.TEST_USER_ECDH_XPUB);
      });
    });
  });

  let refreshToken;
  describe('Oauth test', function() {
    if ((process as any).browser) {
      // Oauth tests not supported in browser due to same-origin policy
      return;
    }
    let bitgo;

    before(function(done) {
      bitgo = new BitGoJS.BitGo({ clientId: TestBitGo.TEST_CLIENTID, clientSecret: TestBitGo.TEST_CLIENTSECRET });
      done();
    });

    describe('Authenticate with auth code', function() {
      it('arguments', function() {
        assert.throws(function() { bitgo.authenticateWithAuthCode(); });
        assert.throws(function() { bitgo.authenticateWithAuthCode({ authCode: 123 }); });
        assert.throws(function() { bitgo.authenticateWithAuthCode({ authCode: 'foo' }, 123); });
        const bitgoNoClientId = new BitGoJS.BitGo();
        assert.throws(function() { bitgoNoClientId.authenticateWithAuthCode({ authCode: TestBitGo.TEST_AUTHCODE }, function() {}); });
      });

      it('bad code', function(done) {
        bitgo.authenticateWithAuthCode({ authCode: 'BADCODE' }, function(err, response) {
          // Expect error
          assert.notEqual(err, null);
          err.message.should.equal('invalid_grant');
          err.should.have.property('status');
          done();
        });
      });

      it('use auth code to get me', function(done) {
        bitgo.authenticateWithAuthCode({ authCode: TestBitGo.TEST_AUTHCODE }, function(err, response) {
          // Expect no error
          assert.equal(err, null);
          response.should.have.property('token_type');
          response.should.have.property('access_token');
          response.should.have.property('expires_in');
          response.should.have.property('refresh_token');
          refreshToken = response.refresh_token;

          bitgo.me({}, function(err, me_result) {

            me_result.should.have.property('username');
            me_result.should.have.property('email');
            me_result.should.have.property('phone');
            done();
          });
        });
      });
    });

    describe('Initialize with access token', function() {
      it('arguments', function() {
        assert.throws(function() {
          bitgo.authenticateWithAuthCode({}, 123);
        });
      });

      it('use bad access token', function(done) {
        const bitgoAT = new BitGoJS.BitGo({
          clientId: TestBitGo.TEST_CLIENTID,
          clientSecret: TestBitGo.TEST_CLIENTSECRET,
          accessToken: 'bad token'
        });

        bitgoAT.me({}, function(err, me_result) {
          assert.notEqual(err, null);
          err.message.should.equal('unauthorized');
          err.should.have.property('status');
          done();
        });
      });

      it('use access token', function(done) {
        const bitgoAT = new BitGoJS.BitGo({
          clientId: TestBitGo.TEST_CLIENTID,
          clientSecret: TestBitGo.TEST_CLIENTSECRET,
          accessToken: TestBitGo.TEST_ACCESSTOKEN
        });

        bitgoAT.me({}, function(err, me_result) {
          me_result.should.have.property('username');
          me_result.should.have.property('email');
          me_result.should.have.property('phone');
          done();
        });
      });
    });

    describe('Use refresh token', function() {
      it('arguments', function() {
        assert.throws(function() { bitgo.refresh_token(); });
        assert.throws(function() { bitgo.refresh_token(123); });
        assert.throws(function() { bitgo.refresh_token('foo', 123); });
        assert.throws(function() { bitgo.refresh_token(TestBitGo.TEST_REFRESHTOKEN, 123); });
        const bitgoNoClientId = new BitGoJS.BitGo();
        assert.throws(function() { bitgoNoClientId.refresh_token(TestBitGo.TEST_AUTHCODE, function() {}); });
      });

      it('bad token', function(done) {
        bitgo.refreshToken({ refreshToken: 'BADTOKEN' }, function(err, response) {
          // Expect error
          assert.notEqual(err, null);
          err.message.should.equal('invalid_grant');
          err.should.have.property('status');
          done();
        });
      });

      it('use refresh token to get access token to get me', function(done) {
        bitgo.refreshToken({ refreshToken: refreshToken }, function(err, response) {
          // Expect no error
          assert.equal(err, null);
          response.should.have.property('token_type');
          response.should.have.property('access_token');
          response.should.have.property('expires_in');
          response.should.have.property('refresh_token');

          const bitgoWithNewToken = new BitGoJS.BitGo({
            clientId: TestBitGo.TEST_CLIENTID,
            clientSecret: TestBitGo.TEST_CLIENTSECRET,
            accessToken: response.access_token
          });

          bitgoWithNewToken.me({}, function(err, me_result) {

            me_result.should.have.property('username');
            me_result.should.have.property('email');
            me_result.should.have.property('phone');
            done();
          });
        });
      });

      it('login with auth code then refresh with no args', function(done) {

        bitgo = new BitGoJS.BitGo({ clientId: TestBitGo.TEST_CLIENTID, clientSecret: TestBitGo.TEST_CLIENTSECRET });
        bitgo.authenticateWithAuthCode({ authCode: TestBitGo.TEST_AUTHCODE }, function(err, response) {
          // Expect no error
          assert.equal(err, null);
          response.should.have.property('token_type');
          response.should.have.property('access_token');
          response.should.have.property('expires_in');
          response.should.have.property('refresh_token');

          bitgo.refreshToken({ refreshToken: undefined }, function(err, response) {
            // Expect no error
            assert.equal(err, null);
            response.should.have.property('token_type');
            response.should.have.property('access_token');
            response.should.have.property('expires_in');
            response.should.have.property('refresh_token');

            const bitgoWithNewToken = new BitGoJS.BitGo({
              clientId: TestBitGo.TEST_CLIENTID,
              clientSecret: TestBitGo.TEST_CLIENTSECRET,
              accessToken: response.access_token
            });

            bitgoWithNewToken.me({}, function(err, me_result) {

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

  describe('Change user', function() {

    let bitgo;

    before(co(function *() {
      bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      return bitgo.authenticateTestUser(bitgo.testUserOTP());
    }));

    it('allows logout and login as a different user', co(function *() {
      yield bitgo.logout();
      // reuse known balance test user only for login purposes
      return bitgo.authenticateKnownBalanceTestUser(bitgo.testUserOTP());
    }));
  });
});
