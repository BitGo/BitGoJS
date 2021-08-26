//
// Tests for BitGo Object
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

/* eslint-disable @typescript-eslint/no-empty-function */

import { strict as assert } from 'assert';

import * as BitGoJS from '../../../src/index';
import { TestBitGo } from '../../lib/test_bitgo';

const TestUtil = require('../../integration/testutil');
import 'should';

describe('BitGo', function () {

  describe('Logged Out', function () {
    describe('Authenticate', function () {
      let bitgo;
      before(function () {
        bitgo = new TestBitGo();
        bitgo.initializeTestVars();
      });

      it('arguments', async function () {
        await bitgo.authenticate().should.be.rejected();
        await bitgo.authenticate(123).should.be.rejected();
        await bitgo.authenticate('foo', 123).should.be.rejected();
        await bitgo.authenticate({ username: 'foo', password: 'bar', otp: 0.01 }).should.be.rejected();
        await bitgo.authenticate({ username: 'foo', password: 'bar', otp: 'baz' }, 123).should.be.rejected();
      });

      it('fails without OTP', async function () {
        await bitgo.authenticateTestUser('0').catch((err) => {
          err.status.should.equal(401);
          err.needsOTP.should.equal(true);

          throw err;
        }).should.be.rejected();
      });

      it('succeeds with OTP', async function () {
        await bitgo.authenticateTestUser(bitgo.testUserOTP()).should.be.fulfilled();
      });

      it('verify password fails', async function () {
        await bitgo.verifyPassword({ password: 'foobar' }).should.be.fulfilledWith(false);
      });

      it('verify password succeeds', async function () {
        await bitgo.verifyPassword({ password: TestBitGo.TEST_PASSWORD }).should.be.fulfilledWith(true);
      });
    });

    describe('Logout API', function () {
      it('logout', async function () {
        const bitgo = new TestBitGo();
        bitgo.initializeTestVars();
        await bitgo.logout().should.be.rejected();
      });
    });

    describe('me', function () {
      it('me', async function () {
        const bitgo = new TestBitGo();
        bitgo.initializeTestVars();

        await bitgo.me().catch((err) => {
          assert.equal(err.message, 'unauthorized');

          throw err;
        }).should.be.rejected();
      });
    });

    describe('session', function () {
      it('session', async function () {
        const bitgo = new TestBitGo();
        bitgo.initializeTestVars();

        bitgo.session().catch((err) => {
          assert.equal(err.message, 'unauthorized');

          throw err;
        }).should.be.rejected();
      });
    });
  });

  describe('Estimate Fee', function () {
    let bitgo;
    before(function (done) {
      bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      done();
    });

    it('arguments', async function () {
      bitgo.estimateFee({ numBlocks: 'none' }).should.be.rejected();
    });

    it('get default', async function () {
      await bitgo.estimateFee()
        .should.be.fulfilled()
        .then(function (res) {
          res.should.have.property('feePerKb');
          res.should.have.property('numBlocks');
          res.numBlocks.should.eql(2);
          res.feePerKb.should.be.within(1e3, 1e7);
        });
    });

    it('get fee for target of 3 blocks', async function () {
      await bitgo.estimateFee({ numBlocks: 3 })
        .should.be.fulfilled()
        .then(function (res) {
          res.should.have.property('feePerKb');
          res.should.have.property('numBlocks');
          res.numBlocks.should.eql(3);
          res.feePerKb.should.be.within(1e3, 1e7);
        });
    });
  });

  describe('Ping', function () {
    let bitgo;
    before(function (done) {
      bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      done();
    });

    it('environment', async function () {

      BitGoJS.setNetwork('testnet');
      await bitgo.ping().should.be.fulfilled().then((res) => {
        res.should.have.property('status');
        res.should.have.property('environment');
        res.environment.should.containEql('BitGo');
      });
    });
  });

  describe('Logged In (Test User)', function () {
    let bitgo;
    before(async function () {
      bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      await bitgo.authenticateTestUser(bitgo.testUserOTP()).should.be.fulfilled();
      await bitgo.authenticateWithAccessToken({ accessToken: bitgo._token }).should.be.fulfilled();
    });

    describe('Authenticate', function () {
      it('already logged in', async function () {
        bitgo.authenticateTestUser(bitgo.testUserOTP()).catch((err) => {
          assert.equal(err.message, 'already logged in');

          throw err;
        }).should.be.rejected();
      });
    });

    describe('Extend Token', function () {
      let extensibleTokenBitGo;
      before(function (done) {
        extensibleTokenBitGo = new TestBitGo();
        extensibleTokenBitGo.initializeTestVars();
        done();
      });

      after(function () {
        // delete all extensible tokens, because if they're left around then the test/accessToken.js tests will
        // fail because there are more than 10 long lived tokens, and then we can't add any more long lived tokens
        const filterFunc = function (tok) { return tok.isExtensible; };
        return TestUtil.deleteTestTokens(extensibleTokenBitGo, filterFunc);
      });

      it('logging in with extensible token', async function () {
        const authenticationData = {
          username: TestBitGo.TEST_USER,
          password: TestBitGo.TEST_PASSWORD,
          otp: bitgo.testUserOTP(),
          extensible: true,
        };

        const response = await extensibleTokenBitGo.authenticate(authenticationData);
        response.access_token.should.be.type('string');
      });

      it('extending token by impermissible duration', async function () {
        await extensibleTokenBitGo.extendToken({ duration: 3600 * 24 * 20 }).catch((err) => {
          err.status.should.equal(400);

          throw err;
        }).should.be.rejected();
      });

      it('extending token by permissible duration', async function () {
        const response = await extensibleTokenBitGo.extendToken({ duration: 3600 * 24 * 10 });
        response.isExtensible.should.equal(true);
        response.extensionAddress.should.be.type('string');
      });

      it('extending token after juggling session data', async function () {
        const sessionData = extensibleTokenBitGo.toJSON();
        extensibleTokenBitGo.fromJSON(sessionData);
        await extensibleTokenBitGo.extendToken({ duration: 3600 * 24 * 10 })
          .then(function (response) {
            response.isExtensible.should.equal(true);
            response.extensionAddress.should.be.type('string');
          });
      });
    });

    describe('me', function () {
      it('get', async function () {
        const user = await bitgo.me();
        user.should.have.property('id');
        user.should.have.property('name');
        user.name.full.should.equal(TestBitGo.TEST_USER);
        user.isActive.should.equal(true);
      });
    });

    describe('getUser', function () {
      it('success', async function () {
        const user = await bitgo.getUser({ id: TestBitGo.TEST_SHARED_KEY_USERID });

        user.should.have.property('id');
        user.should.have.property('email');
        user.email.email.should.equal(TestBitGo.TEST_SHARED_KEY_USER);
      });
    });

    // TODO: BG-19631
    xdescribe('labels', function () {
      // ensure that we have at least one label created on two of this user's wallets
      before(function () {
        return bitgo.wallets().get({ id: TestBitGo.TEST_WALLET1_ADDRESS })
          .then(function (wallet) {
            return wallet.setLabel({ label: 'testLabel', address: TestBitGo.TEST_WALLET1_ADDRESS2 });
          })
          .then(function () {
            return bitgo.wallets().get({ id: TestBitGo.TEST_WALLET3_ADDRESS });
          })
          .then(function (wallet3) {
            return wallet3.setLabel({ label: 'testLabel3', address: TestBitGo.TEST_WALLET3_ADDRESS2 });
          })
          .then(function (Res) {
            console.log(Res);
          });
      });

      it('success', async function () {
        const labels = await bitgo.labels();

        labels.length.should.not.equal(0);
        labels.should.containDeep([{ address: TestBitGo.TEST_WALLET1_ADDRESS2 }]);
        labels.should.containDeep([{ label: 'testLabel' }]);
        labels.should.containDeep([{ address: TestBitGo.TEST_WALLET3_ADDRESS2 }]);
        labels.should.containDeep([{ label: 'testLabel3' }]);

        labels.forEach(function (label) {
          label.should.have.property('label');
          label.should.have.property('address');
        });
      });
    });

    describe('session', function () {
      it('get', async function () {
        const session = await bitgo.session({});
        session.should.have.property('client');
        session.should.have.property('user');
        session.should.have.property('scope');
        session.client.should.equal('bitgo');
      });
    });

    describe('getWalletAddress', function () {
      it('address not found', async function () {
        await bitgo.getWalletAddress({ address: 'mk6ZqJBctDBbVuy6FHK9ddS7CVtRJnN15a' }) // not a bitgo address
          .catch(function (error) {
            error.message.should.containEql('not found');

            throw error;
          })
          .should.be.rejected();
      });

      it('get', async function () {
        await bitgo.getWalletAddress({ address: TestBitGo.TEST_WALLET1_ADDRESS2 })
          .then(function (result) {
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

    describe('instant', function () {
      it('get guarantee', async function () {
        await bitgo.instantGuarantee({ id: '56562ee923ab7f3a28d638085ba6955a' })
          .then(function (result) {
            result.normalizedHash.should.eql('074d7bd485253bd050d669aa0d34217c6566b6518ac2bc628f9bdc29ba00a785');
            result.amount.should.eql(600000);
            result.guarantee.should.containEql('BitGo Inc. guarantees the transaction');
            result.signature.should.eql('1c4146bd7f54b6ac7cd18e27fd7e4369a312f5be727a6d7a3519cdee2aee2e05255d76ce320effe6777d87c03cc1ff1c2dfadfc0fcb74aaf1b58d0d3425980699a');
          });
      });
      it('detect a bad gaurantee', async function () {
        await bitgo.instantGuarantee({ id: '5656359623ab7f3a28d64266ba8c11db' })
          .catch(function (error) {
            error.message.should.containEql('Invalid signature');

            throw error;
          }).should.be.rejected();
      });
    });

    describe('Logout', function () {
      it('logout', function (done) {
        bitgo.logout({}, function (err) {
          if (err) {
            throw err;
          }
          done();
        });
      });
    });

  });

  describe('Change Password', function () {
    let bitgo;
    let oldPassword;
    let newPassword;
    const incorrectPassword = 'incorrectPassword';

    before(async function beforeLoggedInUpdatePW() {
      bitgo = new TestBitGo({ env: 'test' });
      bitgo.initializeTestVars();
      const loginPasswords = await bitgo.authenticateChangePWTestUser(bitgo.testUserOTP());
      await bitgo.unlock({ otp: bitgo.testUserOTP() });
      oldPassword = loginPasswords.password;
      newPassword = loginPasswords.alternatePassword;
    });

    it('wrong password', async function coWrongPassword() {
      try {
        await bitgo.changePassword({ oldPassword: incorrectPassword, newPassword });
        throw new Error();
      } catch (e) {
        e.message.should.equal('the provided oldPassword is incorrect');
      }
    });

    it('successful password change', async function coSuccessfulPasswordChange() {
      await bitgo.changePassword({ oldPassword, newPassword });
    });
  });

  describe('ECDH sharing keychain', function () {
    let bitgo;

    before(function (done) {
      bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      bitgo.authenticateTestUser(bitgo.testUserOTP(), function (err, response) {
        if (err) {
          throw err;
        }
        done();
      });
    });

    it('Get user ECDH sharing keychain', function () {
      return bitgo.unlock({ otp: '0000000' })
        .then(function () {
          return bitgo.getECDHSharingKeychain();
        })
        .then(function (result) {
          result.xpub.should.equal(TestBitGo.TEST_USER_ECDH_XPUB);
        });
    });
  });

  let refreshToken;
  describe('Oauth test', function () {
    if ((process as any).browser) {
      // Oauth tests not supported in browser due to same-origin policy
      return;
    }
    let bitgo;

    before(function (done) {
      bitgo = new BitGoJS.BitGo({ clientId: TestBitGo.TEST_CLIENTID, clientSecret: TestBitGo.TEST_CLIENTSECRET });
      done();
    });

    describe('Authenticate with auth code', async function () {
      it('arguments', async function () {
        await bitgo.authenticateWithAuthCode().should.be.rejected();
        await bitgo.authenticateWithAuthCode({ authCode: 123 }).should.be.rejected();
        bitgo.authenticateWithAuthCode({ authCode: 'foo' }, 123).should.be.rejected();
        const bitgoNoClientId = new BitGoJS.BitGo();

        await bitgoNoClientId.authenticateWithAuthCode({ authCode: TestBitGo.TEST_AUTHCODE }).should.be.rejected();
      });

      it('bad code', async function () {
        await bitgo.authenticateWithAuthCode({ authCode: 'BADCODE' }).catch((err) => {
          err.message.should.equal('invalid_grant');
          err.should.have.property('status');

          throw err;
        }).should.be.rejected();
      });

      it('use auth code to get me', async function () {
        const response = await bitgo.authenticateWithAuthCode({ authCode: TestBitGo.TEST_AUTHCODE });

        response.should.have.property('token_type');
        response.should.have.property('access_token');
        response.should.have.property('expires_in');
        response.should.have.property('refresh_token');
        refreshToken = response.refresh_token;

        const me_result = await bitgo.me({});
        me_result.should.have.property('username');
        me_result.should.have.property('email');
        me_result.should.have.property('phone');
      });
    });

    describe('Initialize with access token', function () {
      it('arguments', async function () {
        await bitgo.authenticateWithAuthCode({}, 123).should.be.rejected();
      });

      it('use bad access token', async function () {
        const bitgoAT = new BitGoJS.BitGo({
          clientId: TestBitGo.TEST_CLIENTID,
          clientSecret: TestBitGo.TEST_CLIENTSECRET,
          accessToken: 'bad token',
        });

        await bitgoAT.me().catch((err) => {
          err.message.should.equal('unauthorized');
          err.should.have.property('status');

          throw err;
        }).should.be.rejected();
      });

      it('use access token', async function () {
        const bitgoAT = new BitGoJS.BitGo({
          clientId: TestBitGo.TEST_CLIENTID,
          clientSecret: TestBitGo.TEST_CLIENTSECRET,
          accessToken: TestBitGo.TEST_ACCESSTOKEN,
        });

        const me_result = await bitgoAT.me();
        me_result.should.have.property('username');
        me_result.should.have.property('email');
        me_result.should.have.property('phone');
      });
    });

    describe('Use refresh token', function () {
      it('arguments', async function () {
        await bitgo.refreshToken(123).should.be.rejected();
        await bitgo.refreshToken('foo', 123).should.be.rejected();
        await bitgo.refreshToken(TestBitGo.TEST_REFRESHTOKEN, 123).should.be.rejected();
        const bitgoNoClientId = new BitGoJS.BitGo();
        await bitgoNoClientId.refreshToken(TestBitGo.TEST_AUTHCODE).should.be.rejected();
      });

      it('bad token', async function () {
        await bitgo.refreshToken({ refreshToken: 'BADTOKEN' })
          .catch((err) => {
            err.message.should.equal('invalid_grant');
            err.should.have.property('status');

            throw err;
          }).should.be.rejected();
      });

      it('use refresh token to get access token to get me', async () => {
        const response = await bitgo.refreshToken({ refreshToken });

        response.should.have.property('token_type');
        response.should.have.property('access_token');
        response.should.have.property('expires_in');
        response.should.have.property('refresh_token');

        const bitgoWithNewToken = new BitGoJS.BitGo({
          clientId: TestBitGo.TEST_CLIENTID,
          clientSecret: TestBitGo.TEST_CLIENTSECRET,
          accessToken: response.access_token,
        });

        const me_result = await bitgoWithNewToken.me();
        me_result.should.have.property('username');
        me_result.should.have.property('email');
        me_result.should.have.property('phone');
      });

      it('login with auth code then refresh with no args', async function () {

        bitgo = new BitGoJS.BitGo({ clientId: TestBitGo.TEST_CLIENTID, clientSecret: TestBitGo.TEST_CLIENTSECRET });
        const authResp = await bitgo.authenticateWithAuthCode({ authCode: TestBitGo.TEST_AUTHCODE });

        authResp.should.have.property('token_type');
        authResp.should.have.property('access_token');
        authResp.should.have.property('expires_in');
        authResp.should.have.property('refresh_token');

        const refreshTokenResp = bitgo.refreshToken({ refreshToken: undefined });

        refreshTokenResp.should.have.property('token_type');
        refreshTokenResp.should.have.property('access_token');
        refreshTokenResp.should.have.property('expires_in');
        refreshTokenResp.should.have.property('refresh_token');

        const bitgoWithNewToken = new BitGoJS.BitGo({
          clientId: TestBitGo.TEST_CLIENTID,
          clientSecret: TestBitGo.TEST_CLIENTSECRET,
          accessToken: refreshTokenResp.access_token,
        });

        const newTokenResp = await bitgoWithNewToken.me();

        newTokenResp.should.have.property('username');
        newTokenResp.should.have.property('email');
        newTokenResp.should.have.property('phone');
      });
    });
  });

  describe('Change user', function () {
    let bitgo;

    before(async function () {
      bitgo = new TestBitGo();
      bitgo.initializeTestVars();
      return bitgo.authenticateTestUser(bitgo.testUserOTP());
    });

    it('allows logout and login as a different user', async function () {
      await bitgo.logout();
      // reuse known balance test user only for login purposes
      return bitgo.authenticateKnownBalanceTestUser(bitgo.testUserOTP());
    });
  });
});
