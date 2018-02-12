//
// Tests for Wallets
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
require('should');
const Q = require('q');

const BitGoJS = require('../../src/index');
const TestBitGo = require('../lib/test_bitgo');

const bitcoin = BitGoJS.bitcoin;

const TEST_WALLET_LABEL = 'wallet management test';

describe('Wallets', function() {
  let bitgo;
  let wallets;
  let testWallet;      // Test will create this wallet
  const keychains = [];  // Test will create these keychains

  before(function(done) {
    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    wallets = bitgo.wallets();
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

    it('all', function(done) {
      wallets.list({}, function(err, result) {
        assert.equal(err, null);
        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(0);
        result.limit.should.not.equal(0);
        result.total.should.not.equal(0);
        result.wallets.length.should.not.equal(0);
        done();
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

        return wallets.list({ prevId: result.nextBatchPrevId });
      })
      .then(function(result) {
        result.should.have.property('wallets');
        result.should.not.have.property('start'); // if you passed in the prevId start will be undefined
        result.should.have.property('limit');
        result.should.have.property('total');
      });
    });

    it('limit', function(done) {
      wallets.list({ limit: 2 }, function(err, result) {
        assert.equal(err, null);

        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(0);
        result.limit.should.equal(2);
        result.total.should.not.equal(0);
        result.wallets.length.should.equal(2);
        done();
      });
    });

    it('skip', function(done) {
      wallets.list({ limit: 1, skip: 2 }, function(err, result) {
        assert.equal(err, null);

        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(2);
        result.limit.should.equal(1);
        result.total.should.not.equal(0);
        result.wallets.length.should.equal(1);
        done();
      });
    });

    it('limit and skip', function(done) {
      wallets.list({ limit: 1, skip: 5 }, function(err, result) {
        assert.equal(err, null);

        result.should.have.property('wallets');
        result.should.have.property('start');
        result.should.have.property('limit');
        result.should.have.property('total');

        result.start.should.equal(5);
        result.limit.should.equal(1);
        result.total.should.not.equal(0);
        result.wallets.length.should.equal(1);
        done();
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

    it('wallet', function(done) {
      const options = {
        xpub: keychains[0].xpub,
        encryptedXprv: keychains[0].xprv
      };
      bitgo.keychains().add(options, function(err, keychain) {
        assert.equal(err, null);
        assert.equal(keychain.xpub, keychains[0].xpub);
        assert.equal(keychain.encryptedXprv, keychains[0].xprv);

        const options = {
          xpub: keychains[1].xpub
        };
        bitgo.keychains().add(options, function(err, keychain) {
          assert.equal(err, null);
          assert.equal(keychain.xpub, keychains[1].xpub);

          bitgo.keychains().createBitGo({}, function(err, keychain) {
            assert(keychain.xpub);
            keychains.push(keychain);

            const options = {
              label: 'my wallet',
              m: 2,
              n: 3,
              keychains: keychains.map(function(k) { return { xpub: k.xpub }; })
            };
            wallets.add(options, function(err, wallet) {
              assert.equal(err, null);
              testWallet = wallet;

              assert.equal(wallet.balance(), 0);
              assert.equal(wallet.label(), 'my wallet');
              assert.equal(wallet.confirmedBalance(), 0);
              assert.equal(wallet.keychains.length, 3);
              assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[0].xpub }), true);
              assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[1].xpub }), true);
              assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[2].xpub }), true);
              assert.equal(wallet.keychains[0].xpub, keychains[0].xpub);
              assert.equal(wallet.keychains[1].xpub, keychains[1].xpub);
              done();
            });
          });
        });
      });
    });
  });

  describe('Create wallet with createWalletWithKeychains', function() {
    it('arguments', function() {
      const backupXpub = 1234567890;
      assert.throws(function() { wallets.createWalletWithKeychains({ passphrase: TestBitGo.TEST_WALLET1_PASSCODE, backupXpub: backupXpub }); });
      assert.throws(function() { wallets.createWalletWithKeychains({ passphrase: TestBitGo.TEST_WALLET1_PASSCODE, label: TEST_WALLET_LABEL, backupXpub: backupXpub }); });
      assert.throws(function() { wallets.createWalletWithKeychains({ passphrase: TestBitGo.TEST_WALLET1_PASSCODE, label: TEST_WALLET_LABEL, backupXpub: 123 }); });
      assert.throws(function() { wallets.createWalletWithKeychains({ label: TEST_WALLET_LABEL, backupXpub: backupXpub }); });
      assert.throws(function() { wallets.createWalletWithKeychains('invalid'); });
      assert.throws(function() { wallets.createWalletWithKeychains(); });
    });

    it('default create', function(done) {
      const options = {
        passphrase: TestBitGo.TEST_WALLET1_PASSCODE,
        label: TEST_WALLET_LABEL
      };

      bitgo.wallets().createWalletWithKeychains(options, function(err, result) {
        assert.equal(err, null);
        assert.notEqual(result, null);

        result.should.have.property('wallet');
        const wallet = result.wallet;

        assert.equal(wallet.balance(), 0);
        assert.equal(wallet.spendableBalance(), 0);
        assert.equal(wallet.label(), TEST_WALLET_LABEL);
        assert.equal(wallet.confirmedBalance(), 0);
        assert.equal(wallet.keychains.length, 3);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[0].xpub }), true);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[1].xpub }), true);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[2].xpub }), true);
        assert.equal(wallet.keychains[0].xpub, result.userKeychain.xpub);
        assert.equal(wallet.keychains[1].xpub, result.backupKeychain.xpub);

        result.userKeychain.should.have.property('encryptedXprv');
        result.backupKeychain.should.not.have.property('encryptedXprv');
        result.backupKeychain.should.have.property('xprv');
        result.warning.should.include('backup the backup keychain -- it is not stored anywhere else');

        wallet.delete({}, function() {});
        done();
      });
    });

    it('create with cold backup xpub', function(done) {

      // Simulate a cold backup key
      const coldBackupKey = bitgo.keychains().create();
      const options = {
        passphrase: TestBitGo.TEST_WALLET1_PASSCODE,
        label: TEST_WALLET_LABEL,
        backupXpub: coldBackupKey.xpub
      };

      bitgo.wallets().createWalletWithKeychains(options, function(err, result) {
        assert.equal(err, null);
        assert.notEqual(result, null);

        result.should.have.property('wallet');
        const wallet = result.wallet;

        assert.equal(wallet.balance(), 0);
        assert.equal(wallet.label(), TEST_WALLET_LABEL);
        assert.equal(wallet.confirmedBalance(), 0);
        assert.equal(wallet.keychains.length, 3);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[0].xpub }), true);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[1].xpub }), true);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[2].xpub }), true);
        assert.equal(wallet.keychains[0].xpub, result.userKeychain.xpub);
        assert.equal(wallet.keychains[1].xpub, result.backupKeychain.xpub);

        assert.equal(result.backupKeychain.xpub, coldBackupKey.xpub);

        result.userKeychain.should.have.property('encryptedXprv');
        result.backupKeychain.should.have.property('xpub');
        result.backupKeychain.should.not.have.property('xprv');
        result.backupKeychain.should.not.have.property('encryptedXprv');

        wallet.delete({}, function() {});
        done();
      });
    });

    it('create with backup xpub provider (KRS wallet)', function(done) {
      const options = {
        passphrase: TestBitGo.TEST_WALLET1_PASSCODE,
        label: TEST_WALLET_LABEL,
        backupXpubProvider: 'keyvault-io'
      };

      bitgo.wallets().createWalletWithKeychains(options, function(err, result) {
        assert.equal(err, null);
        assert.notEqual(result, null);

        result.should.have.property('wallet');
        const wallet = result.wallet;

        assert.equal(wallet.balance(), 0);
        assert.equal(wallet.spendableBalance(), 0);
        assert.equal(wallet.label(), TEST_WALLET_LABEL);
        assert.equal(wallet.confirmedBalance(), 0);
        assert.equal(wallet.keychains.length, 3);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[0].xpub }), true);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[1].xpub }), true);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[2].xpub }), true);
        assert.equal(wallet.keychains[0].xpub, result.userKeychain.xpub);
        assert.equal(wallet.keychains[1].xpub, result.backupKeychain.xpub);

        result.userKeychain.should.have.property('encryptedXprv');
        result.backupKeychain.should.not.have.property('encryptedXprv');
        result.should.not.have.property('warning');

        result.wallet.canSendInstant().should.eql(true);

        wallet.delete({}, function() {});
        done();
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
      const newKey = wallets.createKey();
      const options = {
        id: newKey.address.toString()
      };
      wallets.get(options, function(err, wallet) {
        assert(!wallet);
        done();
      });
    });

    it('get', function(done) {
      const options = {
        id: testWallet.id()
      };
      wallets.get(options, function(err, wallet) {
        assert.equal(err, null);
        assert.equal(wallet.id(), options.id);
        assert.equal(wallet.balance(), 0);
        assert.equal(wallet.label(), 'my wallet');
        assert.equal(wallet.confirmedBalance(), 0);
        assert.equal(wallet.unconfirmedReceives(), 0);
        assert.equal(wallet.unconfirmedSends(), 0);
        assert.equal(wallet.approvalsRequired(), 1);
        assert.equal(wallet.keychains.length, 3);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[0] }), true);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[1] }), true);
        assert.equal(bitgo.keychains().isValid({ key: wallet.keychains[2] }), true);
        done();
      });
    });
  });

  describe('Setup forward wallet', function() {
    const key = bitcoin.ECPair.makeRandom({ network: bitcoin.getNetwork() });
    const sourceAddress = key.getAddress();

    it('arguments', function() {
      assert.throws(function() { wallets.createForwardWallet('invalid'); });
      assert.throws(function() { wallets.createForwardWallet(); });
      assert.throws(function() { wallets.createForwardWallet({ privKey: key.toWIF(), sourceAddress: null, destinationWallet: testWallet }); });
      assert.throws(function() { wallets.createForwardWallet({ privKey: 'asdasdsa', sourceAddress: sourceAddress, destinationWallet: testWallet }); });
      assert.throws(function() { wallets.createForwardWallet({ privKey: key.toWIF(), sourceAddress: sourceAddress, destinationWallet: null }); });
      assert.throws(function() { wallets.createForwardWallet({ privKey: key.toWIF(), sourceAddress: TestBitGo.TEST_WALLET3_ADDRESS, destinationWallet: null }); });
    });

    it('default', function() {
      return wallets.createForwardWallet({
        privKey: key.toWIF(),
        sourceAddress: sourceAddress,
        destinationWallet: testWallet,
        label: 'forward ' + sourceAddress
      })
      .then(function(result) {
        result.id.should.eql(sourceAddress);
        result.isActive.should.eql(true);
        result.type.should.eql('forward');
        result.label.should.eql('forward ' + sourceAddress);
        result.private.destinationAddress.should.startWith('2');
      });
    });

    it('send coins to forward wallet', function() {
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallets.get({ id: TestBitGo.TEST_WALLET3_ADDRESS });
      })
      .then(function(test3wallet) {
        return test3wallet.sendCoins(
          { address: sourceAddress, amount: 0.0005 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE, fee: 0.0001 * 1e8 }
        );
      })
      .then(function(result) {
        result.should.have.property('tx');
        result.should.have.property('hash');
        result.should.have.property('fee');
        return Q.delay(3500)
        .then(function() {
          return testWallet.get();
        });
      })
      .then(function(wallet) {
        assert.equal(wallet.id(), testWallet.id());
        assert.equal(wallet.balance(), 0.0004 * 1e8); // fee of 0.0001
        assert.equal(wallet.label(), 'my wallet');
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
