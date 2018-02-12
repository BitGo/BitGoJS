//
// Tests for Wallet Webhooks
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
require('should');
const _ = require('lodash');

const BitGoJS = require('../../src/index');
const TestBitGo = require('../lib/test_bitgo');

describe('Webhooks', function() {
  let bitgo;
  let wallet;
  let simulatedTransactionWebhookId;
  let simulatedPendingApprovalWebhookId;

  before(function(done) {
    BitGoJS.setNetwork('testnet');

    bitgo = new TestBitGo();
    bitgo.initializeTestVars();

    simulatedTransactionWebhookId = TestBitGo.TEST_WEBHOOK_TRANSACTION_SIMULATION_ID;
    simulatedPendingApprovalWebhookId = TestBitGo.TEST_WEBHOOK_PENDING_APPROVAL_SIMULATION_ID;

    const wallets = bitgo.wallets();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        console.log(err);
        throw err;
      }

      // Fetch the first wallet.
      const options = {
        id: TestBitGo.TEST_WALLET1_ADDRESS
      };
      wallets.get(options, function(err, result) {
        if (err) {
          throw err;
        }
        wallet = result;
        done();
      });
    });
  });

  describe('Add webhook', function() {
    it('arguments', function(done) {
      assert.throws(function() {
        wallet.addWebhook({});
      });

      assert.throws(function() {
        wallet.addWebhook({}, function() {
        });
      });
      assert.throws(function() {
        wallet.addWebhook({ url: 'http://satoshi.com/' }, function() {
        });
      });
      assert.throws(function() {
        wallet.addWebhook({ type: 'transaction' }, function() {
        });
      });
      done();
    });

    it('add webhook with a bad url', function(done) {

      wallet.addWebhook({ url: 'illegalurl', type: 'transaction' })
      .done(
        function(success) {
          success.should.eql(null);
        },
        function(err) {
          err.status.should.eql(400);
          err.message.should.include('invalid webhook');
          done();
        }
      );
    });

    it('success', function(done) {

      const url = 'http://test.com/';
      const type = 'transaction';
      wallet.addWebhook({ url: url, type: type })
      .then(function(result) {
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

  describe('Simulate wallet webhooks', function() {
    it('should enforce arguments', function() {
      assert.throws(function() { wallet.simulateWebhook({}, function() {}); });
      assert.throws(function() { wallet.simulateWebhook({ webhookId: simulatedTransactionWebhookId }, function() {}); });
      assert.throws(function() { wallet.simulateWebhook({ url: 'https://google.com' }, function() {}); });
      assert.throws(function() { wallet.simulateWebhook({ txHash: 'bogus' }, function() {}); });
    });

    it('should fail to override with bogus hash', function() {
      const hash = 'bogus-tx-hash';
      return wallet.simulateWebhook({ webhookId: simulatedTransactionWebhookId, txHash: hash })
      .then(function() {
        throw new Error('should never be here');
      })
      .catch(function(e) {
        e.message.should.equal('txHash needs to be a hexadecimal Bitcoin transaction hash');
      });
    });

    it('should fail simulate with an invalid pending approval id', function() {
      const pendingApprovalId = 'invalid';
      return wallet.simulateWebhook({ webhookId: simulatedPendingApprovalWebhookId, pendingApprovalId: pendingApprovalId })
      .then(function() {
        throw new Error('should never be here');
      })
      .catch(function(e) {
        e.message.should.equal('pendingApprovalId must not be empty');
      });
    });

    it('should simulate a transaction webhook with valid hash', function() {
      const hash = '1909ef7863aa761e4d9cc30be7e2e0a6a34b5adc06c1e82f84f63491bb6ca40f';
      return wallet.simulateWebhook({ webhookId: simulatedTransactionWebhookId, txHash: hash })
      .then(function(result) {
        // result should contain the simulation response
        result.should.have.property('webhookNotifications');
        result.webhookNotifications.should.not.have.length(0);
        result.webhookNotifications[0].should.have.property('id');
        result.webhookNotifications[0].should.have.property('wallet');
        result.webhookNotifications[0].should.have.property('url');
      });
    });

    it('should simulate a pending approval with valid pendingApprovalId', function() {
      const pendingApprovalId = '5824ce6051b236a6064bdc57a518369f';
      return wallet.simulateWebhook({ webhookId: simulatedPendingApprovalWebhookId, pendingApprovalId: pendingApprovalId })
      .then(function(result) {
        // result should contain the simulation response
        result.should.have.property('webhookNotifications');
        result.webhookNotifications.should.not.have.length(0);
        result.webhookNotifications[0].should.have.property('id');
        result.webhookNotifications[0].should.have.property('wallet');
        result.webhookNotifications[0].should.have.property('url');
      });
    });
  });

  describe('List webhooks', function() {
    it('arguments', function(done) {
      assert.throws(function() {
        wallet.listWebhooks({}, 'abc');
      });
      done();
    });

    it('success', function(done) {

      const url = 'http://test.com/';
      wallet.listWebhooks()
      .then(function(result) {
        result.webhooks.length.should.not.eql(0);
        const urls = _.map(result.webhooks, 'url');
        urls.should.include(url);
        done();
      })
      .done();
    });
  });

  describe('Remove webhooks', function() {
    it('arguments', function(done) {
      assert.throws(function() {
        wallet.removeWebhook({}, 'abc');
      });
      assert.throws(function() {
        wallet.removeWebhook({});
      });

      assert.throws(function() {
        wallet.removeWebhook({}, function() {
        });
      });
      assert.throws(function() {
        wallet.removeWebhook({ url: 'http://satoshi.com/' }, function() {
        });
      });
      assert.throws(function() {
        wallet.removeWebhook({ type: 'transaction' }, function() {
        });
      });
      done();
    });

    it('success', function(done) {

      const url = 'http://test.com/';
      const type = 'transaction';
      wallet.removeWebhook({ url: url, type: type })
      .then(function(result) {
        result.should.have.property('removed');
        result.removed.should.equal(1);

        return wallet.listWebhooks();
      })
      .then(function(result) {
        const urls = _.map(result, 'url');
        urls.should.not.include(url);
        done();
      })
      .done();
    });
  });
});
