  //
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');
var Q = require('q');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');
var TransactionBuilder = require('../src/transactionBuilder');
var unspentData = require('./fixtures/largeunspents.json');

Q.longStackTrace = true;

describe('Wallet', function() {
  var bitgo;
  var wallet1, wallet2, wallet3, safewallet;

  before(function(done) {
    BitGoJS.setNetwork('testnet');

    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    wallets = bitgo.wallets();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        console.log(err);
        throw err;
      }

      // Fetch the first wallet.
      var options = {
        id: TestBitGo.TEST_WALLET1_ADDRESS
      };
      wallets.get(options, function(err, wallet) {
        if (err) {
          throw err;
        }
        wallet1 = wallet;

        // Fetch the second wallet
        var options = {
          id: TestBitGo.TEST_WALLET2_ADDRESS
        };
        wallets.get(options, function(err, wallet) {
          wallet2 = wallet;

          // Fetch the third wallet
          var options = {
            id: TestBitGo.TEST_WALLET3_ADDRESS
          };
          wallets.get(options, function(err, wallet) {
            wallet3 = wallet;

            // Fetch legacy safe wallet
            var options = {
              id: "2MvfC3e6njdTXqWDfGvNUqDs5kwimfaTGjK"
            };
            wallets.get(options, function(err, wallet) {
              safewallet = wallet;
              done();
            });
          });
        });
      });
    });
  });

  var walletShareIdWithViewPermissions, walletShareIdWithSpendPermissions, cancelledWalletShareId;
  describe('Share wallet', function() {
    // clean up any outstanding shares before proceeding
    before(function() {
      return bitgo.wallets().listShares({})
      .then(function(result){
        var cancels = result.outgoing.map(function(share) {
          return bitgo.wallets().cancelShare({ walletShareId: share.id });
        });
        return Q.all(cancels);
      });
    });

    it('arguments', function (done) {
      assert.throws(function () { bitgo.getSharingKey({}); });

      assert.throws(function () { wallet1.shareWallet({}, function() {}); });
      assert.throws(function () { wallet1.shareWallet({ email:'tester@bitgo.com' }, function() {}); });
      // assert.throws(function () { wallet1.shareWallet({ email:'notfoundqery@bitgo.com', walletPassphrase:'wrong' }, function() {}); });
      done();
    });

    it('get sharing key of user that does not exist', function(done) {

      bitgo.getSharingKey({ email:'notfoundqery@bitgo.com' })
      .done(
        function(success) {
          success.should.equal(null);
        },
        function(err) {
          err.status.should.equal(404);
          done();
        }
      );
    });

    it('sharing with user that does not exist', function(done) {

      wallet1.shareWallet({
        email:'notfoundqery@bitgo.com',
        permissions: 'admin,spend,view',
        walletPassphrase:'test'
      })
      .done(
      function(success) {
        success.should.equal(null);
      },
      function(err) {
        err.status.should.equal(404);
        done();
      }
      );
    });

    it('trying to share with an incorrect passcode', function(done) {

      bitgo.unlock({ otp: '0000000' })
      .then(function() {
        wallet1.shareWallet({
          email: TestBitGo.TEST_SHARED_KEY_USER,
          permissions: 'admin,spend,view',
          walletPassphrase: 'wrong'
        })
        .done(
        function(success) {
          success.should.equal(null);
        },
        function(err) {
          err.message.should.include('Unable to decrypt user keychain');
          done();
        }
        );
      });
    });

    it('get sharing key for a user', function(done) {
      var keychains = bitgo.keychains();
      var newKey = keychains.create();

      var options = {
        xpub: newKey.xpub
      };

      bitgo.getSharingKey({ email: TestBitGo.TEST_SHARED_KEY_USER })
      .done(function(result) {

        result.should.have.property('userId');
        result.should.have.property('pubkey');
        result.userId.should.equal(TestBitGo.TEST_SHARED_KEY_USERID);
        done();
      })
    });

    it('share a wallet (view)', function(done) {
      bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet1.shareWallet({
          email: TestBitGo.TEST_SHARED_KEY_USER,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
          reshare: true, // for tests, we have actually already shared the wallet, and thus must set reshare
          permissions: 'view'
        });
      })
      .then(function(result){
        result.should.have.property('walletId');
        result.should.have.property('fromUser');
        result.should.have.property('toUser');
        result.should.have.property('state');
        result.walletId.should.equal(wallet1.id());
        result.fromUser.should.equal(TestBitGo.TEST_USERID);
        result.toUser.should.equal(TestBitGo.TEST_SHARED_KEY_USERID);
        result.state.should.equal('active');

        result.should.have.property('id');
        walletShareIdWithViewPermissions = result.id;
        done();
      })
      .done();
    });

    it('share a wallet (spend)', function(done) {
      bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet2.shareWallet({
          email: TestBitGo.TEST_SHARED_KEY_USER,
          walletPassphrase: TestBitGo.TEST_WALLET2_PASSCODE,
          reshare: true, // for tests, we have actually already shared the wallet, and thus must set reshare
          permissions: 'view,spend'
        });
      })
      .then(function(result){
        result.should.have.property('walletId');
        result.should.have.property('fromUser');
        result.should.have.property('toUser');
        result.should.have.property('state');
        result.walletId.should.equal(wallet2.id());
        result.fromUser.should.equal(TestBitGo.TEST_USERID);
        result.toUser.should.equal(TestBitGo.TEST_SHARED_KEY_USERID);
        result.state.should.equal('active');

        result.should.have.property('id');
        walletShareIdWithSpendPermissions = result.id;
        done();
      })
      .done();
    });

    it('share a wallet and then cancel the share', function(done) {
      bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet3.shareWallet({
          email: TestBitGo.TEST_SHARED_KEY_USER,
          walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE,
          permissions: 'view'
        });
      })
      .then(function(result){
        result.should.have.property('walletId');
        result.should.have.property('fromUser');
        result.should.have.property('toUser');
        result.should.have.property('state');
        result.walletId.should.equal(wallet3.id());
        cancelledWalletShareId = result.id;

        return bitgo.wallets().cancelShare({ walletShareId: cancelledWalletShareId }, function(err, result) {

          result.should.have.property('state');
          result.should.have.property('changed');
          result.state.should.equal('canceled');
          result.changed.should.equal(true);
          done();
        });
      })
      .done();
    });
  });

  var bitgoSharedKeyUser;
  describe('Get wallet share list', function() {
    before(function(done) {
      bitgoSharedKeyUser = new TestBitGo();
      bitgoSharedKeyUser.initializeTestVars();
      bitgoSharedKeyUser.authenticate({ username: TestBitGo.TEST_SHARED_KEY_USER, password: TestBitGo.TEST_SHARED_KEY_PASSWORD, otp: '0000000' })
      .then(function(success) {
        done();
      })
      .done();
    });

    it('cancelled wallet share should not be in sender list', function(done) {

      bitgo.wallets().listShares({})
      .then(function(result){
        result.outgoing.should.not.containDeep([{id: cancelledWalletShareId}]);
        done();
      })
      .done();
    });

    it('wallet share should be in sender list', function(done) {
      bitgo.wallets().listShares({})
      .then(function(result){
        result.outgoing.should.containDeep([{id: walletShareIdWithViewPermissions}]);
        result.outgoing.should.containDeep([{id: walletShareIdWithSpendPermissions}]);
        done();
      })
      .done();
    });

    it('wallet share should be in receiver list', function(done) {
      bitgoSharedKeyUser.wallets().listShares({})
      .then(function(result){
        result.incoming.should.containDeep([{id: walletShareIdWithViewPermissions}]);
        result.incoming.should.containDeep([{id: walletShareIdWithSpendPermissions}]);
        done();
      })
      .done();
    });
  });

  describe('Accept wallet share', function (){
    before(function(done) {
      bitgoSharedKeyUser = new TestBitGo();
      bitgoSharedKeyUser.initializeTestVars();
      bitgoSharedKeyUser.authenticate({ username: TestBitGo.TEST_SHARED_KEY_USER, password: TestBitGo.TEST_SHARED_KEY_PASSWORD, otp: '0000000' })
      .then(function(success) {
        done();
      })
      .done();
    });

    it('accept a wallet share with only view permissions', function(done) {
      bitgoSharedKeyUser.wallets().acceptShare({walletShareId: walletShareIdWithViewPermissions})
      .then(function(result) {
        result.should.have.property('state');
        result.should.have.property('changed');
        result.state.should.equal('accepted');
        result.changed.should.equal(true);

        // now check that the wallet share id is no longer there
        return bitgoSharedKeyUser.wallets().listShares({})
      })
      .then(function(result) {
        result.incoming.should.not.containDeep([{id: walletShareIdWithViewPermissions}]);
        done();
      })
      .done();
    });

    it('accept a wallet share with spend permissions', function(done) {
      bitgoSharedKeyUser.unlock({'otp': '0000000'})
      .then(function() {
        return bitgoSharedKeyUser.wallets().acceptShare({walletShareId: walletShareIdWithSpendPermissions, userPassword: TestBitGo.TEST_SHARED_KEY_PASSWORD})
        .then(function (result) {
          result.should.have.property('state');
          result.should.have.property('changed');
          result.state.should.equal('accepted');
          result.changed.should.equal(true);

          // now check that the wallet share id is no longer there
          return bitgoSharedKeyUser.wallets().listShares()
        })
        .then(function (result) {
          result.incoming.should.not.containDeep([{id: walletShareIdWithSpendPermissions}]);
          done();
        })
        .done();
      })
      .done();
    });
  });

  describe('Wallet shares with skip keychain', function () {

    var walletShareId;
    it('share a wallet (spend) without keychain', function(done) {
      bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet2.shareWallet({
          email: TestBitGo.TEST_SHARED_KEY_USER,
          skipKeychain: true,
          reshare: true, // for tests, we have actually already shared the wallet, and thus must set reshare
          permissions: 'view,spend'
        });
      })
      .then(function(result){
        result.should.have.property('walletId');
        result.should.have.property('fromUser');
        result.should.have.property('toUser');
        result.should.have.property('state');
        result.walletId.should.equal(wallet2.id());
        result.fromUser.should.equal(TestBitGo.TEST_USERID);
        result.toUser.should.equal(TestBitGo.TEST_SHARED_KEY_USERID);
        result.state.should.equal('active');

        result.should.have.property('id');
        walletShareId = result.id;
        done();
      })
      .done();
    });

    it('accept a wallet share without password', function(done) {
      bitgoSharedKeyUser.unlock({'otp': '0000000'})
      .then(function() {
        return bitgoSharedKeyUser.wallets().acceptShare({ walletShareId: walletShareId, overrideEncryptedXprv: 'test' })
        .then(function (result) {
          result.should.have.property('state');
          result.should.have.property('changed');
          result.state.should.equal('accepted');
          result.changed.should.equal(true);

          // now check that the wallet share id is no longer there
          return bitgoSharedKeyUser.wallets().listShares()
        })
        .then(function (result) {
          result.incoming.should.not.containDeep([{id: walletShareId}]);
          done();
        })
        .done();
      })
      .done();
    });
  });

  describe('CreateAddress', function() {
    var addr;

    it('arguments', function(done) {
      assert.throws(function() { wallet2.createAddress('invalid', function() {}); });
      assert.throws(function() { wallet2.createAddress({}, 'invalid'); });
      done();
    });

    it('create', function(done) {
      wallet2.createAddress({}, function(err, address) {
        assert.equal(err, null);
        address.should.have.property('path');
        address.should.have.property('redeemScript');
        address.should.have.property('address');
        addr = address;
        assert.notEqual(address.address, wallet2.id());

        // TODO: Verify the chain?
        done();
      });
    });

    it('validate address', function() {
      assert.throws(function() {
        wallet2.validateAddress({address: addr.address, path: '0/0'});
      });
      assert.throws(function() {
        wallet2.validateAddress({address: addr.address, path: '/0/0'});
      });
      wallet2.validateAddress(addr);
      wallet2.validateAddress({ address: TestBitGo.TEST_WALLET2_ADDRESS, path: '/0/0' });
    });
  });

  describe('GetAddresses', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.addresses('invalid', function() {}); });
      assert.throws(function() { wallet1.addresses({}, 'invalid'); });
      done();
    });

    it('get', function(done) {
      var options = { };
      wallet1.addresses(options, function(err, addresses) {
        assert.equal(err, null);
        addresses.should.have.property('addresses');
        addresses.should.have.property('start');
        addresses.should.have.property('count');
        addresses.should.have.property('total');
        var firstAddress = addresses.addresses[0];
        firstAddress.should.have.property('chain');
        firstAddress.should.have.property('index');
        firstAddress.should.have.property('path');

        assert.equal(Array.isArray(addresses.addresses), true);
        assert.equal(addresses.addresses.length, addresses.count);
        done();
      });
    });

    it('getWithLimit1', function(done) {
      var options = { limit: 1 };
      wallet1.addresses(options, function(err, addresses) {
        assert.equal(err, null);
        addresses.should.have.property('addresses');
        addresses.should.have.property('start');
        addresses.should.have.property('count');
        addresses.should.have.property('total');
        var firstAddress = addresses.addresses[0];
        firstAddress.should.have.property('chain');
        firstAddress.should.have.property('index');
        firstAddress.should.have.property('path');

        assert.equal(Array.isArray(addresses.addresses), true);
        assert.equal(addresses.addresses.length, addresses.count);
        assert.equal(addresses.addresses.length, 1);
        done();
      });
    });
  });

  describe('Estimate Fees', function() {
    it('arguments', function() {
      assert.throws(function () {
        wallet1.estimateFee({ numBlocks: "none" });
      });
    });

    var target1confirmFee;
    it('get default', function() {
      return wallet1.estimateFee()
      .then(function(res) {
        res.should.have.property('feePerKb');
        res.should.have.property('numBlocks');
        res.numBlocks.should.eql(1);
        res.feePerKb.should.be.within(1000, 100000);
        target1confirmFee = res.feePerKb;
      });
    });

    it('get fee for target of 3 blocks', function() {
      return wallet1.estimateFee({ numBlocks: 3 })
      .then(function(res) {
        res.should.have.property('feePerKb');
        res.should.have.property('numBlocks');
        res.numBlocks.should.eql(3);
        res.feePerKb.should.be.within(1000, 100000);
      });
    });
  });

  describe('Labels', function() {
    it('list', function(done) {
      // delete all labels from wallet1
      wallet1.labels({}, function(err, labels) {
        if (labels == null) {
          return;
        }

        labels.forEach (function(label) {
          wallet1.deleteLabel({address: label.address}, function(err, label) {
            assert.equal(err, null);
          });
        });
      });

      // create a single label on TestBitGo.TEST_WALLET1_ADDRESS2 and check that it is returned
      wallet1.setLabel({label: "testLabel", address: TestBitGo.TEST_WALLET1_ADDRESS2}, function(err, label) {
        // create a label on wallet2's TEST_WALLET2_ADDRESS to ensure that it is not returned
        wallet2.setLabel({label: "wallet2TestLabel", address: TestBitGo.TEST_WALLET2_ADDRESS}, function(err, label2) {
          wallet1.labels({}, function(err, labels) {
            assert.equal(err, null);
            labels.forEach (function(label) {
              label.should.have.property('label');
              label.should.have.property('address');
              label.label.should.eql("testLabel");
              label.address.should.eql(TestBitGo.TEST_WALLET1_ADDRESS2);
            });
            done();
          });
        });
      });
    });
  });

  describe('SetLabel', function() {

    it('arguments', function(done) {
      assert.throws(function() { wallet1.setLabel({}, function() {}); });
      assert.throws(function() { wallet1.setLabel({label: "testLabel"}, function() {}); });
      assert.throws(function() { wallet1.setLabel({address: TestBitGo.TEST_WALLET1_ADDRESS2}, function() {}); });
      assert.throws(function() { wallet1.setLabel({label: "testLabel", address: "invalidAddress"}, function() {}); });
      assert.throws(function() { wallet1.setLabel({label: "testLabel", address: TestBitGo.TEST_WALLET2_ADDRESS2}, function() {}); });
      done();
    });

    it('create', function(done) {
      wallet1.setLabel({label: "testLabel", address: TestBitGo.TEST_WALLET1_ADDRESS2}, function(err, label) {
        assert.equal(err, null);
        label.should.have.property('label');
        label.should.have.property('address');
        label.label.should.eql("testLabel");
        label.address.should.eql(TestBitGo.TEST_WALLET1_ADDRESS2);
        done();
      });
    });
  });

  describe('DeleteLabel', function() {

    it('arguments', function(done) {
      assert.throws(function() { wallet1.deleteLabel({}, function() {}); });
      assert.throws(function() { wallet1.deleteLabel({address: "invalidAddress"}, function() {}); });
      done();
    });

    it('delete', function(done) {
      wallet1.deleteLabel({address: TestBitGo.TEST_WALLET1_ADDRESS2}, function(err, label) {
        assert.equal(err, null);
        label.should.have.property('address');
        label.address.should.eql(TestBitGo.TEST_WALLET1_ADDRESS2);
        done();
      });
    });
  });

  describe('Unspents', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.unspents('invalid', function() {}); });
      assert.throws(function() { wallet1.unspents({target: 'a string!'}, function() {}); });
      assert.throws(function() { wallet1.unspents({}, 'invalid'); });
      done();
    });

    it('list', function(done) {
      var options = { limit: 0.5 * 1e8 };
      wallet1.unspents(options, function(err, unspents) {
        assert.equal(err, null);
        assert.equal(Array.isArray(unspents), true);
        done();
      });
    });
  });

  describe('Transactions', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.transactions('invalid', function() {}); });
      assert.throws(function() { wallet1.transactions({}, 'invalid'); });
      done();
    });

    var txHash0;
    it('list', function(done) {
      var options = { };
      wallet1.transactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
        txHash0 = result.transactions[0].id;
        done();
      });
    });

    var limitedTxes;
    var limitTestNumTx = 6;
    var totalTxCount;
    it('list with limit', function(done) {

      var options = { limit: limitTestNumTx };
      wallet1.transactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
        result.count.should.eql(limitTestNumTx);
        result.transactions.length.should.eql(result.count);
        limitedTxes = result.transactions;
        totalTxCount = result.total;
        done();
      });
    });

    it('list with minHeight', function(done) {

      var minHeight = 394335;
      var options = { minHeight: 394327, limit: 500 };
      wallet1.transactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
        result.transactions.length.should.eql(result.count);
        result.transactions.forEach(function(transaction) {
          if (!transaction.pending) {
            transaction.height.should.be.above(minHeight - 1);
          }
        });
        result.total.should.be.below(totalTxCount);
        done();
      });
    });


    it('list with limit and skip', function(done) {
      var skipNum = 2;
      var options = { limit: (limitTestNumTx - skipNum), skip: skipNum };
      wallet1.transactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(skipNum);
        result.count.should.eql(limitTestNumTx - skipNum);
        result.transactions.length.should.eql(result.count);
        limitedTxes = limitedTxes.slice(skipNum);
        result.transactions.should.eql(limitedTxes);
        done();
      });
    });

    it('get transaction', function(done) {
      var options = { id: txHash0 };
      wallet1.getTransaction(options, function(err, result) {
        assert.equal(err, null);
        result.should.have.property('fee');
        result.should.have.property('outputs');
        result.outputs.length.should.not.eql(0);
        result.should.have.property('entries');
        result.entries.length.should.not.eql(0);
        result.should.have.property('confirmations');
        result.should.have.property('hex');
        done();
      });
    });
  });

  describe('TransactionBuilder', function() {
    describe('check', function() {
      it('arguments', function() {
        assert.throws(function() { new TransactionBuilder.createTransaction(); });
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: 'should not be a string'}); });
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}}); });
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}, recipients: 'should not be a string'}); });
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}, recipients: {}, fee: 'should not be a string'}); });
      });

      it('recipient arguments', function() {
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}, recipients: { 123: true }}); });
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}, recipients: { '123': 'should not be a string' }}); });

        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}, recipients: { 'string': 'should not be a string' }}); });
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}, recipients: { 'string': 10000 }}); });
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}, recipients: [recipients]}); });
      });

      it('minConfirms argument', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}, recipients: recipients, fee: 0, minConfirms: 'string'}); });
      });

      it('fee', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}, recipients: recipients, fee: 0.5 * 1e8}); });
      });

      it('fee and feerate', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder.createTransaction({wallet: {}, recipients: recipients, fee: 0.5 * 1e8, feeRate: 0.001 * 1e8}); });
      });
    });

    describe('prepare', function() {
      it('insufficient funds', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = wallet1.balance() + 1e8;
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients})
        .catch(function(e) {
          e.message.should.eql('Insufficient funds');
          e.should.have.property('fee');
        })
        .done();
      });

      it('insufficient funds due to fees', function() {
        // Attempt to spend the full balance - adding the default fee would be insufficient funds.
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = wallet1.balance();
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients})
        .then(function(res) {
          throw new Error('succeeded');
        })
        .catch(function(e) {
          e.message.should.eql('Insufficient funds');
          e.should.have.property('fee');
        })
        .done();
      });

      it('no change required', function() {
        // Attempt to spend the full balance without any fees.
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = wallet1.balance();
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients, fee: 0});
      });

      it('no inputs available', function(done) {
        // TODO: implement me!
        done();
      });

      it('ok', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.01 * 1e8;
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients})
        .then(function(result) {
          result.should.have.property('unspents');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.walletId.should.equal(wallet1.id());
        });
      });
    });

    describe('size calculation and fees', function() {
      var patch;
      var patch2;
      before(function() {
        // Monkey patch wallet1 with simulated inputs
        patch = wallet1.unspents;
        wallet1.unspents = function(options, callback) {
          return Q(unspentData.unspents).nodeify(callback);
        };
        patch2 = wallet1.estimateFee;
        wallet1.estimateFee = function(options, callback) {
          var serverFeeRates = {
            1: 0.000138 * 1e8,
            2: 0.000112 * 1e8,
            3: 0.0000156 * 1e8,
            4: 1.9 * 1e8 // fee rate too high, should fallback to 0.0001
          };
          return Q({
            feePerKb: serverFeeRates[options.numBlocks] || 0.0001,
            numBlocks: options.numBlocks
          }).nodeify(callback);
        };
      });

      after(function() {
        wallet1.unspents = patch;
        wallet1.estimateFee = patch2;
      });

      it('too large for blockchain relay', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 10000 * 1e8;
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients})
        .catch(function(e) {
          e.message.should.include('transaction too large');
        });
      });

      it('approximate', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients})
        .then(function(result) {
          var feeUsed = result.fee;
          // Note that the transaction size here will be fairly small, because the signatures have not
          // been applied.  But we had to estimate our fees already.
          assert.equal(feeUsed, 971421);
          result.feeRate.should.eql(0.000112 * 1e8);
          result.walletId = wallet1.id;
        });
      });

      it('approximate with double fees', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients, fee: undefined, feeRate: 0.0002 * 1e8})
        .then(function(result) {
          var feeUsed = result.fee;
          // Note that the transaction size here will be fairly small, because the signatures have not
          // been applied.  But we had to estimate our fees already.
          assert.equal(feeUsed, 1734681);
        });
      });

      it('do not override', function() {
        var manualFee = 0.04 * 1e8;
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients, fee: manualFee})
        .then(function(result) {
          assert.equal(result.fee, manualFee);
        });
      });

      it('approximate with feeRate set by feeTxConfirmTarget 1 (estimatefee monkeypatch)', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients, feeTxConfirmTarget: 1})
        .then(function(result) {
          var feeUsed = result.fee;
          assert.equal(feeUsed, 1196930); // tx size will be 87kb * 0.000138 * 1e8
        });
      });

      it('approximate with feeRate set by feeTxConfirmTarget 3 (estimatefee monkeypatch)', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients, feeTxConfirmTarget: 3})
        .then(function(result) {
          var feeUsed = result.fee;
          assert.equal(feeUsed, 135306); // tx size will be 87kb * 0.0000156 * 1e8
        });
      });

      it('approximate with feeRate set by feeTxConfirmTarget fallback (estimatefee monkeypatch)', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients, feeTxConfirmTarget: 4})
        .then(function(result) {
          var feeUsed = result.fee;
          assert.equal(feeUsed, 867341); // tx size will be 87kb * 0.0001
        });
      });

      it('validate (disable address verification)', function() {
        var manualFee = 0.04 * 1e8;
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        var walletmock = Object.create(wallet1);
        walletmock.createAddress = function(params) {
          assert.equal(params.validate, false);
          return wallet1.createAddress.apply(wallet1, arguments);
        };
        return TransactionBuilder.createTransaction({wallet: walletmock, recipients: recipients, fee: manualFee, validate: false})
        .then(function(result) {
          assert.equal(result.fee, manualFee);
        });
      });

      it('custom change address', function() {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients, feeRate: 0.0002 * 1e8, forceChangeAtEnd: true, changeAddress: TestBitGo.TEST_WALLET1_ADDRESS})
        .then(function(result) {
          assert.equal(result.changeAddress.address, TestBitGo.TEST_WALLET1_ADDRESS);
        });
      });
    });

    describe('sign', function() {
      var unsignedTransaction;
      var keychain;
      before(function(done) {

        bitgo.unlock({ otp: bitgo.testUserOTP() }, function(err) {
          assert.equal(err, null);
          // Go fetch the private key for our keychain
          var options = {
            xpub: wallet1.keychains[0].xpub,
          };
          bitgo.keychains().get(options, function(err, result) {
            assert.equal(err, null);
            keychain = result;

            var recipients = {};
            recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.001 * 1e8;

            // Now build a transaction
            TransactionBuilder.createTransaction({wallet: wallet1, recipients: recipients})
            .then(function(result) {
              unsignedTransaction = result;
              done();
            })
            .done();
          });
        });
      });

      it('arguments', function() {
        var bogusKey = 'xprv9s21ZrQH143K2EPMtV8YHh3UzYdidYbQyNgxAcEVg1374nZs7UWRvoPRT2tdYpN6dENTZbBNf4Af3ZJQbKDydh1BmZ6azhFeYKJ3knPPjND';
        assert.throws(function() { TransactionBuilder.signTransaction(); });
        assert.throws(function() { TransactionBuilder.signTransaction({transactionHex: 'somestring'}); });
        assert.throws(function() { TransactionBuilder.signTransaction({transactionHex: []}); });
        assert.throws(function() { TransactionBuilder.signTransaction({transactionHex: 'somestring', unspents: [], keychain: boguskey}); });
        assert.throws(function() { TransactionBuilder.signTransaction({transactionHex: unsignedTransaction.transactionHex, unspents: {}}); });
        assert.throws(function() { TransactionBuilder.signTransaction({transactionHex: unsignedTransaction.transactionHex, unspents: 'asdfasdds', keychain: boguskey}); });
        assert.throws(function() { TransactionBuilder.signTransaction({transactionHex: unsignedTransaction.transactionHex, unspents: {}, keychain: boguskey}); });
      });

      it('invalid key', function(done) {
        var bogusKey = 'xprv9s21ZrQH143K2EPMtV8YHh3UzYdidYbQyNgxAcEVg1374nZs7UWRvoPRT2tdYpN6dENTZbBNf4Af3ZJQbKDydh1BmZ6azhFeYKJ3knPPjND';
        assert.throws(function() {
          TransactionBuilder.signTransaction({transactionHex: unsignedTransaction.transactionHex, unspents: unsignedTransaction.unspents, keychain: bogusKey}); }
        );
        done();
      });

      it('valid key', function(done) {
        // First we need to decrypt the xprv.
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        TransactionBuilder.signTransaction({transactionHex: unsignedTransaction.transactionHex, unspents: unsignedTransaction.unspents, keychain: keychain})
        .then(function(result) {
          result.transactionHex.should.not.eql("");
          result.transactionHex.should.not.eql(unsignedTransaction.transactionHex);
          result.transactionHex.length.should.be.above(unsignedTransaction.transactionHex.length);
          done();
        })
        .done();
      });

      it('validate (disable signature verification)', function() {
        // First we need to decrypt the xprv.
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        var realVerifyInputSignatures = TransactionBuilder.verifyInputSignatures;
        TransactionBuilder.verifyInputSignatures = function() {
          throw new Error('should not be called');
        };
        return TransactionBuilder.signTransaction({transactionHex: unsignedTransaction.transactionHex, unspents: unsignedTransaction.unspents, keychain: keychain, validate: false})
        .then(function(result) {
          // restore object's true method for the other tests
          TransactionBuilder.verifyInputSignatures = realVerifyInputSignatures;
          result.transactionHex.should.not.eql("");
          result.transactionHex.should.not.eql(unsignedTransaction.transactionHex);
          result.transactionHex.length.should.be.above(unsignedTransaction.transactionHex.length);
        });
      });

      it('validate (enable signature verification)', function() {
        // First we need to decrypt the xprv.
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        var realVerifyInputSignatures = TransactionBuilder.verifyInputSignatures;
        var verifyWasCalled = false;
        TransactionBuilder.verifyInputSignatures = function() {
          verifyWasCalled = true;
          return -1;
        };
        return TransactionBuilder.signTransaction({transactionHex: unsignedTransaction.transactionHex, unspents: unsignedTransaction.unspents, keychain: keychain, validate: true})
        .then(function(result) {
          // restore object's true method for the other tests
          TransactionBuilder.verifyInputSignatures = realVerifyInputSignatures;
          assert.equal(verifyWasCalled, true);
        });
      });

    });
  });

  describe('Get wallet user encrypted key', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.getEncryptedUserKeychain(undefined, 'invalid'); });
      assert.throws(function() { wallet1.getEncryptedUserKeychain({}, 'invalid'); });
      assert.throws(function() { wallet1.transactions('invalid', function() {}); });
      done();
    });

    it('get key', function(done) {
      var options = { };
      wallet1.getEncryptedUserKeychain(options, function(err, result) {
        assert.equal(err, null);
        result.should.have.property('xpub');
        assert.equal(result.xpub, TestBitGo.TEST_WALLET1_XPUB);
        result.should.have.property('encryptedXprv');
        done();
      });
    });
  });

  describe('Send coins', function() {
    it('arguments', function () {
      assert.throws(function () {
        wallet1.sendCoins();
      });
      assert.throws(function () {
        wallet1.sendCoins({ address: 123 });
      });
      assert.throws(function () {
        wallet1.sendCoins({ address: 'string' });
      });
      assert.throws(function () {
        wallet1.sendCoins({ address: 'string', amount: 123 });
      });
      assert.throws(function () {
        wallet1.sendCoins({ address: 'string', amount: 123, walletPassphrase: 0});
      });
      assert.throws(function () {
        wallet1.sendCoins({ address: 'string', amount: 123, walletPassphrase: 'advanced1' }, {});
      });

      return wallet1.sendCoins({ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 1, walletPassphrase: 'badcode' })
      .then(function(result) {
        throw new Error("Unexpected result - expected to catch bad code");
      })
      .catch(function(err) {
        return wallet1.sendCoins({ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: -1, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE })
      })
      .then(function(result) {
        throw new Error("Unexpected result - expected to catch bad amount");
      })
      .catch(function(err) {
        return wallet1.sendCoins({ address: "bad address", amount: 1, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE });
      })
      .then(function(result) {
        throw new Error("Unexpected result - expected to catch bad address");
      })
      .catch(function(err) { });
    });

    describe('Bad input', function () {
      it('send coins - insufficient funds', function (done) {
        wallet1.sendCoins(
          { address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 22 * 1e8 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE },
          function (err, result) {
            err.message.should.eql('Insufficient funds');
            assert.notEqual(err, null);
            done();
          }
        );
      });
    });

    describe('Real transactions', function() {
      it('send coins fails - not unlocked', function () {
        return bitgo.lock({})
        .then(function() {
          return wallet1.sendCoins(
            { address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 0.006 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE }
          );
        })
        .then(function(result) {
          assert(false); // should not reach
        })
        .catch(function(err) {
          err.needsOTP.should.equal(true);
        });
      });

      it('send coins - wallet1 to wallet3', function () {
        return bitgo.unlock({ otp: '0000000' })
        .then(function() {
          return wallet1.sendCoins(
            { address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 0.006 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE }
          );
        })
        .then(function(result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.feeRate.should.be.lessThan(0.01*1e8);
        });
      });

      it('send coins - wallet3 to wallet1 with specified fee', function() {
        return wallet3.sendCoins({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE, fee: 0.005 * 1e8 })
        .then(function(result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.fee.should.eql(0.005 * 1e8);
        });
      });
    });
  });

  describe('Send many', function() {
    it('arguments', function () {
      assert.throws(function () {
        wallet1.sendMany();
      });
      assert.throws(function () {
        wallet1.sendMany({ recipients: [ 'string' ] });
      });
      assert.throws(function () {
        wallet1.sendMany({ recipients: { 'string': true } });
      });
      assert.throws(function () {
        wallet1.sendMany({ recipients: { 'string': 123 } });
      });
      assert.throws(function () {
        wallet1.sendMany({ recipients: { 'string': 123 }, walletPassphrase: 0 });
      });
      assert.throws(function () {
        wallet1.sendMany({ recipients: { 'string': 123 }, walletPassphrase: 'advanced1' }, {});
      });
      assert.throws(function () {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        wallet1.sendMany([ { recipients: recipients, walletPassphrase: "badpasscode" } ], function () {});
      });
      return wallet1.sendMany({ recipients: [{ address: 'bad address', amount: 0.001 * 1e8 }], walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE })
      .then(function(result) {
        throw new Error("Unexpected result - expected to catch bad address");
      })
      .catch(function(err) {
        return wallet1.sendMany({ recipients: [{ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 0.001 * 1e8 }, { address: 'bad address', amount: 0.001 * 1e8 }], walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE })
      })
      .then(function(result) {
        throw new Error("Unexpected result - expected to catch bad address");
      })
      .catch(function(err) {
        return wallet1.sendMany({ recipients: [{ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: -100 }], walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE })
      })
      .then(function(result) {
        throw new Error("Unexpected result - expected to catch bad amount");
      })
      .catch(function(err) { });
    });

    describe('Bad input', function () {
      it('send many - insufficient funds', function (done) {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 22 * 1e8 * 1e8;
        wallet1.sendMany(
        { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE },
        function (err, result) {
          assert.notEqual(err, null);
          done();
        }
        );
      });
    });

    describe('Real transactions', function() {
      it('send to legacy safe wallet from wallet1', function (done) {
        var recipients = {};
        recipients["2MvfC3e6njdTXqWDfGvNUqDs5kwimfaTGjK"] = 0.001 * 1e8;
        wallet1.sendMany(
        { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE },
        function (err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.feeRate.should.be.lessThan(0.01*1e8);
          done();
        }
        );
      });

      it('send from legacy safe wallet back to wallet1', function () {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 0.0009 * 1e8;
        return safewallet.createTransaction({recipients: recipients})
        .then(function(tx) {
          var enc = '{"iv":"lFkIIulsbL+Ub2jGUiXdrw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pdx6d0iD+Io=","ct":"kVIZBeHxoxt19ki0hs5WBjmuLdHPfBQ30a0iGb5H+pR6+kH5lr3zxPL0xeO5EtwPRR0Mw0JVuLqapQE="}';
          var decrypted = bitgo.decrypt({ password: TestBitGo.TEST_PASSWORD, input: enc });
          tx.signingKey = decrypted;
          return safewallet.signTransaction(tx);
        })
        .then(function(result) {
          result.should.have.property('tx');
        })
        .catch(function(err) {
          throw err;
        });
      });

      it('send many - wallet1 to wallet3 (single output)', function (done) {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET3_ADDRESS] = 0.001 * 1e8;
        wallet1.sendMany(
        { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE },
        function (err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.fee.should.be.lessThan(result.feeRate);
          done();
        }
        );
      });

      it('send many - wallet3 to wallet1 (single output)', function (done) {
        var recipients = [];
        recipients.push({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8});
        wallet3.sendMany(
        { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE },
        function (err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.fee.should.be.lessThan(result.feeRate);
          done();
        }
        );
      });

      it('send many - wallet1 to wallet3 with dynamic fee', function (done) {
        var recipients = [];
        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 0.001 * 1e8});
        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS2, amount: 0.001 * 1e8});
        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS3, amount: 0.006 * 1e8});
        wallet1.sendMany(
        { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE, feeTxConfirmTarget: 2 },
        function (err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          done();
        }
        );
      });

      it('send many - wallet3 to wallet1 with specified fee', function () {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 0.001 * 1e8;
        recipients[TestBitGo.TEST_WALLET1_ADDRESS2] = 0.002 * 1e8;
        return wallet3.sendMany({
          recipients: recipients,
          walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE,
          fee: 0.005 * 1e8
        })
        .then(function(result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.fee.should.equal(0.005 * 1e8);
          return wallet3.get({});
        })
        .then(function(resultWallet) {
          resultWallet.unconfirmedReceives().should.not.eql(0);
          resultWallet.unconfirmedSends().should.not.eql(0);
        });
      });
    });
  });

  describe('Create and Send Transactions (advanced)', function() {
    var keychain;
    var tx;

    before(function(done) {

      // Set up keychain
      var options = {
        xpub: wallet1.keychains[0].xpub
      };
      bitgo.keychains().get(options, function(err, result) {
        assert.equal(err, null);
        keychain = result;
        done();
      });
    });

    it('arguments', function(done) {
      assert.throws(function() { wallet1.createTransaction(); });
      assert.throws(function() { wallet1.createTransaction({ recipients: [ 123 ] }); });
      assert.throws(function() { wallet1.createTransaction({ recipients: { 123: true } }); });
      assert.throws(function() { wallet1.createTransaction({ recipients: { 'string': 123 } }); });
      assert.throws(function() { wallet1.createTransaction({ recipients: { 'string': 123 }, fee: 0}); });
      assert.throws(function() { wallet1.createTransaction({ recipients: { 'string': 123 }, fee: 0, keychain: {} }); });
      assert.throws(function() { wallet1.createTransaction({ address: 'string', amount: 123, fee: 0, keychain: {} }); });

      assert.throws(function() { wallet1.createTransaction({ recipients: { 'invalidaddress': 0.001 * 1e8 }, fee: 0.0001 * 1e8, keychain: keychain }); })
      assert.throws(function() { wallet1.signTransaction(); });
      assert.throws(function() { wallet1.signTransaction({}); });
      assert.throws(function() { wallet1.signTransaction({ keychain:'111' }); });
      assert.throws(function() { wallet1.signTransaction({ transactionHex:'111' }); });
      assert.throws(function() { wallet1.signTransaction({ unspents: [] }); });
      assert.throws(function() { wallet1.signTransaction({ transactionHex:'111', unspents: [], keychain: { xprv: 'abc' } }); });

      assert.throws(function() { wallet1.sendTransaction(); });
      assert.throws(function() { wallet1.sendTransaction({}); });

      assert.throws(function () { wallet1.createTransaction({ recipients: {}, fee: 0.0001 * 1e8, keychain: keychain }, function() {} );});
      done();
    });

    describe('full transaction', function() {
      it('decrypt key', function(done) {
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        done();
      });

      it('create and sign transaction with global no validation', function() {
        var recipients = [];
        recipients.push({address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 0.001 * 1e8});
        var calledVerify = false;
        var setValidate = false;
        var realVerifyInputSignatures = TransactionBuilder.verifyInputSignatures;
        TransactionBuilder.verifyInputSignatures = function() {
          calledVerify = true;
          return -1;
        };
        var wallet = Object.create(wallet1);
        wallet.createAddress = function(params) {
          params.validate.should.equal(false);
          setValidate = true;
          return wallet1.createAddress.apply(wallet, arguments);
        };
        wallet.bitgo.setValidate(false);
        return wallet.createTransaction({ recipients: recipients })
        .then(function(result) {
          result.should.have.property('fee');
          return wallet.signTransaction({ transactionHex: result.transactionHex, unspents: result.unspents, keychain: keychain });
        })
        .then(function(result) {
          TransactionBuilder.verifyInputSignatures = realVerifyInputSignatures;
          calledVerify.should.equal(false);
          setValidate.should.equal(true);
          result.should.have.property('tx');
          tx = result.tx;
        });
      });

      it('create and sign transaction with fee', function(done) {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        wallet1.createTransaction({ recipients: recipients, fee: 0.0001 * 1e8 })
        .then(function(result) {
          result.should.have.property('fee');
          assert.equal(result.fee < 0.0005 * 1e8, true);
          return wallet1.signTransaction({ transactionHex: result.transactionHex, unspents: result.unspents, keychain: keychain });
        })
        .then(function(result) {
          result.should.have.property('tx');
          tx = result.tx;
        })
        .done(done);
      });

      it('create and sign transaction with default fee', function(done) {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        wallet1.createTransaction({ recipients: recipients })
        .then(function(result) {
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          should.exist(result.fee);
          result.fee.should.be.lessThan(0.01*1e8);
          result.feeRate.should.be.lessThan(0.01*1e8);
          return wallet1.signTransaction({ transactionHex: result.transactionHex, unspents: result.unspents, keychain: keychain });
        })
        .then(function(result) {
          result.should.have.property('tx');
          tx = result.tx;
        })
        .done(done);
      });

      it('send', function(done) {
        wallet1.sendTransaction({ tx: tx }, function(err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          done();
        });
      });
    });

    // Now send the money back
    describe('return transaction', function() {
      var keychain;
      var tx;

      it('keychain', function(done) {
        var options = {
          xpub: wallet2.keychains[0].xpub
        };
        bitgo.keychains().get(options, function(err, result) {
          assert.equal(err, null);
          keychain = result;
          done();
        });
      });

      it('decrypt key', function(done) {
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET2_PASSCODE, input: keychain.encryptedXprv });
        done();
      });

      it('create transaction', function(done) {
        var recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 0.001 * 1e8;
        wallet2.createTransaction({ recipients: recipients, fee: 0.0001 * 1e8, minConfirms: 1 })
        .then(function(result) {
          result.should.have.property('fee');
          return wallet2.signTransaction({ transactionHex: result.transactionHex, unspents: result.unspents, keychain: keychain });
        })
        .then(function(result) {
          result.should.have.property('tx');
          tx = result.tx;
        })
        .done(done);
      });

      it('send', function(done) {
        wallet2.sendTransaction({ tx: tx }, function(err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          done();
        });
      });
    });
  });

  describe('Freeze Wallet', function() {
    it('arguments', function (done) {
      assert.throws(function () {
        wallet2.freeze({duration: 'asdfasdasd'});
      });
      assert.throws(function () {
        wallet2.freeze({duration: 5}, 'asdasdsa');
      });
      done();
    });

    it('perform freeze', function (done) {
      wallet2.freeze({duration: 6}, function (err, freezeResult) {
        freezeResult.should.have.property('time');
        freezeResult.should.have.property('expires');
        done();
      });
    });

    it('get wallet should show freeze', function (done) {
      wallet2.get({}, function (err, res) {
        var wallet = res.wallet;
        wallet.should.have.property('freeze');
        wallet.freeze.should.have.property('time');
        wallet.freeze.should.have.property('expires');
        done();
      });
    });

    it('attempt to send funds', function (done) {
      wallet2.sendCoins(
      {address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET2_PASSCODE},
      function (err, result) {
        err.should.not.equal(null);
        err.status.should.equal(403);
        err.message.should.include('wallet is frozen');
        done();
      }
      );
    });
  });
});
