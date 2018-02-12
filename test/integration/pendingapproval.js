//
// Tests for a Pending Approval
//
// Copyright 2015, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
require('should');

const BitGoJS = require('../../src/index');
const TestBitGo = require('../lib/test_bitgo');
const TestUtil = require('./testutil');

const bitcoin = BitGoJS.bitcoin;
const _ = require('lodash');
const Q = require('q');

describe('PendingApproval', function() {
  let bitgo;
  let bitgoSharedKeyUser;
  let bitgoThirdUser;
  let sharedWallet;

  /**
   * There is a 0-limit policy on the shared wallet
   * Create a pending approval by attempting to send coins
   */
  const createTransactionPendingApproval = function() {
    return sharedWallet.sendCoins({
      address: TestBitGo.TEST_WALLET2_ADDRESS,
      amount: 0.0001 * 1e8,
      walletPassphrase: TestBitGo.TEST_PASSWORD,
      otp: bitgo.testUserOTP(),
      message: 'never gonna'
    })
    .then(function(result) {
      result.should.have.property('pendingApproval');
      return bitgo.pendingApprovals().get({ id: result.pendingApproval });
    });
  };

  /**
   * There is a 0-limit policy on the shared wallet
   * Create a pending approval by attempting to send to many
   */
  const createTransactionPendingApprovalToMultipleRecipients = function() {
    return sharedWallet.sendMany({
      recipients: [
        {
          address: TestBitGo.TEST_WALLET3_ADDRESS,
          amount: 0.0002 * 1e8
        },
        {
          address: TestBitGo.TEST_WALLET2_ADDRESS,
          amount: 0.0001 * 1e8
        },
        {
          address: TestBitGo.TEST_SHARED_WALLET_CHANGE_ADDRESS,
          amount: 0.0005 * 1e8
        }
      ],
      walletPassphrase: TestBitGo.TEST_PASSWORD,
      otp: bitgo.testUserOTP(),
      message: 'never gonna'
    })
    .then(function(result) {
      result.should.have.property('pendingApproval');
      return bitgo.pendingApprovals().get({ id: result.pendingApproval });
    });
  };

  /**
   * Create a pending approval by attempting to add a user to the wallet
   */
  const createPolicyPendingApproval = function() {
    // it's ok to set up any tx limit since the daily limit is 0
    return sharedWallet.updatePolicyRule({
      action: {
        type: 'getApproval'
      },
      condition: {
        amount: 1e8 + Math.round(Math.random() * 1e8)
      },
      id: 'com.bitgo.limit.tx',
      type: 'transactionLimit'
    })
    .then(function(result) {
      result.should.have.property('pendingApproval');
      return bitgo.pendingApprovals().get({ id: result.pendingApproval.id });
    });
  };

  before(function() {
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    bitgoSharedKeyUser = new TestBitGo();
    bitgoSharedKeyUser.initializeTestVars();
    bitgoThirdUser = new TestBitGo();
    bitgoThirdUser.initializeTestVars();

    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      return bitgoSharedKeyUser.authenticate({ username: TestBitGo.TEST_SHARED_KEY_USER, password: TestBitGo.TEST_SHARED_KEY_PASSWORD, otp: bitgo.testUserOTP() });
    })
    .then(function() {
      return bitgo.unlock({ otp: bitgo.testUserOTP() });
    })
    .then(function() {
      return bitgoSharedKeyUser.unlock({ otp: bitgo.testUserOTP() });
    })
    .then(function() {
      return bitgo.wallets().get({ id: TestBitGo.TEST_SHARED_WALLET_ADDRESS });
    })
    .then(function(result) {
      sharedWallet = result;
    });
  });


  describe('Create and Get', function() {
    let pendingApproval;

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
      assert.throws(function() { bitgo.pendingApprovals().get({ id: 54321 }, 'invalid'); });
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
    let pendingApproval;

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
    });

    it('error when self approving', function() {
      return createPolicyPendingApproval()
      .then(function(pendingApproval) {
        return pendingApproval.approve({ walletPassphrase: TestBitGo.TEST_PASSWORD, otp: bitgo.testUserOTP() });
      })
      .catch(function(err) {
        err.message.should.include('cannot approve by self');
        return pendingApproval.reject();
      });
    });

    it('can approve when it does not require tx signing', function() {
      return createPolicyPendingApproval()
      .then(function(pendingApproval) {
        return bitgoSharedKeyUser.pendingApprovals().get({ id: pendingApproval.id() })
        .then(function(result) {
          return result.approve({ walletPassphrase: TestBitGo.TEST_PASSWORD, otp: bitgo.testUserOTP() });
        })
        .then(function(result) {
          result.state.should.eql('approved');
          result.info.policyRuleRequest.update.condition.amount.should.eql(pendingApproval.info().policyRuleRequest.update.condition.amount);
        });
      });
    });

    it('can approve when tx does not require reconstruction', function() {
      return createTransactionPendingApproval()
      .then(function(pendingApproval) {
        return bitgoSharedKeyUser.pendingApprovals().get({ id: pendingApproval.id() })
        .then(function(result) {
          return result.approve({ walletPassphrase: TestBitGo.TEST_PASSWORD, otp: bitgo.testUserOTP() });
        })
        .then(function(result) {
          result.state.should.eql('approved');
        });
      });
    });

    it('error when it does require tx signing but wrong passphrase', function() {
      return createTransactionPendingApproval()
      .then(function(pendingApproval) {
        return bitgoSharedKeyUser.pendingApprovals().get({ id: pendingApproval.id() });
      })
      .then(function(result) {
        return result.approve({ walletPassphrase: 'abcdef', otp: bitgo.testUserOTP() });
      })
      .catch(function(err) {
        err.message.should.include('Unable to decrypt user keychain');
        return pendingApproval.reject();
      });
    });

    it('can approve when it does require tx signing', function() {
      return createTransactionPendingApproval()
      .then(function(pendingApproval) {
        return bitgoSharedKeyUser.pendingApprovals().get({ id: pendingApproval.id() });
      })
      .then(function(result) {
        return result.approve({ walletPassphrase: TestBitGo.TEST_PASSWORD, otp: bitgo.testUserOTP() });
      })
      .then(function(result) {
        result.state.should.eql('approved');
      });
    });

    it('cannot approve when transaction needs reconstructing', function() {
      let approvals = [];
      return Q.all([
        createTransactionPendingApproval(),
        createTransactionPendingApproval()
      ])
      .spread(function(approval1, approval2) {
        approvals = [approval1, approval2];
        return bitgoSharedKeyUser.pendingApprovals().get({ id: approval1.id() });
      })
      .then(function(result) {
        return result.approve({ walletPassphrase: TestBitGo.TEST_PASSWORD, otp: bitgo.testUserOTP() });
      })
      .then(function(result) {
        result.state.should.eql('approved');
        const approval2 = approvals[1];
        return bitgoSharedKeyUser.pendingApprovals().get({ id: approval2.id() });
      })
      .then(function(result) {
        return result.approve({ otp: bitgo.testUserOTP() });
      })
      .then(function() {
        throw new Error('approval success');
      })
      .catch(function(error) {
        error.message.should.equal('unspents expired, wallet passphrase or xprv required to recreate transaction');
      });
    });

    it('can approve when it does require tx signing (multiple recipients)', function() {
      return createTransactionPendingApprovalToMultipleRecipients()
      .then(function(pendingApproval) {
        return bitgoSharedKeyUser.pendingApprovals().get({ id: pendingApproval.id() });
      })
      .then(function(result) {
        return result.approve({ walletPassphrase: TestBitGo.TEST_PASSWORD, otp: bitgo.testUserOTP() });
      })
      .then(function(result) {
        result.state.should.eql('approved');

        // Parse the completed tx hex and make sure it was built with proper outputs
        const completedTxHex = result.info.transactionRequest.validTransaction;
        const transaction = bitcoin.Transaction.fromHex(completedTxHex);
        if (!transaction || !transaction.outs) {
          throw new Error('transaction had no outputs or failed to parse successfully');
        }
        const outputAddresses = _.map(transaction.outs, function(out) {
          return bitcoin.address.fromOutputScript(out.script, BitGoJS.getNetworkObj());
        });

        // Output addresses should contain the 2 destinations, but not the change address
        outputAddresses.should.include(TestBitGo.TEST_WALLET3_ADDRESS);
        outputAddresses.should.include(TestBitGo.TEST_WALLET2_ADDRESS);
        outputAddresses.should.not.include(TestBitGo.TEST_SHARED_WALLET_CHANGE_ADDRESS);
      });
    });

    it('can manually pass in reconstructed tx', function() {
      let pendingApproval;
      return createTransactionPendingApprovalToMultipleRecipients()
      .then(function(pendingApproval) {
        return bitgoSharedKeyUser.pendingApprovals().get({ id: pendingApproval.id() });
      })
      .then(function(result) {
        pendingApproval = result;
        return pendingApproval.constructApprovalTx({ walletPassphrase: TestBitGo.TEST_PASSWORD, otp: bitgo.testUserOTP() });
      })
      .then(function(result) {
        return pendingApproval.approve({ walletPassphrase: TestBitGo.TEST_PASSWORD, tx: result.tx, otp: bitgo.testUserOTP() });
      })
      .then(function(result) {
        result.state.should.eql('approved');

        // Parse the completed tx hex and make sure it was built with proper outputs
        const completedTxHex = result.info.transactionRequest.validTransaction;
        const transaction = bitcoin.Transaction.fromHex(completedTxHex);
        if (!transaction || !transaction.outs) {
          throw new Error('transaction had no outputs or failed to parse successfully');
        }
        const outputAddresses = _.map(transaction.outs, function(out) {
          return bitcoin.address.fromOutputScript(out.script, BitGoJS.getNetworkObj());
        });

        // Output addresses should contain the 2 destinations, but not the change address
        outputAddresses.should.include(TestBitGo.TEST_WALLET3_ADDRESS);
        outputAddresses.should.include(TestBitGo.TEST_WALLET2_ADDRESS);
        outputAddresses.should.not.include(TestBitGo.TEST_SHARED_WALLET_CHANGE_ADDRESS);
      });
    });
  });

  describe('Reject', function() {
    let pendingApproval;

    before(function() {
      return Q.delay(500).then(function() {
        return createTransactionPendingApproval();
      })
      .then(function(result) {
        pendingApproval = result;
      });
    });

    it('arguments', function() {
      assert.throws(function() { pendingApproval.reject({}, 'invalid'); });
      assert.throws(function() { pendingApproval.reject('invalid'); });
    });

    it('can cancel', function() {
      return pendingApproval.reject()
      .then(function(result) {
        result.state.should.eql('rejected');
      });
    });

    it('can reject', function() {
      return bitgoSharedKeyUser.pendingApprovals().get({ id: pendingApproval.id() })
      .then(function(result) {
        return result.reject();
      })
      .then(function(result) {
        result.state.should.eql('rejected');
      });
    });
  });

  describe('Create, Get, Approve and Reject with Multiple Approvers', function() {
    // setup third user
    let multipleApproversWallet;
    let pendingApproval;
    before(function() {
      return bitgoThirdUser.authenticate({
        username: TestBitGo.TEST_THIRD_USER,
        password: TestBitGo.TEST_THIRD_PASSWORD,
        otp: bitgo.testUserOTP()
      })
      .then(function() {
        return bitgoThirdUser.unlock({ otp: bitgoThirdUser.testUserOTP() });
      })
      .then(function() {
        return bitgoThirdUser.wallets().get({ id: TestBitGo.TEST_WALLETMULTAPPROVERS_ADDRESS });
      })
      .then(function(result) {
        multipleApproversWallet = result;

        if (multipleApproversWallet.approvalsRequired() === 2) {
          // we don't need to bother setting the number of approvals required
          return;
        }

        return multipleApproversWallet.updateApprovalsRequired({ approvalsRequired: 2 })
        .then(function(result) {
          return bitgoSharedKeyUser.pendingApprovals().get({ id: result.id });
        })
        .then(function(result) {
          pendingApproval = result;
          pendingApproval.approvalsRequired().should.equal(1);
          return result.approve({ otp: bitgo.testUserOTP() });
        })
        .then(function(result) {
          result.state.should.eql('approved');

          // update wallet variable with new approvalsRequired
          return bitgoThirdUser.wallets().get({ id: TestBitGo.TEST_WALLETMULTAPPROVERS_ADDRESS });
        })
        .then(function(result) {
          multipleApproversWallet = result;
        });
      });
    });

    after(function() {
      pendingApproval.reject();
    });

    it('should fail with too low approvalsRequired', function() {
      assert.throws(function() { multipleApproversWallet.updateApprovalsRequired({ approvalsRequired: 0 }); }, 'invalid approvalsRequired');
    });

    it('should fail with too high approvalsRequired', function() {
      const promise = multipleApproversWallet.updateApprovalsRequired({ approvalsRequired: 3 });
      return TestUtil.throws(promise, 'approvalsRequired must be less than the number of admins on the wallet');
    });

    it('should be a no-op with same approvalsRequired', function() {
      return multipleApproversWallet.updateApprovalsRequired({ approvalsRequired: 2 })
      .then(function(wallet) {
        wallet.should.equal(multipleApproversWallet.wallet);
      });
    });

    it('should set approvals required to 1 after 2 approvals', function() {
      return multipleApproversWallet.updateApprovalsRequired({ approvalsRequired: 1 })
      .then(function(result) {
        return bitgoSharedKeyUser.pendingApprovals().get({ id: result.id });
      })
      .then(function(result) {
        pendingApproval = result;
        pendingApproval.approvalsRequired().should.equal(2);
        return result.approve({ otp: bitgo.testUserOTP() });
      })
      .then(function(result) {
        result.state.should.eql('pending');

        return bitgo.pendingApprovals().get({ id: result.id });
      })
      .then(function(result) {
        return result.approve({ otp: bitgo.testUserOTP() });
      })
      .then(function(result) {
        result.state.should.eql('approved');

        return bitgoThirdUser.wallets().get({ id: TestBitGo.TEST_WALLETMULTAPPROVERS_ADDRESS });
      })
      .then(function(wallet) {
        multipleApproversWallet = wallet;
        multipleApproversWallet.approvalsRequired().should.equal(1);
      });
    });
  });
});
