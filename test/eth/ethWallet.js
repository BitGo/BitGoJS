//
// Tests for Wallet
//
// Copyright 2014, BitGo, Inc.  All Rights Reserved.
//

const assert = require('assert');
require('should');
const Q = require('q');

const BitGoJS = require('../../src/index');
const TestBitGo = require('../lib/test_bitgo');
const crypto = require('crypto');
const _ = require('lodash');

Q.longStackTrace = true;

// TODO: WORK IN PROGRESS
describe('Ethereum Wallet API:', function() {
  let bitgo;
  let wallet1, wallet2;

  before(function() {
    BitGoJS.setNetwork('testnet');

    bitgo = new TestBitGo();
    bitgo.initializeTestVars();
    const wallets = bitgo.eth().wallets();
    return bitgo.authenticateTestUser(bitgo.testUserOTP())
    .then(function() {
      // Fetch the first wallet.
      const options = {
        id: TestBitGo.TEST_ETH_WALLET1_ADDRESS
      };
      return wallets.get(options);
    })
    .then(function(wallet) {
      wallet1 = wallet;

      // Fetch the second wallet
      const options = {
        id: TestBitGo.TEST_ETH_WALLET2_ADDRESS
      };
      return wallets.get(options);
    })
    .then(function(wallet) {
      wallet2 = wallet;
    });
  });

  describe('Labels', function() {
    it('list', function() {
      // delete all labels from wallet1
      wallet1.labels({})
      .then(function(labels) {
        if (labels === null) {
          return;
        }

        labels.forEach(function(label) {
          wallet1.deleteLabel({ address: label.address }, function(err, label) {
            assert.equal(err, null);
          });
        });
      });

      // create a single label on TestBitGo.TEST_ETH_WALLET1_ADDRESS2 and check that it is returned
      return wallet1.setLabel({ label: 'testLabel', address: TestBitGo.TEST_ETH_WALLET1_ADDRESS2 })
      .then(function() {
        // create a label on wallet2's TEST_ETH_WALLET2_ADDRESS to ensure that it is not returned
        return wallet2.setLabel({ label: 'wallet2TestLabel', address: TestBitGo.TEST_ETH_WALLET3_ADDRESS });
      })
      .then(function() {
        return wallet1.labels({});
      })
      .then(function(labels) {
        labels.forEach(function(label) {
          label.should.have.property('label');
          label.should.have.property('address');
          label.label.should.eql('testLabel');
          label.address.should.eql(TestBitGo.TEST_ETH_WALLET1_ADDRESS2);
        });
      });
    });
  });

  describe('SetLabel', function() {

    it('arguments', function() {
      assert.throws(function() { wallet1.setLabel({}, function() {}); });
      assert.throws(function() { wallet1.setLabel({ label: 'testLabel' }, function() {}); });
      assert.throws(function() { wallet1.setLabel({ address: TestBitGo.TEST_ETH_WALLET1_ADDRESS2 }, function() {}); });
      assert.throws(function() { wallet1.setLabel({ label: 'testLabel', address: 'invalidAddress' }, function() {}); });
      assert.throws(function() { wallet1.setLabel({ label: 'testLabel', address: TestBitGo.TEST_ETH_WALLET2_ADDRESS2 }, function() {}); });
    });

    it('create', function() {
      return wallet1.setLabel({ label: 'testLabel', address: TestBitGo.TEST_ETH_WALLET1_ADDRESS2 })
      .then(function(label) {
        label.should.have.property('label');
        label.should.have.property('address');
        label.label.should.equal('testLabel');
        label.address.should.equal(TestBitGo.TEST_ETH_WALLET1_ADDRESS2);
      });
    });
  });

  describe('Rename Wallet / Set Wallet Label', function() {

    it('arguments', function() {
      assert.throws(function() { wallet1.setLabel({}, function() {}); });
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
        result.id.should.eql(TestBitGo.TEST_ETH_WALLET1_ADDRESS);
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

    it('arguments', function() {
      assert.throws(function() { wallet1.deleteLabel({}, function() {}); });
      assert.throws(function() { wallet1.deleteLabel({ address: 'invalidAddress' }, function() {}); });
    });

    it('delete', function() {
      return wallet1.deleteLabel({ address: TestBitGo.TEST_ETH_WALLET1_ADDRESS2 })
      .then(function(label) {
        label.should.have.property('address');
        label.address.should.eql(TestBitGo.TEST_ETH_WALLET1_ADDRESS2);
      });
    });
  });

  describe('Create Address', function() {
    it('should create a proxy contract', function() {
      return wallet1.createAddress()
      .then(function(address) {
        address.should.have.property('address');
        address.should.have.property('deployTxHash');
        address.should.have.property('walletNonce');
        address.walletAddress.should.equal(wallet1.id());
      });
    });
  });

  describe('Transactions', function() {
    it('arguments', function() {
      assert.throws(function() { wallet1.transactions('invalid', function() {}); });
      assert.throws(function() { wallet1.transactions({}, 'invalid'); });
    });

    let txHash0;
    it('list', function() {
      const options = {};
      return wallet1.transactions(options)
      .then(function(result) {
        assert.equal(Array.isArray(result.transactions), true);
        // result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
        txHash0 = result.transactions[0].txHash;
      });
    });

    const limitTestNumTx = 6;
    it('list with limit', function() {
      const options = { limit: limitTestNumTx };
      return wallet1.transactions(options)
      .then(function(result) {
        assert.equal(Array.isArray(result.transactions), true);
        // result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
        result.count.should.eql(limitTestNumTx);
        result.transactions.length.should.eql(result.count);
      });
    });

    it('list with minHeight', function() {

      const minHeight = 530000;
      const options = { minHeight: minHeight, limit: 500 };
      return wallet1.transactions(options)
      .then(function(result) {
        assert.equal(Array.isArray(result.transactions), true);
        // result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
        result.transactions.length.should.eql(result.count);
        result.transactions.forEach(function(transaction) {
          if (transaction.confirmations > 0) {
            transaction.should.have.property('blockHeight');
            transaction.blockHeight.should.be.above(minHeight - 1);
          }
        });
        // result.count.should.be.below(totalTxCount);
      });
    });

    it('list with limit and skip', function() {
      const skipNum = 2;
      const options = { limit: (limitTestNumTx - skipNum), skip: skipNum };
      const referenceOptions = { limit: limitTestNumTx };
      return Q.all([wallet1.transactions(options), wallet1.transactions(referenceOptions)])
      .spread(function(result, reference) {
        assert.equal(Array.isArray(result.transactions), true);
        // result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.equal(skipNum);
        result.count.should.equal(limitTestNumTx - skipNum);
        result.transactions.length.should.eql(result.count);

        const limitedTxes = reference.transactions;

        // there should be no difference between these object arrays
        const difference = _.differenceWith(result.transactions, limitedTxes, _.isEqual);
        difference.length.should.equal(0);
      });
    });

    it('get transaction', function() {
      const options = { id: txHash0 };
      return wallet1.getTransaction(options)
      .then(function(result) {
        result.transaction.should.have.property('gas');
        // gas used only there if confirmations > 0
        result.transaction.should.have.property('type');
        result.transaction.should.have.property('gasPrice');
        result.transaction.should.have.property('entries');
        result.transaction.entries.length.should.not.equal(0);
        result.transaction.type.should.not.equal('internal');
        result.transaction.should.have.property('confirmations');
        result.transaction.should.have.property('txHash');
        if (result.transaction.confirmations > 0) {
          result.transaction.should.have.property('blockHeight');
        }
      });
    });
  });

  describe('Transfers', function() {
    it('arguments', function() {
      assert.throws(function() { wallet1.transfers('invalid', function() {}); });
      assert.throws(function() { wallet1.transfers({}, 'invalid'); });
    });

    it('list', function() {
      const options = {};
      return wallet1.transfers(options)
      .then(function(result) {
        assert.equal(Array.isArray(result.transfers), true);
        // result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
      });
    });

    const limitTestNumTransfers = 4;
    it('list with limit', function() {
      const options = { limit: limitTestNumTransfers };
      return wallet1.transfers(options)
      .then(function(result) {
        assert.equal(Array.isArray(result.transfers), true);
        // result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.eql(0);
        result.count.should.eql(limitTestNumTransfers);
        result.transfers.length.should.eql(result.count);
        // totalTransferCount = result.total;
      });
    });

    it('list with limit and skip', function() {
      const skipNum = 2;
      const referenceOptions = { limit: limitTestNumTransfers };
      const options = { limit: (limitTestNumTransfers - skipNum), skip: skipNum };
      return Q.all([wallet1.transfers(options), wallet1.transfers(referenceOptions)])
      .spread(function(result, reference) {
        assert.equal(Array.isArray(result.transfers), true);
        // result.should.have.property('total');
        result.should.have.property('count');
        result.start.should.equal(skipNum);
        // result.total.should.eql(limitTestNumTransfers);
        result.count.should.eql(limitTestNumTransfers - skipNum);
        result.transfers.length.should.equal(result.count);

        const limitedTransfers = reference.transfers;
        const limitedTransfersSubset = limitedTransfers.slice(skipNum);
        // there should be no difference between these object arrays
        const difference = _.differenceWith(result.transfers, limitedTransfersSubset, _.isEqual);
        difference.length.should.equal(0);
      });
    });
  });

  describe('Send Transaction', function() {
    it('arguments', function() {
      // No recipients provided
      assert.throws(function() { wallet1.sendTransaction({}, function() {}); });
      assert.throws(function() { wallet1.sendTransaction({ recipients: [] }, function() {}); });

      // Invalid recipient toAddress
      assert.throws(function() {
        wallet1.sendTransaction({
          recipients: [{ toAddress: 'abc', value: '10000' }],
          walletPassphrase: 'daodaodao'
        }, function() {});
      });

      // Invalid recipient value
      assert.throws(function() {
        wallet1.sendTransaction({
          recipients: [{ toAddress: '0x9c4545befe9bfec17ffcdfbebe34a7ecc80e9165', value: 10000 }],
          walletPassphrase: 'daodaodao'
        }, function() {});
      });

      // Invalid recipient data
      assert.throws(function() {
        wallet1.sendTransaction({
          recipients: [{ toAddress: '0x9c4545befe9bfec17ffcdfbebe34a7ecc80e9165', value: '10000', data: 1234 }],
          walletPassphrase: 'daodaodao'
        }, function() {});
      });

      // Invalid expire time
      assert.throws(function() {
        wallet1.sendTransaction({
          recipients: [{ toAddress: '0x9c4545befe9bfec17ffcdfbebe34a7ecc80e9165', value: '10000' }],
          expireTime: 'asdfadsads',
          walletPassphrase: 'daodaodao'
        }, function() {});
      });
    });

    it('missing walletPassphrase', function() {
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet1.sendTransaction({ recipients: [{ toAddress: wallet1.id(), value: '25000' }] });
      })
      .then(function(result) {
        throw new Error('should not be here');
      })
      .catch(function(error) {
        error.message.should.include('walletPassphrase');
      });
    });

    it('wrong walletPassphrase', function() {
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet1.sendTransaction({
          recipients: [{ toAddress: wallet1.id(), value: '25000' }],
          walletPassphrase: 'wrong passphrase'
        });
      })
      .then(function(result) {
        throw new Error('should not be here');
      })
      .catch(function(error) {
        error.message.should.include('Unable to decrypt user keychain');
      });
    });

    it('non-undefined gasLimit', function() {
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet1.sendTransaction({ recipients: [{ toAddress: wallet1.id(), value: '25000' }], gasLimit: null });
      })
      .then(function(result) {
        throw new Error('should not be here');
      })
      .catch(function(error) {
        error.message.should.include('expecting positive integer for gasLimit');
      });
    });

    it('non-numeric gasLimit', function() {
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet1.sendTransaction({ recipients: [{ toAddress: wallet1.id(), value: '25000' }], gasLimit: '10' });
      })
      .then(function(result) {
        throw new Error('should not be here');
      })
      .catch(function(error) {
        error.message.should.include('expecting positive integer for gasLimit');
      });
    });

    it('invalid gasLimit', function() {
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet1.sendTransaction({ recipients: [{ toAddress: wallet1.id(), value: '25000' }], gasLimit: -1 });
      })
      .then(function(result) {
        throw new Error('should not be here');
      })
      .catch(function(error) {
        error.message.should.include('expecting positive integer for gasLimit');
      });
    });

    it('success', function() {
      let txHash;
      const sequenceId = 'randSeq_' + (new Date().getTime());
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet1.sendTransaction({
          recipients: [{ toAddress: wallet1.id(), value: '36000' }],
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
          sequenceId: sequenceId
        });
      })
      .then(function(result) {
        result.should.have.property('hash');
        result.should.have.property('tx');
        txHash = result.hash;
        return wallet1.getTransfer({ id: txHash });
      })
      .then(function(result) {
        result.should.have.property('transfer');
        result.transfer.txHash.should.eql(txHash);
        result.transfer.outputs.length.should.eql(1);
        result.transfer.value.should.eql('-36000');
        return wallet1.getTransfer({ id: sequenceId });
      })
      .then(function(result) {
        result.transfer.txHash.should.eql(txHash);
      });
    });

    xit('success with custom gas limit', function() {
      let txHash;
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet1.sendTransaction({
          recipients: [{ toAddress: wallet1.id(), value: '36000' }],
          walletPassphrase: TestBitGo.TEST_WALLET1_PASSCODE,
          gasLimit: 41234567
        });
      })
      .then(function(result) {
        result.should.have.property('hash');
        result.should.have.property('tx');
        // TODO: assert correct gas amount
        result.tx.gas.should.equal(41234567);
        txHash = result.hash;
        return wallet1.getTransfer({ id: txHash });
      })
      .then(function(result) {
        result.transfer.txHash.should.eql(txHash);
        result.transfer.gas.should.eql(41234567);
      });
    });

  });

  describe('Gas Balance', function() {
    it('should retrieve gas balance', function() {
      return bitgo.eth().gasBalance()
      .then(function(balance) {
        balance.should.have.property('balance');
        balance.should.have.property('updateTime');
        assert(typeof(balance.balance) === 'string');
      });
    });
  });

  describe('Get wallet user encrypted key', function() {
    it('arguments', function() {
      assert.throws(function() { wallet1.getEncryptedUserKeychain(undefined, 'invalid'); });
      assert.throws(function() { wallet1.getEncryptedUserKeychain({}, 'invalid'); });
      assert.throws(function() { wallet1.transactions('invalid', function() {}); });
    });

    it('get key', function() {
      const options = {};
      return bitgo.unlock({ otp: '0000000' })
      .then(function() {
        return wallet1.getEncryptedUserKeychain(options);
      })
      .then(function(result) {
        result.should.have.property('xpub');
        result.xpub.should.equal(TestBitGo.TEST_ETH_WALLET1_XPUB);
        result.should.have.property('encryptedXprv');
      });
    });
  });

  describe('Freeze Wallet', function() {
    it('arguments', function() {
      assert.throws(function() {
        wallet2.freeze({ duration: 'asdfasdasd' });
      });
      assert.throws(function() {
        wallet2.freeze({ duration: 5 }, 'asdasdsa');
      });
    });

    it('perform freeze', function() {
      return wallet2.freeze({ duration: 6 })
      .then(function(freezeResult) {
        freezeResult.should.have.property('time');
        freezeResult.should.have.property('expires');
      });
    });

    it('get wallet should show freeze', function() {
      return wallet2.get({})
      .then(function(res) {
        const wallet = res.wallet;
        wallet.should.have.property('freeze');
        wallet.freeze.should.have.property('time');
        wallet.freeze.should.have.property('expires');
      });
    });
  });
});
