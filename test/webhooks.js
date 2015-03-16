//
// Tests for Wallet Webhooks
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');
var Q = require('q');
var _ = require('lodash');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');

describe('Webhooks', function() {
  var bitgo;
  var wallet;

  before(function (done) {
    BitGoJS.setNetwork('testnet');

    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    wallets = bitgo.wallets();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function (err, response) {
      if (err) {
        console.log(err);
        throw err;
      }

      // Fetch the first wallet.
      var options = {
        id: TestBitGo.TEST_WALLET1_ADDRESS
      };
      wallets.get(options, function (err, result) {
        if (err) {
          throw err;
        }
        wallet = result;
        done();
      });
    });
  });

  describe('Add webhook', function () {
    it('arguments', function (done) {
      assert.throws(function () {
        wallet.addWebhook({});
      });

      assert.throws(function () {
        wallet.addWebhook({}, function () {
        });
      });
      assert.throws(function () {
        wallet.addWebhook({url: 'http://satoshi.com/'}, function () {
        });
      });
      assert.throws(function () {
        wallet.addWebhook({type: 'transaction'}, function () {
        });
      });
      done();
    });

    it('add webhook with a bad url', function (done) {

      wallet.addWebhook({url: 'illegalurl', type: 'transaction'})
      .done(
      function (success) {
        success.should.eql(null);
      },
      function (err) {
        err.status.should.eql(400);
        err.message.should.include('invalid webhook');
        done();
      }
      );
    });

    it('success', function (done) {

      var url = 'http://test.com/';
      var type = 'transaction';
      wallet.addWebhook({url: url, type: type})
      .then(function (result) {
        result.should.have.property('walletId');
        result.should.have.property('url');
        result.should.have.property('type');
        result.walletId.should.eql(wallet.id());
        result.url.should.eql(url);
        result.type.should.eql(type);
        done();
      })
      .done();
    });
  });

  describe('List webhooks', function () {
    it('arguments', function (done) {
      assert.throws(function () {
        wallet.listWebhooks({}, 'abc');
      });
      done();
    });

    it('success', function (done) {

      var url = 'http://test.com/';
      wallet.listWebhooks()
      .then(function (result) {
        result.webhooks.length.should.not.eql(0);
        var urls = _.pluck(result.webhooks, 'url');
        urls.should.include(url);
        done();
      })
      .done();
    });
  });

  describe('Remove webhooks', function () {
    it('arguments', function (done) {
      assert.throws(function () {
        wallet.removeWebhook({}, 'abc');
      });
      assert.throws(function () {
        wallet.removeWebhook({});
      });

      assert.throws(function () {
        wallet.removeWebhook({}, function () {
        });
      });
      assert.throws(function () {
        wallet.removeWebhook({url: 'http://satoshi.com/'}, function () {
        });
      });
      assert.throws(function () {
        wallet.removeWebhook({type: 'transaction'}, function () {
        });
      });
      done();
    });

    it('success', function (done) {

      var url = 'http://test.com/';
      var type = 'transaction';
      wallet.removeWebhook({url: url, type: type})
      .then(function (result) {
        result.should.have.property('removed');
        result.removed.should.equal(1);

        return wallet.listWebhooks();
      })
      .then(function (result) {
        var urls = _.pluck(result, 'url');
        urls.should.not.include(url);
        done();
      })
      .done();
    });
  });
});
