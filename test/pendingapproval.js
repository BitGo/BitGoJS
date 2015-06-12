//
// Tests for a Pending Approval
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');

var _ = require('lodash');
var Q = require('q');

describe('PendingApproval', function() {
  var bitgo;
  var bitgoSharedKeyUser;
  var sharedWallet;

  /**
   * There is a 0-limit policy on the shared wallet
   * Create a pending approval by attempting to send coins
   */
  var createTransactionPendingApproval = function() {
    return sharedWallet.sendCoins({
      address: TestBitGo.TEST_WALLET2_ADDRESS,
      amount: 0.0001 * 1e8,
      walletPassphrase: TestBitGo.TEST_PASSWORD,
      message: 'never gonna'
    })
    .then(function(result) {
      result.should.have.property('pendingApproval');
      return bitgo.pendingApprovals().get({id: result.pendingApproval})
    });
  };

  /**
   * Create a pending approval by attempting to add a user to the wallet
   */
  var createPolicyPendingApproval = function() {
    // it's ok to set up any tx limit since the daily limit is 0
    return sharedWallet.updatePolicyRule({
      action: {
        type: 'getApproval'
      },
      condition: {
        amount: 1e8 + Math.round(Math.random()*1e8)
      },
      id: 'com.bitgo.limit.tx',
      type: 'transactionLimit'
    })
    .then(function(result) {
      result.should.have.property('pendingApproval');
      return bitgo.pendingApprovals().get({id: result.pendingApproval.id })
    });
  };

  before(function() {
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    bitgoSharedKeyUser = new TestBitGo();
    bitgoSharedKeyUser.initializeTestVars();

    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      return bitgoSharedKeyUser.authenticate({ username: TestBitGo.TEST_SHARED_KEY_USER, password: TestBitGo.TEST_SHARED_KEY_PASSWORD, otp: bitgo.testUserOTP() })
    })
    .then(function() {
      return bitgo.unlock({ otp: bitgo.testUserOTP() })
    })
    .then(function() {
      return bitgoSharedKeyUser.unlock({ otp: bitgo.testUserOTP() })
    })
    .then(function() {
      return bitgo.wallets().get({id: TestBitGo.TEST_SHARED_WALLET_ADDRESS})
    })
    .then(function(result) {
      sharedWallet = result;
    });
  });

  describe('Create and Get', function() {
    var pendingApproval;

    before(function() {
      return createTransactionPendingApproval()
      .then(function(result) {
        pendingApproval = result;
      });
    });

    after(function() {
      return pendingApproval.reject();
    });

    it('arguments', function() {
      assert.throws(function() { bitgo.pendingApprovals().get({}, 'invalid'); });
      assert.throws(function() { bitgo.pendingApprovals().get('invalid'); });
      assert.throws(function() { bitgo.pendingApprovals().get({'id': 54321}, 'invalid'); });
    });

    it('get property methods', function() {
      pendingApproval.id().should.eql(pendingApproval.pendingApproval.id);
      pendingApproval.ownerType().should.eql('wallet');
      pendingApproval.walletId().should.eql(sharedWallet.id());
      assert.equal(pendingApproval.enterpriseId(), undefined);
      pendingApproval.state().should.eql('pending');
      pendingApproval.creator().should.eql(TestBitGo.TEST_USERID);
      pendingApproval.type().should.eql('transactionRequest');
      pendingApproval.info().transactionRequest.message.should.eql('never gonna');
      pendingApproval.info().transactionRequest.destinationAddress.should.eql(TestBitGo.TEST_WALLET2_ADDRESS);
    });

    it('get', function() {
      pendingApproval.get({})
      .then(function(result) {
        pendingApproval = result;
        pendingApproval.id().should.eql(pendingApproval.pendingApproval.id);
        pendingApproval.ownerType().should.eql('wallet');
        pendingApproval.walletId().should.eql(sharedWallet.id());
        assert.equal(pendingApproval.enterpriseId(), undefined);
        pendingApproval.state().should.eql('pending');
        pendingApproval.creator().should.eql(TestBitGo.TEST_USERID);
        pendingApproval.type().should.eql('transactionRequest');
        pendingApproval.info().transactionRequest.destinationAddress.should.eql(TestBitGo.TEST_WALLET2_ADDRESS);
      });
    });
  });

  describe('Approve', function() {
    var pendingApproval;

    before(function() {
      return createTransactionPendingApproval()
      .then(function(result) {
        pendingApproval = result;
      });
    });

    after(function() {
      return pendingApproval.reject();
    });

    it('arguments', function() {
      assert.throws(function() { pendingApproval.approve({}, 'invalid'); });
      assert.throws(function() { pendingApproval.approve('invalid'); });
      assert.throws(function() { pendingApproval.approve(); });
    });

    it('error when self approving', function() {
      return createPolicyPendingApproval()
      .then(function(pendingApproval) {
        return pendingApproval.approve();
      })
      .catch(function(err) {
        err.message.should.include('cannot approve by self');
        return pendingApproval.reject();
      });
    });

    it('can approve when it does not require tx signing', function() {
      return createPolicyPendingApproval()
      .then(function(pendingApproval) {
        return bitgoSharedKeyUser.pendingApprovals().get({id: pendingApproval.id()})
        .then(function(result) {
          return result.approve();
        })
        .then(function(result) {
          result.state.should.eql('approved');
          result.info.policyRuleRequest.update.condition.amount.should.eql(pendingApproval.info().policyRuleRequest.update.condition.amount);
        });
      });
    });

    it('error when it does require tx signing but wrong passphrase', function() {
      return createTransactionPendingApproval()
      .then(function(pendingApproval) {
        return bitgoSharedKeyUser.pendingApprovals().get({id: pendingApproval.id()});
      })
      .then(function(result) {
        return result.approve({ walletPassphrase: 'abcdef' });
      })
      .catch(function(err) {
        err.message.should.include('Unable to decrypt user keychain');
        return pendingApproval.reject();
      });
    });

    it('can approve when it does require tx signing', function() {
      return createTransactionPendingApproval()
      .then(function(pendingApproval) {
        return bitgoSharedKeyUser.pendingApprovals().get({id: pendingApproval.id()})
      })
      .then(function(result) {
        return result.approve({ walletPassphrase: TestBitGo.TEST_PASSWORD });
      })
      .then(function(result) {
        result.state.should.eql('approved');
      });
    });
  });

  describe('Reject', function() {
    var pendingApproval;

    before(function () {
      return Q.delay(500).then(function() {
        return createTransactionPendingApproval();
      })
      .then(function (result) {
        pendingApproval = result;
      });
    });

    it('arguments', function () {
      assert.throws(function () { pendingApproval.reject({}, 'invalid'); });
      assert.throws(function () { pendingApproval.reject('invalid'); });
    });

    it('can cancel', function () {
      return pendingApproval.reject()
      .then(function (result) {
        result.state.should.eql('rejected');
      });
    });

    it('can reject', function () {
      return bitgoSharedKeyUser.pendingApprovals().get({id: pendingApproval.id()})
      .then(function(result) {
        return result.reject()
      })
      .then(function(result) {
        result.state.should.eql('rejected');
      });
    });
  });
});
