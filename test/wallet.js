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

var TEST_WALLET1_ADDRESS = '2N21Bt5ZjQg5eWJLGuggY2DfkHyxhPKaagB';
var TEST_WALLET1_ADDRESS2 = '2NEtpyMqA2v8zf44KDyyhE814FKb59zTX3J';
var TEST_WALLET1_PASSCODE = 'test wallet #1 security';
var TEST_WALLET2_ADDRESS = '2N1PtMP1FvPJxX8iUutbkxRVRC86xcxeF6h';
var TEST_WALLET2_PASSCODE = 'test wallet #2 security';
var TEST_WALLET3_ADDRESS = '2NEC139iJ3wTMeSC4GosKEYmpmGo729kBFN';
var TEST_WALLET3_PASSCODE = 'test wallet #3 security';
var TEST_WALLET3_ADDRESS2 = '2ND7sbcPS5DDD9b3FpwNs53uMTEKq4hLfxW';
var TEST_WALLET3_ADDRESS3 = '2N7Dba7yr1XkoRQh7XVhGjNUKSEgLCiibJp';

describe('Wallet', function() {
  var bitgo;
  var wallet1, wallet2, wallet3;

  before(function(done) {
    BitGoJS.setNetwork('testnet');

    bitgo = new TestBitGo();
    wallets = bitgo.wallets();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        console.log(err);
        throw err;
      }

      // Fetch the first wallet.
      var options = {
        id: TEST_WALLET1_ADDRESS
      };
      wallets.get(options, function(err, wallet) {
        if (err) {
          throw err;
        }
        wallet1 = wallet;

        // Fetch the second wallet
        var options = {
          id: TEST_WALLET2_ADDRESS
        };
        wallets.get(options, function(err, wallet) {
          wallet2 = wallet;

          // Fetch the third wallet
          var options = {
            id: TEST_WALLET3_ADDRESS
          };
          wallets.get(options, function(err, wallet) {
            wallet3 = wallet;
            done();
          });
        });
      });
    });
  });

  var walletShareIdWithViewPermissions, walletShareIdWithSpendPermissions;
  describe('Share wallet', function() {
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

      wallet1.shareWallet({ email:'notfoundqery@bitgo.com', walletPassphrase:'test' })
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
        wallet1.shareWallet({ email: TestBitGo.TEST_SHARED_KEY_USER, walletPassphrase: 'wrong' })
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
        result.userId.should.equal('549d0ee835aec81206004c082757570f');
        result.pubkey.should.equal('03F19AAC9A533BDFDAC8CDAD2B71CD3993CECFA0112E12D428914633C203304CA9');
        done();
      })
    });

    it('share a wallet (view)', function(done) {
      bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet1.shareWallet(
        { email: TestBitGo.TEST_SHARED_KEY_USER, walletPassphrase: TEST_WALLET1_PASSCODE, permissions: 'view' }
        )
      })
      .then(function(result){
        result.should.have.property('walletId');
        result.should.have.property('fromUser');
        result.should.have.property('toUser');
        result.should.have.property('state');
        result.walletId.should.equal(wallet1.id());
        result.fromUser.should.equal('543c11ed356d00cb7600000b98794503');
        result.toUser.should.equal('549d0ee835aec81206004c082757570f');
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
        return wallet2.shareWallet(
          { email: TestBitGo.TEST_SHARED_KEY_USER, walletPassphrase: TEST_WALLET2_PASSCODE, permissions: 'view,spend' }
        )
      })
      .then(function(result){
        result.should.have.property('walletId');
        result.should.have.property('fromUser');
        result.should.have.property('toUser');
        result.should.have.property('state');
        result.walletId.should.equal(wallet2.id());
        result.fromUser.should.equal('543c11ed356d00cb7600000b98794503');
        result.toUser.should.equal('549d0ee835aec81206004c082757570f');
        result.state.should.equal('active');

        result.should.have.property('id');
        walletShareIdWithSpendPermissions = result.id;
        done();
      })
      .done();
    });
  });

  var bitgoSharedKeyUser;
  describe('Get wallet share list', function() {
    before(function(done) {
      bitgoSharedKeyUser = new TestBitGo();
      bitgoSharedKeyUser.authenticate({ username: TestBitGo.TEST_SHARED_KEY_USER, password: TestBitGo.TEST_SHARED_KEY_PASSWORD, otp: '0000000' })
      .then(function(success) {
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
        bitgoSharedKeyUser.wallets().acceptShare({walletShareId: walletShareIdWithSpendPermissions, userPassword: TestBitGo.TEST_SHARED_KEY_PASSWORD})
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

    describe('CreateLabel', function() {

        it('arguments', function(done) {
            assert.throws(function() { wallet1.createLabel({}, function() {}); });
            assert.throws(function() { wallet1.createLabel({label: "testLabel"}, function() {}); });
            assert.throws(function() { wallet1.createLabel({address: TEST_WALLET1_ADDRESS2}, function() {}); });
            assert.throws(function() { wallet1.createLabel({label: "testLabel", address: "invalidAddress"}, function() {}); });
            assert.throws(function() { wallet1.createLabel({label: "testLabel", address: TEST_WALLET2_ADDRESS2}, function() {}); });
            done();
        });

        it('create', function(done) {
            wallet1.createLabel({label: "testLabel", address: TEST_WALLET1_ADDRESS2}, function(err, label) {
                assert.equal(err, null);
                label.should.have.property('label');
                label.should.have.property('address');
                assert.equal(label.label, "testLabel");
                assert.equal(label.address, TEST_WALLET1_ADDRESS2);
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
            wallet1.deleteLabel({address: TEST_WALLET1_ADDRESS2}, function(err, label) {
                assert.equal(err, null);
                label.should.have.property('address');
                assert.equal(label.address, TEST_WALLET1_ADDRESS2);
                done();
            });
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
      wallet2.validateAddress({ address: TEST_WALLET2_ADDRESS, path: '/0/0' });
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

    it('list', function(done) {
      var options = { };
      wallet1.transactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
        done();
      });
    });

    var limitedTxes;
    var limitTestNumTx = 6;
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
  });

  describe('TransactionBuilder', function() {
    describe('check', function() {
      it('arguments', function() {
        assert.throws(function() { new TransactionBuilder(); });
        assert.throws(function() { new TransactionBuilder('should not be a string'); });
        assert.throws(function() { new TransactionBuilder({}); });
        assert.throws(function() { new TransactionBuilder({}, 'should not be a string'); });
        assert.throws(function() { new TransactionBuilder({}, {}, 'should not be a string'); });
      });

      it('recipient arguments', function() {
        assert.throws(function() { new TransactionBuilder({}, { 123: true }); });
        assert.throws(function() { new TransactionBuilder({}, { '123': 'should not be a string' }); });

        assert.throws(function() { new TransactionBuilder({}, { 'string': 'should not be a string' }); });
        assert.throws(function() { new TransactionBuilder({}, { 'string': 10000 }); });
        var recipients = {};
        recipients[TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder({}, [recipients]); });
      });

      it('minConfirms argument', function() {
        var recipients = {};
        recipients[TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder({}, recipients, 0, 'string'); });
      });

      it('fee', function() {
        var recipients = {};
        recipients[TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder({}, recipients, 0.5 * 1e8); });
      });
    });

    describe('prepare', function() {
      it('insufficient funds', function(done) {
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = wallet1.balance() + 1e8;
        var tb = new TransactionBuilder(wallet1, recipients);
        tb.prepare()
          .catch(function(e) {
            assert.equal(e.toString(), 'Insufficient funds');
            done();
          });
      });

      it('insufficient funds due to fees', function(done) {
        // Attempt to spend the full balance - adding the default fee would be insufficient funds.
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = wallet1.balance();
        var tb = new TransactionBuilder(wallet1, recipients);
        tb.prepare()
          .then(function(res) {
            throw new Error('succeeded');
          })
          .catch(function(e) {
            assert.equal(e.toString(), 'Insufficient funds');
            done();
          })
          .done();
      });

      it('insufficient funds due to minConfirms', function(done) {
        // Attempt to spend the full balance - adding the default fee would be insufficient funds.
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = 0.01 * 1e8;
        var tb = new TransactionBuilder(wallet1, recipients, 0, 1e6);
        tb.prepare()
          .then(function(res) {
            throw new Error('succeeded');
          })
          .catch(function(e) {
            assert.equal(e.toString(), 'Insufficient funds');
            done();
          })
          .done();
      });

      it('no change required', function(done) {
        // Attempt to spend the full balance without any fees.
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = wallet1.balance();
        var tb = new TransactionBuilder(wallet1, recipients, 0);
        tb.prepare()
          .then(function() {
            done();
          })
          .done();
      });

      it('no inputs available', function(done) {
        // TODO: implement me!
        done();
      });

      it('ok', function(done) {
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = 0.01 * 1e8;
        var tb = new TransactionBuilder(wallet1, recipients);
        tb.prepare()
          .then(function() {
            done();
          })
          .done();
      });
    });

    describe('fees', function() {
      var patch;
      before(function() {
        // Monkey patch wallet1 with simulated inputs
        patch = wallet1.unspents;
        wallet1.unspents = function(options, callback) {
          callback(null, unspentData.unspents);
        };
      });

      after(function() {
        wallet1.unspents = patch;
      });

      it('approximate', function(done) {
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = 10000 * 1e8;
        var tb = new TransactionBuilder(wallet1, recipients);
        tb.prepare()
          .then(function() {
            var feeUsed = tb.fee;
            // Note that the transaction size here will be fairly small, because the signatures have not
            // been applied.  But we had to estimate our fees already.
            assert.equal(feeUsed, 1390000);
            done();
          })
          .done();
      });

      it('do not override', function(done) {
        var manualFee = 0.04 * 1e8;
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = 10000 * 1e8;
        var tb = new TransactionBuilder(wallet1, recipients, manualFee);
        tb.prepare()
          .then(function() {
            assert.equal(tb.fee, manualFee);
            done();
          })
          .done();
      });
    });

    describe('sign', function() {
      var tb;
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
            recipients[TEST_WALLET2_ADDRESS] = 0.001 * 1e8;

            // Now build a transaction
            tb = new TransactionBuilder(wallet1, recipients);
            tb.prepare().then(function() {
              done();
            });
          });
        });
      });

      it('arguments', function() {
        assert.throws(function() { tb.sign(); });
        assert.throws(function() { tb.sign('not a string'); });
      });

      it('invalid key', function(done) {
        var bogusKey = 'xprv9s21ZrQH143K2EPMtV8YHh3UzYdidYbQyNgxAcEVg1374nZs7UWRvoPRT2tdYpN6dENTZbBNf4Af3ZJQbKDydh1BmZ6azhFeYKJ3knPPjND';
        assert.throws(function() { tb.sign({path: 'm', xprv: bogusKey}); });
        done();
      });

      it('valid key', function(done) {
        // First we need to decrypt the xprv.
        keychain.xprv = bitgo.decrypt({ password: TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        var tx = tb.sign(keychain);
        done();
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
        assert.equal(result.xpub, 'xpub661MyMwAqRbcFSjo1JiMfyKa9vbvMADQHRxUAGy5q6WTLWno94m9BTdJBPVJzFsP2e4wmdjzLGCUw5cD4xxw5F6J8iDrr2w3V7WfFth61oN');
        result.should.have.property('encryptedXprv');
        done();
      });
    });
  });

  describe('Send coins', function() {
    it('arguments', function (done) {
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
      assert.throws(function () {
        wallet1.sendCoins(
          { address: TEST_WALLET2_ADDRESS, amount: 0, walletPassphrase: TEST_WALLET1_PASSCODE },
          function () { }
        );
      });
      assert.throws(function () {
        wallet1.sendCoins(
          { address: TEST_WALLET2_ADDRESS, amount: 0, walletPassphrase: "badpasscode" } ,
          function () {}
        );
      });
      assert.throws(function () {
        wallet1.sendCoins(
          { address: "bad address", amount: 0, walletPassphrase: TEST_WALLET1_PASSCODE } ,
          function () {}
        );
      });
      assert.throws(function () {
        wallet1.sendMany(
        { recipients: {}, walletPassphrase: TEST_WALLET1_PASSCODE }, function() {}
        );
      });
      done();
    });

    describe('Bad input', function () {
      it('send coins - insufficient funds', function (done) {
        wallet1.sendCoins(
          { address: TEST_WALLET2_ADDRESS, amount: 22 * 1e8 * 1e8, walletPassphrase: TEST_WALLET1_PASSCODE },
          function (err, result) {
            err.should.eql('Insufficient funds');
            assert.notEqual(err, null);
            done();
          }
        );
      });
    });

    describe('Real transactions', function() {
      it('send coins - wallet1 to wallet3', function (done) {
        wallet1.sendCoins(
          { address: TEST_WALLET3_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TEST_WALLET1_PASSCODE },
          function (err, result) {
            assert.equal(err, null);
            result.should.have.property('tx');
            result.should.have.property('hash');
            result.should.have.property('fee');
            done();
          }
        );
      });

      it('send coins - wallet3 to wallet1', function (done) {
        wallet3.sendCoins(
          { address: TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TEST_WALLET3_PASSCODE },
          function (err, result) {
            assert.equal(err, null);
            result.should.have.property('tx');
            result.should.have.property('hash');
            result.should.have.property('fee');
            done();
          }
        );
      });
    });
  });

  describe('Send many', function() {
    it('arguments', function (done) {
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
        recipients[TEST_WALLET2_ADDRESS] = 0;
        wallet1.sendMany({ recipients: recipients, walletPassphrase: TEST_WALLET1_PASSCODE }, function () {});
      });
      assert.throws(function () {
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        wallet1.sendMany([ { recipients: recipients, walletPassphrase: "badpasscode" } ], function () {});
      });
      assert.throws(function () {
        var recipients = {};
        recipients['bad address'] = 0.001 * 1e8;
        wallet1.sendMany({ recipients: recipients, walletPassphrase: TEST_WALLET1_PASSCODE }, function () {});
      });
      assert.throws(function () {
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = 5;
        recipients['bad address'] = 0.001 * 1e8;
        wallet1.sendMany({ recipients: recipients, walletPassphrase: TEST_WALLET1_PASSCODE }, function () {});
      });
      done();
    });

    describe('Bad input', function () {
      it('send many - insufficient funds', function (done) {
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        recipients[TEST_WALLET1_ADDRESS] = 22 * 1e8 * 1e8;
        wallet1.sendMany(
        { recipients: recipients, walletPassphrase: TEST_WALLET1_PASSCODE },
        function (err, result) {
          assert.notEqual(err, null);
          done();
        }
        );
      });
    });

    describe('Real transactions', function() {
      it('send many - wallet1 to wallet3 (single output)', function (done) {
        var recipients = {};
        recipients[TEST_WALLET3_ADDRESS] = 0.001 * 1e8;
        wallet1.sendMany(
        { recipients: recipients, walletPassphrase: TEST_WALLET1_PASSCODE },
        function (err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.fee.should.equal(0.0001 * 1e8);
          done();
        }
        );
      });

      it('send many - wallet3 to wallet1 (single output)', function (done) {
        var recipients = {};
        recipients[TEST_WALLET1_ADDRESS] = 0.001 * 1e8;
        wallet3.sendMany(
        { recipients: recipients, walletPassphrase: TEST_WALLET3_PASSCODE },
        function (err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.fee.should.equal(0.0001 * 1e8);
          done();
        }
        );
      });

      it('send many - wallet1 to wallet3', function (done) {
        var recipients = {};
        recipients[TEST_WALLET3_ADDRESS] = 0.001 * 1e8;
        recipients[TEST_WALLET3_ADDRESS2] = 0.001 * 1e8;
        recipients[TEST_WALLET3_ADDRESS3] = 0.001 * 1e8;
        wallet1.sendMany(
        { recipients: recipients, walletPassphrase: TEST_WALLET1_PASSCODE },
        function (err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          done();
        }
        );
      });

      it('send many - wallet3 to wallet1', function (done) {
        var recipients = {};
        recipients[TEST_WALLET1_ADDRESS] = 0.001 * 1e8;
        recipients[TEST_WALLET1_ADDRESS2] = 0.002 * 1e8;
        wallet3.sendMany(
        { recipients: recipients, walletPassphrase: TEST_WALLET3_PASSCODE },
        function (err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          done();
        }
        );
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

      assert.throws(function() { wallet1.sendTransaction(); });
      assert.throws(function() { wallet1.sendTransaction({}); });

      assert.throws(function () { wallet1.createTransaction({ recipients: {}, fee: 0.0001 * 1e8, keychain: keychain }, function() {} );});
      done();
    });

    describe('full transaction', function() {
      it('decrypt key', function(done) {
        keychain.xprv = bitgo.decrypt({ password: TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        done();
      });

      it('create transaction with fee', function(done) {
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        wallet1.createTransaction({ recipients: recipients, fee: 0.0001 * 1e8, keychain: keychain }, function(err, result) {
          assert.equal(err, null);
          assert.equal(result.fee < 0.0005 * 1e8, true);
          result.should.have.property('tx');
          result.should.have.property('fee');
          tx = result.tx;
          done();
        });
      });

      it('create transaction with default fee', function(done) {
        var recipients = {};
        recipients[TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        wallet1.createTransaction({ recipients: recipients, keychain: keychain }, function(err, result) {
          assert.equal(err, null);
          assert.equal(result.fee, 10000);
          result.should.have.property('tx');
          result.should.have.property('fee');
          tx = result.tx;
          done();
        });
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
        keychain.xprv = bitgo.decrypt({ password: TEST_WALLET2_PASSCODE, input: keychain.encryptedXprv });
        done();
      });

      it('create transaction', function(done) {
        var recipients = {};
        recipients[TEST_WALLET1_ADDRESS] = 0.001 * 1e8;
        wallet2.createTransaction({ recipients: recipients, fee: 0.0001 * 1e8, keychain: keychain }, function(err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('fee');
          tx = result.tx;
          done();
        });
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
      {address: TEST_WALLET3_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TEST_WALLET2_PASSCODE},
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
