//
// Tests for Wallets
//

var assert = require('assert');
var should = require('should');
var bitcoin = require('bitcoinjs-lib');

var common = require('../../src/common');
var TestBitGo = require('./lib/test_bitgo');

describe('Wallets', function() {
  var bitgo;
  var wallets;
  var keychains;
  var basecoin;
  
  before(function() {
    // TODO: replace dev with test
    bitgo = new TestBitGo({ env: 'dev' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tbtc', bitcoin.networks.testnet);
    wallets = basecoin.wallets();
    keychains = basecoin.keychains();
    return bitgo.authenticateTestUser(bitgo.testUserOTP());
  });
  
  describe('List', function() {
    it('arguments', function() {
      assert.throws(function() { wallets.list({}, 'invalid'); });
      assert.throws(function() { wallets.list('invalid'); });
    });
    
    it('skip', function(done) {
      // TODO server currently doesn't use this param
      done()
    });
    
    it('getbalances', function(done) {
      // TODO server currently doesn't use this param
      done()
    });
    
    it('prevId', function(done) {
      // TODO server currently doesn't use this param
      done()
    });
  });
  
  describe('Generate Wallet', function() {
    var passphrase = 'yoplait';
    var label = 'v2 wallet';
    
    it('arguments', function() {
      assert.throws(function() {wallets.generateWallet();});
      assert.throws(function() {wallets.generateWallet('invalid');});
      assert.throws(function() {wallets.generateWallet({}, 0);});
      assert.throws(function() {
        wallets.generateWallet({
          passphrase: passphrase,
          label: label,
          backupXpub: 'xpub',
          backupXpubProvider: 'krs'
        }, function() {
        });
      });
      assert.throws(function() {
        wallets.generateWallet({
          passphrase: passphrase,
          label: label,
          disableTransactionNotifications: 'blah'
        }, function() {
        });
      });
    });
    
    it('should make wallet with client-generated user and backup key', function() {
      var params = {
        passphrase: passphrase,
        label: label,
        disableTransactionNotifications: true
      };
      
      return wallets.generateWallet(params)
      .then(function(res) {
        res.should.have.property('wallet');
        res.should.have.property('userKeychain');
        res.should.have.property('backupKeychain');
        res.should.have.property('bitgoKeychain');
        
        res.userKeychain.should.have.property('pub');
        res.userKeychain.should.have.property('prv');
        res.userKeychain.should.have.property('encryptedPrv');
        
        res.backupKeychain.should.have.property('pub');
        res.backupKeychain.should.have.property('prv');
        
        res.bitgoKeychain.should.have.property('pub');
        res.bitgoKeychain.isBitGo.should.equal(true);
        res.bitgoKeychain.should.not.have.property('prv');
        res.bitgoKeychain.should.not.have.property('encryptedPrv');
      });
    });
    
    it('should make wallet with client-generated user and krs backupkey', function() {
      
      var xpub = keychains.create().pub; // random xpub
      var params = {
        passphrase: passphrase,
        label: label,
        backupXpub: xpub
      };
      return wallets.generateWallet(params)
      .then(function(res) {
        res.should.have.property('wallet');
        res.should.have.property('userKeychain');
        res.should.have.property('backupKeychain');
        res.should.have.property('bitgoKeychain');
        
        res.backupKeychain.should.have.property('pub');
        res.backupKeychain.should.not.have.property('prv');
      });
    });
  });
  
  describe('Get Wallet', function() {
    it('should get wallet', function() {
      return wallets.getWallet({ id: TestBitGo.TEST_WALLET1_ID })
      .then(function(wallet) {
        should.exist(wallet);
        wallet.should.have.property('baseCoin');
        wallet.should.have.property('bitgo');
        wallet.should.have.property('_wallet');
        wallet = wallet._wallet;
        wallet.label.should.equal('v2 test wallet');
        wallet.balance.should.be.greaterThan(0);
        wallet.confirmedBalance.should.be.greaterThan(0);
        wallet.coin.should.equal('tbtc');
        wallet.id.should.equal(TestBitGo.TEST_WALLET1_ID);
        wallet.approvalsRequired.should.equal(1);
        wallet.m.should.equal(2);
        wallet.n.should.equal(3);
      })
    });
  });
});
