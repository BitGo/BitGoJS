//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');

var BitGoJS = require('../src/index');
var TestBitGo = require('./lib/test_bitgo');
var TransactionBuilder = require('../src/transactionbuilder');
var unspentData = require('./fixtures/largeunspents.json');

var TEST_WALLET1_ADDRESS = '2N94kT4NtoGCbBfcfp3K1rEPYNohL3VV8rC';
var TEST_WALLET1_PASSCODE = 'test wallet #1 security';
var TEST_WALLET2_ADDRESS = '2MyGdUWZuxTNnvPZHJFmrpi4cSiSyEe3Ztp';
var TEST_WALLET2_PASSCODE = 'test wallet #2 security'

describe('Wallet', function() {
  var bitgo;
  var wallet1, wallet2;

  before(function(done) {
    BitGoJS.setNetwork('testnet');

    bitgo = new TestBitGo();
    wallets = bitgo.wallets();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        throw err;
      }

      // Fetch the first wallet.
      var options = {
        type: 'bitcoin',
        address: TEST_WALLET1_ADDRESS,
        otp: bitgo.testUserOTP()
      };
      wallets.get(options, function(err, wallet) {
        if (err) {
          throw err;
        }
        wallet1 = wallet;

        // Fetch the second wallet
        var options = {
          type: 'bitcoin',
          address: TEST_WALLET2_ADDRESS,
          otp: bitgo.testUserOTP()
        };
        wallets.get(options, function(err, wallet) {
          wallet2 = wallet;
          done();
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


  describe('Unspents', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.unspents('invalid', function() {}); });
      assert.throws(function() { wallet1.unspents({btcLimit: 'a string!'}, function() {}); });
      assert.throws(function() { wallet1.unspents({}); });
      done();
    });

    it('list', function(done) {
      var options = { btcLimit: 0.5 * 1e8 };
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

        // Go fetch the private key for our keychain
        var options = {
          xpub: wallet1.keychains[0].xpub,
          otp: bitgo.testUserOTP()
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
        keychain.xprv = bitgo.decrypt(TEST_WALLET1_PASSCODE, keychain.encryptedXprv);
        // Now we can go ahead and sign.
        var tx = tb.sign(keychain);
        done();
      });
    });
  });

  describe('Send', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.createTransaction(); });
      assert.throws(function() { wallet1.createTransaction(123); });
      assert.throws(function() { wallet1.createTransaction('string'); });
      assert.throws(function() { wallet1.createTransaction('string', 123); });
      assert.throws(function() { wallet1.createTransaction('string', 123, 0); });
      assert.throws(function() { wallet1.createTransaction('string', 123, 0, {}); });

      assert.throws(function() { wallet1.send(); });
      assert.throws(function() { wallet1.send({}); });
      done();
    });

    describe('full transaction', function() {
      var keychain;
      var tx;

      it('keychain', function(done) {
        var options = {
          xpub: wallet1.keychains[0].xpub,
          otp: bitgo.testUserOTP()
        };
        bitgo.keychains().get(options, function(err, result) {
          assert.equal(err, null);
          keychain = result;
          done();
        });
      });

      it('decrypt key', function(done) {
        keychain.xprv = bitgo.decrypt(TEST_WALLET1_PASSCODE, keychain.encryptedXprv);
        done();
      });

      it('create transaction with fee', function(done) {
        wallet1.createTransaction(TEST_WALLET2_ADDRESS, 0.001 * 1e8, 0.0001 * 1e8, keychain, function(err, result) {
          assert.equal(err, null);
          assert.equal(result.fee < 0.0005 * 1e8, true);
          result.should.have.property('tx');
          result.should.have.property('fee');
          tx = result.tx;
          done();
        });
      });

      it('create transaction with default fee', function(done) {
        wallet1.createTransaction(TEST_WALLET2_ADDRESS, 0.001 * 1e8, undefined, keychain, function(err, result) {
          assert.equal(err, null);
          assert.equal(result.fee, 10000);
          result.should.have.property('tx');
          result.should.have.property('fee');
          tx = result.tx;
          done();
        });
      });

      it('send', function(done) {
        wallet1.send(tx, function(err, result) {
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
          xpub: wallet2.keychains[0].xpub,
          otp: bitgo.testUserOTP()
        };
        bitgo.keychains().get(options, function(err, result) {
          assert.equal(err, null);
          keychain = result;
          done();
        });
      });

      it('decrypt key', function(done) {
        keychain.xprv = bitgo.decrypt(TEST_WALLET2_PASSCODE, keychain.encryptedXprv);
        done();
      });

      it('create transaction', function(done) {
        wallet2.createTransaction(TEST_WALLET1_ADDRESS, 0.001 * 1e8, 0.0001 * 1e8, keychain, function(err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('fee');
          tx = result.tx;
          done();
        });
      });

      it('send', function(done) {
        wallet2.send(tx, function(err, result) {
          assert.equal(err, null);
          result.should.have.property('tx');
          result.should.have.property('hash');
          done();
        });
      });
    });
  });
});
