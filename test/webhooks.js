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
  var simulatedWebhookId;

  before(function (done) {
    BitGoJS.setNetwork('testnet');

    bitgo = new TestBitGo();
    bitgo.initializeTestVars();

    simulatedWebhookId = TestBitGo.TEST_WEBHOOK_TRANSACTION_SIMULATION_ID;

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

  describe('Simulate webhook', function() {
    it('should enforce arguments', function(){
      assert.throws(function() { wallet.simulateWebhook({}, function() {}); });
      assert.throws(function() { wallet.simulateWebhook({ webhookId: simulatedWebhookId }, function() {}); });
      assert.throws(function() { wallet.simulateWebhook({ url: 'https://google.com' }, function() {}); });
      assert.throws(function() { wallet.simulateWebhook({ txHash: 'bogus' }, function() {}); });
    });

    it('should fail to override with bogus hash', function() {
      var hash = 'bogus-tx-hash';
      return wallet.simulateWebhook({ webhookId: simulatedWebhookId, txHash: hash })
      .then(function() {
        throw new Error('should never be here');
      })
      .catch(function(e) {
        e.message.should.equal('txHash needs to be a hexadecimal Bitcoin transaction hash');
      });
    });

    it('should simulate with valid hash and url', function() {
      var customURL = 'https://mockbin.com/bin/155d5dc2-5ef8-4f57-b9f2-879a7eb3a4bb';
      var hash = '1909ef7863aa761e4d9cc30be7e2e0a6a34b5adc06c1e82f84f63491bb6ca40f';
      return wallet.simulateWebhook({ webhookId: simulatedWebhookId, txHash: hash, url: customURL })
      .then(function(result) {
        // result should contain the simulation response
        result.should.have.property('body');
        result.should.have.property('code');
        result.should.have.property('type');
        result.body.should.equal('hello again!');
        result.code.should.equal(200);
        result.type.should.equal('text/html');
      });
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
        var urls = _.map(result.webhooks, 'url');
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
        var urls = _.map(result, 'url');
        urls.should.not.include(url);
        done();
      })
      .done();
    });
  });
});
