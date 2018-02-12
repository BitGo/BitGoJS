//
// Tests for Wallets
//

const should = require('should');
const _ = require('lodash');
const Promise = require('bluebird');
const co = Promise.coroutine;

const TestV2BitGo = require('../../lib/test_bitgo');

describe('V2 Wallet:', function() {
  let bitgo;
  let wallets;
  let basecoin;
  let wallet;
  let sequenceId;
  let walletAddress;
  let walletAddressId;

  // TODO: automate keeping test wallet full with bitcoin
  // If failures are occurring, make sure that the wallet at test.bitgo.com contains bitcoin.
  // The wallet is named Test Wallet, and its information is sometimes cleared from the test environment, causing
  // many of these tests to fail. If that is the case, send it some bitcoin with at least 2 transactions
  // to make sure the tests will pass.

  before(co(function *() {
    // TODO: replace dev with test
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbtc');
    wallets = basecoin.wallets();
    basecoin.keychains();

    yield bitgo.authenticateTestUser(bitgo.testUserOTP());
    wallet = yield wallets.getWallet({ id: TestV2BitGo.V2.TEST_WALLET1_ID });

    const fundingVerificationBitgo = new TestV2BitGo({ env: 'test' });
    fundingVerificationBitgo.initializeTestVars();
    yield fundingVerificationBitgo.checkFunded();
  }));

  describe('Create Address', function() {

    it('should create a new address', function() {
      return wallet.createAddress()
      .then(function(newAddress) {
        newAddress.should.have.property('address');
        newAddress.should.have.property('coin');
        newAddress.should.have.property('wallet');
        newAddress.wallet.should.equal(wallet._wallet.id);
        newAddress.coin.should.equal(wallet._wallet.coin);
      });
    });

    it('should fail to create a new address', co(function *() {
      try {
        yield wallet.createAddress({ gasPrice: {} });
        throw new Error();
      } catch (e) {
        e.message.should.equal('gasPrice has to be an integer or numeric string');
      }
      try {
        yield wallet.createAddress({ gasPrice: 'abc' });
        throw new Error();
      } catch (e) {
        e.message.should.equal('gasPrice has to be an integer or numeric string');
      }
      try {
        yield wallet.createAddress({ gasPrice: null });
        throw new Error();
      } catch (e) {
        e.message.should.equal('gasPrice has to be an integer or numeric string');
      }

      const address1 = yield wallet.createAddress({ gasPrice: '12345' });
      address1.chain.should.equal(0);

      const address2 = yield wallet.createAddress({ gasPrice: '123456789111315171921' });
      address2.chain.should.equal(0);

      const address3 = yield wallet.createAddress({ gasPrice: 1234567 });
      address3.chain.should.equal(0);
    }));

  });

  describe('List Unspents', function() {

    it('unspents', function() {
      return wallet.unspents()
      .then(function(unspents) {
        unspents.should.have.property('coin');
        unspents.should.have.property('unspents');
        unspents.unspents.length.should.be.greaterThan(2);
      });
    });
  });

  describe('List Addresses', function() {

    it('addresses', function() {
      return wallet.addresses()
      .then(function(addresses) {
        addresses.should.have.property('coin');
        addresses.should.have.property('count');
        addresses.should.have.property('addresses');
        addresses.addresses.length.should.be.greaterThan(2);
        walletAddress = _.head(addresses.addresses).address;
        walletAddressId = _.head(addresses.addresses).id;
      });
    });

    it('should get single address', function() {
      return wallet.getAddress({ address: walletAddress })
      .then(function(address) {
        address.should.have.property('coin');
        address.should.have.property('wallet');
        address.address.should.equal(walletAddress);
        address.wallet.should.equal(wallet.id());
      });
    });

    it('should get single address by id', function() {
      return wallet.getAddress({ id: walletAddressId })
      .then(function(address) {
        address.should.have.property('coin');
        address.should.have.property('wallet');
        address.address.should.equal(walletAddress);
        address.id.should.equal(walletAddressId);
        address.wallet.should.equal(wallet.id());
      });
    });

    it('getbalances', function() {
      // TODO server currently doesn't use this param
    });

    it('prevId', function() {
      // TODO server currently doesn't use this param
    });
  });

  describe('List Transactions', function() {

    it('transactions', function() {
      return wallet.transactions()
      .then(function(transactions) {
        transactions.should.have.property('coin');
        transactions.should.have.property('transactions');
        transactions.transactions.length.should.be.greaterThan(2);
        const firstTransaction = transactions.transactions[0];
        firstTransaction.should.have.property('date');
        firstTransaction.should.have.property('entries');
        firstTransaction.should.have.property('fee');
        firstTransaction.should.have.property('hex');
        firstTransaction.should.have.property('id');
        firstTransaction.should.have.property('inputIds');
        firstTransaction.should.have.property('inputs');
        firstTransaction.should.have.property('outputs');
        firstTransaction.should.have.property('size');
      });
    });

    it('transactions with limit', function() {
      return wallet.transactions({ limit: 2 })
      .then(function(transactions) {
        transactions.should.have.property('coin');
        transactions.should.have.property('transactions');
        transactions.transactions.length.should.eql(2);
        const firstTransaction = transactions.transactions[0];
        firstTransaction.should.have.property('date');
        firstTransaction.should.have.property('entries');
        firstTransaction.should.have.property('fee');
        firstTransaction.should.have.property('hex');
        firstTransaction.should.have.property('id');
        firstTransaction.should.have.property('inputIds');
        firstTransaction.should.have.property('inputs');
        firstTransaction.should.have.property('outputs');
        firstTransaction.should.have.property('size');
      });
    });

    it('should fetch transaction by id', function() {
      return wallet.getTransaction({ txHash: '96b2376fb0ccfdbcc9472489ca3ec75df1487b08a0ea8d9d82c55da19d8cceea' })
      .then(function(transaction) {
        transaction.should.have.property('id');
        transaction.should.have.property('normalizedTxHash');
        transaction.should.have.property('date');
        transaction.should.have.property('blockHash');
        transaction.should.have.property('blockHeight');
        transaction.should.have.property('blockPosition');
        transaction.should.have.property('confirmations');
        transaction.should.have.property('fee');
        transaction.should.have.property('feeString');
        transaction.should.have.property('size');
        transaction.should.have.property('inputIds');
        transaction.should.have.property('inputs');
        transaction.should.have.property('size');

      });
    });

    it('should fail if not given a txHash', co(function *() {
      try {
        yield wallet.getTransaction();
        throw '';
      } catch (error) {
        error.message.should.equal('Missing parameter: txHash');
      }
    }));

    it('should fail if limit is negative', co(function *() {
      try {
        yield wallet.getTransaction({ txHash: '96b2376fb0ccfdbcc9472489ca3ec75df1487b08a0ea8d9d82c55da19d8cceea', limit: -1 });
        throw '';
      } catch (error) {
        error.message.should.equal('invalid limit argument, expecting positive integer');
      }
    }));

  });

  describe('List Transfers', function() {

    let thirdTransfer;
    it('transfers', function() {
      return wallet.transfers()
      .then(function(transfers) {
        transfers.should.have.property('transfers');
        transfers.transfers.length.should.be.greaterThan(0);
        thirdTransfer = transfers.transfers[2];
      });
    });

    it('transfers with limit and nextBatchPrevId', function() {
      return wallet.transfers({ limit: 2 })
      .then(function(transfers) {
        transfers.should.have.property('transfers');
        transfers.transfers.length.should.eql(2);
        return wallet.transfers({ prevId: transfers.nextBatchPrevId });
      })
      .then(function(transfers) {
        transfers.should.have.property('transfers');
        transfers.transfers.length.should.be.greaterThan(0);
        transfers.transfers[0].id.should.eql(thirdTransfer.id);
      });
    });

    it('get a transfer by id', function() {
      return wallet.getTransfer({ id: thirdTransfer.id })
      .then(function(transfer) {
        transfer.should.have.property('coin');
        transfer.should.have.property('height');
        transfer.should.have.property('txid');
        transfer.id.should.eql(thirdTransfer.id);
      });
    });

    it('update comment', function() {
      return wallet.transfers()
      .then(function(result) {
        const params = {
          id: result.transfers[0].id,
          comment: 'testComment'
        };
        return wallet.transferComment(params);
      })
      .then(function(transfer) {
        transfer.should.have.property('comment');
        transfer.comment.should.eql('testComment');
      });
    });

    it('remove comment', function() {
      return wallet.transfers()
      .then(function(result) {
        const params = {
          id: result.transfers[0].id,
          comment: null
        };
        return wallet.transferComment(params);
      })
      .then(function(transfer) {
        transfer.should.have.property('comment');
        transfer.comment.should.eql('');
      });
    });
  });

  describe('Send Transactions', function() {
    // some of the tests will return the error "Error: transaction attempted to double spend",
    // that occurs when the same unspent is selected different transactions, this is unlikely when
    // first running the function, but if you need to run it multiple times, all unspents will
    // be selected and used for pending transactions, and the tests will fail until there are available unspents.

    before(co(function *() {
      // TODO temporarily unlocking session to fix tests. Address unlock concept in BG-322.
      yield bitgo.unlock({ otp: bitgo.testUserOTP() });
    }));

    it('should send transaction to the wallet itself with send', function() {
      return wallet.createAddress()
      .delay(3000) // wait three seconds before sending
      .then(function(recipientAddress) {
        const params = {
          amount: 0.01 * 1e8, // 0.01 tBTC
          address: recipientAddress.address,
          walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
        };
        return wallet.send(params);
      })
      .then(function(transaction) {
        transaction.should.have.property('status');
        transaction.should.have.property('txid');
        transaction.status.should.equal('signed');
      });
    });

    it('should send transaction with sequence Id', co(function *() {
      // Wait five seconds to send a new tx
      yield Promise.delay(5000);

      sequenceId = Math.random().toString(36).slice(-10);
      const recipientAddress = yield wallet.createAddress();
      const params = {
        amount: 0.01 * 1e8, // 0.01 tBTC
        address: recipientAddress.address,
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
        sequenceId: sequenceId
      };
      const transaction = yield wallet.send(params);
      transaction.should.have.property('status');
      transaction.should.have.property('txid');
      transaction.status.should.equal('signed');
    }));

    it('should fetch a transfer by its sequence Id', co(function *() {
      // Wait for worker to do its work
      yield Promise.delay(10000);

      const transfer = yield wallet.transferBySequenceId({ sequenceId: sequenceId });
      transfer.should.have.property('sequenceId');
      transfer.sequenceId.should.equal(sequenceId);
    }));

    it('sendMany should error when given a non-array of recipients', co(function *() {
      const recipientAddress = yield wallet.createAddress();
      const params = {
        recipients: {
          amount: 0.01 * 1e8, // 0.01 tBTC
          address: recipientAddress.address
        },
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
      };

      const error = yield bitgo.getAsyncError(wallet.sendMany(params));
      should.exist(error);
    }));

    it('should send a transaction to the wallet itself with sendMany', function() {
      return wallet.createAddress()
      .then(function(recipientAddress) {
        const params = {
          recipients: [
            {
              amount: 0.01 * 1e8, // 0.01 tBTC
              address: recipientAddress.address
            }
          ],
          walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
        };
        return wallet.sendMany(params);
      })
      .then(function(transaction) {
        transaction.should.have.property('status');
        transaction.should.have.property('txid');
        transaction.status.should.equal('signed');
      });
    });

    it('should prebuild a transaction to the wallet', function() {
      return wallet.createAddress()
      .then(function(recipientAddress) {
        const params = {
          recipients: [
            {
              amount: 0.01 * 1e8, // 0.01 tBTC
              address: recipientAddress.address
            }
          ]

        };
        return wallet.prebuildTransaction(params);
      })
      .then(function(prebuild) {
        const explanation = basecoin.explainTransaction(prebuild);
        explanation.displayOrder.length.should.equal(6);
        explanation.outputs.length.should.equal(1);
        explanation.changeOutputs.length.should.equal(1);
        explanation.outputAmount.should.equal(0.01 * 1e8);
        explanation.outputs[0].amount.should.equal(0.01 * 1e8);
        explanation.should.have.property('fee');
        return wallet.sendMany({
          prebuildTx: prebuild,
          walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
          comment: 'Hello World!',
          txHex: 'should be overwritten'
        });
      })
      .then(function(transaction) {
        transaction.should.have.property('status');
        transaction.should.have.property('txid');
        transaction.status.should.equal('signed');
      });
    });

    it('should prebuild a transaction to the wallet and manually sign and submit it', function() {
      let keychain;
      return basecoin.keychains().get({ id: wallet._wallet.keys[0] })
      .then(function(key) {
        keychain = key;
        return wallet.createAddress();
      })
      .then(function(recipientAddress) {
        const params = {
          recipients: [
            {
              amount: 0.01 * 1e8, // 0.01 tBTC
              address: recipientAddress.address
            }
          ]

        };
        return wallet.prebuildTransaction(params);
      })
      .then(function(prebuild) {
        return wallet.signTransaction({
          txPrebuild: prebuild,
          key: keychain,
          walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE,
          comment: 'Hello World!',
          txHex: 'should be overwritten'
        });
      })
      .then(function(signedTransaction) {
        return wallet.submitTransaction(signedTransaction);
      })
      .then(function(transaction) {
        transaction.should.have.property('status');
        transaction.should.have.property('txid');
        transaction.status.should.equal('signed');
      });
    });
  });

  describe('Sharing & Pending Approvals', function() {
    let sharingUserBitgo;
    let sharingUserBasecoin;
    before(co(function *() {
      sharingUserBitgo = new TestV2BitGo({ env: 'test' });
      sharingUserBitgo.initializeTestVars();
      sharingUserBasecoin = sharingUserBitgo.coin('tbtc');
      yield sharingUserBitgo.authenticateSharingTestUser(sharingUserBitgo.testUserOTP());

      // clean up all incoming wallet shares for the sharing (shared-to) user
      const activeShares = yield sharingUserBasecoin.wallets().listShares({});
      const cancelShare = (share) => sharingUserBasecoin.wallets().cancelShare({ walletShareId: share.id });
      return Promise.all(_.map(activeShares.incoming, cancelShare));
    }));

    it('should extend invitation from main user to sharing user', function() {
      // take the main user wallet and invite this user
      let share;
      return wallet.shareWallet({
        email: TestV2BitGo.TEST_SHARED_KEY_USER,
        permissions: 'view,spend,admin',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
      })
      .then(function(shareDetails) {
        share = shareDetails;
        return sharingUserBitgo.unlock({ otp: sharingUserBitgo.testUserOTP() });
      })
      .then(function() {
        return sharingUserBasecoin.wallets().acceptShare({
          walletShareId: share.id,
          userPassword: TestV2BitGo.TEST_SHARED_KEY_PASSWORD
        });
      })
      .then(function(acceptanceDetails) {
        acceptanceDetails.should.have.property('changed');
        acceptanceDetails.should.have.property('state');
        acceptanceDetails.changed.should.equal(true);
        acceptanceDetails.state.should.equal('accepted');
      });
    });

    it('should have sharing user self-remove from accepted wallet and reject it', function() {
      const receivedWalletId = wallet.id();
      console.log('This is received wallet ID', receivedWalletId);
      return sharingUserBasecoin.wallets().list()
      .then(function(sharedWallets) {
        const receivedWallet = _.find(sharedWallets.wallets, function(w) { return w.id() === receivedWalletId; });
        return receivedWallet.removeUser({ userId: sharingUserBitgo._user.id });
      })
      .then(function(removal) {
        // this should require a pending approval
        return basecoin.wallets().get({ id: receivedWalletId });
      })
      .then(function(updatedWallet) {
        return updatedWallet.pendingApprovals();
      })
      .then(function(pendingApprovals) {
        const pendingApproval = _.find(pendingApprovals, function(pa) { return pa.wallet.id() === receivedWalletId; });

        pendingApproval.ownerType().should.equal('wallet');
        should.exist(pendingApproval.walletId());
        should.exist(pendingApproval.state());
        should.exist(pendingApproval.creator());
        should.exist(pendingApproval.info());
        should.exist(pendingApproval.type());
        should.exist(pendingApproval.approvalsRequired());
        pendingApproval.approvalsRequired().should.equal(1);
        return pendingApproval.reject();
      })
      .then(function(approval) {
        approval.wallet.should.equal(receivedWalletId);
        approval.state.should.equal('rejected');
      });
    });

    it('should have sharing user self-remove from accepted wallet and approve it', function() {
      const receivedWalletId = wallet.id();
      return sharingUserBasecoin.wallets().list()
      .then(function(sharedWallets) {
        const receivedWallet = _.find(sharedWallets.wallets, function(w) { return w.id() === receivedWalletId; });
        return receivedWallet.removeUser({ userId: sharingUserBitgo._user.id });
      })
      .then(function(removal) {
        // this should require a pending approval
        return basecoin.wallets().get({ id: receivedWalletId });
      })
      .then(function(updatedWallet) {
        return updatedWallet.pendingApprovals();
      })
      .then(function(pendingApprovals) {
        const pendingApproval = _.find(pendingApprovals, function(pa) { return pa.wallet.id() === receivedWalletId; });
        return pendingApproval.approve({ otp: bitgo.testUserOTP() });
      })
      .then(function(approval) {
        approval.should.have.property('approvalsRequired');
        approval.should.have.property('coin');
        approval.should.have.property('creator');
        approval.should.have.property('id');
        approval.should.have.property('state');
        approval.should.have.property('userIds');
        approval.should.have.property('wallet');
        approval.state.should.equal('approved');
        approval.wallet.should.equal(receivedWalletId);
      });
    });

    it('should share a wallet and then resend the wallet invite', co(function *() {
      // share this wallet
      const share = yield wallet.shareWallet({
        email: TestV2BitGo.TEST_SHARED_KEY_USER,
        permissions: 'view',
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
      });

      // resend the wallet share invitation
      const resendDetails = yield basecoin.wallets().resendShareInvite({
        walletShareId: share.id
      });

      // should get back an object like this: { resent: true }
      resendDetails.should.have.property('resent', true);
    }));

  });

  describe('Policies', function() {
    let policyWallet;
    before(co(function *() {
      // create a throwaway wallet
      const newWallet = yield bitgo.coin('tltc').wallets().generateWallet({
        label: 'Policy Testing Wallet',
        passphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
      });
      policyWallet = newWallet.wallet;
    }));

    it('should create a velocity limit policy and then remove it', co(function *() {
      const policyRuleWallet = yield policyWallet.createPolicyRule({
        action: {
          type: 'getApproval'
        },
        condition: {
          amountString: 100000,
          excludeTags: [],
          groupTags: [':tag'],
          timeWindow: 86400
        },
        id: 'abcdef',
        default: true,
        type: 'velocityLimit'
      });

      const policyRules = policyRuleWallet.admin.policy.rules;
      policyRules.length.should.equal(1);
      const policyRule = policyRules[0];
      policyRule.type.should.equal('velocityLimit');
      policyRule.id.should.equal('abcdef');
      policyRule.coin.should.equal('tltc');
      policyRule.condition.amountString.should.equal('100000');

      const updatedRuleWallet = yield policyWallet.setPolicyRule({
        action: {
          type: 'getApproval'
        },
        condition: {
          amountString: 50000,
          excludeTags: [],
          groupTags: [':tag'],
          timeWindow: 86400
        },
        id: 'abcdef',
        default: true,
        type: 'velocityLimit'
      });
      const updatedRules = updatedRuleWallet.admin.policy.rules;
      updatedRules.length.should.equal(1);
      const updatedRule = updatedRules[0];
      updatedRule.type.should.equal('velocityLimit');
      updatedRule.id.should.equal('abcdef');
      updatedRule.coin.should.equal('tltc');
      updatedRule.condition.amountString.should.equal('50000');

      const removalWallet = yield policyWallet.removePolicyRule({
        action: {
          type: 'getApproval'
        },
        condition: {
          amountString: 100000,
          excludeTags: [],
          groupTags: [':tag'],
          timeWindow: 86400
        },
        id: 'abcdef',
        default: true,
        type: 'velocityLimit'
      });
      const newPolicyRules = removalWallet.admin.policy.rules;
      newPolicyRules.length.should.equal(0);
    }));

    after(co(function *() {
      return policyWallet.remove();
    }));
  });

  describe('Unspent Manipulation', function() {
    let unspentWallet;

    before(co(function *() {
      unspentWallet = yield wallets.getWallet({ id: TestV2BitGo.V2.TEST_WALLET2_UNSPENTS_ID });
      yield bitgo.unlock({ otp: bitgo.testUserOTP() });
    }));

    it('should consolidate the number of unspents to 2', co(function *() {
      yield Promise.delay(3000);

      const params = {
        limit: 250,
        numUnspentsToMake: 2,
        minValue: 1000,
        numBlocks: 12,
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET2_UNSPENTS_PASSCODE
      };
      const transaction = yield unspentWallet.consolidateUnspents(params);
      transaction.should.have.property('status');
      transaction.should.have.property('txid');
      transaction.status.should.equal('signed');

      yield Promise.delay(8000);

      const unspentsResult = yield unspentWallet.unspents({ limit: 1000 });
      const numUnspents = unspentsResult.unspents.length;
      numUnspents.should.equal(2);

      yield Promise.delay(3000);
    }));

    it('should fanout the number of unspents to 200', co(function *() {
      yield Promise.delay(3000);

      const params = {
        minHeight: 1,
        maxNumInputsToUse: 80, // should be 2, but if a test were to fail and need to be rerun we want to use more of them
        numUnspentsToMake: 20,
        numBlocks: 12,
        walletPassphrase: TestV2BitGo.V2.TEST_WALLET2_UNSPENTS_PASSCODE
      };
      const transaction = yield unspentWallet.fanoutUnspents(params);

      transaction.should.have.property('status');
      transaction.should.have.property('txid');
      transaction.status.should.equal('signed');

      yield Promise.delay(8000);

      const unspentsResult = yield unspentWallet.unspents({ limit: 1000 });
      const numUnspents = unspentsResult.unspents.length;
      numUnspents.should.equal(20);
    }));
  });

});
