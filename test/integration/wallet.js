//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
const should = require('should');
const Q = require('q');

const BitGoJS = require('../../src/index');
const TestBitGo = require('../lib/test_bitgo');
const config = require('../../src/config');
const TransactionBuilder = require('../../src/transactionBuilder');
const crypto = require('crypto');
const _ = require('lodash');
const bitcoin = BitGoJS.bitcoin;
const unspentData = require('./fixtures/largeunspents.json');

Q.longStackTrace = true;

describe('Wallet API', function() {
  let bitgo;
  let wallets;
  let wallet1, wallet2, wallet3, safewallet;

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
      const options = {
        id: TestBitGo.TEST_WALLET1_ADDRESS
      };
      wallets.get(options, function(err, wallet) {
        if (err) {
          throw err;
        }
        wallet1 = wallet;

        // Fetch the second wallet
        const options = {
          id: TestBitGo.TEST_WALLET2_ADDRESS
        };
        wallets.get(options, function(err, wallet) {
          if (err) {
            throw err;
          }
          wallet2 = wallet;

          // Fetch the third wallet
          const options = {
            id: TestBitGo.TEST_WALLET3_ADDRESS
          };
          wallets.get(options, function(err, wallet) {
            wallet3 = wallet;

            // Fetch legacy safe wallet
            const options = {
              id: '2MvfC3e6njdTXqWDfGvNUqDs5kwimfaTGjK'
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

  describe('Invite non BitGo user', function() {
    before(function(done) {
      wallets.listInvites({})
      .done(function(success) {
        success.should.have.property('outgoing');
        Q.all(success.outgoing.map(function(out) {
          return wallets.cancelInvite({ walletInviteId: out.id });
        }))
        .then(function() {
          done();
        });
      }, function(err) {
        err.should.equal(null);
      });
    });

    it('arguments', function(done) {
      assert.throws(function() { bitgo.wallets().cancelInvite({}, function() {}); });

      assert.throws(function() { wallet1.createInvite({}, function() {}); });
      assert.throws(function() { wallet1.createInvite({ email: 'tester@bitgo.com' }, function() {}); });
      done();
    });

    it('invite existing user', function(done) {
      wallet1.createInvite({
        email: TestBitGo.TEST_SHARED_KEY_USER,
        permissions: 'admin'
      })
      .done(function(success) {
        success.should.equal(null);
      }, function(err) {
        err.status.should.equal(400);
        done();
      });
    });

    let walletInviteId;
    it('invite non bitgo user', function(done) {
      wallet1.createInvite({
        email: 'notfoundqery@bitgo.com',
        permissions: 'admin'
      })
      .done(function(success) {
        success.should.have.property('invite');
        walletInviteId = success.invite.id;
        done();
      }, function(err) {
        err.should.equal(null);
      });
    });

    it('cancel invite', function(done) {
      wallets.cancelInvite({
        walletInviteId: walletInviteId
      })
      .done(function(success) {
        success.should.have.property('state');
        success.state.should.equal('canceled');
        success.should.have.property('changed');
        success.changed.should.equal(true);
        done();
      }, function(err) {
        err.should.equal(null);
      });
    });

    it('can invite non bitgo user again', function(done) {
      wallet1.createInvite({
        email: 'notfoundqery@bitgo.com',
        permissions: 'admin'
      })
      .done(function(success) {
        success.should.have.property('invite');
        walletInviteId = success.invite.id;
        done();
      }, function(err) {
        err.should.equal(null);
      });
    });
  });

  let walletShareIdWithViewPermissions, walletShareIdWithSpendPermissions, cancelledWalletShareId;
  describe('Share wallet', function() {
    // clean up any outstanding shares before proceeding
    before(function() {
      return bitgo.wallets().listShares({})
      .then(function(result) {
        const cancels = result.outgoing.map(function(share) {
          return bitgo.wallets().cancelShare({ walletShareId: share.id });
        });
        return Q.all(cancels);
      });
    });

    it('arguments', function(done) {
      assert.throws(function() { bitgo.getSharingKey({}); });

      assert.throws(function() { wallet1.shareWallet({}, function() {}); });
      assert.throws(function() { wallet1.shareWallet({ email: 'tester@bitgo.com' }, function() {}); });
      // assert.throws(function () { wallet1.shareWallet({ email:'notfoundqery@bitgo.com', walletPassphrase:'wrong' }, function() {}); });
      done();
    });

    it('get sharing key of user that does not exist', function(done) {

      bitgo.getSharingKey({ email: 'notfoundqery@bitgo.com' })
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
        email: 'notfoundqery@bitgo.com',
        permissions: 'admin,spend,view',
        walletPassphrase: 'test'
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
      const keychains = bitgo.keychains();
      keychains.create();

      bitgo.getSharingKey({ email: TestBitGo.TEST_SHARED_KEY_USER })
      .done(function(result) {

        result.should.have.property('userId');
        result.should.have.property('pubkey');
        result.userId.should.equal(TestBitGo.TEST_SHARED_KEY_USERID);
        done();
      });
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
      .then(function(result) {
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

    it('remove user from wallet', function() {
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet2.removeUser({
          user: TestBitGo.TEST_SHARED_KEY_USERID
        });
      })
      .then(function(wallet) {
        wallet.adminCount.should.eql(1);
        wallet.admin.users.length.should.eql(1);
      });
    });

    it('share a wallet (spend)', function(done) {
      bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet2.shareWallet({
          email: TestBitGo.TEST_SHARED_KEY_USER,
          walletPassphrase: TestBitGo.TEST_WALLET2_PASSCODE,
          permissions: 'view,spend'
        });
      })
      .then(function(result) {
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
      .then(function(result) {
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

    it('share a wallet and then resend the share', function(done) {
      bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet3.shareWallet({
          email: TestBitGo.TEST_SHARED_KEY_USER,
          walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE,
          permissions: 'view'
        });
      })
      .then(function(result) {
        result.should.have.property('walletId');
        result.should.have.property('fromUser');
        result.should.have.property('toUser');
        result.should.have.property('state');
        result.walletId.should.equal(wallet3.id());
        const walletShareIdToResend = result.id;

        return bitgo.wallets().resendShareInvite({ walletShareId: walletShareIdToResend }, function(err, result) {
          result.should.have.property('resent', true);
          done();
        });
      })
      .done();
    });
  });

  let bitgoSharedKeyUser;
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
      .then(function(result) {
        result.outgoing.should.not.containDeep([{ id: cancelledWalletShareId }]);
        done();
      })
      .done();
    });

    it('wallet share should be in sender list', function(done) {
      bitgo.wallets().listShares({})
      .then(function(result) {
        result.outgoing.should.containDeep([{ id: walletShareIdWithViewPermissions }]);
        result.outgoing.should.containDeep([{ id: walletShareIdWithSpendPermissions }]);
        done();
      })
      .done();
    });

    it('wallet share should be in receiver list', function(done) {
      bitgoSharedKeyUser.wallets().listShares({})
      .then(function(result) {
        result.incoming.should.containDeep([{ id: walletShareIdWithViewPermissions }]);
        result.incoming.should.containDeep([{ id: walletShareIdWithSpendPermissions }]);
        done();
      })
      .done();
    });
  });

  describe('Accept wallet share', function() {
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
      bitgoSharedKeyUser.wallets().acceptShare({ walletShareId: walletShareIdWithViewPermissions })
      .then(function(result) {
        result.should.have.property('state');
        result.should.have.property('changed');
        result.state.should.equal('accepted');
        result.changed.should.equal(true);

        // now check that the wallet share id is no longer there
        return bitgoSharedKeyUser.wallets().listShares({});
      })
      .then(function(result) {
        result.incoming.should.not.containDeep([{ id: walletShareIdWithViewPermissions }]);
        done();
      })
      .done();
    });

    it('accept a wallet share with spend permissions', function(done) {
      bitgoSharedKeyUser.unlock({ otp: '0000000' })
      .then(function() {
        return bitgoSharedKeyUser.wallets().acceptShare({ walletShareId: walletShareIdWithSpendPermissions, userPassword: TestBitGo.TEST_SHARED_KEY_PASSWORD })
        .then(function(result) {
          result.should.have.property('state');
          result.should.have.property('changed');
          result.state.should.equal('accepted');
          result.changed.should.equal(true);

          // now check that the wallet share id is no longer there
          return bitgoSharedKeyUser.wallets().listShares();
        })
        .then(function(result) {
          result.incoming.should.not.containDeep([{ id: walletShareIdWithSpendPermissions }]);
          done();
        })
        .done();
      })
      .done();
    });
  });

  describe('Wallet shares with skip keychain', function() {

    let walletShareId;
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
      .then(function(result) {
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
      bitgoSharedKeyUser.unlock({ otp: '0000000' })
      .then(function() {
        return bitgoSharedKeyUser.wallets().acceptShare({ walletShareId: walletShareId, overrideEncryptedXprv: 'test' })
        .then(function(result) {
          result.should.have.property('state');
          result.should.have.property('changed');
          result.state.should.equal('accepted');
          result.changed.should.equal(true);

          // now check that the wallet share id is no longer there
          return bitgoSharedKeyUser.wallets().listShares();
        })
        .then(function(result) {
          result.incoming.should.not.containDeep([{ id: walletShareId }]);
          done();
        })
        .done();
      })
      .done();
    });
  });

  describe('CreateAddress', function() {
    let addr;

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
        wallet2.validateAddress({ address: addr.address, path: '0/0' });
      });
      assert.throws(function() {
        wallet2.validateAddress({ address: addr.address, path: '/0/0' });
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
      const options = { };
      wallet1.addresses(options, function(err, addresses) {
        assert.equal(err, null);
        addresses.should.have.property('addresses');
        addresses.should.have.property('start');
        addresses.should.have.property('count');
        addresses.should.have.property('total');
        const firstAddress = addresses.addresses[0];
        firstAddress.should.have.property('chain');
        firstAddress.should.have.property('index');
        firstAddress.should.have.property('path');

        assert.equal(Array.isArray(addresses.addresses), true);
        assert.equal(addresses.addresses.length, addresses.count);
        done();
      });
    });

    it('getWithLimit1', function(done) {
      const options = { limit: 1 };
      wallet1.addresses(options, function(err, addresses) {
        assert.equal(err, null);
        addresses.should.have.property('addresses');
        addresses.should.have.property('start');
        addresses.should.have.property('count');
        addresses.should.have.property('total');
        const firstAddress = addresses.addresses[0];
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

  describe('GetAddress', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.address('invalid', function() {}); });
      assert.throws(function() { wallet1.address({}, 'invalid'); });
      done();
    });

    it('get', function() {
      const options = { address: wallet1.id() };
      return wallet1.address(options)
      .then(function(result) {
        result.address.should.eql(wallet1.id());
        result.chain.should.eql(0);
        result.index.should.eql(0);
        result.redeemScript.should.not.eql('');
        result.sent.should.be.greaterThan(0);
        result.received.should.be.greaterThan(0);
        result.txCount.should.be.greaterThan(0);
        result.balance.should.be.greaterThan(0);
      });
    });
  });

  describe('Labels', function() {
    it('list', function(done) {
      // delete all labels from wallet1
      wallet1.labels({}, function(err, labels) {
        if (labels === null) {
          return;
        }

        labels.forEach(function(label) {
          wallet1.deleteLabel({ address: label.address }, function(err, label) {
            assert.equal(err, null);
          });
        });
      });

      // create a single label on TestBitGo.TEST_WALLET1_ADDRESS2 and check that it is returned
      wallet1.setLabel({ label: 'testLabel', address: TestBitGo.TEST_WALLET1_ADDRESS2 }, function(err, label) {
        // create a label on wallet2's TEST_WALLET2_ADDRESS to ensure that it is not returned
        wallet2.setLabel({ label: 'wallet2TestLabel', address: TestBitGo.TEST_WALLET2_ADDRESS }, function(err, label2) {
          wallet1.labels({}, function(err, labels) {
            assert.equal(err, null);
            labels.forEach(function(label) {
              label.should.have.property('label');
              label.should.have.property('address');
              label.label.should.eql('testLabel');
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
      assert.throws(function() { wallet1.setLabel({ label: 'testLabel' }, function() {}); });
      assert.throws(function() { wallet1.setLabel({ address: TestBitGo.TEST_WALLET1_ADDRESS2 }, function() {}); });
      assert.throws(function() { wallet1.setLabel({ label: 'testLabel', address: 'invalidAddress' }, function() {}); });
      assert.throws(function() { wallet1.setLabel({ label: 'testLabel', address: TestBitGo.TEST_WALLET2_ADDRESS2 }, function() {}); });
      done();
    });

    it('create', function(done) {
      wallet1.setLabel({ label: 'testLabel', address: TestBitGo.TEST_WALLET1_ADDRESS2 }, function(err, label) {
        assert.equal(err, null);
        label.should.have.property('label');
        label.should.have.property('address');
        label.label.should.eql('testLabel');
        label.address.should.eql(TestBitGo.TEST_WALLET1_ADDRESS2);
        done();
      });
    });
  });

  describe('Rename Wallet / Set Wallet Label', function() {

    it('arguments', function(done) {
      assert.throws(function() { wallet1.setLabel({}, function() {}); });
      done();
    });

    it('should rename wallet', function() {
      // generate some random string to make the rename visible in the system
      const renameIndicator = crypto.randomBytes(3).toString('hex');
      const originalWalletName = 'Even Better Test Wallet 1';
      const newWalletName = originalWalletName + '(' + renameIndicator + ')';
      return wallet1.setWalletName({ label: newWalletName })
      .then(function(result) {
        result.should.have.property('id');
        result.should.have.property('label');
        result.id.should.eql(TestBitGo.TEST_WALLET1_ADDRESS);
        result.label.should.eql(newWalletName);

        // now, let's rename it back
        return wallet1.setWalletName({ label: originalWalletName });
      })
      .catch(function(err) {
        // it should never be in here
        assert.equal(err, null);
      });
    });
  });

  describe('DeleteLabel', function() {

    it('arguments', function(done) {
      assert.throws(function() { wallet1.deleteLabel({}, function() {}); });
      assert.throws(function() { wallet1.deleteLabel({ address: 'invalidAddress' }, function() {}); });
      done();
    });

    it('delete', function(done) {
      wallet1.deleteLabel({ address: TestBitGo.TEST_WALLET1_ADDRESS2 }, function(err, label) {
        assert.equal(err, null);
        label.should.have.property('address');
        label.address.should.eql(TestBitGo.TEST_WALLET1_ADDRESS2);
        done();
      });
    });
  });

  describe('Unspents', function() {

    // let sharedWallet;

    before(function() {
      const consolidationBitgo = new TestBitGo();
      consolidationBitgo.initializeTestVars();

      return consolidationBitgo.authenticateTestUser(consolidationBitgo.testUserOTP())
      .then(function() {
        return consolidationBitgo.unlock({ otp: consolidationBitgo.testUserOTP(), duration: 3600 });
      })
      .then(function() {
        return consolidationBitgo.wallets().get({ id: TestBitGo.TEST_WALLET2_ADDRESS });
      })
      .then(function(result) {
        // sharedWallet = result;
      });
    });

    it('arguments', function(done) {
      assert.throws(function() { wallet1.unspents('invalid', function() {}); });
      assert.throws(function() { wallet1.unspents({ target: 'a string!' }, function() {}); });
      assert.throws(function() { wallet1.unspents({}, 'invalid'); });
      assert.throws(function() { wallet1.unspentsPaged('invalid', function() {}); });
      assert.throws(function() { wallet1.unspentsPaged({ target: 'a string!' }, function() {}); });
      assert.throws(function() { wallet1.unspentsPaged({ limit: 'a string!' }, function() {}); });
      assert.throws(function() { wallet1.unspentsPaged({ skip: 'a string!' }, function() {}); });
      assert.throws(function() { wallet1.unspentsPaged({ minConfirms: 'a string!' }, function() {}); });
      assert.throws(function() { wallet1.unspentsPaged({}, 'invalid'); });
      done();
    });

    it('list', function(done) {
      const options = { limit: 0.5 * 1e8 };
      wallet1.unspents(options, function(err, unspents) {
        assert.equal(err, null);
        assert.equal(Array.isArray(unspents), true);
        done();
      });
    });

    it('list with minconfirms', function(done) {
      const options = { minConfirms: 5 };
      wallet1.unspents(options, function(err, unspents) {
        _.forEach(unspents, function(unspent) {
          unspent.confirmations.should.be.greaterThan(4);
        });
        done();
      });
    });

    it('list instant only', function(done) {
      const options = { target: 500 * 1e8, instant: true };
      wallet3.unspents(options, function(err, unspents) {
        _.every(unspents, function(unspent) {
          return unspent.instant === true;
        }).should.eql(true);
        done();
      });
    });

    it('list paged', function() {
      const options = { minConfirms: 1, limit: 3 };
      return wallet3.unspentsPaged(options)
      .then(function(result) {
        result.should.have.property('start');
        result.should.have.property('count');
        result.should.have.property('total');
        result.should.have.property('unspents');
        result.unspents.length.should.eql(result.count);
        result.start.should.eql(0);
        result.count.should.eql(3);
      });
    });

    it('list paged with target', function() {
      const options = { target: 50 * 1e8 };
      return wallet1.unspentsPaged(options)
      .then(function(result) {
        result.should.have.property('count');
        result.should.have.property('total');
        result.should.have.property('unspents');
      });
    });

    describe('Unspent Fanning And Consolidation', function() {

      let regroupWallet;
      before(function() {
        const walletParams = {
          id: TestBitGo.TEST_WALLET_REGROUP_ADDRESS
        };
        return bitgo.wallets().get(walletParams)
        .then(function(wallet) {
          regroupWallet = wallet;
        });
      });

      it('arguments', function(done) {
        assert.throws(function() { regroupWallet.fanOutUnspents('invalid'); });
        assert.throws(function() { regroupWallet.fanOutUnspents({}); });
        assert.throws(function() { regroupWallet.fanOutUnspents({ target: -4 }); });
        assert.throws(function() { regroupWallet.fanOutUnspents({ target: 0 }); });
        assert.throws(function() { regroupWallet.fanOutUnspents({ target: 2.3 }); });

        assert.throws(function() { regroupWallet.consolidateUnspents('invalid'); });
        assert.throws(function() { regroupWallet.consolidateUnspents({ target: -4 }); });
        assert.throws(function() { regroupWallet.consolidateUnspents({ target: 0 }); });
        assert.throws(function() { regroupWallet.consolidateUnspents({ target: 2.3 }); });
        assert.throws(function() { regroupWallet.consolidateUnspents({ target: 3, maxInputCountPerConsolidation: -4 }); });
        assert.throws(function() { regroupWallet.consolidateUnspents({ target: 3, maxInputCountPerConsolidation: 0 }); });
        assert.throws(function() { regroupWallet.consolidateUnspents({ target: 3, maxInputCountPerConsolidation: -2.3 }); });
        done();
      });

      it('prepare unspents', function() {
        const options = {
          walletPassphrase: TestBitGo.TEST_WALLET_REGROUP_PASSCODE,
          otp: '0000000',
          target: 2,
          minConfirms: 0
        };
        // this unit test should simply not throw an error
        return bitgo.unlock({ otp: '0000000' })
        .then(function() {
          return regroupWallet.regroupUnspents(options);
        });
      });

      it('fan out unspents', function() {

        const options = {
          walletPassphrase: TestBitGo.TEST_WALLET_REGROUP_PASSCODE,
          otp: '0000000',
          target: 10, // the maximum consolidation count per input will be 7. This is to ensure we have multiple batches
          validate: false,
          minConfirms: 0
        };

        return Q.delay(5000) // allow time for unspents to be registered
        .then(function() {
          return bitgo.unlock({ otp: '0000000' });
        })
        .then(function() {
          return regroupWallet.fanOutUnspents(options);
        })
        .then(function(response) {
          response.should.have.property('hash');
          response.should.have.property('tx');
          response.status.should.equal('accepted');
        });

      });

      it('consolidate unspents with automatic input count per consolidation', function() {

        const options = {
          walletPassphrase: TestBitGo.TEST_WALLET_REGROUP_PASSCODE,
          otp: '0000000',
          target: 8,
          validate: false,
          minConfirms: 0
        };

        return Q.delay(5000) // allow time for unspents to be registered
        .then(function() {
          return bitgo.unlock({ otp: '0000000' });
        })
        .then(function() {
          return regroupWallet.consolidateUnspents(options);
        })
        .then(function(response) {
          response.length.should.equal(1);
          const firstConsolidation = response[0];
          firstConsolidation.should.have.property('hash');
          firstConsolidation.should.have.property('tx');
          firstConsolidation.status.should.equal('accepted');
        });

      });

      xit('consolidate unspents', function() {
        const maxInputCountPerConsolidation = 3;
        let progressCallbackCount = 0;
        const progressCallback = function(progressDetails) {
          progressDetails.should.have.property('index');
          progressDetails.should.have.property('inputCount');
          progressDetails.index.should.equal(progressCallbackCount);
          assert(progressDetails.inputCount <= maxInputCountPerConsolidation);
          progressCallbackCount++;
        };

        const options = {
          walletPassphrase: TestBitGo.TEST_WALLET_REGROUP_PASSCODE,
          otp: '0000000',
          target: 2,
          maxInputCountPerConsolidation: maxInputCountPerConsolidation,
          validate: false,
          minConfirms: 0,
          progressCallback: progressCallback
        };

        return Q.delay(5000)
        .then(function() {
          return bitgo.unlock({ otp: '0000000' });
        })
        .then(function() {
          return regroupWallet.consolidateUnspents(options);
        })
        .then(function(response) {
          response.length.should.equal(1);
          progressCallbackCount.should.equal(3);
          const firstConsolidation = response[0];
          firstConsolidation.should.have.property('hash');
          firstConsolidation.should.have.property('tx');
          firstConsolidation.status.should.equal('accepted');
        });
      });
    });
  });


  describe('Instant', function() {
    it('wallet1 cannot send instant', function() {
      return Q()
      .then(function() {
        return wallet1.canSendInstant();
      })
      .then(function(result) {
        (!!result).should.eql(false);
      });
    });

    it('wallet3 can send instant', function() {
      return Q()
      .then(function() {
        return wallet3.canSendInstant();
      })
      .then(function(result) {
        result.should.eql(true);
      });
    });

    it('wallet1 cannot get instant balance', function() {
      return Q()
      .then(function() {
        return wallet1.instantBalance();
      })
      .catch(function(error) {
        error.message.should.include('not an instant wallet');
      });
    });

    it('wallet3 instant balance', function() {
      const instantBalance = wallet3.instantBalance();
      instantBalance.should.be.greaterThan(-1);
    });
  });

  describe('Transactions', function() {
    it('arguments', function(done) {
      assert.throws(function() { wallet1.transactions('invalid', function() {}); });
      assert.throws(function() { wallet1.transactions({}, 'invalid'); });
      done();
    });

    let txHash0;
    it('list', function(done) {
      const options = { };
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

    let limitedTxes;
    const limitTestNumTx = 6;
    let totalTxCount;
    it('list with limit', function(done) {

      const options = { limit: limitTestNumTx };
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

      const minHeight = 530000;
      const options = { minHeight: minHeight, limit: 500 };
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

    it('list with maxHeight', function(done) {

      const maxHeight = 530000;
      const options = { maxHeight: maxHeight, limit: 500 };
      wallet1.transactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
        result.transactions.length.should.eql(result.count);
        result.transactions.forEach(function(transaction) {
          if (!transaction.pending) {
            transaction.height.should.be.below(maxHeight + 1);
          }
        });
        result.total.should.be.below(totalTxCount);
        done();
      });
    });

    it('list with minConfirms', function(done) {

      const minConfirms = 100000;
      const options = { minConfirms: minConfirms, limit: 500 };
      wallet1.transactions(options, function(err, result) {
        assert.equal(err, null);
        assert.equal(Array.isArray(result.transactions), true);
        result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
        result.transactions.length.should.eql(result.count);
        result.transactions.forEach(function(transaction) {
          transaction.pending.should.eql(false);
        });
        result.total.should.be.below(totalTxCount);
        done();
      });
    });


    it('list with limit and skip', function(done) {
      const skipNum = 2;
      const options = { limit: (limitTestNumTx - skipNum), skip: skipNum };
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
      const options = { id: txHash0 };
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

    it('get transaction with travel info', function() {
      let keychain;
      return bitgo.keychains().get({ xpub: wallet3.keychains[0].xpub })
      .then(function(res) {
        keychain = res;
        res.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET3_PASSCODE, input: keychain.encryptedXprv });
        return wallet3.getTransaction({ id: TestBitGo.TRAVEL_RULE_TXID });
      })
      .then(function(tx) {
        tx.should.have.property('receivedTravelInfo');
        tx.receivedTravelInfo.should.have.length(2);
        tx = bitgo.travelRule().decryptReceivedTravelInfo({ tx: tx, keychain: keychain });
        const infos = tx.receivedTravelInfo;
        infos.should.have.length(2);
        let info = infos[0].travelInfo;
        info.fromUserName.should.equal('Alice');
        info.toEnterprise.should.equal('SDKOther');
        info = infos[1].travelInfo;
        info.fromUserName.should.equal('Bob');
      });
    });
  });

  describe('TransactionBuilder', function() {
    describe('check', function() {
      it('arguments', function() {
        assert.throws(function() { new TransactionBuilder.createTransaction(); });
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: 'should not be a string' }); });
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {} }); });
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {}, recipients: 'should not be a string' }); });
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {}, recipients: {}, fee: 'should not be a string' }); });
      });

      it('recipient arguments', function() {
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {}, recipients: { 123: true } }); });
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {}, recipients: { 123: 'should not be a string' } }); });

        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {}, recipients: { string: 'should not be a string' } }); });
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {}, recipients: { string: 10000 } }); });
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {}, recipients: [recipients] }); });
      });

      it('minConfirms argument', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {}, recipients: recipients, fee: 0, minConfirms: 'string' }); });
      });

      it('fee', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {}, recipients: recipients, fee: 0.5 * 1e8 }); });
      });

      it('fee and feerate', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 1e8;
        assert.throws(function() { new TransactionBuilder.createTransaction({ wallet: {}, recipients: recipients, fee: 0.5 * 1e8, feeRate: 0.001 * 1e8 }); });
      });
    });

    describe('prepare', function() {
      it('insufficient funds', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = wallet1.balance() + 1e8;
        return Q()
        .then(function() {
          return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients });
        })
        .catch(function(e) {
          e.message.should.eql('Insufficient funds');
          e.result.should.have.property('fee');
          e.result.should.have.property('txInfo');
          e.result.txInfo.should.have.property('nP2SHInputs');
          e.result.txInfo.should.have.property('nP2PKHInputs');
          e.result.txInfo.should.have.property('nOutputs');
          e.result.txInfo.nP2PKHInputs.should.eql(0);
        });
      });

      it('spend from wallet with no unspents', function() {
        let wallet;

        return bitgo.wallets().createWalletWithKeychains({
          passphrase: TestBitGo.TEST_WALLET1_PASSCODE,
          label: 'temp-empty-wallet-1'
        })
        .then(function(result) {
          result.should.have.property('wallet');
          wallet = result.wallet;
          const recipients = {};
          recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 1e8; // wallet is empty
          return TransactionBuilder.createTransaction({ wallet: wallet, recipients: recipients });
        })
        .catch(function(e) {
          e.message.should.eql('no unspents available on wallet');
          return wallet.delete({});
        });
      });

      it('conflicting output script and address', function() {
        const recipients = [];
        recipients.push({ address: '2Mx3TZycg4XL5sQFfERBgNmg9Ma7uxowK9y', script: '76a914cd3af9b7b4587133693da3f40854da2b0ac99ec588ad', amount: wallet1.balance() - 5000 });
        return Q()
        .then(function() {
          return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients });
        })
        .then(function() {
          throw new Error('should not be here!!');
        })
        .catch(function(e) {
          e.message.should.include('both script and address provided but they did not match');
        });
      });

      it('insufficient funds due to fees', function() {
        // Attempt to spend the full balance - adding the default fee would be insufficient funds.
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = wallet1.balance();
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients })
        .then(function(res) {
          throw new Error('succeeded');
        })
        .catch(function(e) {
          e.message.should.eql('Insufficient funds');
          e.result.should.have.property('fee');
        })
        .done();
      });

      xit('prepare wallet1 for transaction size estimation', function() {
        const options = {
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
          otp: '0000000',
          target: 15,
          validate: false,
          minConfirms: 0
        };

        return Q.delay(5000) // allow time for unspents to be registered
        .then(function() {
          return bitgo.unlock({ otp: '0000000' });
        })
        .then(function() {
          return wallet1.consolidateUnspents(options);
        })
        .catch(function(error) {
          // even if there was an error, it was fine. We only want to reduce the number of unspents if it is more than 15
          console.log('wallet 1 not consolidated');
          console.dir(error);
        });
      });

      it('uses all unspents passed into method', function() {
        // Attempt to spend the full balance without any fees.

        const walletmock = Object.create(wallet1);

        // prepare the mock
        return wallet1.unspentsPaged(arguments)
        .then(function(unspents) {
          // it's ascending by default, but we need it to be descending
          const sortedUnspents = _.reverse(_.sortBy(unspents.unspents, 'value'));

          // limit the amount to no more than 15 unspents
          const filteredArray = _.take(sortedUnspents, 15);

          unspents.total = filteredArray.length;
          unspents.count = filteredArray.length;
          unspents.unspents = filteredArray;
          walletmock.wallet.balance = _.sumBy(filteredArray, 'value');

          walletmock.unspentsPaged = function() {
            return Q.fcall(function() {
              return unspents;
            });
          };
        })
        .then(function() {
          const recipients = {};
          recipients[TestBitGo.TEST_WALLET2_ADDRESS] = walletmock.balance();
          return TransactionBuilder.createTransaction({
            wallet: walletmock,
            recipients: recipients,
            fee: 0,
            minConfirms: 0,
            bitgoFee: { amount: 0, address: 'foo' }
          });
        })
        .then(function(result) {
          result.fee.should.equal(0);
          result.changeAddresses.length.should.equal(0);
          result.bitgoFee.amount.should.equal(0);
        });
      });

      it('ok', function() {
        const recipients = [];
        recipients.push({ address: 'n3Eii3DYh5z3SMzWiq7ZVS43bQLvuArsd4', script: '76a914ee40c53bd6f0dcc34f024b6dd13803db2bc8beba88ac', amount: 0.01 * 1e8 });
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.01 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients })
        .then(function(result) {
          result.should.have.property('unspents');
          result.txInfo.nP2PKHInputs.should.equal(15);
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.walletId.should.equal(wallet1.id());
        });
      });

      it('Filter uneconomic unspents test, no feerate set', function() {
        // prepare the mock
        const walletmock = Object.create(wallet1);
        let countLowInputs = 0;
        return wallet1.unspentsPaged(arguments)
        .then(function(unspents) {

          // limit the amount to no more than 15 unspents
          const filteredArray = _.take(unspents.unspents, 15);
          unspents.count = filteredArray.length;
          unspents.unspents = filteredArray;
          // mock a very low unspent value
          unspents.unspents[2].value = 10;
          walletmock.wallet.balance = _.sumBy(filteredArray, 'value');

          for (let i = 0; i < unspents.count; i++) {
            // count the number of inputs that are below 1 sat/Byte
            if (unspents.unspents[i].value <= 1000 * config.tx.P2SH_INPUT_SIZE / 1000) {
              countLowInputs++;
            }
          }
          countLowInputs.should.be.above(0);

          // mock the unspentsPaged call to return an unspent with a very low value
          walletmock.unspentsPaged = function() {
            return Q.fcall(function() {
              should.equal(unspents.count, 15);
              return unspents;
            });
          };
        })
        .then(function() {
          const recipients = {};
          // Spend the complete wallet balance minus some for fees.
          recipients[TestBitGo.TEST_WALLET2_ADDRESS] = walletmock.balance() - 120000;
          return TransactionBuilder.createTransaction({
            wallet: walletmock,
            recipients: recipients,
            minConfirms: 1
          });
        })
        .then(function(result) {
          // several inputs are below fee cost to add them and should be pruned
          result.txInfo.nP2SHInputs.should.equal(15 - 1);
        });
      });

      it('Filter uneconomic unspents test, given feerate', function() {
        // prepare the mock
        const walletmock = Object.create(wallet1);
        let countLowInputs = 0;
        return wallet1.unspentsPaged(arguments)
        .then(function(unspents) {

          // limit the amount to no more than 15 unspents
          const filteredArray = _.take(unspents.unspents, 15);
          unspents.count = filteredArray.length;
          unspents.unspents = filteredArray;
          // mock a very low unspent value
          unspents.unspents[2].value = 10;
          walletmock.wallet.balance = _.sumBy(filteredArray, 'value');


          for (let i = 0; i < unspents.count; i++) {
            if (unspents.unspents[i].value <= 1000 * config.tx.P2SH_INPUT_SIZE / 1000) {
              countLowInputs++;
            }
          }

          countLowInputs.should.be.above(0);

          walletmock.unspentsPaged = function() {
            return Q.fcall(function() {
              should.equal(unspents.count, 15);
              return unspents;
            });
          };
        })
        .then(function() {
          const recipients = {};
          // Spend the complete wallet balance minus some for fees.
          recipients[TestBitGo.TEST_WALLET2_ADDRESS] = walletmock.balance() - 120000;
          return TransactionBuilder.createTransaction({
            wallet: walletmock,
            recipients: recipients,
            feeRate: 1000,
            minConfirms: 1
          });
        })
        .then(function(result) {
          // several inputs are below fee cost to add them and should be pruned
          result.txInfo.nP2SHInputs.should.equal(15 - 1);
        });
      });

      it('no change required', function() {
        // Attempt to spend the full balance without any fees.

        const walletmock = Object.create(wallet1);

        // prepare the mock
        return wallet1.unspentsPaged(arguments)
        .then(function(unspents) {
          // it's ascending by default, but we need it to be descending
          const sortedUnspents = _.reverse(_.sortBy(unspents.unspents, 'value'));

          // limit the amount to no more than 15 unspents
          const filteredArray = _.take(sortedUnspents, 15);

          unspents.total = filteredArray.length;
          unspents.count = filteredArray.length;
          unspents.unspents = filteredArray;
          walletmock.wallet.balance = _.sumBy(filteredArray, 'value');

          walletmock.unspentsPaged = function() {
            return Q.fcall(function() {
              return unspents;
            });
          };
        })
        .then(function() {
          const recipients = {};
          recipients[TestBitGo.TEST_WALLET2_ADDRESS] = walletmock.balance();
          return TransactionBuilder.createTransaction({
            wallet: walletmock,
            recipients: recipients,
            fee: 0,
            minConfirms: 0,
            bitgoFee: { amount: 0, address: 'foo' }
          });
        })
        .then(function(result) {
          result.fee.should.equal(0);
          result.changeAddresses.length.should.equal(0);
          result.bitgoFee.amount.should.equal(0);
        });
      });

      it('ok', function() {
        const recipients = [];
        recipients.push({ address: 'n3Eii3DYh5z3SMzWiq7ZVS43bQLvuArsd4', script: '76a914ee40c53bd6f0dcc34f024b6dd13803db2bc8beba88ac', amount: 0.01 * 1e8 });
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.01 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients })
        .then(function(result) {
          result.should.have.property('unspents');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.walletId.should.equal(wallet1.id());
        });
      });
    });

    describe('size calculation and fees', function() {
      let patch;
      let patch2;
      let patch3;
      let patch4;
      before(function() {
        // Monkey patch wallet1 with simulated inputs
        patch = wallet1.unspents;
        patch3 = wallet1.unspentsPaged;
        patch4 = wallet1.createAddress;
        wallet1.unspents = function(options, callback) {
          return Q(unspentData.unspents).nodeify(callback);
        };
        wallet1.unspentsPaged = function(options, callback) {
          return Q(unspentData).nodeify(callback);
        };
        wallet1.createAddress = function(options, callback) {
          const changeAddress = { address: '2N1Dk6C74PM5xoUzEdoPLpWEWufULRwSag7',
            chain: 1,
            index: 8838,
            path: '/1/8838',
            redeemScript: '52210369c90fd18fd7d6bd028d02486997f38cd54365780db5f2a046994cd63680truncated'
          };
          return Q(changeAddress).nodeify(callback);
        };
        patch2 = wallet1.bitgo.estimateFee;
        wallet1.bitgo.estimateFee = function(options, callback) {
          const serverFeeRates = {
            1: 0.000138 * 1e8,
            2: 0.000112 * 1e8,
            3: 0.0000312 * 1e8,
            4: 1.9 * 1e8 // fee rate too high, should fallback to 0.0001
          };
          return Q({
            feePerKb: serverFeeRates[options.numBlocks || 2] || 0.0001,
            numBlocks: options.numBlocks
          }).nodeify(callback);
        };
      });

      after(function() {
        wallet1.unspents = patch;
        wallet1.bitgo.estimateFee = patch2;
        wallet1.unspentsPaged = patch3;
        wallet1.createAddress = patch4;
      });

      it('too large for blockchain relay', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 10000 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients })
        .catch(function(e) {
          e.message.should.include('transaction too large');
        });
      });

      it('estimateFee with amount', function() {
        return wallet1.estimateFee({ amount: 6200 * 1e8, noSplitChange: true })
        .then(function(result) {
          result.feeRate.should.eql(0.000112 * 1e8);
          result.estimatedSize.should.eql(75327);
          result.fee.should.eql(843663);
        });
      });

      it('estimateFee with recipients (1 recipient)', function() {
        const recipients = [];
        recipients.push({ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 6200 * 1e8 });
        return wallet1.estimateFee({ recipients: recipients, noSplitChange: true })
        .then(function(result) {
          result.feeRate.should.eql(0.000112 * 1e8);
          result.estimatedSize.should.eql(75327);
          result.fee.should.eql(843663);
        });
      });

      it('estimateFee with recipients (2 recipients)', function() {
        const recipients = [];
        recipients.push({ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 6195 * 1e8 });

        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 5 * 1e8 });
        return wallet1.estimateFee({ recipients: recipients, noSplitChange: true })
        .then(function(result) {
          result.feeRate.should.eql(0.000112 * 1e8);
          result.estimatedSize.should.eql(75361);
          result.fee.should.eql(844044);
        });
      });

      it('approximate', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, noSplitChange: true })
        .then(function(result) {
          // Note that the transaction size here will be fairly small, because the signatures have not
          // been applied.  But we had to estimate our fees already.
          result.feeRate.should.eql(0.000112 * 1e8);
          result.walletId = wallet1.id;
          result.fee.should.eql(843663);
          result.should.have.property('txInfo');
          result.txInfo.nP2SHInputs.should.eql(255);
          result.txInfo.nP2PKHInputs.should.eql(0);
          result.txInfo.nOutputs.should.eql(3);
        });
      });

      it('approximate with double fees', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, fee: undefined, feeRate: 0.0002 * 1e8, noSplitChange: true })
        .then(function(result) {
          const feeUsed = result.fee;
          // Note that the transaction size here will be fairly small, because the signatures have not
          // been applied.  But we had to estimate our fees already.
          assert.equal(feeUsed, 1506740);
        });
      });

      it('do not override', function() {
        const manualFee = 0.04 * 1e8;
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, fee: manualFee })
        .then(function(result) {
          assert.equal(result.fee, manualFee);
        });
      });

      it('approximate with feeRate set by feeTxConfirmTarget 1 (estimatefee monkeypatch)', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeTxConfirmTarget: 1, noSplitChange: true })
        .then(function(result) {
          const feeUsed = result.fee;
          assert.equal(feeUsed, 1039513); // tx size will be 75kb * 0.000138 * 1e8
          result.should.have.property('txInfo');
          result.txInfo.nP2SHInputs.should.eql(255);
          result.txInfo.nP2PKHInputs.should.eql(0);
          result.txInfo.nOutputs.should.eql(3);
        });
      });

      it('approximate with feeRate with maxFeeRate (server gives too high a fee and we use max)', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeTxConfirmTarget: 1, maxFeeRate: 5000, noSplitChange: true })
        .then(function(result) {
          const feeUsed = result.fee;
          assert.equal(feeUsed, 376635);
        });
      });

      it('approximate with feeRate set by feeTxConfirmTarget 3 (estimatefee monkeypatch)', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeTxConfirmTarget: 3, noSplitChange: true })
        .then(function(result) {
          const feeUsed = result.fee;
          assert.equal(feeUsed, 235021); // tx size will be 75kb * 0.0000312 * 1e8
        });
      });

      it('approximate with feeRate with maxFeeRate (real service)', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        // undo the monkey patch so we get the right max fee
        const feeMonkeyPatch = wallet1.bitgo.estimateFee;
        wallet1.bitgo.estimateFee = patch2;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeTxConfirmTarget: 3, maxFeeRate: 2200, noSplitChange: true })
        .then(function(result) {
          wallet1.bitgo.estimateFee = feeMonkeyPatch;
          const feeUsed = result.fee;
          assert.equal(feeUsed, 165720);
        });
      });

      it('approximate with feeRate set by feeTxConfirmTarget fallback (estimatefee monkeypatch)', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6200 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeTxConfirmTarget: 4, noSplitChange: true })
        .then(function(result) {
          const feeUsed = result.fee;
          assert.equal(feeUsed, 75327000); // tx size will be 75kb * 0.01 (max feerate as defined in bitgo.js)
        });
      });

      it('validate (disable address verification)', function() {
        const manualFee = 0.04 * 1e8;
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6194e8;
        const walletmock = Object.create(wallet1);
        walletmock.createAddress = function(params) {
          assert.equal(params.validate, false);
          return wallet1.createAddress.apply(wallet1, arguments);
        };
        return TransactionBuilder.createTransaction({ wallet: walletmock, recipients: recipients, fee: manualFee, validate: false })
        .then(function(result) {
          assert.equal(result.fee, manualFee);
        });
      });

      it('custom change address', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6194e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeRate: 0.0002 * 1e8, forceChangeAtEnd: true, changeAddress: TestBitGo.TEST_WALLET1_ADDRESS })
        .then(function(result) {
          assert.equal(result.changeAddresses[0].address, TestBitGo.TEST_WALLET1_ADDRESS);
        });
      });

      it('no change splitting', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6194e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeRate: 0.0002 * 1e8, forceChangeAtEnd: true, noSplitChange: true })
        .then(function(result) {
          result.changeAddresses.length.should.equal(1);
          result.should.have.property('txInfo');
          result.txInfo.nP2SHInputs.should.eql(255);
          result.txInfo.nP2PKHInputs.should.eql(0);
          result.txInfo.nOutputs.should.eql(3);
        });
      });

      it('no change splitting 2', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6194e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeRate: 0.0002 * 1e8, forceChangeAtEnd: true, splitChangeSize: 0 })
        .then(function(result) {
          result.changeAddresses.length.should.equal(1);
        });
      });

      it('change splitting on by default', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 6194e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeRate: 0.0002 * 1e8, forceChangeAtEnd: true })
        .then(function(result) {
          result.changeAddresses.length.should.equal(3);
          result.should.have.property('txInfo');
          result.txInfo.nP2SHInputs.should.eql(255);
          result.txInfo.nP2PKHInputs.should.eql(0);
          result.txInfo.nOutputs.should.eql(5);
        });
      });

      it('insufficient inputs in single key address', function() {
        const recipients = [];
        recipients.push({ address: 'n3Eii3DYh5z3SMzWiq7ZVS43bQLvuArsd4', script: '76a914ee40c53bd6f0dcc34f024b6dd13803db2bc8beba88ac', amount: 0.01 * 1e8 });
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.1 * 1e8;

        return TransactionBuilder.createTransaction({
          wallet: wallet1,
          recipients: recipients,
          feeSingleKeySourceAddress: 'mnGmNgALrkHRX6nPqmC4x1tmGtJn9sFTdn'
        })
        .then(function(result) {
          throw new Error('succeeded');
        })
        .catch(function(err) {
          err.message.should.eql('No unspents available in single key fee source');
        })
        .done();
      });

      it('single key address and WIF do not match', function() {
        const recipients = [];
        recipients.push({ address: 'n3Eii3DYh5z3SMzWiq7ZVS43bQLvuArsd4', script: '76a914ee40c53bd6f0dcc34f024b6dd13803db2bc8beba88ac', amount: 0.01 * 1e8 });
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.01 * 1e8;

        return Q()
        .then(function() {
          return TransactionBuilder.createTransaction({
            wallet: wallet1,
            recipients: recipients,
            feeSingleKeySourceAddress: 'mibJ4uJc9f1fbMeaUXNuWqsB1JgNMcTZK7',
            feeSingleKeyWIF: 'L2zRizgTckt4FbBae1AUcxMC686S37iACpiAj4aMEiUtxKFhW87q'
          });
        })
        .then(function(result) {
          throw new Error('succeeded');
        })
        .catch(function(err) {
          err.message.should.eql('feeSingleKeySourceAddress did not correspond to address of feeSingleKeyWIF');
        })
        .done();
      });

      it('ok with single fee wallet key', function() {
        const recipients = [];
        recipients.push({ address: 'n3Eii3DYh5z3SMzWiq7ZVS43bQLvuArsd4', script: '76a914ee40c53bd6f0dcc34f024b6dd13803db2bc8beba88ac', amount: 0.01 * 1e8 });
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.01 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeSingleKeyWIF: 'cRVQ6cbUyGHVvByPKF9GnEhaB4HUBFgLQ2jVX1kbQARHaTaD7WJ2', splitChangeSize: 0 })
        .then(function(result) {
          result.should.have.property('unspents');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.walletId.should.equal(wallet1.id());
          result.unspents[result.unspents.length - 1].redeemScript.should.eql(false);
          result.changeAddresses.length.should.eql(2); // we expect 2 changeaddresses - 1 for the usual wallet, and 1 for the fee address
          result.should.have.property('txInfo');
          result.txInfo.nP2SHInputs.should.eql(1);
          result.txInfo.nP2PKHInputs.should.eql(1);
          result.txInfo.nOutputs.should.eql(3);
        });
      });

      it('ok with single fee wallet address', function() {
        const recipients = [];
        recipients.push({ address: 'n3Eii3DYh5z3SMzWiq7ZVS43bQLvuArsd4', script: '76a914ee40c53bd6f0dcc34f024b6dd13803db2bc8beba88ac', amount: 0.01 * 1e8 });
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.01 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeSingleKeySourceAddress: 'mibJ4uJc9f1fbMeaUXNuWqsB1JgNMcTZK7', splitChangeSize: 0 })
        .then(function(result) {
          result.should.have.property('unspents');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.walletId.should.equal(wallet1.id());
          result.unspents[result.unspents.length - 1].redeemScript.should.eql(false);
          result.changeAddresses.length.should.eql(2); // we expect 2 changeaddresses - 1 for the usual wallet, and 1 for the fee address

          // parse tx to make sure the single key address was used to pay the fee
          const transaction = bitcoin.Transaction.fromHex(result.transactionHex);
          const singleKeyInput = transaction.ins[transaction.ins.length - 1];
          const inputTxHash = bitcoin.bufferutils.reverse(singleKeyInput.hash).toString('hex');

          // get the input tx to find the amount taken from the single key fee address
          return bitgo.get(bitgo.url('/tx/' + inputTxHash))
          .then(function(response) {
            const inputTx = response.body;
            const output = inputTx.outputs[singleKeyInput.index];

            const feeAddressInputValue = output.value;
            const feeAddressChangeAmount = _.find(result.changeAddresses, { address: 'mibJ4uJc9f1fbMeaUXNuWqsB1JgNMcTZK7' }).amount;

            // calculate the implied fee by using the input amount minus the output and ensure this amount was the final fee for the tx
            const impliedFeeFromTx = feeAddressInputValue - feeAddressChangeAmount;
            impliedFeeFromTx.should.eql(result.fee);
          });
        });
      });

      it('ok with single fee wallet address and key', function() {
        const recipients = [];
        recipients.push({ address: 'n3Eii3DYh5z3SMzWiq7ZVS43bQLvuArsd4', script: '76a914ee40c53bd6f0dcc34f024b6dd13803db2bc8beba88ac', amount: 0.01 * 1e8 });
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.01 * 1e8;
        return TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeSingleKeySourceAddress: 'mibJ4uJc9f1fbMeaUXNuWqsB1JgNMcTZK7', feeSingleKeyWIF: 'cRVQ6cbUyGHVvByPKF9GnEhaB4HUBFgLQ2jVX1kbQARHaTaD7WJ2' })
        .then(function(result) {
          result.should.have.property('unspents');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.walletId.should.equal(wallet1.id());
          result.unspents[result.unspents.length - 1].redeemScript.should.eql(false);
          result.changeAddresses.length.should.be.greaterThan(2); // we expect more than 2 changeaddresses - 2 for the usual wallet (autodetected split change size), and 1 for the fee address
        });
      });
    });

    describe('sign', function() {
      let unsignedTransaction;
      let unsignedTransactionUsingSingleKeyFeeAddress;
      let keychain;
      before(function(done) {

        bitgo.unlock({ otp: bitgo.testUserOTP() }, function(err) {
          assert.equal(err, null);
          // Go fetch the private key for our keychain
          const options = {
            xpub: wallet1.keychains[0].xpub
          };
          bitgo.keychains().get(options, function(err, result) {
            assert.equal(err, null);
            keychain = result;

            const recipients = {};
            recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.001 * 1e8;

            // Now build a transaction
            TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients })
            .then(function(result) {
              unsignedTransaction = result;
              // Build a transaction with single fee wallet address
              TransactionBuilder.createTransaction({ wallet: wallet1, recipients: recipients, feeSingleKeySourceAddress: TestBitGo.TEST_FEE_SINGLE_KEY_ADDRESS })
              .then(function(result) {
                unsignedTransactionUsingSingleKeyFeeAddress = result;
                done();
              })
              .done();
            })
            .done();
          });
        });
      });

      it('arguments', function() {
        const bogusKey = 'xprv9s21ZrQH143K2EPMtV8YHh3UzYdidYbQyNgxAcEVg1374nZs7UWRvoPRT2tdYpN6dENTZbBNf4Af3ZJQbKDydh1BmZ6azhFeYKJ3knPPjND';
        assert.throws(function() { TransactionBuilder.signTransaction(); });
        assert.throws(function() { TransactionBuilder.signTransaction({ transactionHex: 'somestring' }); });
        assert.throws(function() { TransactionBuilder.signTransaction({ transactionHex: [] }); });
        assert.throws(function() { TransactionBuilder.signTransaction({ transactionHex: 'somestring', unspents: [], keychain: bogusKey }); });
        assert.throws(function() { TransactionBuilder.signTransaction({ transactionHex: unsignedTransaction.transactionHex, unspents: {} }); });
        assert.throws(function() { TransactionBuilder.signTransaction({ transactionHex: unsignedTransaction.transactionHex, unspents: 'asdfasdds', keychain: bogusKey }); });
        assert.throws(function() { TransactionBuilder.signTransaction({ transactionHex: unsignedTransaction.transactionHex, unspents: {}, keychain: bogusKey }); });
      });

      it('invalid key', function(done) {
        const bogusKey = 'xprv9s21ZrQH143K2EPMtV8YHh3UzYdidYbQyNgxAcEVg1374nZs7UWRvoPRT2tdYpN6dENTZbBNf4Af3ZJQbKDydh1BmZ6azhFeYKJ3knPPjND';
        assert.throws(function() {
          TransactionBuilder.signTransaction({ transactionHex: unsignedTransaction.transactionHex, unspents: unsignedTransaction.unspents, keychain: bogusKey });
        }
        );
        done();
      });

      it('valid key', function(done) {
        // First we need to decrypt the xprv.
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        TransactionBuilder.signTransaction({ transactionHex: unsignedTransaction.transactionHex, unspents: unsignedTransaction.unspents, keychain: keychain })
        .then(function(result) {
          result.transactionHex.should.not.eql('');
          result.transactionHex.should.not.eql(unsignedTransaction.transactionHex);
          result.transactionHex.length.should.be.above(unsignedTransaction.transactionHex.length);
          done();
        })
        .done();
      });

      it('valid key but missing single-sig key', function() {
        // First we need to decrypt the xprv.
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        return Q()
        .then(function() {
          return TransactionBuilder.signTransaction({
            transactionHex: unsignedTransactionUsingSingleKeyFeeAddress.transactionHex,
            unspents: unsignedTransactionUsingSingleKeyFeeAddress.unspents,
            keychain: keychain,
            feeSingleKeySourceAddress: TestBitGo.TEST_FEE_SINGLE_KEY_ADDRESS
          });
        })
        .then(function(res) {
          throw new Error('succeeded');
        })
        .catch(function(e) {
          e.message.should.eql('single key address used in input but feeSingleKeyWIF not provided');
        });
      });

      it('invalid single-sig key WIF', function() {
        // First we need to decrypt the xprv.
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        return Q()
        .then(function() {
          return TransactionBuilder.signTransaction({
            transactionHex: unsignedTransactionUsingSingleKeyFeeAddress.transactionHex,
            unspents: unsignedTransactionUsingSingleKeyFeeAddress.unspents,
            keychain: keychain,
            feeSingleKeyWIF: 'L18QdhbdYCbEkkW7vqL9QvCWYpz4WoaeKzb2QbJ5u3mHKiSoqk98'
          });
        })
        .then(function(res) {
          throw new Error('succeeded');
        })
        .catch(function(e) {
          e.message.should.eql('Invalid checksum');
        });
      });

      it('valid key and valid single-sig key WIF', function() {
        // First we need to decrypt the xprv.
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        return TransactionBuilder.signTransaction({
          transactionHex: unsignedTransactionUsingSingleKeyFeeAddress.transactionHex,
          unspents: unsignedTransactionUsingSingleKeyFeeAddress.unspents,
          keychain: keychain,
          feeSingleKeyWIF: TestBitGo.TEST_FEE_SINGLE_KEY_WIF
        })
        .then(function(result) {
          result.transactionHex.should.not.eql('');
          result.transactionHex.should.not.eql(unsignedTransaction.transactionHex);
          result.transactionHex.length.should.be.above(unsignedTransaction.transactionHex.length);
        });
      });

      it('validate (disable signature verification)', function() {
        // First we need to decrypt the xprv.
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        const realVerifyInputSignatures = TransactionBuilder.verifyInputSignatures;
        TransactionBuilder.verifyInputSignatures = function() {
          throw new Error('should not be called');
        };
        return TransactionBuilder.signTransaction({ transactionHex: unsignedTransaction.transactionHex, unspents: unsignedTransaction.unspents, keychain: keychain, validate: false })
        .then(function(result) {
          // restore object's true method for the other tests
          TransactionBuilder.verifyInputSignatures = realVerifyInputSignatures;
          result.transactionHex.should.not.eql('');
          result.transactionHex.should.not.eql(unsignedTransaction.transactionHex);
          result.transactionHex.length.should.be.above(unsignedTransaction.transactionHex.length);
        });
      });

      it('validate (enable signature verification)', function() {
        // First we need to decrypt the xprv.
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        // Now we can go ahead and sign.
        const realVerifyInputSignatures = TransactionBuilder.verifyInputSignatures;
        let verifyWasCalled = false;
        TransactionBuilder.verifyInputSignatures = function() {
          verifyWasCalled = true;
          return -1;
        };
        return TransactionBuilder.signTransaction({ transactionHex: unsignedTransaction.transactionHex, unspents: unsignedTransaction.unspents, keychain: keychain, validate: true })
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
      const options = { };
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
    it('arguments', function() {
      assert.throws(function() {
        wallet1.sendCoins();
      });
      assert.throws(function() {
        wallet1.sendCoins({ address: 123 });
      });
      assert.throws(function() {
        wallet1.sendCoins({ address: 'string' });
      });

      return wallet1.sendCoins({ address: 'string', amount: 123 })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad code');
      })
      .catch(function(err) {
        err.message.should.include('one of xprv or walletPassphrase');
        return wallet1.sendCoins({ address: 'string', amount: 123, walletPassphrase: ' ' });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad address');
      })
      .catch(function(err) {
        err.message.should.include('invalid bitcoin address');
        return wallet1.sendCoins({ address: 'string', amount: 123, walletPassphrase: 'advanced1' }, {});
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad code');
      })
      .catch(function(err) {
        err.message.should.include('illegal callback argument');
        return wallet1.sendCoins({ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 1, walletPassphrase: 'badcode' });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad code');
      })
      .catch(function(err) {
        err.message.should.include('Unable to decrypt user keychain');
        return wallet1.sendCoins({ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: -1, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad amount');
      })
      .catch(function(err) {
        err.message.should.include('invalid amount');
        return wallet1.sendCoins({ address: 'bad address', amount: 1, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad address');
      })
      .catch(function(err) {
        err.message.should.include('invalid bitcoin address');
        return wallet1.sendCoins({ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 10000, xprv: 'abcdef' });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad xprv');
      })
      .catch(function(err) {
        err.message.should.include('Unable to parse');
        return wallet1.sendCoins({ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 10000, xprv: 'xprv9wHokC2KXdTSpEepFcu53hMDUHYfAtTaLEJEMyxBPAMf78hJg17WhL5FyeDUQH5KWmGjGgEb2j74gsZqgupWpPbZgP6uFmP8MYEy5BNbyET' });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch xprv not belonging on wallet');
      })
      .catch(function(err) {
        err.message.should.include('not a keychain on this wallet');
        return wallet1.sendCoins({ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 10000, xprv: 'xpub661MyMwAqRbcGU7FnXMKSHMwbWxARxYJUpKD1CoMJP6vonLT9bZZaWYq7A7tKPXmDFFXTKigT7VHMnbtEnjCmxQ1E93ZJe6HDKwxWD28M6f' });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch xpub provided instead of xprv');
      })
      .catch(function(err) {
        err.message.should.include('not a private key');
      });
    });

    describe('Bad input', function() {
      it('send coins - insufficient funds', function() {
        return wallet1.sendCoins(
          { address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 22 * 1e8 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE }
        )
        .then(function(res) {
          assert(false); // should not reach
        })
        .catch(function(err) {
          err.message.should.eql('Insufficient funds');
          err.result.should.have.property('txInfo');
          err.result.txInfo.should.have.property('nP2SHInputs');
          err.result.txInfo.should.have.property('nP2PKHInputs');
          err.result.txInfo.should.have.property('nOutputs');
          err.result.txInfo.nP2PKHInputs.should.eql(0);
        });
      });

      it('send coins - instant unsupported on non-krs wallet', function() {
        return wallet1.sendCoins({
          address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 0.001 * 1e8 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE, instant: true
        })
        .then(function(res) {
          assert(false); // should not reach
        })
        .catch(function(err) {
          err.message.should.eql('wallet does not support instant transactions');
        });
      });
    });

    describe('Real transactions', function() {
      it('send coins fails - not unlocked', function() {
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

      it('send coins - wallet1 to wallet3', function() {
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
          result.should.have.property('instant');
          result.instant.should.eql(false);
          result.feeRate.should.be.lessThan(0.01 * 1e8);
        });
      });

      it('send instant transaction with no fee required - wallet3 to wallet1', function() {
        return wallet3.sendCoins({
          address: TestBitGo.TEST_WALLET1_ADDRESS,
          amount: 0.001 * 1e8,
          walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE,
          instant: true
        })
        .then(function(result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.should.have.property('instant');
          result.should.have.property('instantId');
          result.should.not.have.property('bitgoFee');
          result.instant.should.eql(true);
        });
      });

      it('send coins - wallet1 to wallet3 using xprv and single key fee input', function() {
        const seqId = Math.floor(Math.random() * 1e16).toString(16);
        let txHash;
        return bitgo.unlock({ otp: '0000000' })
        .then(function() {
          return wallet1.sendCoins({
            address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 14000000, // 0.14 coins, test js floating point bugs
            xprv: 'xprv9s21ZrQH143K3z2ngVpK59RD3V7g2VpT7bPcCpPjk3Zwvz1Jc4FK2iEMFtKeWMfgDRpqQosVgqS7NNXhA3iVYjn8sd9mxUpx4wFFsMxxWEi',
            sequenceId: seqId,
            feeSingleKeyWIF: TestBitGo.TEST_FEE_SINGLE_KEY_WIF
          });
        })
        .then(function(result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          result.feeRate.should.be.lessThan(0.01 * 1e8);
          txHash = result.hash;
          return wallet1.getWalletTransactionBySequenceId({ sequenceId: seqId });
        })
        .then(function(result) {
          result.transaction.transactionId.should.eql(txHash);
          result.transaction.sequenceId.should.eql(seqId);
        });
      });

      it('send coins - wallet3 to wallet1 with xprv and instant', function() {
        return wallet3.sendCoins({
          address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 14000000, // 0.14 coins, test js floating point bugs
          xprv: 'xprv9s21ZrQH143K3aLCRoCteo8TkJWojD5d8wQwJmcvUPx6TaDeLnEWq2Mw6ffDyThZNe4YgaNsdEAL9JN8ip8BdqisQsEpy9yR6HxVfvkgEEZ'
        })
        .then(function(result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
        });
      });

      it('list unspents and expect some instant and some non-instant', function() {
        return wallet3.unspents({})
        .then(function(unspents) {
          _.some(unspents, function(unspent) { return unspent.instant === true; }).should.eql(true);
          _.some(unspents, function(unspent) { return unspent.instant === false; }).should.eql(true);
        });
      });

      it('get instant balance 2 ways and make sure they are the same', function() {
        let instantBalanceFromUnspentsNative;
        return wallet3.get()
        .then(function() {
          return wallet3.unspents({ instant: true, target: 10000 * 1e8 });
        })
        .then(function(unspents) {
          instantBalanceFromUnspentsNative = _.sumBy(unspents, 'value');
          return wallet3.instantBalance();
        })
        .then(function(balance) {
          balance.should.eql(instantBalanceFromUnspentsNative);
        });
      });
    });
  });

  describe('Send many', function() {
    it('arguments', function() {
      assert.throws(function() {
        wallet1.sendMany();
      });
      assert.throws(function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        wallet1.sendMany([{ recipients: recipients, walletPassphrase: 'badpasscode' }], function() {});
      });

      return wallet1.sendMany({ recipients: { string: 123 }, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad recipient');
      })
      .catch(function(err) {
        err.message.should.include('invalid bitcoin address');
        return wallet1.sendMany({ recipients: ['string'], walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad recipient');
      })
      .catch(function(err) {
        err.message.should.include('invalid amount');
        return wallet1.sendMany({ recipients: [{ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 12300 }], walletPassphrase: 'abc' });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad wallet passphrase');
      })
      .catch(function(err) {
        err.message.should.include('Unable to decrypt user keychain');
        return wallet1.sendMany({ recipients: { string: 123 }, walletPassphrase: 'advanced1' }, {});
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad callback');
      })
      .catch(function(err) {
        err.message.should.include('illegal callback argument');
        return wallet1.sendMany({ recipients: [{ address: 'bad address', amount: 0.001 * 1e8 }], walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch single bad address');
      })
      .catch(function(err) {
        err.message.should.include('invalid bitcoin address');
        return wallet1.sendMany({ recipients: [{ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 0.001 * 1e8 }], walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE, xprv: 'xprv9wHokC2KXdTSpEepFcu53hMDUHYfAtTaLEJEMyxBPAMf78hJg17WhL5FyeDUQH5KWmGjGgEb2j74gsZqgupWpPbZgP6uFmP8MYEy5BNbyET' });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch double usage of xprv/walletpassphrase');
      })
      .catch(function(err) {
        err.message.should.include('one of xprv or walletPassphrase');
        return wallet1.sendMany({ recipients: [{ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 0.001 * 1e8 }, { address: 'bad address', amount: 0.001 * 1e8 }], walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE });
      })
      .then(function(result) {
        throw new Error('Unexpected result - expected to catch bad address');
      })
      .catch(function(err) {
        err.message.should.include('invalid bitcoin address');
        return wallet1.sendMany({ recipients: [{ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: -100 }], walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE });
      })
      .then(function() {
        throw new Error('Unexpected result - expected to catch bad amount');
      })
      .catch(function(err) {
        err.message.should.include('invalid amount');
        // use a ridiculously high number for the minConfirms so that no viable unspents are returned
        return bitgo.unlock({ otp: '0000000' });
      })
      .then(function() {
        return wallet1.sendMany({ recipients: [{ address: TestBitGo.TEST_WALLET2_ADDRESS, amount: 10000 }], walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE, enforceMinConfirmsForChange: true, minConfirms: 999999999 });
      })
      .then(function() {
        throw new Error('Unexpected result - expected to catch 0 unspents');
      })
      .catch(function(err) {
        err.message.should.include('0 unspents available for transaction creation');
      });
    });

    describe('Bad input', function() {
      it('send many - insufficient funds', function(done) {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 22 * 1e8 * 1e8;
        wallet1.sendMany(
          { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE },
          function(err, result) {
            assert.notEqual(err, null);
            done();
          }
        );
      });
    });

    describe('Real transactions', function() {
      it('send to legacy safe wallet from wallet1', function(done) {
        const recipients = {};
        recipients['2MvfC3e6njdTXqWDfGvNUqDs5kwimfaTGjK'] = 0.001 * 1e8;
        wallet1.sendMany(
          { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE },
          function(err, result) {
            assert.equal(err, null);
            result.should.have.property('tx');
            result.should.have.property('hash');
            result.should.have.property('fee');
            result.should.have.property('feeRate');
            result.feeRate.should.be.lessThan(0.01 * 1e8);
            done();
          });
      });

      it('send from legacy safe wallet back to wallet1', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 0.0009 * 1e8;
        return safewallet.createTransaction({ recipients: recipients })
        .then(function(tx) {
          const enc = '{"iv":"lFkIIulsbL+Ub2jGUiXdrw==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"pdx6d0iD+Io=","ct":"kVIZBeHxoxt19ki0hs5WBjmuLdHPfBQ30a0iGb5H+pR6+kH5lr3zxPL0xeO5EtwPRR0Mw0JVuLqapQE="}';
          const decrypted = bitgo.decrypt({ password: TestBitGo.TEST_PASSWORD, input: enc });
          tx.signingKey = decrypted;
          return safewallet.signTransaction(tx);
        })
        .then(function(result) {
          result.should.have.property('tx');
        });
      });

      it('send many - wallet1 to wallet3 (single output)', function(done) {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET3_ADDRESS] = 0.001 * 1e8;
        wallet1.sendMany(
          { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE },
          function(err, result) {
            assert.equal(err, null);
            result.should.have.property('tx');
            result.should.have.property('hash');
            result.should.have.property('fee');
            result.should.have.property('feeRate');
            done();
          }
        );
      });

      it('send many - wallet3 to wallet1 (single output, using xprv instead of passphrase)', function() {
        const recipients = [];
        recipients.push({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8 });
        return wallet3.sendMany({
          recipients: recipients,
          xprv: 'xprv9s21ZrQH143K3aLCRoCteo8TkJWojD5d8wQwJmcvUPx6TaDeLnEWq2Mw6ffDyThZNe4YgaNsdEAL9JN8ip8BdqisQsEpy9yR6HxVfvkgEEZ'
        })
        .then(function(result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
        });
      });

      it('send many - wallet3 to wallet1 (single output, using keychain)', function() {
        const recipients = [];
        recipients.push({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8 });
        return wallet3.getEncryptedUserKeychain()
        .then(function(keychain) {
          keychain.xprv = 'xprv9s21ZrQH143K3aLCRoCteo8TkJWojD5d8wQwJmcvUPx6TaDeLnEWq2Mw6ffDyThZNe4YgaNsdEAL9JN8ip8BdqisQsEpy9yR6HxVfvkgEEZ';
          return wallet3.sendMany({ recipients: recipients, keychain: keychain });
        })
        .then(function(result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
        });
      });

      it('send many - wallet1 to wallet3 with dynamic fee', function(done) {
        const recipients = [];
        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 0.001 * 1e8 });
        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS2, amount: 0.001 * 1e8 });
        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS3, amount: 0.006 * 1e8 });
        wallet1.sendMany(
          { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE, feeTxConfirmTarget: 2 },
          function(err, result) {
            assert.equal(err, null);
            result.should.have.property('tx');
            result.should.have.property('hash');
            result.should.have.property('fee');
            done();
          }
        );
      });

      it('send many - wallet1 to wallet3 with travel info', function() {
        const recipients = [];
        recipients.push({
          address: TestBitGo.TEST_WALLET3_ADDRESS,
          amount: 0.001 * 1e8,
          travelInfo: {
            fromUserName: 'Alice'
          }
        });
        recipients.push({
          address: TestBitGo.TEST_WALLET3_ADDRESS2,
          amount: 0.002 * 1e8,
          travelInfo: {
            toUserName: 'Bob'
          }
        });
        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS3, amount: 0.006 * 1e8 });
        return wallet1.sendMany({
          recipients: recipients,
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
          feeTxConfirmTarget: 2 }
        )
        .then(function(res) {
          res.should.have.property('tx');
          res.should.have.property('hash');
          res.should.have.property('fee');
          res.should.have.property('travelResult');
          res.travelResult.matched.should.equal(2);
          res.travelResult.results.should.have.length(2);
          let result = res.travelResult.results[0].result;
          result.should.have.property('id');
          result.fromEnterprise.should.equal('SDKTest');
          result.fromEnterpriseId.should.equal(TestBitGo.TEST_ENTERPRISE);
          result.toEnterpriseId.should.equal(TestBitGo.TEST_ENTERPRISE_2);
          result.transactionId.should.equal(res.hash);
          result.should.have.property('outputIndex');
          result.fromWallet.should.equal(TestBitGo.TEST_WALLET1_ADDRESS);
          result.toAddress.should.equal(TestBitGo.TEST_WALLET3_ADDRESS);
          result.amount.should.equal(100000);
          result.toPubKey.should.equal('02fbb4b2f489535af4660202836ec041f2751700bfa1e65a72dee039b7ae3a3ac3');
          result.should.have.property('encryptedTravelInfo');
          result = res.travelResult.results[1].result;
          result.amount.should.equal(200000);
          result.should.have.property('encryptedTravelInfo');
        });
      });

      it('send many - wallet3 to wallet1 with specified fee', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 0.001 * 1e8;
        recipients[TestBitGo.TEST_WALLET1_ADDRESS2] = 0.002 * 1e8;
        return wallet3.sendMany({
          recipients: recipients,
          walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE,
          fee: 0.00042 * 1e8
        })
        .then(function(result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.fee.should.equal(0.00042 * 1e8);
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
    let keychain;
    let tx;

    before(function(done) {

      // Set up keychain
      const options = {
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
      assert.throws(function() { wallet1.createTransaction({ recipients: [123] }); });
      assert.throws(function() { wallet1.createTransaction({ recipients: { 123: true } }); });
      assert.throws(function() { wallet1.createTransaction({ recipients: { string: 123 } }); });
      assert.throws(function() { wallet1.createTransaction({ recipients: { string: 123 }, fee: 0 }); });
      assert.throws(function() { wallet1.createTransaction({ recipients: { string: 123 }, fee: 0, keychain: {} }); });
      assert.throws(function() { wallet1.createTransaction({ address: 'string', amount: 123, fee: 0, keychain: {} }); });

      assert.throws(function() { wallet1.createTransaction({ recipients: { invalidaddress: 0.001 * 1e8 }, fee: 0.0001 * 1e8, keychain: keychain }); });
      assert.throws(function() { wallet1.signTransaction(); });
      assert.throws(function() { wallet1.signTransaction({}); });
      assert.throws(function() { wallet1.signTransaction({ keychain: '111' }); });
      assert.throws(function() { wallet1.signTransaction({ transactionHex: '111' }); });
      assert.throws(function() { wallet1.signTransaction({ unspents: [] }); });
      assert.throws(function() { wallet1.signTransaction({ transactionHex: '111', unspents: [], keychain: { xprv: 'abc' } }); });

      assert.throws(function() { wallet1.sendTransaction(); });
      assert.throws(function() { wallet1.sendTransaction({}); });

      assert.throws(function() { wallet1.createTransaction({ recipients: {}, fee: 0.0001 * 1e8, keychain: keychain }, function() {} );});
      done();
    });

    describe('full transaction', function() {

      it('decrypt key', function(done) {
        keychain.xprv = bitgo.decrypt({ password: TestBitGo.TEST_WALLET1_PASSCODE, input: keychain.encryptedXprv });
        done();
      });

      it('create and sign transaction with global no validation', function() {
        const recipients = [];
        recipients.push({
          address: TestBitGo.TEST_WALLET2_ADDRESS,
          amount: 0.001 * 1e8
        });
        let calledVerify = false;
        let setValidate = false;
        const realVerifyInputSignatures = TransactionBuilder.verifyInputSignatures;
        TransactionBuilder.verifyInputSignatures = function() {
          calledVerify = true;
          return -1;
        };
        const wallet = Object.create(wallet1);
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

      it('create tx with bad travelInfo', function() {
        const recipients = [];
        recipients.push({
          address: TestBitGo.TEST_WALLET2_ADDRESS,
          amount: 0.001 * 1e8,
          travelInfo: {
            fromUserName: 42
          }
        });
        const wallet = Object.create(wallet1);
        return wallet.createTransaction({ recipients: recipients })
        .then(function(result) {
          // should not reach
          assert(false);
        })
        .catch(function(err) {
          err.message.should.include('incorrect type for field fromUserName in travel info');
        });
      });

      it('create tx with travelInfo', function() {
        const recipients = [];
        recipients.push({
          address: TestBitGo.TEST_WALLET2_ADDRESS,
          amount: 0.001 * 1e8,
          travelInfo: {
            fromUserName: 'Alice',
            toUserName: 'Bob'
          }
        });
        const wallet = Object.create(wallet1);
        return wallet.createTransaction({ recipients: recipients })
        .then(function(res) {
          res.should.have.property('travelInfos');
          res.travelInfos.should.have.length(1);
          const travelInfo = res.travelInfos[0];
          travelInfo.should.have.property('outputIndex');
          travelInfo.fromUserName.should.equal('Alice');
          travelInfo.toUserName.should.equal('Bob');
        });
      });

      it('create and sign transaction with fee', function(done) {
        const recipients = {};
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
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        wallet1.createTransaction({ recipients: recipients })
        .then(function(result) {
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          should.exist(result.fee);
          result.fee.should.be.lessThan(0.01 * 1e8);
          result.feeRate.should.be.lessThan(0.01 * 1e8);
          return wallet1.signTransaction({ transactionHex: result.transactionHex, unspents: result.unspents, keychain: keychain });
        })
        .then(function(result) {
          result.should.have.property('tx');
          tx = result.tx;
        })
        .done(done);
      });

      it('create instant transaction', function() {
        const recipients = {};
        let bitgoFee;
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 1.1e8;
        return wallet3.createTransaction({ recipients: recipients, instant: true })
        .then(function(result) {
          result.should.have.property('fee');
          result.should.have.property('feeRate');
          should.exist(result.fee);
          result.fee.should.be.lessThan(0.01e8);
          result.feeRate.should.be.lessThan(0.01e8);
          result.should.have.property('bitgoFee');
          bitgoFee = result.bitgoFee;
          bitgoFee.amount.should.equal(110000);
          bitgoFee.should.have.property('address');
          result.should.have.property('instantFee');
          result.instantFee.amount.should.equal(110000);
          // Re-create the same tx, passing bitgoFee info
          return wallet3.createTransaction({ recipients: recipients, instant: true, bitgoFee: result.bitgoFee });
        })
        .then(function(result) {
          result.should.have.property('bitgoFee');
          result.bitgoFee.address.should.equal(bitgoFee.address);
        });
      });

      it('send', function(done) {
        return bitgo.unlock({ otp: '0000000' })
        .then(function() {
          wallet1.sendTransaction({ tx: tx }, function(err, result) {
            assert.equal(err, null);
            result.should.have.property('tx');
            result.should.have.property('hash');
            done();
          });
        });
      });
    });

    describe('CPFP', function() {
      let parentTxHash;
      let defaultFee;

      before(function() {
        return bitgo.unlock({ otp: '0000000' })
        .then(function() {
          // broadcast parent tx
          const recipients = {};
          recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 0.001 * 1e8;
          return wallet3.sendMany({
            recipients: recipients,
            walletPassphrase: TestBitGo.TEST_WALLET3_PASSCODE,
            fee: 10000    // extremely low fee
          });
        })
        .then(function(result) {
          result.should.have.property('hash');
          parentTxHash = result.hash;
        })
        .delay(3000);    // give the indexer some time to pick up the tx
      });

      it('child should pay more than usual', function() {
        return bitgo.estimateFee({ numBlocks: 2, maxFee: 1.00 * 1e8, inputs: [parentTxHash], txSize: 300, cpfpAware: true })
        .then(function(result) {
          result.should.have.property('feePerKb');
          defaultFee = result.feePerKb;
          result.should.have.property('cpfpFeePerKb');
          defaultFee.should.be.lessThan(result.cpfpFeePerKb);
        });
      });

      it('child fee capped by maxFee', function() {
        const maxFee = defaultFee + 1000;
        return bitgo.estimateFee({ numBlocks: 2, maxFee: maxFee, inputs: [parentTxHash], txSize: 300, cpfpAware: true })
        .then(function(result) {
          result.should.have.property('feePerKb');
          result.should.have.property('cpfpFeePerKb');
          result.cpfpFeePerKb.should.equal(maxFee);
        });
      });

      it('disable cpfp awareness', function() {
        return bitgo.estimateFee({ numBlocks: 2, maxFee: 1.00 * 1e8, inputs: [parentTxHash], txSize: 300, cpfpAware: false })
        .then(function(result) {
          result.should.have.property('feePerKb');
          result.should.have.property('cpfpFeePerKb');
          result.feePerKb.should.equal(result.cpfpFeePerKb);
        });
      });
    });

    // Now send the money back
    describe('return transaction', function() {
      let keychain;
      let tx;

      it('keychain', function(done) {
        const options = {
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

      it('create transaction, check that minSize is sent', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 0.001 * 1e8;
        // monkey patch unspents to check that expected options are sent
        const backingUnspentMethod = wallet2.unspents.bind(wallet2);
        wallet2.unspents = function(expectedOptions) {
          expectedOptions.should.have.property('minSize');
          expectedOptions.minSize.should.eql(5460);
          return backingUnspentMethod(arguments);
        };
        return wallet2.createTransaction({ recipients: recipients, fee: 0.0001 * 1e8, minConfirms: 1 })
        .then(function(result) {
          result.should.have.property('fee');
          return wallet2.signTransaction({ transactionHex: result.transactionHex, unspents: result.unspents, keychain: keychain });
        })
        .then(function(result) {
          result.should.have.property('tx');
          tx = result.tx;
          wallet2.unspents = backingUnspentMethod;
        });
      });

      it('create transaction with custom minSize', function() {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET1_ADDRESS] = 0.001 * 1e8;
        // monkey patch unspents to check that expected options are sent
        const backingUnspentMethod = wallet2.unspents.bind(wallet2);
        wallet2.unspents = function(expectedOptions) {
          expectedOptions.should.have.property('minSize');
          expectedOptions.minSize.should.eql(999);
          return backingUnspentMethod(arguments);
        };
        return wallet2.createTransaction({ recipients: recipients, fee: 0.0001 * 1e8, minConfirms: 1, minUnspentSize: 999 })
        .then(function() {
          wallet2.unspents = backingUnspentMethod;
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

  describe('Policy', function() {
    it('arguments', function(done) {
      assert.throws(function() {
        wallet1.setPolicyRule({});
      });
      assert.throws(function() {
        wallet1.setPolicyRule({ id: 'policy1' });
      });
      assert.throws(function() {
        wallet1.setPolicyRule({ id: 'policy1', type: 'dailyLimit' });
      });
      assert.throws(function() {
        wallet1.setPolicyRule({ id: 'policy1', type: 'dailyLimit', action: { type: 'getApproval' } });
      });
      assert.throws(function() {
        wallet1.setPolicyRule({ id: 'policy1', type: 'dailyLimit', condition: { amount: 1e8 } });
      });
      assert.throws(function() {
        wallet1.removePolicyRule({});
      });
      done();
    });

    let amount;
    it('set a policy rule', function() {
      amount = 888 * 1e8 + Math.round(Math.random() * 1e8);
      return wallet1.setPolicyRule({
        action: { type: 'getApproval' },
        condition: { amount: amount },
        id: 'test1',
        type: 'dailyLimit'
      })
      .then(function(wallet) {
        wallet.id.should.eql(wallet1.id());
        const rulesById = _.keyBy(wallet.admin.policy.rules, 'id');
        rulesById.should.have.property('test1');
        rulesById['test1'].action.type.should.eql('getApproval');
        rulesById['test1'].condition.amount.should.eql(amount);
        rulesById['test1'].id.should.eql('test1');
        rulesById['test1'].type.should.eql('dailyLimit');
      });
    });

    it('get policy and rules', function() {
      return wallet1.getPolicy({})
      .then(function(policy) {
        const rulesById = _.keyBy(policy.rules, 'id');
        rulesById.should.have.property('test1');
        rulesById['test1'].action.type.should.eql('getApproval');
        rulesById['test1'].condition.amount.should.eql(amount);
        rulesById['test1'].id.should.eql('test1');
        rulesById['test1'].type.should.eql('dailyLimit');
      });
    });

    it('get policy status', function() {
      return wallet1.getPolicyStatus({})
      .then(function(policyStatus) {
        const rulesById = _.keyBy(policyStatus.statusResults, 'ruleId');
        rulesById['test1'].ruleId.should.eql('test1');
        rulesById['test1'].status.should.have.property('remaining');
        rulesById['test1'].status.remaining.should.be.greaterThan(0);
      });
    });

    it('delete the policy rule', function() {
      return wallet1.removePolicyRule({ id: 'test1' })
      .then(function(wallet) {
        wallet.id.should.eql(wallet1.id());
        const rulesById = _.keyBy(wallet.admin.policy.rules, 'id');
        rulesById.should.not.have.property('test1');
      });
    });
  });

  describe('Freeze Wallet', function() {
    it('arguments', function(done) {
      assert.throws(function() {
        wallet2.freeze({ duration: 'asdfasdasd' });
      });
      assert.throws(function() {
        wallet2.freeze({ duration: 5 }, 'asdasdsa');
      });
      done();
    });

    it('perform freeze', function(done) {
      wallet2.freeze({ duration: 6 }, function(err, freezeResult) {
        freezeResult.should.have.property('time');
        freezeResult.should.have.property('expires');
        done();
      });
    });

    it('get wallet should show freeze', function(done) {
      wallet2.get({}, function(err, res) {
        const wallet = res.wallet;
        wallet.should.have.property('freeze');
        wallet.freeze.should.have.property('time');
        wallet.freeze.should.have.property('expires');
        done();
      });
    });

    it('attempt to send funds', function(done) {
      wallet2.sendCoins(
        { address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET2_PASSCODE },
        function(err, result) {
          err.should.not.equal(null);
          err.status.should.equal(403);
          err.message.should.include('wallet is frozen');
          done();
        }
      );
    });
  });
});
