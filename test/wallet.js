//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');
var TransactionBuilder = require('../src/transactionBuilder');
var unspentData = require('./fixtures/largeunspents.json');

var TEST_WALLET1_ADDRESS = '2Mv4HFh1yaF5S9ma2E1hPTA4jw6RMPpqJi5';
var TEST_WALLET1_PASSCODE = 'test wallet #1 security';
var TEST_WALLET2_ADDRESS = '2MyQeDjDgsVC6k1BR7m8kjveCPNErUoz6gc';
var TEST_WALLET2_PASSCODE = 'test wallet #2 security';
var TEST_WALLET3_ADDRESS = '2NAEdoarGihKn9Wo2pRY1AqgNroRqokaAwm';
var TEST_WALLET3_PASSCODE = 'test wallet #3 security';

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
        id: TEST_WALLET1_ADDRESS,
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

  describe('CreateAddress', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet2.createAddress('invalid', function() {}); });
      assert.throws(function() { wallet2.createAddress({}); });
      done();
    });

    it('create', function(done) {
      wallet2.createAddress({}, function(err, wallet) {
        assert.equal(err, null);
        wallet.should.have.property('path');
        wallet.should.have.property('redeemScript');
        wallet.should.have.property('address');
        assert.notEqual(wallet.address, wallet2.address());

        // TODO: Verify the chain?
        done();
      });
    });
  });

  describe('GetAddresses', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.addresses({}, null, function() {}); });
      assert.throws(function() { wallet1.addresses({}); });
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
      assert.throws(function() { wallet1.unspents({btcLimit: 'a string!'}, function() {}); });
      assert.throws(function() { wallet1.unspents({}); });
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
      assert.throws(function() { wallet1.transactions({}); });
      done();
    });

    it('list', function(done) {
      var options = { };
      wallet1.transactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        assert.equal(result.start, 0);
        result.should.have.property('total');
        result.should.have.property('count');
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
        assert.throws(function() { new TransactionBuilder({}, {address: 123}); });
        assert.throws(function() { new TransactionBuilder({}, {address: 'string', amount: 'should not be a string'}); });
        assert.throws(function() { new TransactionBuilder({}, {address: 'string', amount: 'should not be a string'}); });
        assert.throws(function() { new TransactionBuilder({}, {address: 'string', amount: 10000}); });
      });

      it('fee', function() {
        assert.throws(function() { new TransactionBuilder({}, {address: TEST_WALLET1_ADDRESS, amount: 1e8 }, 0.5 * 1e8); });
      });
    });

    describe('prepare', function() {
      it('insufficient funds', function(done) {
        var tb = new TransactionBuilder(wallet1, { address: TEST_WALLET2_ADDRESS, amount: wallet1.balance() + 1e8});
        tb.prepare()
          .catch(function(e) {
            assert.equal(e.toString(), 'Insufficient funds');
            done();
          });
      });

      it('insufficient funds due to fees', function(done) {
        // Attempt to spend the full balance - adding the default fee would be insufficient funds.
        var tb = new TransactionBuilder(wallet1, { address: TEST_WALLET2_ADDRESS, amount: wallet1.pendingBalance()});
        tb.prepare()
          .then(function() {
            console.log("this should not have worked.");
            done();
          })
          .catch(function(e) {
            assert.equal(e.toString(), 'Insufficient funds');
            done();
          });
      });

      it('no change required', function(done) {
        // Attempt to spend the full balance without any fees.
        var tb = new TransactionBuilder(wallet1, { address: TEST_WALLET2_ADDRESS, amount: wallet1.availableBalance()}, 0);
        tb.prepare()
          .then(function() {
            done();
          })
          .catch(function(e) {
            assert.equal(e, null);
          });
      });

      it('no inputs available', function(done) {
        // TODO: implement me!
        done();
      });

      it('ok', function(done) {
        var tb = new TransactionBuilder(wallet1, { address: TEST_WALLET2_ADDRESS, amount: 0.01 * 1e8 });
        tb.prepare()
          .then(function() {
            done();
          })
          .catch(function(e) {
            assert.equal(e, null);
          });
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
        var tb = new TransactionBuilder(wallet1, { address: TEST_WALLET2_ADDRESS, amount: 10000 * 1e8 });
        tb.prepare()
          .then(function() {
            var feeUsed = tb.fee;
            // Note that the transaction size here will be fairly small, because the signatures have not
            // been applied.  But we had to estimate our fees already.
            assert.equal(feeUsed, 1360000);
            done();
          })
          .catch(function(e) {
            assert.equal(e, null);
          });
      });

      it('do not override', function(done) {
        var manualFee = 0.04 * 1e8;
        var tb = new TransactionBuilder(wallet1, { address: TEST_WALLET2_ADDRESS, amount: 10000 * 1e8}, manualFee);
        tb.prepare()
          .then(function() {
            assert.equal(tb.fee, manualFee);
            done();
          })
          .catch(function(e) {
            assert.equal(e, null);
          });
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

            // Now build a transaction
            tb = new TransactionBuilder(wallet1, { address: TEST_WALLET2_ADDRESS, amount: 0.001 * 1e8 });
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
        keychain.xprv = bitgo.decrypt({ password: TEST_WALLET1_PASSCODE, opaque: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        var tx = tb.sign(keychain);
        done();
      });
    });
  });

  describe('Get wallet user encrypted key', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.getEncryptedUserKeychain(); });
      assert.throws(function() { wallet1.getEncryptedUserKeychain({}); });
      assert.throws(function() { wallet1.transactions('invalid', function() {}); });
      done();
    });

    it('get key', function(done) {
      var options = { };
      wallet1.getEncryptedUserKeychain(options, function(err, result) {
        assert.equal(err, null);
        result.should.have.property('xpub');
        assert.equal(result.xpub, 'xpub661MyMwAqRbcEvHxkJFVGwCw6AHithEVTQwMFzgURx8DcgqHv83ehKE9pqtdFzg2c23R9BH51iUrEgkQGrf5uL8Jutf6RDKfqibBEx4gipJ');
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
      done();
    });

    describe('Bad input', function () {
      it('send coins - insufficient funds', function (done) {
        wallet1.sendCoins(
          { address: TEST_WALLET2_ADDRESS, amount: 22 * 1e8 * 1e8, walletPassphrase: TEST_WALLET1_PASSCODE },
          function (err, result) {
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
            result.fee.should.equal(0.0001 * 1e8);
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
            result.fee.should.equal(0.0001 * 1e8);
            done();
          }
        );
      });
    });
  });

  describe('Create and Send Transactions (advanced)', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.createTransaction(); });
      assert.throws(function() { wallet1.createTransaction({ address: 123 }); });
      assert.throws(function() { wallet1.createTransaction({ address: 'string' }); });
      assert.throws(function() { wallet1.createTransaction({ address: 'string', amount: 123 }); });
      assert.throws(function() { wallet1.createTransaction({ address: 'string', amount: 123, fee: 0}); });
      assert.throws(function() { wallet1.createTransaction({ address: 'string', amount: 123, fee: 0, keychain: {} }); });

      assert.throws(function() { wallet1.sendTransaction(); });
      assert.throws(function() { wallet1.sendTransaction({}); });
      done();
    });

    describe('full transaction', function() {
      var keychain;
      var tx;

      it('keychain', function(done) {
        var options = {
          xpub: wallet1.keychains[0].xpub,
        };
        bitgo.keychains().get(options, function(err, result) {
          assert.equal(err, null);
          keychain = result;
          done();
        });
      });

      it('decrypt key', function(done) {
        keychain.xprv = bitgo.decrypt({ password: TEST_WALLET1_PASSCODE, opaque: keychain.encryptedXprv });
        done();
      });

      it('create transaction with fee', function(done) {
        wallet1.createTransaction({ address: TEST_WALLET2_ADDRESS, amount: 0.001 * 1e8, fee: 0.0001 * 1e8, keychain: keychain }, function(err, result) {
          assert.equal(err, null);
          assert.equal(result.fee < 0.0005 * 1e8, true);
          result.should.have.property('tx');
          result.should.have.property('fee');
          tx = result.tx;
          done();
        });
      });

      it('create transaction with default fee', function(done) {
        wallet1.createTransaction({ address: TEST_WALLET2_ADDRESS, amount: 0.001 * 1e8, keychain: keychain }, function(err, result) {
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
        keychain.xprv = bitgo.decrypt({ password: TEST_WALLET2_PASSCODE, opaque: keychain.encryptedXprv });
        done();
      });

      it('create transaction', function(done) {
        wallet2.createTransaction({ address: TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8, fee: 0.0001 * 1e8, keychain: keychain }, function(err, result) {
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
});
