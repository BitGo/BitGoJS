//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
const should = require('should');
const Q = require('q');

const BitGoJS = require('../src/index');
const Wallet = require('../src/wallet');
const TestBitGo = require('./lib/test_bitgo');
const TransactionBuilder = require('../src/transactionBuilder');
const unspentData = require('./fixtures/largeunspents.json');
const crypto = require('crypto');
const _ = require('lodash');
const bitcoin = BitGoJS.bitcoin;
const Promise = require('bluebird');
const co = Promise.coroutine;

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

    it('can invite non bitgo user again', function (done) {
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

    it('arguments', function (done) {
      assert.throws(function () { bitgo.getSharingKey({}); });

      assert.throws(function () { wallet1.shareWallet({}, function() {}); });
      assert.throws(function () { wallet1.shareWallet({ email: 'tester@bitgo.com' }, function() {}); });
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

  describe('Accept wallet share', function () {
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
        .then(function (result) {
          result.should.have.property('state');
          result.should.have.property('changed');
          result.state.should.equal('accepted');
          result.changed.should.equal(true);

          // now check that the wallet share id is no longer there
          return bitgoSharedKeyUser.wallets().listShares();
        })
        .then(function (result) {
          result.incoming.should.not.containDeep([{ id: walletShareIdWithSpendPermissions }]);
          done();
        })
        .done();
      })
      .done();
    });
  });

  describe('Wallet shares with skip keychain', function () {

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
        .then(function (result) {
          result.should.have.property('state');
          result.should.have.property('changed');
          result.state.should.equal('accepted');
          result.changed.should.equal(true);

          // now check that the wallet share id is no longer there
          return bitgoSharedKeyUser.wallets().listShares();
        })
        .then(function (result) {
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
              if (unspents.unspents[i].value <= 1000 * 295 / 1000) {
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
              if (unspents.unspents[i].value <= 1000 * 295 / 1000) {
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

    describe('Bad input', function () {
      it('send coins - insufficient funds', function () {
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

      it('send coins - wallet1 to wallet3 using xprv and single key fee input', function () {
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
    it('arguments', function () {
      assert.throws(function () {
        wallet1.sendMany();
      });
      assert.throws(function () {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET2_ADDRESS] = 0.001 * 1e8;
        wallet1.sendMany([{ recipients: recipients, walletPassphrase: 'badpasscode' }], function () {});
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

    describe('Bad input', function () {
      it('send many - insufficient funds', function (done) {
        const recipients = {};
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
        const recipients = {};
        recipients['2MvfC3e6njdTXqWDfGvNUqDs5kwimfaTGjK'] = 0.001 * 1e8;
        wallet1.sendMany(
          { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE },
          function (err, result) {
            assert.equal(err, null);
            result.should.have.property('tx');
            result.should.have.property('hash');
            result.should.have.property('fee');
            result.should.have.property('feeRate');
            result.feeRate.should.be.lessThan(0.01 * 1e8);
            done();
          });
      });

      it('send from legacy safe wallet back to wallet1', function () {
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

      it('send many - wallet1 to wallet3 (single output)', function (done) {
        const recipients = {};
        recipients[TestBitGo.TEST_WALLET3_ADDRESS] = 0.001 * 1e8;
        wallet1.sendMany(
          { recipients: recipients, walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE },
          function (err, result) {
            assert.equal(err, null);
            result.should.have.property('tx');
            result.should.have.property('hash');
            result.should.have.property('fee');
            result.should.have.property('feeRate');
            done();
          }
        );
      });

      it('send many - wallet3 to wallet1 (single output, using xprv instead of passphrase)', function () {
        const recipients = [];
        recipients.push({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8 });
        return wallet3.sendMany({
          recipients: recipients,
          xprv: 'xprv9s21ZrQH143K3aLCRoCteo8TkJWojD5d8wQwJmcvUPx6TaDeLnEWq2Mw6ffDyThZNe4YgaNsdEAL9JN8ip8BdqisQsEpy9yR6HxVfvkgEEZ'
        })
        .then(function (result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
        });
      });

      it('send many - wallet3 to wallet1 (single output, using keychain)', function () {
        const recipients = [];
        recipients.push({ address: TestBitGo.TEST_WALLET1_ADDRESS, amount: 0.001 * 1e8 });
        return wallet3.getEncryptedUserKeychain()
        .then(function(keychain) {
          keychain.xprv = 'xprv9s21ZrQH143K3aLCRoCteo8TkJWojD5d8wQwJmcvUPx6TaDeLnEWq2Mw6ffDyThZNe4YgaNsdEAL9JN8ip8BdqisQsEpy9yR6HxVfvkgEEZ';
          return wallet3.sendMany({ recipients: recipients, keychain: keychain });
        })
        .then(function (result) {
          result.should.have.property('tx');
          result.should.have.property('hash');
          result.should.have.property('fee');
          result.should.have.property('feeRate');
        });
      });

      it('send many - wallet1 to wallet3 with dynamic fee', function (done) {
        const recipients = [];
        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 0.001 * 1e8 });
        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS2, amount: 0.001 * 1e8 });
        recipients.push({ address: TestBitGo.TEST_WALLET3_ADDRESS3, amount: 0.006 * 1e8 });
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

      it('send many - wallet1 to wallet3 with travel info', function () {
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

      it('send many - wallet3 to wallet1 with specified fee', function () {
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

      assert.throws(function () { wallet1.createTransaction({ recipients: {}, fee: 0.0001 * 1e8, keychain: keychain }, function() {} );});
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
    it('arguments', function (done) {
      assert.throws(function () {
        wallet1.setPolicyRule({});
      });
      assert.throws(function () {
        wallet1.setPolicyRule({ id: 'policy1' });
      });
      assert.throws(function () {
        wallet1.setPolicyRule({ id: 'policy1', type: 'dailyLimit' });
      });
      assert.throws(function () {
        wallet1.setPolicyRule({ id: 'policy1', type: 'dailyLimit', action: { type: 'getApproval' } });
      });
      assert.throws(function () {
        wallet1.setPolicyRule({ id: 'policy1', type: 'dailyLimit', condition: { amount: 1e8 } });
      });
      assert.throws(function () {
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
    it('arguments', function (done) {
      assert.throws(function () {
        wallet2.freeze({ duration: 'asdfasdasd' });
      });
      assert.throws(function () {
        wallet2.freeze({ duration: 5 }, 'asdasdsa');
      });
      done();
    });

    it('perform freeze', function (done) {
      wallet2.freeze({ duration: 6 }, function (err, freezeResult) {
        freezeResult.should.have.property('time');
        freezeResult.should.have.property('expires');
        done();
      });
    });

    it('get wallet should show freeze', function (done) {
      wallet2.get({}, function (err, res) {
        const wallet = res.wallet;
        wallet.should.have.property('freeze');
        wallet.freeze.should.have.property('time');
        wallet.freeze.should.have.property('expires');
        done();
      });
    });

    it('attempt to send funds', function (done) {
      wallet2.sendCoins(
        { address: TestBitGo.TEST_WALLET3_ADDRESS, amount: 0.001 * 1e8, walletPassphrase: TestBitGo.TEST_WALLET2_PASSCODE },
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

describe('Wallet Prototype Methods', function() {

  const bitgo = new TestBitGo();
  bitgo.initializeTestVars();

  const userKeypair = {
    xprv: 'xprv9s21ZrQH143K2fJ91S4BRsupcYrE6mmY96fcX5HkhoTrrwmwjd16Cn87cWinJjByrfpojjx7ezsJLx7TAKLT8m8hM5Kax9YcoxnBeJZ3t2k',
    xpub: 'xpub661MyMwAqRbcF9Nc7TbBo1rZAagiWEVPWKbDKThNG8zqjk76HAKLkaSbTn6dK2dQPfuD7xjicxCZVWvj67fP5nQ9W7QURmoMVAX8m6jZsGp',
    rawPub: '02c103ac74481874b5ef0f385d12725e4f14aedc9e00bc814ce96f47f62ce7adf2',
    rawPrv: '936c5af3f8af81f75cdad1b08f29e7d9c01e598e2db2d7be18b9e5a8646e87c6',
    path: 'm',
    walletSubPath: '/0/0'
  };
  const backupKeypair = {
    xprv: 'xprv9s21ZrQH143K47sEkLkykgYmq1xF5ZWrPYhUZcmBpPFMQojvGUmEcr5jFXYGfr8CpFdpTvhQ7L9NN2rLtsBFjSix3BAjwJcBj6U3D5hxTPc',
    xpub: 'xpub661MyMwAqRbcGbwhrNHz7pVWP3njV2Ehkmd5N1AoNinLHc54p25VAeQD6q2oTS3uuDMDnfnXnthbS9ufC8JVYpNnWU5Rn3pYaNuLCNywkw1',
    rawPub: '03bbcb73997977068d9e36666bbd5cd37579acae8e2bd5ce9d0a6e5c150a423bc3',
    rawPrv: '77a15f14796f4001d1092ae84f766bd869e9bee6bffae6547def5045b96fa943',
    path: 'm',
    walletSubPath: '/0/0'
  };
  const bitgoKey = {
    xpub: 'xpub661MyMwAqRbcGQcVFiwcrtc7c3vopsX96jsJUYPcFMREcRTqAqsqbv2ZRyCJAPLm5NMHCy85E3ZwpT4EAUw9WGU7vMhG6z83hDeKXBWn6Lf',
    path: 'm',
    walletSubPath: '/0/0'
  };

  const extraKeypair1 = {
    xprv: 'xprv9s21ZrQH143K4QBfbn1EUu6C3T2sWxuLcmJq7aEVWPK76VXA5xVZKhp42UPwEgNiW76i3Pr3XmUyipj1WQnmqVZ2eLovfPXJCJHKyGBqepP',
    xpub: 'xpub661MyMwAqRbcGtG8hoYEr32vbUsMvRdByzERuxe74ir5yHrJdVoosW8XskKeKKp2HZGtc28sPtp3CZUdYb59yq9SjhQ1FSMqWfQLQU5cA3o',
    rawPub: '03174291b93b7e95ff070949272136e706be24d4885c47d6cf2203b7f792e26b0d',
    rawPrv: 'a151bd090c47ab339acfdeea680795d0a32408ad73f339412795b45e50ba8e3d',
    path: 'm',
    walletSubPath: '/0/0'
  };

  const extraKeypair2 = {
    xprv: 'xprv9s21ZrQH143K3B1ZejZg5dJdfbAjrdZNCqofurao3msbSckfk2vho7tHmsvPgxKFJB3Q34UCL39HyJjqW7GiNT3ecM7ryYCQ7Mp4uhicB5f',
    xpub: 'xpub661MyMwAqRbcFf62km6gSmFNDd1EG6HDa4jGiEzQc7QaKR5pHaExLvCmdARERzquG8hfEJq6wwWTrCr2KWYQzCY1rfnhpnGm2R2A3Tyv8Wm',
    rawPub: '02d2e2b63f348772aa7fccd2c21234441c352900eeda6da6d60baeb0d9fe3ce293',
    rawPrv: '11b6dfcea36c06afa337236a016192dc783f1b3c5a946b9a37e070c4a8cab5f3',
    path: 'm',
    walletSubPath: '/0/0'
  };

  const keychains = [userKeypair, backupKeypair, bitgoKey, extraKeypair1, extraKeypair2];
  const fakeWallet = new Wallet(bitgo, { id: '2NCoSfHH6Ls4CdTS5QahgC9k7x9RfXeSwY4', private: { keychains: [userKeypair, backupKeypair, bitgoKey] } });

  describe('Generate Address', function() {

    it('generate first address', function() {
      const idAddress = fakeWallet.generateAddress({ path: '/0/0', segwit: false });
      idAddress.address.should.equal(fakeWallet.id());
      idAddress.chain.should.equal(0);
      idAddress.index.should.equal(0);
      idAddress.chainPath.should.equal('/0/0');
      idAddress.path.should.equal('/0/0');
      idAddress.outputScript.should.equal('a914d682476e9bd54454a885f9dff1e604e99cef43dc87');
      idAddress.redeemScript.should.equal('522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae');
      idAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate second address', function() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/1', segwit: false });
      p2shAddress.address.should.equal('2N5y5RLVqdZi7qp5PmzMdPR6YvQzUqBQFWK');
      p2shAddress.chain.should.equal(0);
      p2shAddress.index.should.equal(1);
      p2shAddress.chainPath.should.equal('/0/1');
      p2shAddress.path.should.equal('/0/1');
      p2shAddress.outputScript.should.equal('a9148b8bd3da68ef0f2465523146bd2de33c86b9c87187');
      p2shAddress.redeemScript.should.equal('522102709edb6a2198d364c485a76b981d12065eabde8aa2d85bd7e7a035f7ecb3579b2102a724efed499c05fdb4da1e139700951fae00c006b3283888bdfd1b46979292242102b32abe44d61986ff57b835e3bd16293d93f303d0d8fb0454e2c9cceda5c4929853ae');
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate change address', function() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/1/0', segwit: false });
      p2shAddress.address.should.equal('2NFj9JrpZc5MyYnCouyREtzNY4eoyKWDfgP');
      p2shAddress.chain.should.equal(1);
      p2shAddress.index.should.equal(0);
      p2shAddress.chainPath.should.equal('/1/0');
      p2shAddress.path.should.equal('/1/0');
      p2shAddress.outputScript.should.equal('a914f69a81fad75ea65ad166da76515291679a4f1ad887');
      p2shAddress.redeemScript.should.equal('5221020b4c4f891a5520f5a0b6818d8d53919552a0d4d806b5fa05c97708079d83737e2102c5cc49bf0331eb0b0890a7e7d87f7e9e0dea515438280dc76834c21d198efe08210370e52cf741ebf4513749d028839d696891eb789ba7a58592cfbc857cdc0a9de753ae');
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate segwit address', function() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/0', segwit: true });
      segwitAddress.address.should.equal('2N5EVegRPWnmed2PpqDggZPw7DcNDguRYv8');
      segwitAddress.chain.should.equal(10);
      segwitAddress.index.should.equal(0);
      segwitAddress.chainPath.should.equal('/10/0');
      segwitAddress.path.should.equal('/10/0');
      segwitAddress.outputScript.should.equal('a914837e2adcb6f6386fea3c5d40316b282ccf39121d87');
      segwitAddress.redeemScript.should.equal('0020a62afee1d211c5adb9739f81ed4e36330e6cda651c7bdd314e32ccc465ec2203');
      segwitAddress.witnessScript.should.equal('5221027b30505777a4ed8947b069fcb0116e287995d97278d84da4db6c613270649d3d21034c30e51f1e614cad667815c91d041404c18225d0b2f79e2c0bcb63fd2604316b2103b65ddfc06159b691693390761e75a0b8cc7a65b6ff305d094f3ad972f17953fe53ae');
      segwitAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate segwit address with custom threshold', function() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/0', segwit: true, threshold: 3 });
      segwitAddress.address.should.equal('2NCa6VuAUNenQeZRnQj8PHQwVDgVc97DDcc');
      segwitAddress.chain.should.equal(10);
      segwitAddress.index.should.equal(0);
      segwitAddress.chainPath.should.equal('/10/0');
      segwitAddress.path.should.equal('/10/0');
      segwitAddress.outputScript.should.equal('a914d3fc0a95eb85047626d1b64dde10252b945138b187');
      segwitAddress.redeemScript.should.equal('00209ee0c2623c8c050afce517c9ce7cba38c64625e1e97cd402e928d789553c3538');
      segwitAddress.witnessScript.should.equal('5321027b30505777a4ed8947b069fcb0116e287995d97278d84da4db6c613270649d3d21034c30e51f1e614cad667815c91d041404c18225d0b2f79e2c0bcb63fd2604316b2103b65ddfc06159b691693390761e75a0b8cc7a65b6ff305d094f3ad972f17953fe53ae');
      segwitAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate segwit address with custom keyset', function() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/0', segwit: true, keychains: keychains });
      segwitAddress.address.should.equal('2N9p18EKz583H7unBiT19Jt1bfyBHGsyEZX');
      segwitAddress.chain.should.equal(10);
      segwitAddress.index.should.equal(0);
      segwitAddress.chainPath.should.equal('/10/0');
      segwitAddress.path.should.equal('/10/0');
      segwitAddress.outputScript.should.equal('a914b5b50075c69779f3daffdccd2dfa0f0fc11213ac87');
      segwitAddress.redeemScript.should.equal('0020448e0457c42eca18e19dfb00a6a73ecb44b5b2a0dcb48baef32b64d8eccaffff');
      segwitAddress.witnessScript.should.equal('5221027b30505777a4ed8947b069fcb0116e287995d97278d84da4db6c613270649d3d21034c30e51f1e614cad667815c91d041404c18225d0b2f79e2c0bcb63fd2604316b2103b65ddfc06159b691693390761e75a0b8cc7a65b6ff305d094f3ad972f17953fe2102e6ee6da95e1e96f41285cba9c0b05a03518995da5f35909b219fcfed734b75a2210272b67ddf56f8b7447e5b0bb6b5bc04edbe20a75652595986131de24ea63d473355ae');
      segwitAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate segwit address with custom keyset and threshold', function() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/0', segwit: true, keychains: keychains, threshold: 4 });
      segwitAddress.address.should.equal('2MvQXRwq3AXNMXSKQkJuP81Ye5cah4hytxU');
      segwitAddress.chain.should.equal(10);
      segwitAddress.index.should.equal(0);
      segwitAddress.chainPath.should.equal('/10/0');
      segwitAddress.path.should.equal('/10/0');
      segwitAddress.outputScript.should.equal('a91422aaae654226e45a5d526e5100cd837c1ea62ad487');
      segwitAddress.redeemScript.should.equal('002064b7e9639cd8f454012132644c7a445db88c783ad751a9b9bd40ee8e271464a1');
      segwitAddress.witnessScript.should.equal('5421027b30505777a4ed8947b069fcb0116e287995d97278d84da4db6c613270649d3d21034c30e51f1e614cad667815c91d041404c18225d0b2f79e2c0bcb63fd2604316b2103b65ddfc06159b691693390761e75a0b8cc7a65b6ff305d094f3ad972f17953fe2102e6ee6da95e1e96f41285cba9c0b05a03518995da5f35909b219fcfed734b75a2210272b67ddf56f8b7447e5b0bb6b5bc04edbe20a75652595986131de24ea63d473355ae');
      segwitAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate p2sh address with custom threshold', function() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/0', segwit: false, threshold: 3 });
      p2shAddress.address.should.equal('2NFnEZjzUhrFAutNCM9fwvQy53SY4wftoJ1');
      p2shAddress.chain.should.equal(0);
      p2shAddress.index.should.equal(0);
      p2shAddress.chainPath.should.equal('/0/0');
      p2shAddress.path.should.equal('/0/0');
      p2shAddress.outputScript.should.equal('a914f73024c2f917b82ae5cd4233069fe71b2103d0d987');
      p2shAddress.redeemScript.should.equal('532102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc53ae');
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate p2sh address with custom keyset', function() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/0', segwit: false, keychains: keychains });
      p2shAddress.address.should.equal('2MvPfwPEgg2oMRbrBCBqsA34XkpCFARqhbM');
      p2shAddress.chain.should.equal(0);
      p2shAddress.index.should.equal(0);
      p2shAddress.chainPath.should.equal('/0/0');
      p2shAddress.path.should.equal('/0/0');
      p2shAddress.outputScript.should.equal('a91422815df4e86b71600c5cc3f37bcc8b026c97801f87');
      p2shAddress.redeemScript.should.equal('522102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc21038c80e64d61f7e9a6d36a9dbb86e40288e9aac60f1a33bb47bff9c3a1336a510121032c64677912d511571907444c82fd1abd4807ebef327e2f7bfe41f1951ca8190d55ae');
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

    it('generate p2sh address with custom keyset and threshold', function() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/0', segwit: false, keychains: keychains, threshold: 4 });
      p2shAddress.address.should.equal('2MsfbMMnNS198FdzDU9rZiTvHSKcw3PizXq');
      p2shAddress.chain.should.equal(0);
      p2shAddress.index.should.equal(0);
      p2shAddress.chainPath.should.equal('/0/0');
      p2shAddress.path.should.equal('/0/0');
      p2shAddress.outputScript.should.equal('a914049bd0fa7c1a009070989af606084b720d519b2e87');
      p2shAddress.redeemScript.should.equal('542102cd3c8e6006a4627705021d1d016d097c2944d98100a47bf2da67a5fe15aeeb342102ee1fa9e812e779356aa3c31ebf317d0cffebab92864cfe38bab223e0820f98bc21026ba05752baa6eafd5c5659da62b7f0ac51fd2886b65c241d0afef1c4fdfa1cbc21038c80e64d61f7e9a6d36a9dbb86e40288e9aac60f1a33bb47bff9c3a1336a510121032c64677912d511571907444c82fd1abd4807ebef327e2f7bfe41f1951ca8190d55ae');
      p2shAddress.wallet.should.equal(fakeWallet.id());
    });

  });

  describe('Create Transaction', function() {

    before(co(function *() {
      yield bitgo.authenticateTestUser(bitgo.testUserOTP());
      bitgo._token.should.not.be.empty;
    }));

    it('default p2sh', co(function *() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/13', segwit: false });
      const unspent = {
        addresses: [
          '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X'
        ],
        value: '0.00504422',
        value_int: 504422,
        txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
        n: 1,
        script_pub_key: {
          asm: 'OP_HASH160 d039cb3344294a5a384a5508a006444c420cbc11 OP_EQUAL',
          hex: 'a914d039cb3344294a5a384a5508a006444c420cbc1187'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 9,
        id: 61330229
      };
      _.extend(unspent, p2shAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo p2sh test': 1000 }
      });
      transaction.transactionHex.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b500483045022100e760bffb404c523ef7d60a63a9b3b8612750022572a4fe61a2186777e3ae698e02204df3c75afa3300d0ede0bcdd634b1fdbe0377be2df00002f5552f350172d3f4f014c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/a8ccb928169032d6e1f37bf81dfd9ab6d90362a4f84e577397fa690aa711550c
      signature2.tx.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000fdfe0000483045022100e760bffb404c523ef7d60a63a9b3b8612750022572a4fe61a2186777e3ae698e02204df3c75afa3300d0ede0bcdd634b1fdbe0377be2df00002f5552f350172d3f4f01483045022100a3e49dd7d5a3e01d0b74208e3b2ef99e6ab847e05125aaacce9227ae426dbfcf0220121fa5e0f1752d40c3dd01f9a2ec9012712105502736a21289c6f3cd5af7abd9014c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');
    }));

    it('BCH p2sh', co(function *() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/13', segwit: false });
      const unspent = {
        addresses: [
          '2NCEDmmKNNnqKvnWw7pE3RLzuFe5aHHVy1X'
        ],
        value: '0.00504422',
        value_int: 504422,
        txid: 'b816ded89c3d8d5021b01097f4a3129a6a68a5cb7c886e97945f4205cba5de44',
        n: 1,
        script_pub_key: {
          asm: 'OP_HASH160 d039cb3344294a5a384a5508a006444c420cbc11 OP_EQUAL',
          hex: 'a914d039cb3344294a5a384a5508a006444c420cbc1187'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 9,
        id: 61330229
      };
      _.extend(unspent, p2shAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo p2sh test': 1000 }
      });
      transaction.transactionHex.should.equal('010000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b80100000000ffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add first signature
      transaction.keychain = userKeypair;
      transaction.forceBCH = true;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('020000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b5004830450221009e63ff1c8b0860073bc06bbce84f20568251a31f7a12c0ce300dc024e416f28202200b0dcb4a3b6b2cda1886ea6c020884907efd517d23d97e84fbf411aa65d280dd414c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/a8ccb928169032d6e1f37bf81dfd9ab6d90362a4f84e577397fa690aa711550c
      signature2.tx.should.equal('020000000144dea5cb05425f94976e887ccba5686a9a12a3f49710b021508d3d9cd8de16b801000000b400473044022037ec6e87075b9bcf958c8cc98502d745e24e3236d806a6443892ba04f1e022a10220622760c7eb6ad3138560bfdde82e30b3346bd416311d02664ae4fd9e88c08288414c695221031cd227e40ad61b4e137109cb2845eb6f5a584ed5c67d9d3135cdaa5045a842ea2103a2e7b54c7b2da0992555353b8e26c6acff4248f4351f08787bf3e2efc94b658321025c2a6cde33c2d73ccf12eecf64c54f08f722c2f073824498950695e9883b141253aeffffffff02e803000000000000116a0f426974476f2070327368207465737440a107000000000017a914d039cb3344294a5a384a5508a006444c420cbc118700000000');
    }));

    it('default segwit', co(function *() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/13', segwit: true });
      const unspent = {
        addresses: [
          '2MxKkH8yB3S9YWmTQRbvmborYQyQnH5petP'
        ],
        value: '0.18750000',
        value_int: 18750000,
        txid: '7d282878a85daee5d46e043827daed57596d75d1aa6e04fd0c09a36f9130881f',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 37b393fce627a0ec634eb543dda1e608e2d1c78a OP_EQUAL',
          hex: 'a91437b393fce627a0ec634eb543dda1e608e2d1c78a87'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331617
      };
      _.extend(unspent, segwitAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: segwitAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo segwit test': 1000 }
      });
      transaction.transactionHex.should.equal('01000000011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000000ffffffff02e803000000000000136a11426974476f207365677769742074657374220f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a8700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000001011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000023220020440e858228b753544b4c57e300296b55717f811053883f9be9b6a712eacd931cffffffff02e803000000000000136a11426974476f207365677769742074657374220f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a870300483045022100b69bcf45425eff113f3cfbb67f3669f4d2c96dcd97498a518ddcb7efd014bc1a022071135f2ac79374e8a0af36a758beea9bcadab6e27983c79ab510a6d6004a8a7101695221032c505fc8a1e4b56811b27366a371e61c9faf565dd2fabaff7a70eac19c32157c210251160b583bd5dc0f0d48096505131c4347ab65b4f21ed57d76c38157499c003d2102679712d62a2560917cc43fd2cc3a1b9b61f528c88bc64905bae6ee079e60609f53ae00000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/d67266f1de905baaee750011fa4b3d88a8e3a1758d5173a659c67709488dde07
      signature2.tx.should.equal('010000000001011f8830916fa3090cfd046eaad1756d5957edda2738046ed4e5ae5da87828287d0000000023220020440e858228b753544b4c57e300296b55717f811053883f9be9b6a712eacd931cffffffff02e803000000000000136a11426974476f207365677769742074657374220f1e010000000017a91437b393fce627a0ec634eb543dda1e608e2d1c78a870400483045022100b69bcf45425eff113f3cfbb67f3669f4d2c96dcd97498a518ddcb7efd014bc1a022071135f2ac79374e8a0af36a758beea9bcadab6e27983c79ab510a6d6004a8a710147304402201ab788fc78a50d0b851a8b81021f97b36505895cb1d4283403a65d17c1e4caa202201e3dd1101b5a483eef131b2413923323fd0eef1262219fc565960c6c815afcd201695221032c505fc8a1e4b56811b27366a371e61c9faf565dd2fabaff7a70eac19c32157c210251160b583bd5dc0f0d48096505131c4347ab65b4f21ed57d76c38157499c003d2102679712d62a2560917cc43fd2cc3a1b9b61f528c88bc64905bae6ee079e60609f53ae00000000');
    }));

    it('3/5 p2sh', co(function *() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/1/13', segwit: false, keychains: keychains, threshold: 3 });
      const unspent = {
        addresses: [
          '2NBK1thw7RpffyyCGa2aePqueJSUA7pENwf'
        ],
        value: '0.09375000',
        value_int: 9375000,
        txid: '11226fdef22b4d87241dc2e01b1ef39bcbfdfbe8352bfc0c8295a6e7fc5d1545',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 c629d4a1640a55e0703726aeb2aabbcfc5b29de4 OP_EQUAL',
          hex: 'a914c629d4a1640a55e0703726aeb2aabbcfc5b29de487'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331633
      };
      _.extend(unspent, p2shAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo 3/5 p2sh test': 1000 }
      });
      transaction.transactionHex.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f22110000000000ffffffff02e803000000000000156a13426974476f20332f3520703273682074657374f2fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f221100000000f900483045022100e44398b712a8e4c194276cdacb15ef42dbc8cf78d118d18aee6423168b0694a20220520661c9d4c74bb4ec420179acdcc44aa65f35bf88c4024e3312018929226ea5014cad5321032b3bb7da8cd35f2b31387a32411eb1b4ecbc97f88f413ef3afafdd6251ebe7782103bf401f8a9204bf331217c67042978426d498070f998d923f5974f603663cf0ff21024bbfbc82267c0096fbcf1b3aef443a3ace227a7279016600a100373ecfa7b38021037a0d7a56f5a91d285bea86b332e2bcab7795e32fc2165afaa989fb5fe441d8d72103b78ab4a0c4c00190585b91be57fb54c9aac17dc9516e319399d9104af0052c1d55aeffffffff02e803000000000000156a13426974476f20332f3520703273682074657374f2fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      signature2.tx.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f221100000000fd420100483045022100e44398b712a8e4c194276cdacb15ef42dbc8cf78d118d18aee6423168b0694a20220520661c9d4c74bb4ec420179acdcc44aa65f35bf88c4024e3312018929226ea501483045022100907cacba94cf0b152249a073454fe6638fd1ad2b24ad90537ff6808a3f3728c2022004352d5285938b21bf9e3a78d5350a8e92b72215aa9287aac4f58c3a9af40f9e014cad5321032b3bb7da8cd35f2b31387a32411eb1b4ecbc97f88f413ef3afafdd6251ebe7782103bf401f8a9204bf331217c67042978426d498070f998d923f5974f603663cf0ff21024bbfbc82267c0096fbcf1b3aef443a3ace227a7279016600a100373ecfa7b38021037a0d7a56f5a91d285bea86b332e2bcab7795e32fc2165afaa989fb5fe441d8d72103b78ab4a0c4c00190585b91be57fb54c9aac17dc9516e319399d9104af0052c1d55aeffffffff02e803000000000000156a13426974476f20332f3520703273682074657374f2fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');

      // add third signature
      transaction.transactionHex = signature2.tx;
      transaction.keychain = extraKeypair1;
      const signature3 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/aefe61fdf292e52ff94235e64d08d617a6670bc4ab17b18f499a62194a52c180
      signature3.tx.should.equal('010000000145155dfce7a695820cfc2b35e8fbfdcb9bf31e1be0c21d24874d2bf2de6f221100000000fd8a0100483045022100e44398b712a8e4c194276cdacb15ef42dbc8cf78d118d18aee6423168b0694a20220520661c9d4c74bb4ec420179acdcc44aa65f35bf88c4024e3312018929226ea501483045022100907cacba94cf0b152249a073454fe6638fd1ad2b24ad90537ff6808a3f3728c2022004352d5285938b21bf9e3a78d5350a8e92b72215aa9287aac4f58c3a9af40f9e01473044022044bb8eafa2e6d3c9d0ab9bbe851271343718c24dde98cf03431e39c985b052ae022069a300aa694f347283acbe7f2ec3c9d9e6ac16851dd03f5e63dc49eb94bf2883014cad5321032b3bb7da8cd35f2b31387a32411eb1b4ecbc97f88f413ef3afafdd6251ebe7782103bf401f8a9204bf331217c67042978426d498070f998d923f5974f603663cf0ff21024bbfbc82267c0096fbcf1b3aef443a3ace227a7279016600a100373ecfa7b38021037a0d7a56f5a91d285bea86b332e2bcab7795e32fc2165afaa989fb5fe441d8d72103b78ab4a0c4c00190585b91be57fb54c9aac17dc9516e319399d9104af0052c1d55aeffffffff02e803000000000000156a13426974476f20332f3520703273682074657374f2fb8e000000000017a914c629d4a1640a55e0703726aeb2aabbcfc5b29de48700000000');
    }));

    it('3/5 segwit', co(function *() {
      const segwitAddress = fakeWallet.generateAddress({ path: '/11/13', segwit: true, keychains: keychains, threshold: 3 });
      const unspent = {
        addresses: [
          '2N2zJWhXvUnRy5KDZKpqkQLGgK8sT6hhyGz'
        ],
        value: '0.04687500',
        value_int: 4687500,
        txid: '5278d64090a8dc62f88e09c88845bd8b1b523b85dd6bd236bcea1cc99a3ac342',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 6adecb920b918a98854914e41f5f1b1628ca166f OP_EQUAL',
          hex: 'a9146adecb920b918a98854914e41f5f1b1628ca166f87'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331653
      };
      _.extend(unspent, segwitAddress);
      unspent.value = unspent.value_int;
      unspent.tx_hash = unspent.txid;
      unspent.tx_output_n = unspent.n;
      unspent.script = unspent.outputScript;

      const transaction = yield fakeWallet.createTransaction({
        changeAddress: segwitAddress.address,
        unspents: [unspent],
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        bitgoFee: {
          amount: 0,
          address: ''
        },
        opReturns: { 'BitGo 3/5 segwit test': 1000 }
      });
      transaction.transactionHex.should.equal('010000000142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d678520000000000ffffffff02e803000000000000176a15426974476f20332f352073656777697420746573747e7b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f8700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('0100000000010142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d67852000000002322002054e45638b45b5b81045c63a75a9e5436d59c11c1a4912b1a82b28cd947e2217bffffffff02e803000000000000176a15426974476f20332f352073656777697420746573747e7b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f87030047304402207d6e26a688a7739289f016577b0bdbf9f6b5428152264b0741c30caf0cdb9f760220036b2e136e9d60c6c3511665495ad60340e556d44aaf722c48ab2f7fa3bf433b01ad5321032ca600eb36dbe41d265d030e8be0d8a28e8eda40ff45689e66a26e48c3180e9c21023ae2eaab9b7ad991fd3bb23b528b336d33959370c49ac73c05c54d787f174b872103fef2b09781b432232afcd009a66bfee17b54720b5d90b0edfc63e4d8709e1d1a21037c5c9e990362ed1253e6c018a56203eba988d2697baeeedf05fc0f9881305c97210243c099c5fbc97cc5855b881e128b985d79bec7639041ea82a7c9b67a2701bcc355ae00000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      signature2.tx.should.equal('0100000000010142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d67852000000002322002054e45638b45b5b81045c63a75a9e5436d59c11c1a4912b1a82b28cd947e2217bffffffff02e803000000000000176a15426974476f20332f352073656777697420746573747e7b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f87040047304402207d6e26a688a7739289f016577b0bdbf9f6b5428152264b0741c30caf0cdb9f760220036b2e136e9d60c6c3511665495ad60340e556d44aaf722c48ab2f7fa3bf433b0147304402204ba908bdfb1d6fbdedbcd7b809095da113ade62056953c5d37bf49ef975917e502206ff0f1612cde1cb7c27b9cb8498d340997ac20beff6ec4dd7ab41272e0a8e4db01ad5321032ca600eb36dbe41d265d030e8be0d8a28e8eda40ff45689e66a26e48c3180e9c21023ae2eaab9b7ad991fd3bb23b528b336d33959370c49ac73c05c54d787f174b872103fef2b09781b432232afcd009a66bfee17b54720b5d90b0edfc63e4d8709e1d1a21037c5c9e990362ed1253e6c018a56203eba988d2697baeeedf05fc0f9881305c97210243c099c5fbc97cc5855b881e128b985d79bec7639041ea82a7c9b67a2701bcc355ae00000000');

      // add third signature
      transaction.transactionHex = signature2.tx;
      transaction.keychain = extraKeypair2;
      const signature3 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/d0afa363519c5fad3db24a59293bf39a50d00c60753ddbade79e92f64c46d2f8
      signature3.tx.should.equal('0100000000010142c33a9ac91ceabc36d26bdd853b521b8bbd4588c8098ef862dca89040d67852000000002322002054e45638b45b5b81045c63a75a9e5436d59c11c1a4912b1a82b28cd947e2217bffffffff02e803000000000000176a15426974476f20332f352073656777697420746573747e7b47000000000017a9146adecb920b918a98854914e41f5f1b1628ca166f87050047304402207d6e26a688a7739289f016577b0bdbf9f6b5428152264b0741c30caf0cdb9f760220036b2e136e9d60c6c3511665495ad60340e556d44aaf722c48ab2f7fa3bf433b0147304402204ba908bdfb1d6fbdedbcd7b809095da113ade62056953c5d37bf49ef975917e502206ff0f1612cde1cb7c27b9cb8498d340997ac20beff6ec4dd7ab41272e0a8e4db014830450221009454f0be335392888b74bd8048b78eb64150faed6eeb89e547c670fd30301974022002127e309f1642072f438f310cbe9f62043b52b21f8909437e73e752805d31dc01ad5321032ca600eb36dbe41d265d030e8be0d8a28e8eda40ff45689e66a26e48c3180e9c21023ae2eaab9b7ad991fd3bb23b528b336d33959370c49ac73c05c54d787f174b872103fef2b09781b432232afcd009a66bfee17b54720b5d90b0edfc63e4d8709e1d1a21037c5c9e990362ed1253e6c018a56203eba988d2697baeeedf05fc0f9881305c97210243c099c5fbc97cc5855b881e128b985d79bec7639041ea82a7c9b67a2701bcc355ae00000000');
    }));

    it('mixed p2sh & segwit', co(function *() {
      const p2shAddress = fakeWallet.generateAddress({ path: '/0/14', segwit: false });
      const segwitAddress = fakeWallet.generateAddress({ path: '/10/14', segwit: true });
      const p2shUnspent = {
        addresses: [
          '2N533fqgyPYKVD892nBRaYmFHbbTykhYSEw'
        ],
        value: '2.99996610',
        value_int: 299996610,
        txid: 'f654ce0a5be3f12df7fecf4ee777b6d86b5aa8c710ef6946ec121206b4f8757c',
        n: 1,
        script_pub_key: {
          asm: 'OP_HASH160 8153e7a35508088b6cf599226792c7de2dbff252 OP_EQUAL',
          hex: 'a9148153e7a35508088b6cf599226792c7de2dbff25287'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61331263
      };
      const segwitUnspent = {
        addresses: [
          '2NBtpXcDruf3zRutmF4AbCMFNQHXsGNP6kT'
        ],
        value: '1.50000000',
        value_int: 150000000,
        txid: 'a4409c3f042fae67b890ac3df40ef0db03539c67331fd7e9260511893b4f9f24',
        n: 0,
        script_pub_key: {
          asm: 'OP_HASH160 cc8e7cbf481389d3183a590acfa6aa66eb97c8e1 OP_EQUAL',
          hex: 'a914cc8e7cbf481389d3183a590acfa6aa66eb97c8e187'
        },
        req_sigs: 1,
        type: 'scripthash',
        confirmations: 0,
        id: 61330882
      };
      const addresses = [p2shAddress, segwitAddress];
      const unspents = [p2shUnspent, segwitUnspent].map((unspent, index) => {
        const address = addresses[index];
        _.extend(unspent, address);
        unspent.value = unspent.value_int;
        unspent.tx_hash = unspent.txid;
        unspent.tx_output_n = unspent.n;
        unspent.script = unspent.outputScript;
        return unspent;
      });


      const transaction = yield fakeWallet.createTransaction({
        changeAddress: p2shAddress.address,
        unspents: unspents,
        recipients: {},
        noSplitChange: true,
        forceChangeAtEnd: true,
        feeRate: 10000,
        opReturns: { 'BitGo mixed p2sh & segwit test': 400000000 },
        bitgoFee: {
          amount: 81760,
          address: '2ND7jQR5itjGTbh3DKgbpZWSY9ungDrwcwb'
        }
      });
      transaction.transactionHex.should.equal('01000000027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f60100000000ffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a40000000000ffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374e28ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba98700000000');

      // add first signature
      transaction.keychain = userKeypair;
      const signature1 = yield fakeWallet.signTransaction(transaction);
      signature1.tx.should.equal('010000000001027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f601000000b40047304402206b92ff7c1b4381fd7279cd263f1e8f41dee8c892b9405633f3274e0e795a4add02205ad4eab4a1f716fa4e5d8681bb38525b0c1d140a2f155c2031f0636518128407014c69522103da95b28a13aa2d4bb490d70628e2e5d912461d375fef381aadd89dc1256220752103121287a510c5f32e8ba72d2479e90eb52ba44a467173df339feb0ff215f100e32102977cdfbee76066ae739db72d55371ad49dc6712fb8f2f3f69bb1a4c2422b0b1a53aeffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a400000000232200208b91aa03eb0f7f31e3917088084168ba5282a915e7cde0a5a934b7ea02eb057bffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374e28ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba987000300473044022022780c8721d54c6b128e96f43fd2a48c96956efd1b659cdf1ad2ebfe0974cc4b022016f2e9b3f017aef95dba9bccca02d4c8484342169613c1fd189e5b109f56a15401695221030780186c0be5df0d2d62cf54cc2f3d2c09911e377aa95b5fe875fa352aed0a592103f3237edd2d87010e8fe9f43f34e8c63de6384283de909795d62af4ddb4d579542102ad03de5504ef947e4e6ee2fa6b15d150d553c21275f49f2ce2359d9fdedb9ade53ae00000000');

      // add second signature
      transaction.transactionHex = signature1.tx;
      transaction.keychain = backupKeypair;
      transaction.fullLocalSigning = true;
      const signature2 = yield fakeWallet.signTransaction(transaction);
      // this transaction has actually worked: https://testnet.smartbit.com.au/tx/e2f696bcba91a376c36bb525df8c367938f6e2fd6344c90587bf12802091124c
      signature2.tx.should.equal('010000000001027c75f8b4061212ec4669ef10c7a85a6bd8b677e74ecffef72df1e35b0ace54f601000000fdfd000047304402206b92ff7c1b4381fd7279cd263f1e8f41dee8c892b9405633f3274e0e795a4add02205ad4eab4a1f716fa4e5d8681bb38525b0c1d140a2f155c2031f063651812840701483045022100c21634dc6b9915d42a97f7dee53902a9dc40cdc9f29a1a9eeb726328187bcc2202205e2b3782f11a5246d2773581c926bae1aaebdfab1d9a33d176e4e50d531a652d014c69522103da95b28a13aa2d4bb490d70628e2e5d912461d375fef381aadd89dc1256220752103121287a510c5f32e8ba72d2479e90eb52ba44a467173df339feb0ff215f100e32102977cdfbee76066ae739db72d55371ad49dc6712fb8f2f3f69bb1a4c2422b0b1a53aeffffffff249f4f3b89110526e9d71f33679c5303dbf00ef43dac90b867ae2f043f9c40a400000000232200208b91aa03eb0f7f31e3917088084168ba5282a915e7cde0a5a934b7ea02eb057bffffffff030084d71700000000206a1e426974476f206d6978656420703273682026207365677769742074657374e28ff9020000000017a9148153e7a35508088b6cf599226792c7de2dbff25287603f01000000000017a914d9f7be47975c036f94228b0bfd70701912758ba987000400473044022022780c8721d54c6b128e96f43fd2a48c96956efd1b659cdf1ad2ebfe0974cc4b022016f2e9b3f017aef95dba9bccca02d4c8484342169613c1fd189e5b109f56a15401483045022100f4da608dfd1428ddd20c6df951bc7da04067f933c648c4eb3e4ce0966f35f433022055ce495629d7db5312b381756057cdea5933396cdca4be4b658d1a22ba87c69f01695221030780186c0be5df0d2d62cf54cc2f3d2c09911e377aa95b5fe875fa352aed0a592103f3237edd2d87010e8fe9f43f34e8c63de6384283de909795d62af4ddb4d579542102ad03de5504ef947e4e6ee2fa6b15d150d553c21275f49f2ce2359d9fdedb9ade53ae00000000');
    }));

  });

});
