//
// Tests for Wallets
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

var assert = require('assert');
var should = require('should');
var ethereumUtil = require('ethereumjs-util');

var BitGoJS = require('../../src/index');
var common = require('../../src/common');
var TestBitGo = require('../lib/test_bitgo');
var Util = require('../../src/util');

var bitcoin = BitGoJS.bitcoin;

var TEST_WALLET_LABEL = 'wallet management test';

// TODO: WORK IN PROGRESS
describe('Ethereum Wallets API:', function() {
  var bitgo;
  var wallets;
  var testWallet;      // Test will create this wallet
  var keychains = [];  // Test will create these keychains

  before(function(done) {
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    wallets = bitgo.eth().wallets();
    bitgo.authenticateTestUser(bitgo.testUserOTP(), function(err, response) {
      if (err) {
        throw err;
      }
      done();
    });
  });

  describe('List', function() {
    it('arguments', function() {
      assert.throws(function() { wallets.list({}, 'invalid'); });
      assert.throws(function() { wallets.list('invalid'); });
    });

    it('all', function() {
      return wallets.list({})
      .then(function(result) {
        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(0);
        result.limit.should.not.equal(0);
        result.total.should.not.equal(0);
        result.wallets.length.should.not.equal(0);
      });
    });

    it('prevId', function() {
      return wallets.list({})
      .then(function(result) {
        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');
        result.should.have.property('nextBatchPrevId');

        return wallets.list({prevId: result.nextBatchPrevId});
      })
      .then(function(result) {
        result.should.have.property('wallets');
        result.should.not.have.property('start'); // if you passed in the prevId start will be undefined
        result.should.have.property('limit');
        result.should.have.property('total');
      });
    });

    it('limit', function() {
      return wallets.list({ limit: 2 })
      .then(function(result) {
        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(0);
        result.limit.should.equal(2);
        result.total.should.not.equal(0);
        result.wallets.length.should.equal(2);
      });
    });

    it('skip', function() {
      return wallets.list({ limit: 1, skip: 2 })
      .then(function(result) {

        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(2);
        result.limit.should.equal(1);
        result.total.should.not.equal(0);
        result.wallets.length.should.equal(1);
      });
    });

    it('limit and skip', function() {
      return wallets.list({ limit: 1, skip: 5 })
      .then(function(result) {
        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(5);
        result.limit.should.equal(1);
        result.total.should.not.equal(0);
        result.wallets.length.should.equal(1);
      });
    });
  });

  describe('Add', function() {
    before(function() {
      keychains.push(bitgo.keychains().create());
      keychains.push(bitgo.keychains().create());
    });

    it('arguments', function() {
      assert.throws(function() { wallets.add(); });
      assert.throws(function() { wallets.add('invalid'); });
      assert.throws(function() { wallets.add({}, 0); });
    });

    it('wallet', function() {
      var options = {
        xpub: keychains[0].xpub,
        encryptedXprv: keychains[0].xprv
      };
      return bitgo.keychains().add(options)
      .then(function(keychain) {
        assert.equal(keychain.xpub, keychains[0].xpub);
        assert.equal(keychain.encryptedXprv, keychains[0].xprv);

        var options = {
          xpub: keychains[1].xpub
        };
        return bitgo.keychains().add(options);
      })
      .then(function(keychain) {
        assert.equal(keychain.xpub, keychains[1].xpub);

        return bitgo.keychains().createBitGo({ type: 'eth' });
      })
      .then(function(keychain) {
        assert(keychain.ethAddress);
        keychains.push(keychain);

        var options = {
          label: 'my wallet',
          m: 2,
          n: 3,
          addresses: keychains.map(function(k) {
            return k.ethAddress;
          })
        };
        return wallets.add(options);
      })
      .then(function(wallet) {
        testWallet = wallet;

        assert(wallet.balance() instanceof ethereumUtil.BN);
        assert.equal(wallet.balance(), 0);
        assert.equal(Util.weiToEtherString(wallet.balance()), '0');
        assert.equal(wallet.label(), 'my wallet');
        // assert.equal(wallet.confirmedBalance(), 0);
        assert.equal(wallet.addresses.length, 3);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[0].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[1].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[2].address }), true);
        assert.equal(wallet.addresses[0].address, keychains[0].ethAddress);
        assert.equal(wallet.addresses[1].address, keychains[1].ethAddress);
      });
    });
  });

  describe('Create Ether Wallet', function() {
    it('arguments', function() {
      assert.throws(function() { wallets.generateWallet({"passphrase": TestBitGo.TEST_WALLET1_PASSCODE, "backupAddress": backupXpub}); });
      assert.throws(function() { wallets.generateWallet({"passphrase": TestBitGo.TEST_WALLET1_PASSCODE, "label": TEST_WALLET_LABEL, "backupAddress": backupXpub}); });
      assert.throws(function() { wallets.generateWallet({"passphrase": TestBitGo.TEST_WALLET1_PASSCODE, "label": TEST_WALLET_LABEL, "backupAddress": 123}); });
      assert.throws(function() { wallets.generateWallet({"label": TEST_WALLET_LABEL, "backupAddress": backupXpub}); });
      assert.throws(function() { wallets.generateWallet('invalid'); });
      assert.throws(function() { wallets.generateWallet(); });
    });

    it('default create', function() {
      var options = {
        "passphrase": TestBitGo.TEST_WALLET1_PASSCODE,
        "label": TEST_WALLET_LABEL
      };

      return bitgo.eth().wallets().generateWallet(options)
      .then(function(result) {
        assert.notEqual(result, null);

        result.should.have.property('wallet');
        var wallet = result.wallet;

        assert.equal(wallet.balance(), 0);
        // assert.equal(wallet.spendableBalance(), 0);
        assert.equal(wallet.label(), TEST_WALLET_LABEL);
        // assert.equal(wallet.confirmedBalance(), 0);
        assert.equal(wallet.addresses.length, 3);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[0].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[1].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[2].address }), true);
        assert.equal(wallet.addresses[0].address, result.userKeychain.ethAddress);
        assert.equal(wallet.addresses[1].address, result.backupKeychain.ethAddress);

        result.userKeychain.should.have.property('encryptedXprv');
        result.backupKeychain.should.have.property('xprv');
        result.backupKeychain.should.have.property('encryptedXprv');
        result.warning.should.include('back up the backup keychain -- it is not stored anywhere else');

        return wallet.delete({});
      });
    });

    it('create with cold backup xpub', function() {

      // Simulate a cold backup key
      var coldBackupKey = bitgo.keychains().create();
      var options = {
        "passphrase": TestBitGo.TEST_WALLET1_PASSCODE,
        "label": TEST_WALLET_LABEL,
        "backupXpub": coldBackupKey.xpub
        // "backupXpub": 'xpub6AHA9hZDN11k2ijHMeS5QqHx2KP9aMBRhTDqANMnwVtdyw2TDYRmF8PjpvwUFcL1Et8Hj59S3gTSMcUQ5gAqTz3Wd8EsMTmF3DChhqPQBnU'
      };

      return bitgo.eth().wallets().generateWallet(options)
      .then(function(result) {
        assert.notEqual(result, null);

        result.should.have.property('wallet');
        var wallet = result.wallet;

        assert.equal(wallet.balance(), 0);
        assert.equal(wallet.label(), TEST_WALLET_LABEL);
        // assert.equal(wallet.confirmedBalance(), 0);
        assert.equal(wallet.addresses.length, 3);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[0].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[1].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[2].address }), true);
        assert.equal(wallet.addresses[0].address, result.userKeychain.ethAddress);
        assert.equal(wallet.addresses[1].address, coldBackupKey.ethAddress);

        result.userKeychain.should.have.property('encryptedXprv');
        // result.backupKeychain.should.have.property('xpub');
        // result.backupKeychain.should.not.have.property('xprv');
        // result.backupKeychain.should.not.have.property('encryptedXprv');

        return wallet.delete({});
      });
    });

    it('create with cold backup eth address', function() {

      // Simulate a cold backup key
      var coldBackupKey = bitgo.keychains().create();
      var options = {
        "passphrase": TestBitGo.TEST_WALLET1_PASSCODE,
        "label": TEST_WALLET_LABEL,
        "backupAddress": Util.xpubToEthAddress(coldBackupKey.xpub)
      };

      return bitgo.eth().wallets().generateWallet(options)
      .then(function(result) {
        assert.notEqual(result, null);

        result.should.have.property('wallet');
        var wallet = result.wallet;

        assert.equal(wallet.balance(), 0);
        assert.equal(wallet.label(), TEST_WALLET_LABEL);
        // assert.equal(wallet.confirmedBalance(), 0);
        assert.equal(wallet.addresses.length, 3);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[0].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[1].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[2].address }), true);
        assert.equal(wallet.addresses[0].address, result.userKeychain.ethAddress);
        assert.equal(wallet.addresses[1].address, coldBackupKey.ethAddress);

        result.userKeychain.should.have.property('encryptedXprv');
        // result.backupKeychain.should.have.property('xpub');
        // result.backupKeychain.should.not.have.property('xprv');
        // result.backupKeychain.should.not.have.property('encryptedXprv');

        return wallet.delete({});
      });
    });

    it('create with backup xpub provider (KRS wallet)', function() {
      var options = {
        "passphrase": TestBitGo.TEST_WALLET1_PASSCODE,
        "label": TEST_WALLET_LABEL,
        "backupXpubProvider": "keyvault-io"
      };

      return bitgo.eth().wallets().generateWallet(options)
      .then(function(result) {
        assert.notEqual(result, null);

        result.should.have.property('wallet');
        var wallet = result.wallet;

        assert.equal(wallet.balance(), 0);
        // assert.equal(wallet.spendableBalance(), 0);
        assert.equal(wallet.label(), TEST_WALLET_LABEL);
        // assert.equal(wallet.confirmedBalance(), 0);
        assert.equal(wallet.addresses.length, 3);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[0].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[1].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[2].address }), true);
        assert.equal(wallet.addresses[0].address, result.userKeychain.ethAddress);
        assert.equal(wallet.addresses[1].address, result.backupKeychain.ethAddress);

        result.userKeychain.should.have.property('encryptedXprv');
        result.backupKeychain.should.not.have.property('encryptedXprv');
        result.should.not.have.property('warning');

        return wallet.delete({});
      });
    });

    it('create with different backup xpub provider (KRS wallet)', function() {
      var options = {
        "passphrase": TestBitGo.TEST_WALLET1_PASSCODE,
        "label": TEST_WALLET_LABEL,
        "backupXpubProvider": "keyternal"
      };

      return bitgo.eth().wallets().generateWallet(options)
      .then(function(result) {
        assert.notEqual(result, null);

        result.should.have.property('wallet');
        var wallet = result.wallet;

        assert.equal(wallet.balance(), 0);
        // assert.equal(wallet.spendableBalance(), 0);
        assert.equal(wallet.label(), TEST_WALLET_LABEL);
        // assert.equal(wallet.confirmedBalance(), 0);
        assert.equal(wallet.addresses.length, 3);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[0].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[1].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[2].address }), true);
        assert.equal(wallet.addresses[0].address, result.userKeychain.ethAddress);
        assert.equal(wallet.addresses[1].address, result.backupKeychain.ethAddress);

        result.userKeychain.should.have.property('encryptedXprv');
        result.backupKeychain.should.not.have.property('encryptedXprv');
        result.should.not.have.property('warning');

        return wallet.delete({});
      });
    });
  });

  describe('Get', function() {
    it('arguments', function() {
      assert.throws(function() { wallets.get(); });
      assert.throws(function() { wallets.get('invalid'); });
      assert.throws(function() { wallets.get({}, function() {}); });
    });

    it('non existent wallet', function(done) {
      var options = {
        id: '0xaaaaaaaaaaaaaaa0123456789abcdef72e63b508'
      };
      return wallets.get(options)
      .catch(function(error) {
        error.message.should.equal('not found');
        error.status.should.equal(404);
        done();
      })
    });

    it('get', function() {
      var options = {
        id: testWallet.id()
      };
      return wallets.get(options)
      .then(function(wallet) {
        assert.equal(wallet.id(), options.id);
        assert.equal(wallet.balance(), 0);
        assert.equal(wallet.label(), 'my wallet');
        // assert.equal(wallet.confirmedBalance(), 0);
        // assert.equal(wallet.unconfirmedReceives(), 0);
        // assert.equal(wallet.unconfirmedSends(), 0);
        // assert.equal(wallet.approvalsRequired(), 1);
        assert.equal(wallet.addresses.length, 3);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[0].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[1].address }), true);
        assert.equal(bitgo.keychains().isValid({ ethAddress: wallet.addresses[2].address }), true);
      });
    });
  });

  describe('Delete', function() {
    it('arguments', function(done) {
      assert.throws(function() { testWallet.delete({}, 'invalid'); });
      done();
    });

    it('delete', function(done) {
      testWallet.delete({}, function(err, status) {
        assert.equal(err, null);
        done();
      });
    });
  });
});
