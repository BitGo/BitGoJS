//
// Tests for Wallets
//

import * as should from 'should';
import * as _ from 'lodash';
import * as nock from 'nock';

import { TestBitGo } from '../../lib/test_bitgo';

describe('V2 Wallet:', function () {
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

  before(async function () {
    nock.restore();
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbtc');
    wallets = basecoin.wallets();
    basecoin.keychains();

    await bitgo.authenticateTestUser(bitgo.testUserOTP());
    wallet = await wallets.getWallet({ id: TestBitGo.V2.TEST_WALLET1_ID });

    const fundingVerificationBitgo = new TestBitGo({ env: 'test' });
    fundingVerificationBitgo.initializeTestVars();
    await fundingVerificationBitgo.checkFunded();
  });

  describe('Create Address', function () {
    it('should create a new address', function () {
      return wallet.createAddress({ label: 'test run address' }).then(function (newAddress) {
        newAddress.should.have.property('address');
        newAddress.should.have.property('coin');
        newAddress.should.have.property('wallet');
        newAddress.label.should.equal('test run address');
        newAddress.wallet.should.equal(wallet._wallet.id);
        newAddress.coin.should.equal(wallet._wallet.coin);
      });
    });

    it('should create a new address from a listed wallet', async function () {
      const { wallets: walletsListing } = await wallets.list();

      // there is one known bad wallet with missing keychains. This will break this test, so filter it out
      const wallet = _(walletsListing)
        .filter((w) => w.id() !== '585cc6eb16efb0a50675fe4e3054662b')
        .sample();
      const { address } = await wallet.createAddress('listed wallet address');
      basecoin.isValidAddress(address).should.be.True();
    });

    it('should create new addresses in bulk', async function () {
      const result = await wallet.createAddress({ count: 3 });
      result.should.have.property('addresses');
      result.addresses.should.have.length(3);

      _.forEach(result.addresses, (addr) => {
        addr.should.have.property('id');
        addr.should.have.property('address');
        addr.should.have.property('chain');
        addr.should.have.property('index');
        addr.should.have.property('coin', wallet.coin());
        addr.should.have.property('wallet', wallet.id());
        addr.should.have.property('keychains');
      });
    });

    it('should label a new address', async function () {
      const originalAddress = await wallet.createAddress({ label: 'old_label' });
      const postParams = { address: originalAddress.id, label: 'label_01' };
      let updatedAddress = await wallet.updateAddress(postParams);
      updatedAddress.label.should.equal('label_01');
      postParams.address = originalAddress.address;
      postParams.label = 'label_02';
      updatedAddress = await wallet.updateAddress(postParams);
      updatedAddress.label.should.equal('label_02');
    });

    it('should set gas price for a new address', async function () {
      const address1 = await wallet.createAddress({ gasPrice: '12345' });
      address1.chain.should.equal(10);

      const address2 = await wallet.createAddress({ gasPrice: '123456789111315171921' });
      address2.chain.should.equal(10);

      const address3 = await wallet.createAddress({ gasPrice: 1234567 });
      address3.chain.should.equal(10);
    });
  });

  describe('List Unspents', function () {
    it('unspents', function () {
      return wallet.unspents().then(function (unspents) {
        unspents.should.have.property('coin');
        unspents.should.have.property('unspents');
        unspents.unspents.length.should.be.greaterThan(2);
      });
    });
  });

  describe('List Addresses', function () {
    it('addresses', function () {
      return wallet.addresses().then(function (addresses) {
        addresses.should.have.property('coin');
        addresses.should.have.property('count');
        addresses.should.have.property('addresses');
        addresses.addresses.length.should.be.greaterThan(2);
        walletAddress = (_.head(addresses.addresses) as any).address;
        walletAddressId = (_.head(addresses.addresses) as any).id;
      });
    });

    it('should get single address', function () {
      return wallet.getAddress({ address: walletAddress }).then(function (address) {
        address.should.have.property('coin');
        address.should.have.property('wallet');
        address.address.should.equal(walletAddress);
        address.wallet.should.equal(wallet.id());
      });
    });

    it('should get single address by id', function () {
      return wallet.getAddress({ id: walletAddressId }).then(function (address) {
        address.should.have.property('coin');
        address.should.have.property('wallet');
        address.address.should.equal(walletAddress);
        address.id.should.equal(walletAddressId);
        address.wallet.should.equal(wallet.id());
      });
    });

    it('getbalances', function () {
      // TODO server currently doesn't use this param
    });

    it('prevId', function () {
      // TODO server currently doesn't use this param
    });
  });

  describe('List Transactions', function () {
    it('transactions', function () {
      return wallet.transactions().then(function (transactions) {
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

    it('transactions with limit', function () {
      return wallet.transactions({ limit: 2 }).then(function (transactions) {
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

    it('should fetch transaction by id', function () {
      return wallet
        .getTransaction({ txHash: '96b2376fb0ccfdbcc9472489ca3ec75df1487b08a0ea8d9d82c55da19d8cceea' })
        .then(function (transaction) {
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

    it('should fail if not given a txHash', async function () {
      try {
        await wallet.getTransaction();
        throw '';
      } catch (error) {
        error.message.should.equal('Missing parameter: txHash');
      }
    });

    it('should fail if limit is negative', async function () {
      try {
        await wallet.getTransaction({
          txHash: '96b2376fb0ccfdbcc9472489ca3ec75df1487b08a0ea8d9d82c55da19d8cceea',
          limit: -1,
        });
        throw '';
      } catch (error) {
        error.message.should.equal('invalid limit argument, expecting positive integer');
      }
    });
  });

  describe('List Transfers', function () {
    let lookupTransfer;
    let wallet;
    let thirdTransfer;
    before(async function () {
      wallet = await wallets.getWallet({ id: TestBitGo.V2.TEST_WALLET2_UNSPENTS_ID });
      const transfers = await wallet.transfers();
      transfers.should.have.property('transfers');
      transfers.transfers.length.should.be.greaterThan(2);

      thirdTransfer = transfers.transfers[2];
      // need a confirmed transaction to ensure lookup works correctly
      lookupTransfer = _(transfers.transfers)
        .filter((t) => t.state === 'confirmed')
        .sample();
    });

    it('transfers with limit and nextBatchPrevId', async function () {
      const transfers = await wallet.transfers({ limit: 2 });
      transfers.should.have.property('transfers');
      transfers.transfers.length.should.eql(2);
      const nextBatch = await wallet.transfers({ prevId: transfers.nextBatchPrevId });
      nextBatch.should.have.property('transfers');
      nextBatch.transfers.length.should.be.greaterThan(0);
      nextBatch.transfers[0].id.should.eql(thirdTransfer.id);
    });

    // test is currently broken/flaky (BG-6378)
    xit('transfers with a searchLabel', async function () {
      const transfers = await wallet.transfers({ limit: 2, searchLabel: 'test' });
      transfers.should.have.property('transfers');
      transfers.transfers.length.should.eql(2);
    });

    it('get a transfer by id', async function () {
      const transfer = await wallet.getTransfer({ id: lookupTransfer.id });
      transfer.should.have.property('coin');
      transfer.should.have.property('height');
      transfer.should.have.property('txid');
      transfer.id.should.eql(lookupTransfer.id);
    });

    it('update comment', async function () {
      const result = await wallet.transfers();
      const params = {
        id: result.transfers[0].id,
        comment: 'testComment',
      };
      const transfer = await wallet.transferComment(params);
      transfer.should.have.property('comment');
      transfer.comment.should.eql('testComment');
    });

    it('remove comment', async function () {
      const result = await wallet.transfers();
      const params = {
        id: result.transfers[0].id,
        comment: null,
      };
      const transfer = await wallet.transferComment(params);
      transfer.should.have.property('comment');
      transfer.comment.should.eql('');
    });
  });

  describe('Prebuild Transactions', () => {
    it('should retrieve offline verification data for transaction prebuilds, if requested', async function () {
      const recipientAddress = await wallet.createAddress();
      const params = {
        recipients: [
          {
            amount: 0.01 * 1e8, // 0.01 tBTC
            address: recipientAddress.address,
          },
        ],
        offlineVerification: true,
      };
      const prebuild = await wallet.prebuildTransaction(params);

      prebuild.should.have.property('txInfo');
      prebuild.txInfo.should.have.property('unspents');
      prebuild.txInfo.should.have.property('txHexes');

      const txIds = Object.keys(prebuild.txInfo.txHexes);
      for (const unspent of prebuild.txInfo.unspents) {
        txIds.some((txId) => unspent.id.split(':')[0] === txId).should.be.true();
      }
    });
  });

  describe('Send Transactions', function () {
    // some of the tests will return the error "Error: transaction attempted to double spend",
    // that occurs when the same unspent is selected different transactions, this is unlikely when
    // first running the function, but if you need to run it multiple times, all unspents will
    // be selected and used for pending transactions, and the tests will fail until there are available unspents.

    before(async function () {
      // TODO temporarily unlocking session to fix tests. Address unlock concept in BG-322.
      await bitgo.unlock({ otp: bitgo.testUserOTP() });
    });

    it('should send transaction to the wallet itself with send', function () {
      return wallet
        .createAddress()
        .delay(3000) // wait three seconds before sending
        .then(function (recipientAddress) {
          const params = {
            amount: 0.01 * 1e8, // 0.01 tBTC
            address: recipientAddress.address,
            walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
          };
          return wallet.send(params);
        })
        .then(function (transaction) {
          transaction.should.have.property('status');
          transaction.should.have.property('txid');
          transaction.status.should.equal('signed');
        });
    });

    it('should send transaction with sequence Id', async function () {
      // Wait five seconds to send a new tx
      await new Promise((resolve) => setTimeout(resolve, 5000));

      sequenceId = Math.random().toString(36).slice(-10);
      const recipientAddress = await wallet.createAddress();
      const params = {
        amount: 0.01 * 1e8, // 0.01 tBTC
        address: recipientAddress.address,
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        sequenceId: sequenceId,
      };
      const transaction = await wallet.send(params);
      transaction.should.have.property('status');
      transaction.should.have.property('txid');
      transaction.status.should.equal('signed');
    });

    it('should fetch a transfer by its sequence Id', async function () {
      // Wait for worker to do its work
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const transfer = await wallet.transferBySequenceId({ sequenceId: sequenceId });
      transfer.should.have.property('sequenceId');
      transfer.sequenceId.should.equal(sequenceId);
    });

    it('sendMany should error when given a non-array of recipients', async function () {
      const recipientAddress = await wallet.createAddress();
      const params = {
        recipients: {
          amount: 0.01 * 1e8, // 0.01 tBTC
          address: recipientAddress.address,
        },
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
      };

      await wallet.sendMany(params).should.be.rejected();
    });

    it('should send a transaction to the wallet itself with sendMany', function () {
      return wallet
        .createAddress()
        .then(function (recipientAddress) {
          const params = {
            recipients: [
              {
                amount: 0.01 * 1e8, // 0.01 tBTC
                address: recipientAddress.address,
              },
            ],
            walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
          };
          return wallet.sendMany(params);
        })
        .then(function (transaction) {
          transaction.should.have.property('status');
          transaction.should.have.property('txid');
          transaction.status.should.equal('signed');
        });
    });

    it('should prebuild a transaction to the wallet', async function () {
      const recipientAddress = await wallet.createAddress();
      const params = {
        recipients: [
          {
            amount: 0.01 * 1e8, // 0.01 tBTC
            address: recipientAddress.address,
          },
        ],
      };
      const prebuild = await wallet.prebuildTransaction(params);
      const explanation = await basecoin.explainTransaction(prebuild);
      explanation.displayOrder.length.should.equal(7);
      explanation.outputs.length.should.equal(1);
      // sometimes the change output is below the dust threshold and gets dumped to fees, so it may be missing
      explanation.changeOutputs.length.should.be.within(0, 1);
      explanation.outputAmount.should.equal(0.01 * 1e8);
      explanation.outputs[0].amount.should.equal(0.01 * 1e8);
      const chainhead = await bitgo.get(basecoin.url('/public/block/latest')).result();
      explanation.locktime.should.equal(chainhead.height);
      explanation.should.have.property('fee');
      const transaction = await wallet.sendMany({
        prebuildTx: prebuild,
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        comment: 'Hello World!',
        txHex: 'should be overwritten',
      });
      transaction.should.have.property('status');
      transaction.should.have.property('txid');
      transaction.status.should.equal('signed');
    });

    it('should prebuild a transaction to the wallet and manually sign and submit it', function () {
      let keychain;
      return basecoin
        .keychains()
        .get({ id: wallet._wallet.keys[0] })
        .then(function (key) {
          keychain = key;
          return wallet.createAddress();
        })
        .then(function (recipientAddress) {
          const params = {
            recipients: [
              {
                amount: 0.01 * 1e8, // 0.01 tBTC
                address: recipientAddress.address,
              },
            ],
          };
          return wallet.prebuildTransaction(params);
        })
        .then(function (prebuild) {
          return wallet.signTransaction({
            txPrebuild: prebuild,
            key: keychain,
            walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
            comment: 'Hello World!',
            txHex: 'should be overwritten',
          });
        })
        .then(function (signedTransaction) {
          return wallet.submitTransaction(signedTransaction);
        })
        .then(function (transaction) {
          transaction.should.have.property('status');
          transaction.should.have.property('txid');
          transaction.status.should.equal('signed');
        });
    });
  });

  // FIXME(BG-20416): test is failing
  xdescribe('Sharing & Pending Approvals', function () {
    let sharingUserBitgo;
    let sharingUserBasecoin;
    before(async function () {
      sharingUserBitgo = new TestBitGo({ env: 'test' });
      sharingUserBitgo.initializeTestVars();
      sharingUserBasecoin = sharingUserBitgo.coin('tbtc');
      await sharingUserBitgo.authenticateSharingTestUser(sharingUserBitgo.testUserOTP());

      // clean up all incoming wallet shares for the sharing (shared-to) user
      const activeShares = await sharingUserBasecoin.wallets().listShares({});
      const cancelShare = (share) => sharingUserBasecoin.wallets().cancelShare({ walletShareId: share.id });
      return Promise.all(_.map(activeShares.incoming, cancelShare));
    });

    it('should extend invitation from main user to sharing user', function () {
      // take the main user wallet and invite this user
      let share;
      return wallet
        .shareWallet({
          email: TestBitGo.TEST_SHARED_KEY_USER,
          permissions: 'view,spend,admin',
          walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
        })
        .then(function (shareDetails) {
          share = shareDetails;
          return sharingUserBitgo.unlock({ otp: sharingUserBitgo.testUserOTP() });
        })
        .then(function () {
          return sharingUserBasecoin.wallets().acceptShare({
            walletShareId: share.id,
            userPassword: TestBitGo.TEST_SHARED_KEY_PASSWORD,
          });
        })
        .then(function (acceptanceDetails) {
          acceptanceDetails.should.have.property('changed');
          acceptanceDetails.should.have.property('state');
          acceptanceDetails.changed.should.equal(true);
          acceptanceDetails.state.should.equal('accepted');
        });
    });

    it('should have sharing user self-remove from accepted wallet and reject it', function () {
      const receivedWalletId = wallet.id();
      return sharingUserBasecoin
        .wallets()
        .list()
        .then(function (sharedWallets) {
          const receivedWallet = _.find(sharedWallets.wallets, function (w) {
            return w.id() === receivedWalletId;
          });
          receivedWallet.should.have.property('_permissions');
          receivedWallet._permissions.length.should.equal(3);
          receivedWallet._permissions.should.containEql('admin');
          receivedWallet._permissions.should.containEql('view');
          receivedWallet._permissions.should.containEql('spend');
          return receivedWallet.removeUser({ userId: sharingUserBitgo._user.id });
        })
        .then(function (removal) {
          // this should require a pending approval
          return basecoin.wallets().get({ id: receivedWalletId });
        })
        .then(function (updatedWallet) {
          return updatedWallet.pendingApprovals();
        })
        .then(function (pendingApprovals) {
          const pendingApproval = _.find(pendingApprovals, function (pa) {
            return pa.wallet.id() === receivedWalletId;
          });

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
        .then(function (approval) {
          approval.wallet.should.equal(receivedWalletId);
          approval.state.should.equal('rejected');
        });
    });

    it('should have sharing user self-remove from accepted wallet and approve it', function () {
      const receivedWalletId = wallet.id();
      return sharingUserBasecoin
        .wallets()
        .list()
        .then(function (sharedWallets) {
          const receivedWallet = _.find(sharedWallets.wallets, function (w) {
            return w.id() === receivedWalletId;
          });
          return receivedWallet.removeUser({ userId: sharingUserBitgo._user.id });
        })
        .then(function (removal) {
          // this should require a pending approval
          return basecoin.wallets().get({ id: receivedWalletId });
        })
        .then(function (updatedWallet) {
          return updatedWallet.pendingApprovals();
        })
        .then(function (pendingApprovals) {
          const pendingApproval = _.find(pendingApprovals, function (pa) {
            return pa.wallet.id() === receivedWalletId;
          });
          return pendingApproval.approve({ otp: bitgo.testUserOTP() });
        })
        .then(function (approval) {
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

    it('should share a wallet and then resend the wallet invite', async function () {
      // share this wallet
      const share = await wallet.shareWallet({
        email: TestBitGo.TEST_SHARED_KEY_USER,
        permissions: 'view',
        walletPassphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
      });

      // resend the wallet share invitation
      const resendDetails = await basecoin.wallets().resendShareInvite({
        walletShareId: share.id,
      });

      // should get back an object like this: { resent: true }
      resendDetails.should.have.property('resent', true);
    });
  });

  describe('Policies', function () {
    let policyWallet;
    before(async function () {
      // create a throwaway wallet
      const newWallet = await bitgo.coin('tltc').wallets().generateWallet({
        label: 'Policy Testing Wallet',
        passphrase: TestBitGo.V2.TEST_WALLET1_PASSCODE,
      });
      policyWallet = newWallet.wallet;
    });

    it('should create a velocity limit policy and then remove it', async function () {
      const policyRuleWallet = await policyWallet.createPolicyRule({
        action: {
          type: 'getApproval',
        },
        condition: {
          amountString: 100000,
          groupTags: [':tag'],
          timeWindow: 86400,
        },
        id: 'abcdef',
        default: true,
        type: 'velocityLimit',
      });

      const policyRules = policyRuleWallet.admin.policy.rules;
      policyRules.length.should.equal(1);
      const policyRule = policyRules[0];
      policyRule.type.should.equal('velocityLimit');
      policyRule.id.should.equal('abcdef');
      policyRule.coin.should.equal('tltc');
      policyRule.condition.amountString.should.equal('100000');

      const updatedRuleWallet = await policyWallet.setPolicyRule({
        action: {
          type: 'getApproval',
        },
        condition: {
          amountString: 50000,
          groupTags: [':tag'],
          timeWindow: 86400,
        },
        id: 'abcdef',
        default: true,
        type: 'velocityLimit',
      });
      const updatedRules = updatedRuleWallet.admin.policy.rules;
      updatedRules.length.should.equal(1);
      const updatedRule = updatedRules[0];
      updatedRule.type.should.equal('velocityLimit');
      updatedRule.id.should.equal('abcdef');
      updatedRule.coin.should.equal('tltc');
      updatedRule.condition.amountString.should.equal('50000');

      const removalWallet = await policyWallet.removePolicyRule({
        action: {
          type: 'getApproval',
        },
        condition: {
          amountString: 100000,
          groupTags: [':tag'],
          timeWindow: 86400,
        },
        id: 'abcdef',
        default: true,
        type: 'velocityLimit',
      });
      const newPolicyRules = removalWallet.admin.policy.rules;
      newPolicyRules.length.should.equal(0);
    });

    after(async function () {
      return policyWallet.remove();
    });
  });

  describe('Unspent Manipulation', function () {
    xit('should consolidate the number of unspents to 2, and fanout the number of unspents to 200', async function () {
      const unspentWallet = await wallets.getWallet({ id: TestBitGo.V2.TEST_WALLET2_UNSPENTS_ID });
      await bitgo.unlock({ otp: bitgo.testUserOTP() });
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const params1 = {
        limit: 250,
        numUnspentsToMake: 2,
        minValue: 1000,
        numBlocks: 12,
        walletPassphrase: TestBitGo.V2.TEST_WALLET2_UNSPENTS_PASSCODE,
      };
      const transaction1 = await unspentWallet.consolidateUnspents(params1);
      transaction1.should.have.property('status');
      transaction1.should.have.property('txid');
      transaction1.status.should.equal('signed');

      await new Promise((resolve) => setTimeout(resolve, 8000));

      const unspentsResult1 = await unspentWallet.unspents({ limit: 1000 });
      const numUnspents1 = unspentsResult1.unspents.length;
      numUnspents1.should.equal(2);

      await new Promise((resolve) => setTimeout(resolve, 6000));

      const params2 = {
        minHeight: 1,
        maxNumInputsToUse: 80, // should be 2, but if a test were to fail and need to be rerun we want to use more of them
        numUnspentsToMake: 20,
        numBlocks: 12,
        walletPassphrase: TestBitGo.V2.TEST_WALLET2_UNSPENTS_PASSCODE,
      };
      const transaction2 = await unspentWallet.fanoutUnspents(params2);

      transaction2.should.have.property('status');
      transaction2.should.have.property('txid');
      transaction2.status.should.equal('signed');

      await new Promise((resolve) => setTimeout(resolve, 8000));

      const unspentsResult2 = await unspentWallet.unspents({ limit: 1000 });
      const numUnspents2 = unspentsResult2.unspents.length;
      numUnspents2.should.equal(20);
    });

    // TODO: change xit to it once the sweepWallet route is running on test, to run this integration test
    xit('should sweep funds between two wallets', async function () {
      const unspentWallet = await wallets.getWallet({ id: TestBitGo.V2.TEST_WALLET2_UNSPENTS_ID });
      const sweep1Wallet = await wallets.getWallet({ id: TestBitGo.V2.TEST_SWEEP1_ID });
      const sweep2Wallet = await wallets.getWallet({ id: TestBitGo.V2.TEST_SWEEP2_ID });
      await bitgo.unlock({ otp: bitgo.testUserOTP() });
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const params1 = {
        address: TestBitGo.V2.TEST_SWEEP2_ADDRESS,
        walletPassphrase: TestBitGo.V2.TEST_SWEEP1_PASSCODE,
      };
      const transaction1 = await sweep1Wallet.sweep(params1);
      transaction1.should.have.property('status');
      transaction1.should.have.property('txid');
      transaction1.status.should.equal('signed');

      await new Promise((resolve) => setTimeout(resolve, 8000));

      const unspentsResult1 = await sweep1Wallet.unspents();
      const numUnspents1 = unspentsResult1.unspents.length;
      numUnspents1.should.equal(0);

      const unspentsResult2 = await sweep2Wallet.unspents();
      const numUnspents2 = unspentsResult2.unspents.length;
      numUnspents2.should.equal(1);

      // sweep funds back to starting wallet
      const params2 = {
        address: TestBitGo.V2.TEST_SWEEP1_ADDRESS,
        walletPassphrase: TestBitGo.V2.TEST_SWEEP2_PASSCODE,
      };
      const transaction2 = await unspentWallet.sweep(params2);

      transaction2.should.have.property('status');
      transaction2.should.have.property('txid');
      transaction2.status.should.equal('signed');

      await new Promise((resolve) => setTimeout(resolve, 8000));

      const unspentsResult3 = await sweep2Wallet.unspents();
      const numUnspents3 = unspentsResult3.unspents.length;
      numUnspents3.should.equal(0);

      const unspentsResult4 = await sweep1Wallet.unspents();
      const numUnspents4 = unspentsResult4.unspents.length;
      numUnspents4.should.equal(1);
    });
  });
});
