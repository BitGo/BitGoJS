//
// Tests for Wallets
//

var assert = require('assert');
var should = require('should');
var bitcoin = require('bitcoinjs-lib');

var common = require('../../src/common');
var TestV2BitGo = require('../lib/test_bitgo');

describe('V2 Wallet:', function() {
  var bitgo;
  var wallets;
  var keychains;
  var basecoin;
  var wallet;

  before(function() {
    // TODO: replace dev with test
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbtc');
    wallets = basecoin.wallets();
    keychains = basecoin.keychains();

    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      return wallets.getWallet({ id: TestV2BitGo.V2.TEST_WALLET1_ID })
    })
    .then(function(testWallet) {
      wallet = testWallet;
    });
  });

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

  });

  describe('List Addresses', function() {

    it('addresses', function() {
      return wallet.addresses()
      .then(function(addresses){
        addresses.should.have.property('coin');
        addresses.should.have.property('count');
        addresses.should.have.property('addresses');
        addresses.addresses.length.should.be.greaterThan(2);
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
      .then(function(transactions){
        transactions.should.have.property('coin');
        transactions.should.have.property('transactions');
        transactions.transactions.length.should.be.greaterThan(6);
        var firstTransaction = transactions.transactions[0];
        firstTransaction.should.have.property('date');
        firstTransaction.should.have.property('entries');
        firstTransaction.should.have.property('fee');
        firstTransaction.should.have.property('fromWallet');
        firstTransaction.should.have.property('hex');
        firstTransaction.should.have.property('id');
        firstTransaction.should.have.property('inputIds');
        firstTransaction.should.have.property('inputs');
        firstTransaction.should.have.property('outputs');
        firstTransaction.should.have.property('size');
      });
    });
  });

  describe('List Transfers', function() {

    it('transfers', function() {
      return wallet.transfers()
      .then(function(transfers){
        transfers.should.have.property('coin');
        transfers.should.have.property('count');
        transfers.should.have.property('transfers');
      });
    });
  });

  describe('Send Transactions', function() {

    it('should send transaction to the wallet itself with send', function() {
      return wallet.createAddress()
      .then(function(recipientAddress){
        var params = {
          amount: 0.01 * 1e8, // 0.01 tBTC
          address: recipientAddress.address,
          walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
        };
        return wallet.send(params);
      })
      .then(function(transaction){
        transaction.should.have.property('status');
        transaction.should.have.property('txid');
        transaction.status.should.equal('signed');
      });
    });

    it('sendMany should error when given a non-array of recipients', function() {
      return wallet.createAddress()
      .then(function(recipientAddress){
        var params = {
          recipients: {
            amount: 0.01 * 1e8, // 0.01 tBTC
            address: recipientAddress.address,
          },
          walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
        };
        assert.throws(function(){
          wallet.sendMany(params)
        });
      });
    });

    it('should send a transaction to the wallet itself with sendMany', function() {
      return wallet.createAddress()
      .then(function(recipientAddress){
        var params = {
          recipients: [
            {
              amount: 0.01 * 1e8, // 0.01 tBTC
              address: recipientAddress.address,
            }
          ],
          walletPassphrase: TestV2BitGo.V2.TEST_WALLET1_PASSCODE
        };
        return wallet.sendMany(params);
      })
      .then(function(transaction){
        transaction.should.have.property('status');
        transaction.should.have.property('txid');
        transaction.status.should.equal('signed');
      });
    });
  });
});
