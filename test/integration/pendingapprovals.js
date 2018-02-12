//
// Tests for Pending Approvals (listing / get)
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
require('should');

const TestBitGo = require('../lib/test_bitgo');

const _ = require('lodash');

describe('PendingApprovals', function() {
  let bitgo;
  let pendingApprovals;
  let sharedWallet;

  before(function() {
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();

    pendingApprovals = bitgo.pendingApprovals();
    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      return bitgo.unlock({ otp: bitgo.testUserOTP() });
    })
    .then(function() {
      return bitgo.wallets().get({ id: TestBitGo.TEST_SHARED_WALLET_ADDRESS });
    })
    .then(function(result) {
      sharedWallet = result;
    });
  });

  describe('List', function() {
    it('arguments', function() {
      assert.throws(function() { pendingApprovals.list({}, 'invalid'); });
      assert.throws(function() { pendingApprovals.list('invalid'); });
      assert.throws(function() { pendingApprovals.list({ walletId: 54312 }); });
      assert.throws(function() { pendingApprovals.list({ enterpriseId: 54312 }); });
      assert.throws(function() { pendingApprovals.list({ walletId: TestBitGo.TEST_SHARED_WALLET_ADDRESS, enterpriseId: TestBitGo.TEST_ENTERPRISE }); });
    });

    it('wallet pending approvals', function() {
      return bitgo.pendingApprovals().list({ walletId: sharedWallet.id() })
      .then(function(res) {
        res.should.have.property('pendingApprovals');
        res.pendingApprovals.length.should.not.eql(0);
        const pendingApprovalIds = _.map(res.pendingApprovals, function(pa) { return pa.id(); });
        pendingApprovalIds.should.include(TestBitGo.TEST_WALLET_PENDING_APPROVAL_ID);
      });
    });

    it('shared wallet should have pending approval objects on it', function() {
      return sharedWallet.get()
      .then(function(result) {
        const walletPendingApprovals = result.pendingApprovals();
        walletPendingApprovals.length.should.not.eql(0);
        const pendingApprovalIds = _.map(walletPendingApprovals, function(pa) { return pa.id(); });
        pendingApprovalIds.should.include(TestBitGo.TEST_WALLET_PENDING_APPROVAL_ID);
        // the pending approval from the wallet object should have itself on it
        walletPendingApprovals[0].walletId().should.eql(walletPendingApprovals[0].wallet.id());
      });
    });

    it('enterprise pending approvals', function() {
      return bitgo.pendingApprovals().list({ enterpriseId: TestBitGo.TEST_ENTERPRISE })
      .then(function(res) {
        res.should.have.property('pendingApprovals');
        res.pendingApprovals.length.should.not.eql(0);
        const pendingApprovalIds = _.map(res.pendingApprovals, function(pa) { return pa.id(); });
        pendingApprovalIds.should.include(TestBitGo.TEST_ENTERPRISE_PENDING_APPROVAL_ID);
      });
    });
  });

  describe('Get Pending Approval', function() {
    it('arguments', function() {
      assert.throws(function() { pendingApprovals.get({}, 'invalid'); });
      assert.throws(function() { pendingApprovals.get('invalid'); });
      assert.throws(function() { pendingApprovals.get({ id: 54321 }, 'invalid'); });
    });

    it('get a wallet pending approval', function() {
      return bitgo.pendingApprovals().get({ id: TestBitGo.TEST_WALLET_PENDING_APPROVAL_ID })
      .then(function(pendingApproval) {
        pendingApproval.id().should.eql(TestBitGo.TEST_WALLET_PENDING_APPROVAL_ID);
        pendingApproval.ownerType().should.eql('wallet');
        pendingApproval.walletId().should.eql(TestBitGo.TEST_SHARED_WALLET_ADDRESS);
      });
    });

    it('get an enterprise pending approval', function() {
      return bitgo.pendingApprovals().get({ id: TestBitGo.TEST_ENTERPRISE_PENDING_APPROVAL_ID })
      .then(function(pendingApproval) {
        pendingApproval.id().should.eql(TestBitGo.TEST_ENTERPRISE_PENDING_APPROVAL_ID);
        pendingApproval.ownerType().should.eql('enterprise');
        pendingApproval.enterpriseId().should.eql(TestBitGo.TEST_ENTERPRISE);
      });
    });
  });
});
